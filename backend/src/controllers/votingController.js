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

    // MD-01: solo una votación activa por reunión a la vez (el link compartido
    // resuelve siempre la votación activa). Si ya hay otra activa, se bloquea.
    const meetingVotings = await Voting.findByMeeting(voting.meeting_id);
    const otraActiva = meetingVotings.find(v => v.status === 'active' && String(v.id) !== String(req.params.id));
    if (otraActiva) {
      return res.status(409).json({
        message: `Ya hay una votación activa ("${otraActiva.title}"). Ciérrala antes de activar otra.`,
        activeVotingId: otraActiva.id
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

    const totalVotesEmitted = votes.length;

    // Tres cifras distintas que no deben confundirse:
    //   Q_MS = quórum mínimo vigente        -> CEIL(universo * 20%)
    //   V    = votantes habilitados presentes (representaciones computables)
    //   M    = mayoría simple requerida     -> FLOOR(V / 2) + 1
    //
    // En Asamblea la mayoría se calcula sobre los HABILITADOS PRESENTES, no
    // sobre los votos emitidos: si de 18 habilitados solo votan 12, la mayoría
    // sigue siendo 10, no 7. Y el mínimo del Momento Siguiente (17) nunca es el
    // número de votos a favor necesarios para aprobar.
    let contexto = null;
    let baseMayoria = totalVotesEmitted;

    try {
      const Meeting = require('../models/Meeting');
      const meeting = await Meeting.findById(voting.meeting_id, null);
      if (meeting && QuorumService.normalizeMeetingType(meeting.type) === 'asamblea') {
        const quorumInfo = await QuorumService.getAssemblyQuorumInfo(voting.meeting_id, meeting);
        const habilitados = Number(quorumInfo?.present || 0);
        if (habilitados > 0) baseMayoria = habilitados;

        const Attendance = require('../models/Attendance');
        let asistentes = null;
        try { asistentes = await Attendance.countByStatus(voting.meeting_id, 'present'); } catch (e) { /* opcional */ }

        contexto = {
          es_asamblea: true,
          en_momento_siguiente: !!quorumInfo?.momento_siguiente?.aplicado,
          universo_delegados: Number(quorumInfo?.total || 0),
          quorum_minimo_vigente: Number(quorumInfo?.required || 0),
          quorum_inicial: Number(quorumInfo?.quorum_inicial || 0),
          quorum_momento_siguiente: Number(quorumInfo?.quorum_momento_siguiente || 0),
          votantes_habilitados: habilitados,
          asistentes_registrados: asistentes != null ? Number(asistentes) : null,
          base_mayoria: 'votantes_habilitados'
        };
      }
    } catch (e) {
      console.warn('[voting] no se pudo resolver el contexto de Asamblea:', e.message);
    }

    const majority = QuorumService.calculateSimpleMajority(baseMayoria);
    
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
    
    // Validar si alcanza mayoría simple, sobre la base que corresponda
    const majorityValidation = QuorumService.validateSimpleMajority(
      affirmativeVotes,
      baseMayoria
    );

    res.json({
      voting,
      results,
      votes,
      totalVotes: totalVotesEmitted,
      votantes_habilitados: contexto ? contexto.votantes_habilitados : totalVotesEmitted,
      majority,
      majorityValidation,
      contexto_quorum: contexto
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// VOT-CERRAR: Cerrar votación activa
exports.closeVoting = async (req, res) => {
  try {
    const voting = await Voting.findById(req.params.id);
    if (!voting) return res.status(404).json({ message: 'Voting not found' });
    await Voting.updateStatus(req.params.id, 'completed');
    res.json({ message: 'Voting closed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// VOT-LINK fix: obtener la votación ACTIVA de una reunión (sin auth)
exports.getActiveMeetingVoting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const votings = await Voting.findByMeeting(meetingId);
    const active = votings.find(v => v.status === 'active');
    if (!active) {
      return res.status(404).json({ message: 'No hay votación activa en este momento', noActive: true });
    }
    res.json({
      id: active.id,
      title: active.title,
      description: active.description,
      status: active.status,
      meeting_id: active.meeting_id,
      type: active.type,
      options: active.options || null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Endpoint público para obtener votación (sin autenticación)
exports.getPublicVoting = async (req, res) => {
  try {
    const rawId = req.params.id;
    const votingId = typeof rawId === 'string' ? parseInt(rawId, 10) : rawId;
    if (!Number.isFinite(Number(votingId))) {
      return res.status(400).json({ message: 'Voting id inválido' });
    }

    const voting = await Voting.findById(votingId);
    if (!voting) {
      return res.status(404).json({ message: 'Voting not found' });
    }
    // Devolver información necesaria incluyendo opciones
    res.json({
      id: voting.id,
      title: voting.title,
      description: voting.description,
      status: voting.status,
      meeting_id: voting.meeting_id,
      type: voting.type,
      options: voting.options || null // Opciones para votaciones múltiples
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
