-- BOARD QUORUM - Script SQL Completo
-- Base de datos: juntas
-- Ejecutar este script en MySQL para crear todas las tablas y datos iniciales

-- ============================================
-- CREAR TABLAS
-- ============================================

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(100) UNIQUE NOT NULL,
  logo VARCHAR(500),
  primary_color VARCHAR(7) DEFAULT '#0072FF',
  secondary_color VARCHAR(7) DEFAULT '#00C6FF',
  language VARCHAR(2) DEFAULT 'es',
  active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  client_id INT NOT NULL,
  active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Tabla de miembros
CREATE TABLE IF NOT EXISTS members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role VARCHAR(100),
  position VARCHAR(255),
  active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Tabla de reuniones
CREATE TABLE IF NOT EXISTS meetings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date DATETIME NOT NULL,
  location VARCHAR(255),
  type VARCHAR(50) DEFAULT 'junta_directiva',
  status VARCHAR(50) DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Tabla de asistencia
CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  meeting_id INT NOT NULL,
  member_id INT NOT NULL,
  status VARCHAR(50) DEFAULT 'present',
  arrival_time DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  UNIQUE KEY unique_attendance (meeting_id, member_id)
);

-- Tabla de votaciones
CREATE TABLE IF NOT EXISTS votings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  meeting_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) DEFAULT 'simple',
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
);

-- Tabla de votos
CREATE TABLE IF NOT EXISTS votes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  voting_id INT NOT NULL,
  member_id INT NOT NULL,
  option VARCHAR(100) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (voting_id) REFERENCES votings(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  UNIQUE KEY unique_vote (voting_id, member_id)
);

-- ============================================
-- CREAR ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_meetings_client ON meetings(client_id);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(date);
CREATE INDEX IF NOT EXISTS idx_attendance_meeting ON attendance(meeting_id);
CREATE INDEX IF NOT EXISTS idx_votings_meeting ON votings(meeting_id);
CREATE INDEX IF NOT EXISTS idx_votes_voting ON votes(voting_id);
CREATE INDEX IF NOT EXISTS idx_users_client ON users(client_id);
CREATE INDEX IF NOT EXISTS idx_members_client ON members(client_id);

-- ============================================
-- DATOS INICIALES
-- ============================================

-- Crear cliente por defecto (primero debe existir)
INSERT IGNORE INTO clients (id, name, subdomain, primary_color, secondary_color, language) 
VALUES (1, 'BOARD QUORUM Demo', 'demo', '#0072FF', '#00C6FF', 'es');

-- Crear usuario administrador
-- Email: admin@boardquorum.com
-- Contraseña: 1234566
-- Hash bcrypt actualizado
INSERT IGNORE INTO users (email, password, name, role, client_id) 
VALUES (
  'admin@boardquorum.com', 
  '$2a$10$t9TFCryLDNHjq.Lmnm2NpOawl1VzT7Uu5nV1BuuKN0R/tyRS2IMUi',
  'Administrador',
  'admin',
  1
);

-- Crear algunos miembros de ejemplo
INSERT IGNORE INTO members (client_id, name, email, role, position) VALUES
(1, 'Juan Perez', 'juan@example.com', 'Presidente', 'Presidente de la Junta'),
(1, 'Maria Garcia', 'maria@example.com', 'Vicepresidente', 'Vicepresidente'),
(1, 'Carlos Lopez', 'carlos@example.com', 'Secretario', 'Secretario'),
(1, 'Ana Martinez', 'ana@example.com', 'Tesorero', 'Tesorero');

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
