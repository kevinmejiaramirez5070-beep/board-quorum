const JoinRequest = require('../models/JoinRequest');
const Member = require('../models/Member');

exports.requestToJoin = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const userId = req.user.id;

    // Verificar si ya existe una solicitud
    const existingRequest = await JoinRequest.findByUserAndMeeting(userId, meetingId);
    if (existingRequest) {
      return res.status(400).json({ 
        message: 'Ya has enviado una solicitud para esta reunión',
        status: existingRequest.status
      });
    }

    // Buscar el miembro asociado al usuario
    const member = await Member.findByUserId(userId);
    const memberId = member ? member.id : null;

    // Crear la solicitud
    const requestId = await JoinRequest.create({
      meeting_id: meetingId,
      user_id: userId,
      member_id: memberId
    });

    res.status(201).json({ 
      message: 'Solicitud enviada exitosamente',
      requestId 
    });
  } catch (error) {
    console.error('Error creating join request:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getPendingRequests = async (req, res) => {
  try {
    const { meetingId } = req.params;
    
    // Solo admin puede ver las solicitudes
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const requests = await JoinRequest.findByMeeting(meetingId, 'pending');
    res.json(requests);
  } catch (error) {
    console.error('Error getting pending requests:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.acceptRequest = async (req, res) => {
  try {
    const { meetingId, requestId } = req.params;
    
    // Solo admin puede aceptar solicitudes
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const request = await JoinRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    if (request.meeting_id !== parseInt(meetingId)) {
      return res.status(400).json({ message: 'La solicitud no pertenece a esta reunión' });
    }

    // Actualizar estado
    await JoinRequest.updateStatus(requestId, 'accepted', req.user.id);

    res.json({ message: 'Solicitud aceptada exitosamente' });
  } catch (error) {
    console.error('Error accepting request:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.rejectRequest = async (req, res) => {
  try {
    const { meetingId, requestId } = req.params;
    
    // Solo admin puede rechazar solicitudes
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const request = await JoinRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    if (request.meeting_id !== parseInt(meetingId)) {
      return res.status(400).json({ message: 'La solicitud no pertenece a esta reunión' });
    }

    // Actualizar estado
    await JoinRequest.updateStatus(requestId, 'rejected', req.user.id);

    res.json({ message: 'Solicitud rechazada' });
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getUserRequestStatus = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const userId = req.user.id;

    const request = await JoinRequest.findByUserAndMeeting(userId, meetingId);
    
    if (!request) {
      return res.json({ status: 'none' });
    }

    res.json({ status: request.status });
  } catch (error) {
    console.error('Error getting request status:', error);
    res.status(500).json({ message: error.message });
  }
};






