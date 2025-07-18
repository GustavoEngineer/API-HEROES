const mongoose = require('mongoose');

const TestSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  fecha: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Test', TestSchema); 