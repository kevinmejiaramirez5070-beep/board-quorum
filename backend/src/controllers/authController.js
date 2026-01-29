const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const isValidPassword = await User.comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        client_id: user.client_id 
      },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '24h' }
    );

    const { password: _, ...userWithoutPassword } = user;

    // Admin Master NO debe tener cliente asociado (usa colores oficiales de Board Quorum)
    // Solo obtener cliente si el usuario NO es admin_master
    let client = null;
    if (user.role !== 'admin_master' && user.client_id) {
      try {
        const Client = require('../models/Client');
        client = await Client.findById(user.client_id);
        console.log('Cliente obtenido para usuario:', {
          userId: user.id,
          email: user.email,
          role: user.role,
          clientId: user.client_id,
          client: client ? {
            id: client.id,
            name: client.name,
            primary_color: client.primary_color,
            secondary_color: client.secondary_color
          } : null
        });
      } catch (error) {
        console.error('Error obteniendo cliente:', error);
      }
    } else if (user.role === 'admin_master') {
      console.log('Admin Master detectado - no se carga cliente (usa colores oficiales):', {
        userId: user.id,
        email: user.email,
        role: user.role
      });
    } else {
      console.log('Usuario sin client_id:', {
        userId: user.id,
        email: user.email,
        client_id: user.client_id
      });
    }

    res.json({
      token,
      user: userWithoutPassword,
      client: client || null // Admin Master siempre recibe null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.register = async (req, res) => {
  try {
    const { email, password, name, role, client_id } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Email, contraseña y nombre son requeridos' });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }

    const userId = await User.create({ email, password, name, role, client_id });
    const user = await User.findById(userId);

    res.status(201).json({ message: 'Usuario creado exitosamente', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Contraseña actual y nueva contraseña son requeridas' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    // Obtener el hash de la contraseña actual
    const currentPasswordHash = await User.getPasswordHash(userId);
    if (!currentPasswordHash) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar que la contraseña actual sea correcta
    const isValidPassword = await User.comparePassword(currentPassword, currentPasswordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Contraseña actual incorrecta' });
    }

    // Actualizar la contraseña
    await User.updatePassword(userId, newPassword);

    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.changeEmail = async (req, res) => {
  try {
    const { newEmail, password } = req.body;
    const userId = req.user.id;

    if (!newEmail || !password) {
      return res.status(400).json({ message: 'Nuevo correo y contraseña son requeridos' });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return res.status(400).json({ message: 'Formato de correo inválido' });
    }    // Verificar que el nuevo email no esté en uso
    const existingUser = await User.findByEmail(newEmail);
    if (existingUser && existingUser.id !== userId) {
      return res.status(400).json({ message: 'El correo ya está en uso' });
    }

    // Verificar la contraseña actual
    const currentPasswordHash = await User.getPasswordHash(userId);
    if (!currentPasswordHash) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const isValidPassword = await User.comparePassword(password, currentPasswordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    // Actualizar el correo
    await User.updateEmail(userId, newEmail);

    // Obtener el usuario actualizado
    const updatedUser = await User.findById(userId);

    res.json({ 
      message: 'Correo actualizado exitosamente',
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};