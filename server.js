const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const passport = require('passport'); // Added passport
const authMiddleware = require('./middleware/authMiddleware'); // Added authMiddleware

// Cargar variables de entorno
dotenv.config();

// Importar configuración
const config = require('./config/config');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes'); // Added userRoutes
// const canalRoutes = require('./routes/canalRoutes'); // This was a placeholder from server.js initial content
// const anuncioRoutes = require('./routes/anuncioRoutes'); // This was a placeholder
const channelRoutes = require('./routes/channelRoutes'); // New
const adRoutes = require('./routes/adRoutes');           // New
// const transaccionRoutes = require('./routes/transaccionRoutes'); // Replaced
// const estadisticaRoutes = require('./routes/estadisticaRoutes'); // Replaced
const transactionRoutes = require('./routes/transactionRoutes'); // New
const statisticsRoutes = require('./routes/statisticsRoutes');   // New

// Inicializar app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan('dev'));

// Initialize Passport
app.use(authMiddleware.initializePassport); // Correctly use the exported initializePassport
// Or app.use(passport.initialize()); if you prefer to initialize directly after requiring passport

// Conectar a la base de datos
mongoose.connect(config.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Conexión a MongoDB establecida'))
  .catch(err => console.error('Error al conectar a MongoDB:', err));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes); // Added userRoutes
// app.use('/api/canales', canalRoutes); // Replace this
// app.use('/api/anuncios', anuncioRoutes); // Replace this
app.use('/api/channels', channelRoutes); // Use new one
app.use('/api/ads', adRoutes);           // Use new one
// app.use('/api/transacciones', transaccionRoutes); // Replace
// app.use('/api/estadisticas', estadisticaRoutes); // Replace
app.use('/api/transactions', transactionRoutes);   // New
app.use('/api/statistics', statisticsRoutes);     // New

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
