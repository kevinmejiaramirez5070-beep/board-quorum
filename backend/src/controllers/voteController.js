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

// PASO 1: Verificar cédula para votación (nuevo sistema seguro)
exports.verifyDocumentForVoting = async (req, res) => {
  try {
    const { votingId } = req.params;
    const { cedula } = req.body;

    if (!cedula) {
      return res.status(400).json({ message: 'Número de cédula es requerido' });
    }

    // Verificar que la votación esté activa
    const voting = await Voting.findById(votingId);
    if (!voting) {
      return res.status(404).json({ message: 'Votación no encontrada' });
    }
    if (voting.status !== 'active') {
      return res.status(400).json({ message: 'La votación no está activa actualmente' });
    }

    // Obtener la reunión para obtener client_id
    const meeting = await Meeting.findById(voting.meeting_id, null);
    if (!meeting) {
      return res.status(404).json({ message: 'Reunión no encontrada' });
    }

    const Member = require('../models/Member');
    
    // Buscar miembro por número de documento
    const member = await Member.findByDocumentNumber(cedula, meeting.client_id);
    
    if (!member) {
      // No encontrado
      return res.status(404).json({ 
        found: false,
        message: 'No se encontró en la base de datos',
        cedula: cedula
      });
    }

    // Verificar si ya votó
    const hasVoted = await Vote.hasVotedByDocument(votingId, cedula, meeting.client_id);
    if (hasVoted) {
      return res.status(400).json({ 
        found: true,
        alreadyVoted: true,
        message: 'Ya has votado en esta votación'
      });
    }

    // Validar elegibilidad para votar (INTERNO, no mostrar al usuario)
    const canVote = member.puede_votar === true || member.puede_votar === 1;
    
    // Retornar solo datos públicos para confirmación (NO mostrar campos sensibles)
    res.json({
      found: true,
      alreadyVoted: false,
      member: {
        id: member.id,
        name: member.name,
        numero_documento: member.numero_documento,
        position: member.position || member.rol_organico || 'Miembro'
      },
      canVote: canVote,
      // Este mensaje se mostrará solo si NO puede votar
      voteMessage: canVote 
        ? null 
        : 'Tu voto se registrará pero NO cuenta para la votación'
    });
  } catch (error) {
    console.error('Error in verifyDocumentForVoting:', error);
    res.status(500).json({ message: error.message || 'Error al verificar la cédula' });
  }
};

// PASO 5: Confirmar voto después de verificación
exports.confirmVote = async (req, res) => {
  try {
    const { votingId } = req.params;
    const { cedula, option, confirmado, comment } = req.body;

    if (!cedula || !option || !confirmado) {
      return res.status(400).json({ message: 'Cédula, opción y confirmación son requeridos' });
    }

    // Verificar que la votación esté activa
    const voting = await Voting.findById(votingId);
    if (!voting) {
      return res.status(404).json({ message: 'Votación no encontrada' });
    }
    if (voting.status !== 'active') {
      return res.status(400).json({ message: 'La votación no está activa actualmente' });
    }

    // Obtener la reunión
    const meeting = await Meeting.findById(voting.meeting_id, null);
    if (!meeting) {
      return res.status(404).json({ message: 'Reunión no encontrada' });
    }

    const Member = require('../models/Member');
    
    // Buscar miembro por número de documento
    const member = await Member.findByDocumentNumber(cedula, meeting.client_id);
    if (!member) {
      return res.status(404).json({ message: 'Miembro no encontrado' });
    }

    // Verificar si ya votó
    const hasVoted = await Vote.hasVotedByDocument(votingId, cedula, meeting.client_id);
    if (hasVoted) {
      return res.status(400).json({ message: 'Ya has votado en esta votación' });
    }

    // Validar elegibilidad para votar (INTERNO - validación crítica)
    const canVote = member.puede_votar === true || member.puede_votar === 1;
    if (!canVote) {
      return res.status(403).json({ 
        message: 'No tienes permiso para votar en esta reunión',
        canVote: false
      });
    }

    // Registrar voto
    const voteId = await Vote.createByDocument({
      voting_id: parseInt(votingId),
      member_id: member.id,
      option: option,
      comment: comment || null
    });

    res.status(201).json({ 
      id: voteId, 
      message: 'Voto registrado exitosamente',
      member: {
        name: member.name,
        position: member.position || member.rol_organico
      }
    });
  } catch (error) {
    console.error('Error in confirmVote:', error);
    res.status(500).json({ message: error.message || 'Error al confirmar el voto' });
  }
};

// Endpoint público para votar (LEGACY - mantener para compatibilidad, pero deprecar)
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

