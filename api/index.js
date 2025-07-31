const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');
const connectDB = require('./src/config/database');
const Test = require('./src/domain/models/Test');
const path = require('path');
const cors = require('cors');

connectDB();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Servir archivos estáticos de la carpeta web
app.use(express.static(path.join(__dirname, '../web')));

// Servir archivos CSS, JS e imágenes desde rutas específicas
app.use('/css', express.static(path.join(__dirname, '../web/css')));
app.use('/js', express.static(path.join(__dirname, '../web/js')));
app.use('/Images', express.static(path.join(__dirname, '../web/Images')));

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

// Redirección de la raíz a la aplicación web
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../web/index.html'));
});

// Ruta para acceder a Swagger manualmente
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rutas para las páginas HTML
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../web/html/login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../web/html/register.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../web/html/dashboard.html'));
});

app.get('/campobatallas', (req, res) => {
  res.sendFile(path.join(__dirname, '../web/html/campobatallas.html'));
});

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