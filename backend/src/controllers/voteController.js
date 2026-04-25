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

// PASO 1: Verificar cédula para votación — retorna status codes específicos (BQ_ESPECIFICACION_v2)
// Status: NOT_FOUND | ALREADY_VOTED | NO_VOTE | SUPLENTE_SIN_VOTO | SUPLENTE_ACTUANDO | JV_VOTED | JV_VOZ | OK
exports.verifyDocumentForVoting = async (req, res) => {
  try {
    const { votingId } = req.params;
    const { cedula } = req.body;

    if (!cedula) {
      return res.status(400).json({ status: 'ERROR', message: 'Número de cédula es requerido' });
    }
    const cedulaNorm = String(cedula).replace(/\D/g, '') || cedula;

    const voting = await Voting.findById(votingId);
    if (!voting) return res.status(404).json({ status: 'ERROR', message: 'Votación no encontrada' });
    if (voting.status !== 'active') return res.status(400).json({ status: 'ERROR', message: 'La votación no está activa' });

    const meeting = await Meeting.findById(voting.meeting_id, null);
    if (!meeting) return res.status(404).json({ status: 'ERROR', message: 'Reunión no encontrada' });

    const Member = require('../models/Member');
    const Attendance = require('../models/Attendance');

    const member = await Member.findByDocumentNumber(cedulaNorm, meeting.client_id);
    if (!member) {
      return res.status(404).json({ status: 'NOT_FOUND', found: false, cedula: cedulaNorm });
    }

    // Ya votó
    const hasVoted = await Vote.hasVotedByDocument(votingId, cedula, meeting.client_id);
    if (hasVoted) {
      return res.status(400).json({ status: 'ALREADY_VOTED', found: true });
    }

    // No tiene derecho a voto (Contadora, Revisor Fiscal, etc.)
    const canVote = member.puede_votar === true || member.puede_votar === 1;
    if (!canVote) {
      return res.status(403).json({
        status: 'NO_VOTE',
        found: true,
        cargo: member.rol_organico || member.position || 'Tu cargo'
      });
    }

    const memberType = String(member.member_type || '').toLowerCase().trim();
    const tipoParticipante = String(member.tipo_participante || '').toUpperCase().trim();
    const positionUpper = String(member.position || '').toUpperCase();

    // ── JV: Junta de Vigilancia ──────────────────────────────────────────────
    const isJV = memberType === 'junta_vigilancia' || tipoParticipante === 'JUNTA_DE_VIGILANCIA';
    if (isJV) {
      const jvAlreadyVoted = await Vote.hasJVVoted(parseInt(votingId), meeting.client_id);
      if (jvAlreadyVoted) {
        return res.status(403).json({ status: 'JV_VOTED', found: true });
      }
      // JV presente pero no fue el primero en votar — se le avisa que puede ser él el representante
      // (el control real está en confirmVote; aquí le dejamos pasar con status JV_OK)
      return res.json({
        status: 'OK',
        found: true,
        isJV: true,
        member: {
          id: member.id,
          name: member.name,
          numero_documento: member.numero_documento,
          position: member.rol_organico || member.position || 'Junta de Vigilancia',
          cargo: member.rol_organico || member.position || 'Junta de Vigilancia'
        }
      });
    }

    // ── Suplente ─────────────────────────────────────────────────────────────
    const isSuplente = memberType === 'suplente' || tipoParticipante === 'SUPLENTE' || /\bSUPLENTE\b/.test(positionUpper);
    if (isSuplente) {
      // Verificar si el principal está PRESENTE en la reunión
      let principalPresent = false;

      if (member.principal_id) {
        const principalAttendance = await Attendance.findByMemberAndMeeting(voting.meeting_id, member.principal_id);
        principalPresent = principalAttendance && principalAttendance.status === 'present';
      }

      if (!principalPresent && member.rol_organico) {
        // Fallback: buscar por mismo rol_organico
        const [principalRows] = await require('../config/database').execute(
          `SELECT m.id FROM members m
           WHERE m.client_id = ? AND UPPER(TRIM(COALESCE(m.rol_organico,''))) = ?
             AND (LOWER(TRIM(COALESCE(m.member_type,''))) NOT IN ('suplente'))
             AND m.id != ? LIMIT 1`,
          [meeting.client_id, (member.rol_organico || '').toUpperCase().trim(), member.id]
        );
        if (principalRows.length > 0) {
          const att = await Attendance.findByMemberAndMeeting(voting.meeting_id, principalRows[0].id);
          principalPresent = att && att.status === 'present';
        }
      }

      if (principalPresent) {
        // Principal está presente → suplente tiene voz pero NO voto
        return res.status(403).json({
          status: 'SUPLENTE_SIN_VOTO',
          found: true,
          cargo: member.rol_organico || member.position || 'Tu cargo'
        });
      } else {
        // Principal ausente → suplente actúa como principal
        return res.json({
          status: 'SUPLENTE_ACTUANDO',
          found: true,
          member: {
            id: member.id,
            name: member.name,
            numero_documento: member.numero_documento,
            position: member.rol_organico || member.position || 'Miembro',
            cargo: member.rol_organico || member.position || 'Tu cargo'
          }
        });
      }
    }

    // ── Miembro normal: OK ────────────────────────────────────────────────────
    return res.json({
      status: 'OK',
      found: true,
      member: {
        id: member.id,
        name: member.name,
        numero_documento: member.numero_documento,
        position: member.rol_organico || member.position || 'Miembro',
        cargo: member.rol_organico || member.position || 'Miembro'
      }
    });
  } catch (error) {
    console.error('Error in verifyDocumentForVoting:', error);
    res.status(500).json({ status: 'ERROR', message: error.message || 'Error al verificar la cédula' });
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
    const cedulaNormConfirm = String(cedula).replace(/\D/g, '') || cedula;

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
    const member = await Member.findByDocumentNumber(cedulaNormConfirm, meeting.client_id);
    if (!member) {
      return res.status(404).json({ message: 'Miembro no encontrado' });
    }

    // Verificar si ya votó
    const hasVoted = await Vote.hasVotedByDocument(votingId, cedulaNormConfirm, meeting.client_id);
    if (hasVoted) {
      return res.status(400).json({ message: 'Ya has votado en esta votación' });
    }

    // Validar elegibilidad para votar (INTERNO - validación crítica)
    const canVote = member.puede_votar === true || member.puede_votar === 1;
    if (!canVote) {
      return res.status(403).json({ 
        message: 'Tu cargo no tiene derecho a voto en esta reunión. Asistencia ya registrada.',
        canVote: false
      });
    }

    // VOT-SUPLENCIAS: si es suplente, verificar que el principal no haya votado ya
    const memberType = String(member.member_type || '').toLowerCase().trim();
    const tipoParticipante = String(member.tipo_participante || '').toUpperCase().trim();
    const positionUpper = String(member.position || '').toUpperCase();
    const isSupplente = memberType === 'suplente' || tipoParticipante === 'SUPLENTE' || /\bSUPLENTE\b/.test(positionUpper);

    if (isSupplente) {
      const principalAlreadyVoted = await Vote.hasPrincipalVoted(votingId, member);
      if (principalAlreadyVoted) {
        return res.status(403).json({
          message: 'El voto de tu cargo ya fue registrado por el miembro principal. Tu voto como suplente no puede registrarse.',
          canVote: false
        });
      }
    }

    // VOT-JV-VOTO: si es miembro de la Junta de Vigilancia, solo 1 voto institucional
    const isJV = memberType === 'junta_vigilancia' || tipoParticipante === 'JUNTA_DE_VIGILANCIA';
    if (isJV) {
      const jvAlreadyVoted = await Vote.hasJVVoted(parseInt(votingId), meeting.client_id);
      if (jvAlreadyVoted) {
        return res.status(403).json({
          message: 'El voto de la Junta de Vigilancia ya fue registrado. La JV emite 1 voto institucional por votación (Art. 24°).',
          canVote: false
        });
      }
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

