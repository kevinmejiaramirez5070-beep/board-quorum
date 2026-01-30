-- ============================================
-- BOARD QUORUM - SCRIPT SQL PARA POSTGRESQL (SUPABASE)
-- ============================================
-- Este script crea todas las tablas y estructura de la base de datos
-- Convertido de MySQL a PostgreSQL
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- CREAR TABLAS
-- ============================================

-- Tabla de clientes
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(100) UNIQUE NOT NULL,
  logo VARCHAR(500),
  primary_color VARCHAR(7) DEFAULT '#0072FF',
  secondary_color VARCHAR(7) DEFAULT '#00C6FF',
  language VARCHAR(2) DEFAULT 'es',
  active BOOLEAN DEFAULT true,
  paypal_client_id VARCHAR(500) NULL,
  paypal_secret VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger para updated_at en clients
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  client_id INTEGER NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Trigger para updated_at en users
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabla de miembros
CREATE TABLE IF NOT EXISTS members (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL,
  user_id INTEGER NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role VARCHAR(100),
  position VARCHAR(255),
  member_type VARCHAR(50) DEFAULT 'principal',
  principal_id INTEGER NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (principal_id) REFERENCES members(id) ON DELETE SET NULL
);

-- Trigger para updated_at en members
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabla de reuniones
CREATE TABLE IF NOT EXISTS meetings (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date TIMESTAMP NOT NULL,
  location VARCHAR(255),
  google_meet_link VARCHAR(500) NULL,
  type VARCHAR(50) DEFAULT 'junta_directiva',
  status VARCHAR(50) DEFAULT 'scheduled',
  session_installed BOOLEAN DEFAULT false,
  session_installed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Trigger para updated_at en meetings
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabla de asistencia
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  meeting_id INTEGER NOT NULL,
  member_id INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'present',
  arrival_time TIMESTAMP,
  acting_as_principal BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  UNIQUE (meeting_id, member_id)
);

-- Trigger para updated_at en attendance
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabla de votaciones
CREATE TABLE IF NOT EXISTS votings (
  id SERIAL PRIMARY KEY,
  meeting_id INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) DEFAULT 'simple',
  options TEXT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
);

-- Trigger para updated_at en votings
CREATE TRIGGER update_votings_updated_at BEFORE UPDATE ON votings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabla de votos
CREATE TABLE IF NOT EXISTS votes (
  id SERIAL PRIMARY KEY,
  voting_id INTEGER NOT NULL,
  member_id INTEGER NULL,
  voter_name VARCHAR(255) NULL,
  voter_email VARCHAR(255) NULL,
  option VARCHAR(100) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (voting_id) REFERENCES votings(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
  UNIQUE (voting_id, member_id)
);

-- Tabla de solicitudes de unión
CREATE TABLE IF NOT EXISTS join_requests (
  id SERIAL PRIMARY KEY,
  meeting_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  member_id INTEGER NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP NULL,
  responded_by INTEGER NULL,
  notes TEXT NULL,
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL,
  FOREIGN KEY (responded_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE (meeting_id, user_id)
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
CREATE INDEX IF NOT EXISTS idx_members_user ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_type ON members(member_type);
CREATE INDEX IF NOT EXISTS idx_members_principal ON members(principal_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_meeting_status ON join_requests(meeting_id, status);
CREATE INDEX IF NOT EXISTS idx_join_requests_user ON join_requests(user_id);

-- ============================================
-- FIN DEL SCRIPT DE ESTRUCTURA
-- ============================================
-- 
-- NOTA: Los datos (INSERT) se deben importar después
-- desde tu exportación de MySQL, adaptando los INSERT statements
-- ============================================
