const Product = require('../models/Product');
const Member = require('../models/Member');
const Meeting = require('../models/Meeting');

// Obtener todos los productos de un cliente
exports.getAll = async (req, res) => {
  try {
    // El token JWT guarda client_id, no clientId
    const clientId = req.user.client_id || req.user.clientId;
    console.log('Getting products for clientId:', clientId, 'User:', req.user);
    
    if (!clientId) {
      return res.status(400).json({ message: 'Client ID no encontrado en el token' });
    }
    
    const products = await Product.findAll(clientId);
    console.log('Products found:', products.length);
    res.json(products);
  } catch (error) {
    console.error('Error in getAll products:', error);
    res.status(500).json({ message: error.message || 'Error al obtener productos' });
  }
};

// Obtener un producto por ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user.client_id || req.user.clientId;
    const product = await Product.findById(id, clientId);
    
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    
    // Obtener estadísticas (opcional, si falla devolver producto sin stats)
    try {
      const stats = await Product.getStats(id, clientId);
      res.json({ ...product, stats });
    } catch (statsError) {
      console.error('Error getting stats, returning product without stats:', statsError);
      res.json({ ...product, stats: { memberCount: 0, meetingCount: 0, activeMeeting: null } });
    }
  } catch (error) {
    console.error('Error in getById product:', error);
    res.status(500).json({ message: error.message || 'Error al obtener producto' });
  }
};

// Crear un nuevo producto
exports.create = async (req, res) => {
  try {
    const clientId = req.user.client_id || req.user.clientId;
    const { name, description, quorum_rule, quorum_value, voting_rule, allow_substitutions } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'El nombre del producto es requerido' });
    }
    
    const productId = await Product.create({
      client_id: clientId,
      name,
      description,
      quorum_rule,
      quorum_value,
      voting_rule,
      allow_substitutions
    });
    
    res.status(201).json({ id: productId, message: 'Producto creado exitosamente' });
  } catch (error) {
    console.error('Error in create product:', error);
    res.status(500).json({ message: error.message || 'Error al crear producto' });
  }
};

// Actualizar un producto
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user.client_id || req.user.clientId;
    
    // Verificar que el producto existe y pertenece al cliente
    const product = await Product.findById(id, clientId);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    
    await Product.update(id, req.body);
    res.json({ message: 'Producto actualizado exitosamente' });
  } catch (error) {
    console.error('Error in update product:', error);
    res.status(500).json({ message: error.message || 'Error al actualizar producto' });
  }
};

// Eliminar un producto (soft delete)
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user.client_id || req.user.clientId;
    
    // Verificar que el producto existe y pertenece al cliente
    const product = await Product.findById(id, clientId);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    
    await Product.delete(id, clientId);
    res.json({ message: 'Producto eliminado exitosamente' });
  } catch (error) {
    console.error('Error in delete product:', error);
    res.status(500).json({ message: error.message || 'Error al eliminar producto' });
  }
};

// Obtener estadísticas de un producto
exports.getStats = async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user.client_id || req.user.clientId;
    
    const product = await Product.findById(id, clientId);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    
    const stats = await Product.getStats(id, clientId);
    res.json(stats);
  } catch (error) {
    console.error('Error in getStats product:', error);
    res.status(500).json({ message: error.message || 'Error al obtener estadísticas' });
  }
};
