const Meeting = require('../models/Meeting');
const Attendance = require('../models/Attendance');
const QuorumService = require('../services/quorumService');

exports.getAllMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.findAll(req.user.client_id);
    res.json(meetings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id, req.user.client_id);
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    res.json(meeting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Endpoint público para obtener reunión (sin autenticación)
exports.getPublicMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id, null);
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    // Solo devolver información básica, sin datos sensibles
    res.json({
      id: meeting.id,
      title: meeting.title,
      date: meeting.date,
      location: meeting.location,
      google_meet_link: meeting.google_meet_link,
      type: meeting.type,
      description: meeting.description
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createMeeting = async (req, res) => {
  try {
    const data = {
      ...req.body,
      client_id: req.user.client_id
    };
    const meetingId = await Meeting.create(data);
    
    // Generar el link público de asistencia
    const attendanceLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/public/meeting/${meetingId}/attendance`;
    
    res.status(201).json({ 
      id: meetingId, 
      message: 'Meeting created successfully',
      attendanceLink: attendanceLink
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateMeeting = async (req, res) => {
  try {
    await Meeting.update(req.params.id, req.body);
    res.json({ message: 'Meeting updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteMeeting = async (req, res) => {
  try {
    const meetingId = parseInt(req.params.id);
    const clientId = req.user.client_id;
    
    if (isNaN(meetingId)) {
      return res.status(400).json({ message: 'Invalid meeting ID' });
    }
    
    const meeting = await Meeting.findById(meetingId, clientId);
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    
    await Meeting.delete(meetingId, clientId);
    res.status(200).json({ message: 'Meeting deleted successfully' });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ message: error.message || 'Error al eliminar la reunión' });
  }
};

exports.getQuorum = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id, req.user.client_id);
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    try {
      const quorumInfo = await QuorumService.getQuorumInfo(req.params.id, req.user.client_id);
      res.json(quorumInfo);
    } catch (quorumError) {
      // Si hay error al calcular quorum (por ejemplo, no hay asistencias aún), devolver valores por defecto
      console.warn('Error calculating quorum, returning default values:', quorumError);
      const required = QuorumService.calculateRequiredQuorum(meeting.type, null);
      res.json({
        present: 0,
        required: required,
        total: meeting.type === 'junta_directiva' ? 12 : null,
        valid: false,
        type: meeting.type,
        message: `Quórum insuficiente: 0 presentes (mínimo requerido: ${required})`
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Valida si se puede instalar la sesión (iniciar formalmente)
 */
exports.validateInstallation = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id, req.user.client_id);
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Para asamblea, necesitaríamos el total de delegados
    // Por ahora, usamos null para JD (que tiene valor fijo de 12)
    const totalMembers = meeting.type === 'asamblea' ? null : null; // TODO: obtener total de delegados para asamblea
    
    const validation = await QuorumService.validateQuorumForInstallation(
      req.params.id,
      meeting.type,
      totalMembers
    );

    res.json(validation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Instala formalmente la sesión de la reunión
 */
exports.installSession = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id, req.user.client_id);
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }

    // Verificar si ya está instalada
    const isInstalled = await Meeting.isSessionInstalled(req.params.id, req.user.client_id);
    if (isInstalled) {
      return res.status(400).json({ message: 'Session is already installed' });
    }

    // Validar quórum antes de instalar
    const totalMembers = meeting.type === 'asamblea' ? null : null; // TODO: obtener total para asamblea
    const validation = await QuorumService.validateQuorumForInstallation(
      req.params.id,
      meeting.type,
      totalMembers
    );

    if (!validation.valid) {
      return res.status(400).json({ 
        message: validation.message,
        quorum: validation
      });
    }

    // Instalar la sesión
    await Meeting.installSession(req.params.id, req.user.client_id);
    
    res.json({ 
      message: 'Session installed successfully',
      quorum: validation
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

