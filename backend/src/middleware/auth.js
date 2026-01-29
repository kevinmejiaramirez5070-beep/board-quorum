const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Admin Master: Acceso total multi-cliente (Javier Castilla)
const isAdminMaster = (req, res, next) => {
  if (req.user.role !== 'admin_master') {
    return res.status(403).json({ message: 'Admin Master access required' });
  }
  next();
};

// Admin: Acceso completo dentro de su cliente (Nohora - Admin-Asocolci)
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'admin_master') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Authorized: Acceso limitado para gestionar durante reunión (Mónica - Autorizado-Asocolci)
const isAuthorized = (req, res, next) => {
  if (req.user.role !== 'authorized' && req.user.role !== 'admin' && req.user.role !== 'admin_master') {
    return res.status(403).json({ message: 'Authorized access required' });
  }
  next();
};

// Admin o Authorized: Para operaciones durante reunión
const isAdminOrAuthorized = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'authorized' && req.user.role !== 'admin_master') {
    return res.status(403).json({ message: 'Admin or Authorized access required' });
  }
  next();
};

// Legacy: Mantener compatibilidad
const isMember = (req, res, next) => {
  if (req.user.role !== 'member' && req.user.role !== 'admin' && req.user.role !== 'admin_master') {
    return res.status(403).json({ message: 'Member access required' });
  }
  next();
};

const isAdminOrMember = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'member' && req.user.role !== 'admin_master') {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

module.exports = { 
  auth, 
  isAdminMaster, 
  isAdmin, 
  isAuthorized, 
  isAdminOrAuthorized,
  isMember, 
  isAdminOrMember 
};

