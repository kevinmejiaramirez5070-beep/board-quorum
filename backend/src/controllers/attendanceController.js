const Attendance = require('../models/Attendance');

exports.getAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findByMeeting(req.params.meetingId);
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.registerAttendance = async (req, res) => {
  try {
    const data = {
      meeting_id: req.params.meetingId,
      member_id: req.body.member_id,
      status: req.body.status || 'present',
      arrival_time: new Date()
    };
    const attendanceId = await Attendance.create(data);
    res.status(201).json({ id: attendanceId, message: 'Attendance registered' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateAttendance = async (req, res) => {
  try {
    await Attendance.update(req.params.id, req.body);
    res.json({ message: 'Attendance updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Registro público de asistencia (sin autenticación, mediante link compartible)
exports.registerPublicAttendance = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { member_id, status = 'present' } = req.body;

    if (!member_id) {
      return res.status(400).json({ message: 'member_id es requerido' });
    }

    // Verificar que el miembro existe y obtener el client_id de la reunión
    const Meeting = require('../models/Meeting');
    const Member = require('../models/Member');
    
    // Obtener la reunión para validar que existe
    const meeting = await Meeting.findById(meetingId, null); // Sin validar client_id para acceso público
    if (!meeting) {
      return res.status(404).json({ message: 'Reunión no encontrada' });
    }

    // Verificar que el miembro pertenece al mismo cliente
    const member = await Member.findById(member_id, meeting.client_id);
    if (!member) {
      return res.status(404).json({ message: 'Miembro no encontrado o no pertenece a esta organización' });
    }

    // Verificar si ya está registrado
    const existingAttendance = await Attendance.findByMemberAndMeeting(meetingId, member_id);
    if (existingAttendance) {
      return res.status(400).json({ message: 'Ya has registrado tu asistencia para esta reunión' });
    }

    const data = {
      meeting_id: meetingId,
      member_id: parseInt(member_id),
      status: status,
      arrival_time: new Date()
    };

    const attendanceId = await Attendance.create(data);
    res.status(201).json({ id: attendanceId, message: 'Asistencia registrada exitosamente' });
  } catch (error) {
    console.error('Error in registerPublicAttendance:', error);
    res.status(500).json({ message: error.message || 'Error al registrar la asistencia' });
  }
};

