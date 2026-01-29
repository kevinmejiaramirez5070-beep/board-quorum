const Vote = require('../models/Vote');
const Voting = require('../models/Voting');
const Meeting = require('../models/Meeting');
const QuorumService = require('../services/quorumService');

exports.castVote = async (req, res) => {
  try {
    const { voting_id, member_id, option, comment } = req.body;

    // Verificar que la votación esté activa
    const voting = await Voting.findById(voting_id);
    if (!voting || voting.status !== 'active') {
      return res.status(400).json({ message: 'Voting is not active' });
    }

    // Obtener la reunión para validar quórum
    const meeting = await Meeting.findById(voting.meeting_id, req.user.client_id);
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Verificar si la sesión está instalada
    const sessionInstalled = await Meeting.isSessionInstalled(voting.meeting_id, req.user.client_id);

    // Validar quórum antes de permitir votar
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

    // Verificar que no haya votado antes
    const hasVoted = await Vote.hasVoted(voting_id, member_id);
    if (hasVoted) {
      return res.status(400).json({ message: 'Member has already voted' });
    }

    const voteId = await Vote.create({ voting_id, member_id, option, comment });
    res.status(201).json({ id: voteId, message: 'Vote cast successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getVotes = async (req, res) => {
  try {
    const votes = await Vote.findByVoting(req.params.votingId);
    res.json(votes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Endpoint público para votar (sin autenticación)
exports.castPublicVote = async (req, res) => {
  try {
    const { name, email, option } = req.body;
    const { votingId } = req.params;

    if (!name || !option) {
      return res.status(400).json({ message: 'Name and option are required' });
    }

    // Verificar que la votación esté activa
    const voting = await Voting.findById(votingId);
    if (!voting || voting.status !== 'active') {
      return res.status(400).json({ message: 'Voting is not active' });
    }

    // Verificar que no haya votado antes (por email si está disponible)
    if (email) {
      const hasVoted = await Vote.hasVotedPublic(votingId, email);
      if (hasVoted) {
        return res.status(400).json({ message: 'You have already voted' });
      }
    }

    // Crear un voto público (sin member_id, solo con nombre y email)
    const voteId = await Vote.createPublic({ 
      voting_id: parseInt(votingId), 
      name, 
      email, 
      option 
    });
    
    res.status(201).json({ id: voteId, message: 'Vote cast successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

