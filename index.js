const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');
const connectDB = require('./src/config/database');
const Test = require('./src/domain/models/Test');
const path = require('path');

connectDB();

const app = express();
const port = process.env.PORT || 3000;

// Swagger config básica
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'API Saga Fighters',
    version: '1.0.0',
    description: 'Documentación de la API Saga Fighters',
  },
  servers: [
    { url: 'https://api-heroes-3l62.onrender.com' },
    { url: 'http://localhost:3000' }
  ],
};

const options = {
  swaggerDefinition,
  apis: [path.join(__dirname, 'src/presentation/routes/*.js')], // Rutas para documentación
};

const swaggerSpec = swaggerJSDoc(options);

// Redirección de la raíz (debe ir antes de los app.use de rutas)
app.get('/', (req, res) => {
  res.redirect('/api-docs/');
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(express.json());
const personajeRoutes = require('./src/presentation/routes/personajeRoutes');
const batallaRoutes = require('./src/presentation/routes/batallaRoutes');
const batalla3v3Routes = require('./src/presentation/routes/batalla3v3Routes');
const authRoutes = require('./src/presentation/routes/authRoutes');
app.use('/auth', authRoutes);
app.use(personajeRoutes);
app.use(batallaRoutes);
app.use(batalla3v3Routes);

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
  console.log(`Swagger docs en http://localhost:${port}/api-docs`);
}); 