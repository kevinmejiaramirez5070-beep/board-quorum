const Member = require('../models/Member');
const User = require('../models/User');
const crypto = require('crypto');

exports.getAllMembers = async (req, res) => {
  try {
    const members = await Member.findAll(req.user.client_id);
    res.json(members);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMember = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id, req.user.client_id);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }
    res.json(member);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createMember = async (req, res) => {
  try {
    const { 
      email, name, role, position, member_type, principal_id, 
      tipo_documento, numero_documento, rol_organico,
      tipo_participante, rol_en_votacion,
      cuenta_quorum, puede_votar,
      createUserAccount = false 
    } = req.body;
    const client_id = req.user.client_id;

    // Validar campos requeridos
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'El nombre es requerido' });
    }

    if (!client_id) {
      return res.status(400).json({ message: 'client_id es requerido' });
    }

    // Si se solicita crear cuenta de usuario y hay email
    let userId = null;
    let temporaryPassword = null;

    if (createUserAccount && email) {
      // Verificar si ya existe un usuario con ese email
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ 
          message: 'Ya existe un usuario con ese email. El miembro se puede crear sin cuenta de usuario.' 
        });
      }

      // Generar contraseña temporal (8 caracteres alfanuméricos)
      temporaryPassword = crypto.randomBytes(4).toString('hex');
      
      // Crear usuario con rol 'member' (no admin)
      userId = await User.create({
        email,
        password: temporaryPassword, // Se hashea automáticamente en el modelo
        name: name || email,
        role: 'member', // Rol limitado, no admin
        client_id
      });
    }

    const data = {
      client_id,
      name: name.trim(),
      email: email || null,
      role: role || 'member',
      position: position || null,
      member_type: member_type || 'principal',
      principal_id: principal_id || null,
      user_id: userId || null, // Vincular el usuario con el miembro
      tipo_documento: tipo_documento || null,
      numero_documento: numero_documento || null,
      rol_organico: rol_organico || null,
      tipo_participante: tipo_participante || null,
      rol_en_votacion: rol_en_votacion || null,
      cuenta_quorum: cuenta_quorum !== undefined ? (cuenta_quorum ? 1 : 0) : 1,
      puede_votar: puede_votar !== undefined ? (puede_votar ? 1 : 0) : 1
    };

    console.log('Creating member with data:', data);

    const memberId = await Member.create(data);
    
    const response = {
      id: memberId,
      message: 'Member created successfully'
    };

    // Si se creó cuenta de usuario, incluir la contraseña temporal
    if (createUserAccount && temporaryPassword) {
      response.temporaryPassword = temporaryPassword;
      response.message += '. Se ha creado una cuenta de usuario con contraseña temporal.';
    }

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating member:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      sql: error.sql
    });
    res.status(500).json({ 
      message: error.message || 'Error al crear el miembro',
      details: process.env.NODE_ENV === 'development' ? error.sqlMessage : undefined
    });
  }
};

exports.updateMember = async (req, res) => {
  try {
    await Member.update(req.params.id, req.body);
    res.json({ message: 'Member updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteMember = async (req, res) => {
  try {
    await Member.delete(req.params.id);
    res.json({ message: 'Member deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Endpoint público para obtener miembros de una reunión (sin autenticación)
exports.getPublicMembersByMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const Meeting = require('../models/Meeting');
    
    // Obtener la reunión para obtener el client_id
    const meeting = await Meeting.findById(meetingId, null);
    if (!meeting) {
      return res.status(404).json({ message: 'Reunión no encontrada' });
    }
    
    // Obtener miembros del cliente
    const members = await Member.findAll(meeting.client_id);
    
    // Solo devolver información básica
    const publicMembers = members.map(m => ({
      id: m.id,
      name: m.name,
      role: m.role,
      email: m.email
    }));
    
    res.json(publicMembers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

