const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();

const Personaje = require('./src/domain/models/PersonajeMongo');
const Batalla = require('./src/domain/models/BatallaMongo');
const Batalla3v3 = require('./src/domain/models/Batalla3v3Mongo');

async function importarDatos() {
  await mongoose.connect(process.env.MONGODB_URI, {});

  // Importar personajes
  const personajesData = JSON.parse(fs.readFileSync('./src/infrastructure/repositories/personajes.json', 'utf-8'));
  await Personaje.insertMany(personajesData.personajes);
  console.log('Personajes importados correctamente');

  // Importar batallas
  const batallas = JSON.parse(fs.readFileSync('./src/infrastructure/repositories/batallas.json', 'utf-8'));
  await Batalla.insertMany(batallas);
  console.log('Batallas importadas correctamente');

  // Importar batallas 3v3
  const batallas3v3 = JSON.parse(fs.readFileSync('./src/infrastructure/repositories/batallas3v3.json', 'utf-8'));
  await Batalla3v3.insertMany(batallas3v3);
  console.log('Batallas 3v3 importadas correctamente');

  await mongoose.disconnect();
}

importarDatos().catch(err => {
  console.error('Error al importar datos:', err);
  mongoose.disconnect();
}); 