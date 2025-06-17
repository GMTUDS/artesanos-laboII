const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./models');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Middleware para inyectar io en las rutas
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Rutas
app.use('/usuarios', require('./routes/usuarios.routes'));
app.use('/albumes', require('./routes/albumes.routes'));
app.use('/amistades', require('./routes/amistades.routes'));

// WebSocket para autenticación
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("No autorizado"));
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.usuario_id = decoded.id;
    next();
  } catch {
    next(new Error("Token inválido"));
  }
});

io.on('connection', (socket) => {
  console.log(`📡 Usuario conectado ID: ${socket.usuario_id}`);
  socket.join(`usuario_${socket.usuario_id}`);
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
db.sequelize.sync().then(() => {
  http.listen(PORT, () => {
    console.log(`✅ Rutas de usuarios cargadas`);
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
});

