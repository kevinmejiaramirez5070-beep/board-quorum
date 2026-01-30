const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'https://violet-nights-dance.loca.lt',
      'https://superinfinitely-unresentful-cannon.ngrok-free.dev',
      'https://minute-adipex-ata-demands.trycloudflare.com',
      // Dominios de producción
      'https://datacastilla.com',
      'https://www.datacastilla.com',
      process.env.CORS_ORIGIN // Permite configurar desde .env
    ].filter(Boolean); // Elimina valores undefined/null
    
    // Permitir cualquier URL de Cloudflare Tunnel
    const isCloudflareTunnel = origin?.includes('.trycloudflare.com');
    const isAllowedOrigin = !origin || allowedOrigins.indexOf(origin) !== -1;
    
    if (isAllowedOrigin || isCloudflareTunnel) {
      callback(null, true);
    } else {
      console.warn('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
// Aumentar el límite del body parser para permitir imágenes base64 grandes (10MB)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
try {
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/meetings', require('./routes/meetings'));
  app.use('/api/attendance', require('./routes/attendance'));
  app.use('/api/votings', require('./routes/votings'));
  app.use('/api/votes', require('./routes/votes'));
  app.use('/api/members', require('./routes/members'));
  app.use('/api/clients', require('./routes/clients'));
  app.use('/api/contact', require('./routes/contact'));
  console.log('✅ All routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading routes:', error);
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'BOARD QUORUM API is running' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 BOARD QUORUM API running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

