const Voting = require('../models/Voting');
const Vote = require('../models/Vote');
const QuorumService = require('../services/quorumService');

exports.getVotings = async (req, res) => {
  try {
    const votings = await Voting.findByMeeting(req.params.meetingId);
    console.log(`Votaciones encontradas para meeting ${req.params.meetingId}:`, votings.length);
    res.json(votings);
  } catch (error) {
    console.error('Error obteniendo votaciones:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getVoting = async (req, res) => {
  try {
    const voting = await Voting.findById(req.params.id);
    if (!voting) {
      return res.status(404).json({ message: 'Voting not found' });
    }
    res.json(voting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createVoting = async (req, res) => {
  try {
    const data = {
      meeting_id: req.params.meetingId,
      ...req.body
    };
    
    console.log('Creating voting with data:', data);
    
    const votingId = await Voting.create(data);
    
    // Generar el link público de votación
    const votingLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/public/voting/${votingId}`;
    
    res.status(201).json({ 
      id: votingId, 
      message: 'Voting created',
      votingLink: votingLink
    });
  } catch (error) {
    console.error('Error creating voting:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      sql: error.sql
    });
    res.status(500).json({ 
      message: error.message || 'Error al crear la votación',
      details: process.env.NODE_ENV === 'development' ? error.sqlMessage : undefined
    });
  }
};

exports.updateVoting = async (req, res) => {
  try {
    await Voting.updateStatus(req.params.id, req.body.status);
    res.json({ message: 'Voting updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.activateVoting = async (req, res) => {
  try {
    const voting = await Voting.findById(req.params.id);
    if (!voting) {
      return res.status(404).json({ message: 'Voting not found' });
    }

    // Obtener la reunión para validar quórum
    const Meeting = require('../models/Meeting');
    const meeting = await Meeting.findById(voting.meeting_id, req.user.client_id);
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Verificar si la sesión está instalada
    const sessionInstalled = await Meeting.isSessionInstalled(voting.meeting_id, req.user.client_id);

    // Validar quórum antes de activar votación
    const totalMembers = meeting.type === 'asamblea' ? null : null; // TODO: obtener total para asamblea
    const quorumValidation = await QuorumService.validateQuorumForVoting(
      voting.meeting_id,
      meeting.type,
      totalMembers,
      sessionInstalled
    );

    if (!quorumValidation.valid) {
      return res.status(400).json({ 
        message: quorumValidation.message,
        quorum: quorumValidation
      });
    }

    await Voting.updateStatus(req.params.id, 'active');
    res.json({ message: 'Voting activated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getResults = async (req, res) => {
  try {
    const voting = await Voting.findById(req.params.id);
    if (!voting) {
      return res.status(404).json({ message: 'Voting not found' });
    }

    const results = await Voting.getResults(req.params.id);
    const votes = await Vote.findByVoting(req.params.id);
    
    // Calcular mayoría simple
    const totalVotesEmitted = votes.length;
    const majority = QuorumService.calculateSimpleMajority(totalVotesEmitted);
    
    // Contar votos afirmativos (opciones como "Sí", "A favor", etc.)
    // Esto depende de cómo se definan las opciones, por ahora asumimos que la primera opción es afirmativa
    let affirmativeVotes = 0;
    if (results.length > 0) {
      // Buscar la opción afirmativa (puede ser "Sí", "A favor", etc.)
      const affirmativeOptions = ['sí', 'si', 'yes', 'a favor', 'afavor', 'aprobado', 'approved'];
      affirmativeVotes = results
        .filter(r => affirmativeOptions.includes(r.option.toLowerCase()))
        .reduce((sum, r) => sum + parseInt(r.votes), 0);
    }
    
    // Validar si alcanza mayoría simple
    const majorityValidation = QuorumService.validateSimpleMajority(
      affirmativeVotes,
      totalVotesEmitted
    );
    
    res.json({
      voting,
      results,
      votes,
      totalVotes: totalVotesEmitted,
      majority,
      majorityValidation
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Endpoint público para obtener votación (sin autenticación)
exports.getPublicVoting = async (req, res) => {
  try {
    const voting = await Voting.findById(req.params.id);
    if (!voting) {
      return res.status(404).json({ message: 'Voting not found' });
    }
    // Devolver información necesaria incluyendo opciones
    res.json({
      id: voting.id,
      title: voting.title,
      description: voting.description,
      status: voting.status,
      type: voting.type,
      options: voting.options || null // Opciones para votaciones múltiples
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
