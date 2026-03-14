const Client = require('../models/Client');
const User = require('../models/User');
const Meeting = require('../models/Meeting');
const db = require('../config/database');

// Endpoint público: solo organizaciones ACTIVAS (para login)
exports.getPublic = async (req, res) => {
  try {
    const clients = await Client.findAll();
    const list = Array.isArray(clients) ? clients : [];
    const publicClients = list
      .filter(c => c != null && (c.active === true || c.active === 1))
      .map(client => ({
        id: client.id,
        name: client.name != null ? String(client.name) : ''
      }));
    res.json(publicClients);
  } catch (error) {
    console.error('Error in getPublic clients:', error);
    res.status(500).json({
      message: error.message || 'Error al cargar organizaciones'
    });
  }
};

exports.getAll = async (req, res) => {
  try {
    const clients = await Client.findAllForAdmin();
    
    // Si es admin master, agregar información de última actividad
    if (req.user?.role === 'admin_master') {
      const clientsWithActivity = await Promise.all(
        clients.map(async (client) => {
          try {
            // Obtener última reunión activa o próxima
            const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
            const [lastMeeting] = await db.execute(
              `SELECT id, title, status, date, updated_at 
               FROM meetings 
               WHERE client_id = ? 
               ORDER BY updated_at DESC, date DESC 
               LIMIT 1`,
              [client.id]
            );
            
            // Determinar estado del cliente
            let status = 'inactivo';
            let lastActivity = null;
            
            if (lastMeeting && lastMeeting.length > 0) {
              const meeting = lastMeeting[0];
              const meetingDate = new Date(meeting.updated_at || meeting.date);
              const now = new Date();
              const diffMinutes = (now - meetingDate) / (1000 * 60);
              const diffHours = diffMinutes / 60;
              
              if (meeting.status === 'active') {
                status = 'activa';
                lastActivity = 'Ahora';
              } else if (diffMinutes < 60) {
                status = 'activa';
                lastActivity = `Hace ${Math.floor(diffMinutes)} min`;
              } else if (diffHours < 24) {
                status = 'activa';
                lastActivity = `Hace ${Math.floor(diffHours)} h`;
              } else if (diffHours < 48) {
                status = 'activa';
                lastActivity = 'Ayer ' + meetingDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
              } else {
                const meetingDateObj = new Date(meeting.date);
                if (meetingDateObj > now) {
                  status = 'programada';
                  lastActivity = 'Mañana ' + meetingDateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                } else {
                  lastActivity = meetingDate.toLocaleDateString('es-ES');
                }
              }
            }
            
            return {
              ...client,
              status,
              lastActivity
            };
          } catch (error) {
            console.error(`Error getting activity for client ${client.id}:`, error);
            return {
              ...client,
              status: 'inactivo',
              lastActivity: null
            };
          }
        })
      );
      
      return res.json(clientsWithActivity);
    }
    
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
      console.log('Creating client with data:', { name, subdomain, primary_color, secondary_color, language });
      clientId = await Client.create({
        name,
        subdomain,
        logo: logo || null,
        primary_color: primary_color || '#0072FF',
        secondary_color: secondary_color || '#00C6FF',
        language: language || 'es'
      });
      console.log('Client created successfully with ID:', clientId);
      
      if (!clientId) {
        console.error('❌ Client ID is null or undefined');
        return res.status(500).json({ 
          message: 'Error: No se pudo obtener el ID de la organización creada',
          details: 'El backend creó la organización pero no pudo obtener el ID'
        });
      }
    } catch (createError) {
      console.error('❌ Error creating client:', createError);
      console.error('Error message:', createError.message);
      console.error('Error stack:', createError.stack);
      
      // Capturar error de duplicado de subdomain (MySQL)
      if (createError.code === 'ER_DUP_ENTRY' && createError.sqlMessage && createError.sqlMessage.includes('subdomain')) {
        return res.status(400).json({ 
          message: `El subdominio "${subdomain}" ya está en uso. Por favor, elige otro subdominio.` 
        });
      }
      // Capturar error de duplicado de subdomain (PostgreSQL)
      if (createError.code === '23505' && createError.constraint && createError.constraint.includes('subdomain')) {
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

/** Activar o desactivar organización (solo admin master). Body: { active: true|false } */
exports.setActive = async (req, res) => {
  try {
    if (req.user?.role !== 'admin_master' && req.user?.email !== 'admin@boardquorum.com') {
      return res.status(403).json({ message: 'No tienes permisos para cambiar el estado' });
    }
    const active = req.body.active === true || req.body.active === 'true' || req.body.active === 1;
    await Client.setActive(req.params.id, active);
    res.json({ success: true, active });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Error al actualizar estado' });
  }
};

// Estadísticas de plataforma (solo para admin_master)
exports.getPlatformStats = async (req, res) => {
  try {
    if (req.user.role !== 'admin_master') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const isPostgreSQL = !!process.env.DATABASE_URL || process.env.DB_TYPE === 'postgresql';
    const activeCondition = isPostgreSQL ? 'active = true' : 'active = 1';

    // Clientes activos
    const [activeClients] = await db.execute(
      `SELECT COUNT(*) as count FROM clients WHERE ${activeCondition}`
    );

    // Reuniones activas
    const [activeMeetings] = await db.execute(
      `SELECT COUNT(*) as count FROM meetings WHERE status = 'active'`
    );

    // Usuarios totales
    const [totalUsers] = await db.execute(
      `SELECT COUNT(*) as count FROM users WHERE ${activeCondition}`
    );

    res.json({
      activeClients: parseInt(activeClients[0]?.count || 0),
      activeMeetings: parseInt(activeMeetings[0]?.count || 0),
      totalUsers: parseInt(totalUsers[0]?.count || 0)
    });
  } catch (error) {
    console.error('Error getting platform stats:', error);
    res.status(500).json({ message: error.message || 'Error al obtener estadísticas de plataforma' });
  }
};

// Reuniones activas de todos los clientes (solo para admin_master)
exports.getActiveMeetings = async (req, res) => {
  try {
    if (req.user.role !== 'admin_master') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const [meetings] = await db.execute(
      `SELECT 
        m.id,
        m.title,
        m.status,
        m.date,
        m.location,
        m.google_meet_link,
        c.id as client_id,
        c.name as client_name,
        p.name as product_name
      FROM meetings m
      JOIN clients c ON m.client_id = c.id
      LEFT JOIN products p ON m.product_id = p.id
      WHERE m.status = 'active'
      ORDER BY m.date ASC`
    );

    // Agregar información de quórum si es posible
    const meetingsWithQuorum = await Promise.all(
      meetings.map(async (meeting) => {
        try {
          const QuorumService = require('../services/quorumService');
          const quorumInfo = await QuorumService.getQuorumInfo(meeting.id, meeting.client_id);
          return {
            ...meeting,
            quorum: quorumInfo
          };
        } catch (error) {
          return meeting;
        }
      })
    );

    res.json(meetingsWithQuorum);
  } catch (error) {
    console.error('Error getting active meetings:', error);
    res.status(500).json({ message: error.message || 'Error al obtener reuniones activas' });
  }
};
