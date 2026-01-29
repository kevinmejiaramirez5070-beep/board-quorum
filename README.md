# BOARD QUORUM

Plataforma profesional para la gestión integral de reuniones formales de órganos colegiados.

## 🚀 Características

- ✅ Registro de asistencia
- ✅ Validación automática de quórum
- ✅ Sistema de votaciones
- ✅ Reportes y exportaciones
- ✅ Multi-cliente
- ✅ Multi-idioma (ES/EN)

## 📋 Requisitos

- Node.js 16+ 
- MySQL (XAMPP)
- Base de datos `juntas` creada en MySQL

## 🛠️ Instalación

### Backend

```bash
cd backend
npm install
```

Crear archivo `.env` con:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=juntas
PORT=5000
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:3000
```

Iniciar servidor:
```bash
npm start
# o para desarrollo
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm start
```

## 📁 Estructura del Proyecto

```
juntas/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── styles/
│   └── package.json
└── README.md
```

## 🎨 Identidad Visual

- **Colores principales**: Cyan degradado (#00C6FF → #0072FF)
- **Colores neutros**: Negro profundo (#0A0A0A), Grises (#1F2937, #4B5563)
- **Color premium**: Dorado (#D4AF37)

## 📝 Notas

- La base de datos debe tener las tablas: `clients`, `meetings`, `members`, `attendance`, `votings`, `votes`
- El backend corre en `http://localhost:5000`
- El frontend corre en `http://localhost:3000`

## 👨‍💻 Desarrollo

Desarrollado por **Pivot Consulting**
pivotconsulting.com.co

