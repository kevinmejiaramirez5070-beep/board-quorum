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

// PASO 1: Verificar cédula (nuevo sistema seguro)
exports.verifyDocument = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { cedula } = req.body;

    if (!cedula) {
      return res.status(400).json({ message: 'Número de cédula es requerido' });
    }

    const Meeting = require('../models/Meeting');
    const Member = require('../models/Member');
    
    // Obtener la reunión para validar que existe y obtener client_id
    const meeting = await Meeting.findById(meetingId, null);
    if (!meeting) {
      return res.status(404).json({ message: 'Reunión no encontrada' });
    }

    // Buscar miembro por número de documento
    const member = await Member.findByDocumentNumber(cedula, meeting.client_id);
    
    if (!member) {
      // No encontrado - permitir registro manual
      return res.status(404).json({ 
        found: false,
        message: 'No se encontró en la base de datos',
        cedula: cedula
      });
    }

    // Miembro encontrado - validar elegibilidad (INTERNO, no mostrar al usuario)
    const isEligibleForQuorum = member.cuenta_quorum === true || member.cuenta_quorum === 1;
    
    // Retornar solo datos públicos para confirmación (NO mostrar campos sensibles)
    res.json({
      found: true,
      member: {
        id: member.id,
        name: member.name,
        numero_documento: member.numero_documento,
        position: member.position || member.rol_organico || 'Miembro'
      },
      eligibleForQuorum: isEligibleForQuorum,
      // Este mensaje se mostrará solo si NO es elegible
      quorumMessage: isEligibleForQuorum 
        ? null 
        : 'Tu asistencia se registrará pero NO cuenta para quórum'
    });
  } catch (error) {
    console.error('Error in verifyDocument:', error);
    res.status(500).json({ message: error.message || 'Error al verificar la cédula' });
  }
};

// PASO 5: Confirmar asistencia después de verificación
exports.confirmAttendance = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { cedula, confirmado } = req.body;

    if (!cedula || !confirmado) {
      return res.status(400).json({ message: 'Cédula y confirmación son requeridos' });
    }

    const Meeting = require('../models/Meeting');
    const Member = require('../models/Member');
    
    // Obtener la reunión
    const meeting = await Meeting.findById(meetingId, null);
    if (!meeting) {
      return res.status(404).json({ message: 'Reunión no encontrada' });
    }

    // Buscar miembro por número de documento
    const member = await Member.findByDocumentNumber(cedula, meeting.client_id);
    if (!member) {
      return res.status(404).json({ message: 'Miembro no encontrado' });
    }

    // Verificar si ya está registrado (por member_id o por número de documento - BUG-03)
    const existingByMember = await Attendance.findByMemberAndMeeting(meetingId, member.id);
    if (existingByMember) {
      return res.status(400).json({ message: 'Ya registraste tu asistencia para esta reunión' });
    }
    const existingByDoc = await Attendance.findByDocumentAndMeeting(meetingId, cedula);
    if (existingByDoc) {
      return res.status(400).json({ message: 'Ya registraste tu asistencia para esta reunión' });
    }

    // Registrar asistencia
    const data = {
      meeting_id: meetingId,
      member_id: member.id,
      status: 'present',
      arrival_time: new Date()
    };

    const attendanceId = await Attendance.create(data);
    res.status(201).json({ 
      id: attendanceId, 
      message: 'Asistencia registrada exitosamente',
      member: {
        name: member.name,
        position: member.position || member.rol_organico
      }
    });
  } catch (error) {
    console.error('Error in confirmAttendance:', error);
    res.status(500).json({ message: error.message || 'Error al confirmar la asistencia' });
  }
};

// Registro manual (pendiente de aprobación)
exports.registerManualAttendance = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { cedula, nombre_completo, cargo } = req.body;

    if (!cedula || !nombre_completo || !cargo) {
      return res.status(400).json({ message: 'Cédula, nombre completo y cargo son requeridos' });
    }

    const Meeting = require('../models/Meeting');
    
    // Evitar registro duplicado por mismo documento (BUG-03)
    const existingByDoc = await Attendance.findByDocumentAndMeeting(meetingId, cedula);
    if (existingByDoc) {
      return res.status(400).json({ message: 'Ya registraste tu asistencia para esta reunión' });
    }

    // Obtener la reunión
    const meeting = await Meeting.findById(meetingId, null);
    if (!meeting) {
      return res.status(404).json({ message: 'Reunión no encontrada' });
    }

    // Crear registro pendiente de aprobación (member_id será null)
    const data = {
      meeting_id: meetingId,
      member_id: null, // null porque no está en la BD
      status: 'present',
      arrival_time: new Date(),
      pending_approval: true,
      manual_name: nombre_completo,
      manual_position: cargo,
      manual_document: cedula
    };

    const attendanceId = await Attendance.create(data);
    res.status(201).json({ 
      id: attendanceId, 
      message: 'Registro pendiente de aprobación del administrador',
      pending: true
    });
  } catch (error) {
    console.error('Error in registerManualAttendance:', error);
    res.status(500).json({ message: error.message || 'Error al registrar la asistencia manual' });
  }
};

// Registro público de asistencia (LEGACY - mantener para compatibilidad, pero deprecar)
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

// Admin valida / rechaza asistencia pendiente (INVITADO / PERSONAL ADMIN / Miembros de órgano)
exports.approvePendingAttendance = async (req, res) => {
  try {
    const attendanceId = req.params.id;
    await Attendance.approveAttendance(attendanceId);
    res.json({ success: true, id: attendanceId });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error al aprobar asistencia' });
  }
};

exports.rejectPendingAttendance = async (req, res) => {
  try {
    const attendanceId = req.params.id;
    await Attendance.rejectAttendance(attendanceId);
    res.json({ success: true, id: attendanceId });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error al rechazar asistencia' });
  }
};

