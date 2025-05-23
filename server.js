const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Importar configuración
const config = require('./config/config');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const canalRoutes = require('./routes/canalRoutes');
const anuncioRoutes = require('./routes/anuncioRoutes');
const transaccionRoutes = require('./routes/transaccionRoutes');
const estadisticaRoutes = require('./routes/estadisticaRoutes');

// Inicializar app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan('dev'));

// Conectar a la base de datos
mongoose.connect(config.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Conexión a MongoDB establecida'))
  .catch(err => console.error('Error al conectar a MongoDB:', err));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/canales', canalRoutes);
app.use('/api/anuncios', anuncioRoutes);
app.use('/api/transacciones', transaccionRoutes);
app.use('/api/estadisticas', estadisticaRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API de Plataforma de Monetización para Canales de Comunicación',
    version: '1.0.0'
  });
});

// Middleware para manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Middleware para rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// Iniciar servidor
const PORT = config.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});

module.exports = app;
