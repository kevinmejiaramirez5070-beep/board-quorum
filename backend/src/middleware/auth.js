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

// Solo Autorizado o Admin Master: acciones en vivo (activar votación, instalar sesión, etc.)
const isAuthorizedLive = (req, res, next) => {
  if (req.user.role !== 'authorized' && req.user.role !== 'admin_master') {
    return res.status(403).json({ message: 'Authorized live role required' });
  }
  next();
};

// MD-03 — Operador de Asamblea.
// La estructura operativa de Asamblea son cuatro cuentas nominativas:
//   Administrador Maestro, Administración/Operación 1 y 2, y Revisoría Fiscal.
// Los cuatro comparten los mismos permisos operativos dentro de la Asamblea
// (gestionar Delegados, registro/ingreso, consultar quórum, crear votaciones,
// consultar resultados y ejecutar "Aplicar Momento Siguiente").
//
// La DECISIÓN de aplicar el Momento Siguiente corresponde a Revisoría Fiscal;
// la EJECUCIÓN material puede hacerla cualquiera de los cuatro. Board Quorum
// registra siempre quién lo ejecutó.
//
// No reemplaza a isAuthorizedLive: Junta Directiva conserva su regla actual.
const ASSEMBLY_OPERATOR_ROLES = ['admin_master', 'admin', 'authorized'];

const isAssemblyOperator = (req, res, next) => {
  if (!ASSEMBLY_OPERATOR_ROLES.includes(req.user.role)) {
    return res.status(403).json({
      message: 'Esta acción está reservada a los usuarios operativos de Asamblea (Administración o Revisoría Fiscal).'
    });
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
  isAuthorizedLive,
  isAssemblyOperator,
  ASSEMBLY_OPERATOR_ROLES,
  isMember,
  isAdminOrMember
};

