const Client = require('../models/Client');
const User = require('../models/User');

exports.getAll = async (req, res) => {
  try {
    const clients = await Client.findAll();
    res.json(clients);
  } catch (error) {
    console.error('Error in getAll clients:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: error.message || 'Error al cargar organizaciones',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

exports.getById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    res.json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    // Solo el super admin puede crear organizaciones
    if (req.user.email !== 'admin@boardquorum.com') {
      return res.status(403).json({ message: 'No tienes permisos para crear organizaciones' });
    }

    const { 
      name, 
      subdomain, 
      logo, 
      primary_color, 
      secondary_color, 
      language,
      client_id,
      secret,
      pilotClient 
    } = req.body;

    // Validar campos requeridos
    if (!name || !subdomain) {
      return res.status(400).json({ message: 'Nombre y subdominio son requeridos' });
    }

    // Validar datos del cliente piloto
    if (!pilotClient || !pilotClient.name || !pilotClient.email || !pilotClient.password) {
      return res.status(400).json({ message: 'Datos del cliente piloto son requeridos' });
    }

    // Verificar que el subdominio sea único
    const existingClient = await Client.findBySubdomain(subdomain);
    if (existingClient) {
      return res.status(400).json({ message: 'El subdominio ya está en uso' });
    }

    // Verificar que el email del cliente piloto sea único
    const existingUser = await User.findByEmail(pilotClient.email);
    if (existingUser) {
      return res.status(400).json({ message: 'El email del cliente piloto ya está registrado' });
    }

    // Crear la organización
    let clientId;
    try {
      clientId = await Client.create({
        name,
        subdomain,
        logo: logo || null,
        primary_color: primary_color || '#0072FF',
        secondary_color: secondary_color || '#00C6FF',
        language: language || 'es'
      });
    } catch (createError) {
      // Capturar error de duplicado de subdomain
      if (createError.code === 'ER_DUP_ENTRY' && createError.sqlMessage.includes('subdomain')) {
        return res.status(400).json({ 
          message: `El subdominio "${subdomain}" ya está en uso. Por favor, elige otro subdominio.` 
        });
      }
      throw createError;
    }

    // Crear el cliente piloto (admin de la organización)
    try {
      await User.create({
        email: pilotClient.email,
        password: pilotClient.password,
        name: pilotClient.name,
        role: 'admin',
        client_id: clientId
      });
    } catch (userError) {
      // Si falla la creación del usuario, eliminar la organización creada
      await Client.delete(clientId);
      
      // Capturar error de duplicado de email
      if (userError.code === 'ER_DUP_ENTRY' && userError.sqlMessage.includes('email')) {
        return res.status(400).json({ 
          message: `El email "${pilotClient.email}" ya está registrado. Por favor, usa otro email.` 
        });
      }
      throw userError;
    }

    const client = await Client.findById(clientId);
    res.status(201).json(client);
  } catch (error) {
    console.error('Error creating organization:', error);
    
    // Manejar errores específicos de MySQL
    if (error.code === 'ER_DUP_ENTRY') {
      if (error.sqlMessage.includes('subdomain')) {
        return res.status(400).json({ 
          message: `El subdominio ya está en uso. Por favor, elige otro subdominio.` 
        });
      }
      if (error.sqlMessage.includes('email')) {
        return res.status(400).json({ 
          message: `El email del cliente piloto ya está registrado. Por favor, usa otro email.` 
        });
      }
    }
    
    res.status(500).json({ 
      message: error.message || 'Error al crear la organización' 
    });
  }
};

exports.update = async (req, res) => {
  try {
    // Solo el super admin puede actualizar organizaciones
    if (req.user.email !== 'admin@boardquorum.com') {
      return res.status(403).json({ message: 'No tienes permisos para actualizar organizaciones' });
    }

    await Client.update(req.params.id, req.body);
    const client = await Client.findById(req.params.id);
    res.json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    // Solo el super admin puede eliminar organizaciones
    if (req.user.email !== 'admin@boardquorum.com') {
      return res.status(403).json({ message: 'No tienes permisos para eliminar organizaciones' });
    }

    await Client.delete(req.params.id);
    res.json({ message: 'Organización eliminada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
