const Attendance = require('../models/Attendance');

// M1 — registra un evento de quórum solo si la reunión es de tipo asamblea.
// No bloquea el flujo principal si algo falla.
async function logAssemblyQuorumEvent(meetingId, eventType, memberId, operatorId, detalle) {
  try {
    const db = require('../config/database');
    const [rows] = await db.execute(`SELECT type, product_id FROM meetings WHERE id = ? LIMIT 1`, [meetingId]);
    const meeting = rows[0];
    if (!meeting || !meeting.product_id) return;
    const QuorumService = require('../services/quorumService');
    if (QuorumService.normalizeMeetingType(meeting.type) !== 'asamblea') return;
    // M3 — reevaluar poderes (activar/suspender) tras el cambio de asistencia
    try {
      const AssemblyPowersService = require('../services/assemblyPowersService');
      await AssemblyPowersService.evaluatePowerOnAttendanceChange(meetingId);
    } catch (pe) { /* tabla de poderes puede no existir */ }
    const AssemblyQuorumService = require('../services/assemblyQuorumService');
    // MD-02: si el Momento Siguiente está activo, cada cambio de asistencia puede
    // ser el que alcance el 20 %. Se reevalúa para dejar la hora exacta registrada.
    try {
      const MomentService = require('../services/assemblyMomentService');
      await MomentService.evaluateMomentOutcome(meetingId);
    } catch (me) { /* tabla MD-02 puede no existir aún */ }
    const panel = await AssemblyQuorumService.getFullAssemblyPanel(meetingId);
    await AssemblyQuorumService.logQuorumEvent(
      meetingId, eventType, memberId || null, operatorId || null,
      {}, { cursos: panel.cursos_representados, estado: panel.estado }, detalle || ''
    );
  } catch (e) {
    console.warn('[assembly] logAssemblyQuorumEvent falló:', e.message);
  }
}

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

// MD-02 — Registro masivo de asistencia (varios miembros en una operación)
exports.registerBulkAttendance = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { member_ids, status = 'present' } = req.body;
    if (!Array.isArray(member_ids) || member_ids.length === 0) {
      return res.status(400).json({ message: 'member_ids debe ser un arreglo con al menos un miembro' });
    }

    let registered = 0, skipped = 0;
    const errors = [];
    // MD-04: el modo masivo NO es una lógica paralela. Usa exactamente el mismo
    // Attendance.create del registro individual, y el efecto sobre quórum lo sigue
    // resolviendo el motor por curso (un curso aporta máximo una representación).
    const resultados = [];
    for (const memberId of member_ids) {
      try {
        // Evitar duplicado: si ya existe registro para el miembro, se omite
        const existing = await Attendance.findByMemberAndMeeting(meetingId, memberId);
        if (existing) {
          skipped++;
          resultados.push({ member_id: Number(memberId), resultado: 'omitido', motivo: 'ya_registrado' });
          continue;
        }
        const attendanceId = await Attendance.create({
          meeting_id: meetingId,
          member_id: parseInt(memberId),
          status,
          arrival_time: new Date()
        });
        registered++;
        resultados.push({ member_id: Number(memberId), resultado: 'registrado', attendance_id: attendanceId });
      } catch (e) {
        errors.push({ member_id: memberId, motivo: e.message });
        resultados.push({ member_id: Number(memberId), resultado: 'error', motivo: e.message });
      }
    }

    // MD-04: cada asistencia debe quedar individualmente trazable, aunque la
    // operación se haya ejecutado en bloque.
    const detalleIndividual = resultados
      .map(r => `${r.member_id}:${r.resultado}`)
      .join(', ');

    // Recalcular quórum de asamblea si aplica (una sola vez al final)
    await logAssemblyQuorumEvent(
      meetingId, 'REGISTRO_MASIVO', null, req.user?.id,
      `Registro masivo por usuario ${req.user?.id ?? 's/id'}: ` +
      `${registered} registrados, ${skipped} omitidos, ${errors.length} con error. ` +
      `Detalle [${detalleIndividual}]`
    );

    res.status(201).json({ message: 'Registro masivo procesado', registered, skipped, errors, resultados });
  } catch (error) {
    console.error('Error in registerBulkAttendance:', error);
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
    // Normalizar: solo dígitos (por si viene con puntos o comas)
    const cedulaNorm = String(cedula).replace(/\D/g, '') || cedula;

    const Meeting = require('../models/Meeting');
    const Member = require('../models/Member');
    
    // Obtener la reunión para validar que existe y obtener client_id
    const meeting = await Meeting.findById(meetingId, null);
    if (!meeting) {
      return res.status(404).json({ message: 'Reunión no encontrada' });
    }

    // Buscar miembro por número de documento
    const member = await Member.findByDocumentNumber(cedulaNorm, meeting.client_id);

    if (!member) {
      // No encontrado - permitir registro manual
      return res.status(404).json({ 
        found: false,
        message: 'No se encontró en la base de datos',
        cedula: cedulaNorm
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
    const cedulaNormConfirm = String(cedula).replace(/\D/g, '') || cedula;

    const Meeting = require('../models/Meeting');
    const Member = require('../models/Member');
    
    // Obtener la reunión
    const meeting = await Meeting.findById(meetingId, null);
    if (!meeting) {
      return res.status(404).json({ message: 'Reunión no encontrada' });
    }

    // Buscar miembro por número de documento
    const member = await Member.findByDocumentNumber(cedulaNormConfirm, meeting.client_id);
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
    await logAssemblyQuorumEvent(meetingId, 'INGRESO_DELEGADO', member.id, null, `Ingreso ${member.name}`);
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
    const { cedula, nombre_completo, cargo, motivo } = req.body;

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
      manual_document: cedula,
      // MD-05 §9-11 — el registro manual es una contingencia: queda pendiente de
      // aprobación y con el motivo declarado, para poder revisarse después.
      manual_motivo: motivo || null,
      registered_by: req.user?.id ?? null
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
    const db = require('../config/database');
    const [rows] = await db.execute(`SELECT meeting_id, member_id FROM attendance WHERE id = ? LIMIT 1`, [attendanceId]);
    await Attendance.approveAttendance(attendanceId);
    if (rows[0]) await logAssemblyQuorumEvent(rows[0].meeting_id, 'APROBACION_PENDIENTE', rows[0].member_id, req.user?.id, 'Aprobación de asistencia');
    res.json({ success: true, id: attendanceId });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error al aprobar asistencia' });
  }
};

exports.rejectPendingAttendance = async (req, res) => {
  try {
    const attendanceId = req.params.id;
    const db = require('../config/database');
    const [rows] = await db.execute(`SELECT meeting_id, member_id FROM attendance WHERE id = ? LIMIT 1`, [attendanceId]);
    await Attendance.rejectAttendance(attendanceId);
    if (rows[0]) await logAssemblyQuorumEvent(rows[0].meeting_id, 'RECHAZO_PENDIENTE', rows[0].member_id, req.user?.id, 'Rechazo de asistencia');
    res.json({ success: true, id: attendanceId });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error al rechazar asistencia' });
  }
};

