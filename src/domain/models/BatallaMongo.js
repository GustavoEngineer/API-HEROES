const mongoose = require('mongoose');

const BatallaSchema = new mongoose.Schema({
  personaje1: { type: mongoose.Schema.Types.ObjectId, ref: 'Personaje' },
  personaje2: { type: mongoose.Schema.Types.ObjectId, ref: 'Personaje' },
  ganador: String,
  estado: String,
  turnoActual: Number,
  activa: Boolean,
  historial: Array,
  estadoPersonaje1: Object,
  estadoPersonaje2: Object,
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true }
  // Agrega aquí otros campos según tu JSON
});

module.exports = mongoose.model('Batalla', BatallaSchema); 