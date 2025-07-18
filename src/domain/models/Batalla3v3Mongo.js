const mongoose = require('mongoose');

const Batalla3v3Schema = new mongoose.Schema({
  equipo1: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Personaje' }],
  equipo2: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Personaje' }],
  ganador: String,
  estado: String,
  turnoActual: Number,
  idxActivo1: Number,
  idxActivo2: Number,
  rondas: Array,
  rondaActual: Number,
  historial: Array,
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  // Agrega aquí otros campos según tu JSON
});

module.exports = mongoose.model('Batalla3v3', Batalla3v3Schema); 