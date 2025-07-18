const mongoose = require('mongoose');

const PersonajeSchema = new mongoose.Schema({
  PersonajeID: Number,
  Nombre: String,
  Vida: Number,
  Energia: Number,
  Combo: Number,
  Ultra: Number,
  Estado: String,
  Ciudad: String,
  Categoria: String,
  Saga: String,
  combo1Name: String,
  combo2Name: String,
  combo3Name: String,
  ultraName: String
});

module.exports = mongoose.model('Personaje', PersonajeSchema); 