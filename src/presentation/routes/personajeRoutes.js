const express = require('express');
const router = express.Router();
const repo = require('../../infrastructure/repositories/PersonajeRepository');
const PersonajeMongo = require('../../domain/models/PersonajeMongo');
const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   schemas:
 *     Personaje:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID único generado por MongoDB (ObjectId)
 *         Nombre:
 *           type: string
 *         Ciudad:
 *           type: string
 *         Categoria:
 *           type: string
 *           enum: [Héroe, Villano, Antihéroe, Antivillano]
 *         Saga:
 *           type: string
 *         Vida:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *           description: HP máximo es 100. Definido por el juego.
 *         Energia:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *           description: Definido por el juego.
 *         Combo:
 *           type: integer
 *           description: Definido por el juego.
 *         Ultra:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *           description: Definido por el juego.
 *         Estado:
 *           type: string
 *           enum: [Normal, Aturdido, Cansado, Potenciado]
 *           description: Definido por el juego.
 *         combo1Name:
 *           type: string
 *           description: Nombre del combo menos poderoso
 *         combo2Name:
 *           type: string
 *           description: Nombre del combo intermedio
 *         combo3Name:
 *           type: string
 *           description: Nombre del combo más poderoso
 *         ultraName:
 *           type: string
 *           description: Nombre del ultra, el movimiento más poderoso
 *       required:
 *         - id
 *         - Nombre
 *         - Ciudad
 *         - Categoria
 *         - Saga
 *         - combo1Name
 *         - combo2Name
 *         - combo3Name
 *         - ultraName
 *
 *     PersonajeInput:
 *       type: object
 *       properties:
 *         Nombre:
 *           type: string
 *         Ciudad:
 *           type: string
 *         Categoria:
 *           type: string
 *           enum: [Héroe, Villano, Antihéroe, Antivillano]
 *         Saga:
 *           type: string
 *         combo1Name:
 *           type: string
 *         combo2Name:
 *           type: string
 *         combo3Name:
 *           type: string
 *         ultraName:
 *           type: string
 *       required:
 *         - Nombre
 *         - Ciudad
 *         - Categoria
 *         - Saga
 *         - combo1Name
 *         - combo2Name
 *         - combo3Name
 *         - ultraName
 *       example:
 *         Nombre: "Spider-Man"
 *         Ciudad: "Nueva York"
 *         Categoria: "Héroe"
 *         Saga: "Marvel"
 *         combo1Name: "Patada Araña"
 *         combo2Name: "Red de Impacto"
 *         combo3Name: "Golpe Acrobático"
 *         ultraName: "Sentido Arácnido Supremo"
 */

/**
 * @swagger
 * tags:
 *   - name: Personaje
 *     description: Personajes del sistema. Los campos numéricos deben ser enteros positivos. Los campos string solo aceptan letras y espacios.
 */

/**
 * @swagger
 * /api/personajes:
 *   get:
 *     summary: Obtener todos los personajes (con filtros opcionales)
 *     tags: [Personaje]
 *     parameters:
 *       - in: query
 *         name: Categoria
 *         schema:
 *           type: string
 *           enum: [Héroe, Villano, Antihéroe, Antivillano]
 *         description: Filtrar por categoría
 *       - in: query
 *         name: Saga
 *         schema:
 *           type: string
 *         description: Filtrar por saga
 *     responses:
 *       200:
 *         description: Lista de personajes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Personaje'
 */
function toPublicPersonaje(personaje) {
  if (!personaje) return null;
  const obj = personaje.toObject ? personaje.toObject() : personaje;
  return {
    id: obj._id,
    Nombre: obj.Nombre,
    Ciudad: obj.Ciudad,
    Categoria: obj.Categoria,
    Saga: obj.Saga,
    Vida: obj.Vida,
    Energia: obj.Energia,
    Combo: obj.Combo,
    Ultra: obj.Ultra,
    Estado: obj.Estado,
    combo1Name: obj.combo1Name,
    combo2Name: obj.combo2Name,
    combo3Name: obj.combo3Name,
    ultraName: obj.ultraName
  };
}

// Utilidad para validar enteros positivos estrictos
function esEnteroPositivo(valor) {
  return typeof valor === 'number' && Number.isInteger(valor) && valor > 0;
}
// Utilidad para validar string solo letras y espacios
function esStringLetras(valor) {
  return typeof valor === 'string' && /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/.test(valor.trim());
}

// GET /api/personajes
router.get('/api/personajes', async (req, res) => {
  try {
    const { Categoria, Saga } = req.query;
    const filtro = {};
    if (Categoria) filtro.Categoria = Categoria;
    if (Saga) filtro.Saga = Saga;
    const personajes = await PersonajeMongo.find(filtro);
    res.json(personajes.map(toPublicPersonaje));
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener personajes', message: err.message });
  }
});

/**
 * @swagger
 * /api/personajes/sagas:
 *   get:
 *     summary: Obtener todas las sagas únicas registradas
 *     tags: [Personaje]
 *     responses:
 *       200:
 *         description: Lista de sagas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 */
router.get('/api/personajes/sagas', async (req, res) => {
  try {
    const sagas = await PersonajeMongo.distinct('Saga');
    res.json(sagas.filter(Boolean));
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener sagas', message: err.message });
  }
});

// GET /api/personajes/:id
router.get('/api/personajes/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID de personaje inválido. Debe ser un ObjectId de MongoDB.' });
    }
    const personaje = await PersonajeMongo.findById(id);
    if (!personaje) {
      return res.status(404).json({ error: 'Personaje no encontrado' });
    }
    res.json(toPublicPersonaje(personaje));
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener personaje', message: err.message });
  }
});

/**
 * @swagger
 * /api/personajes/{id}:
 *   get:
 *     summary: Obtener un personaje por ID
 *     tags: [Personaje]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *           description: ID de MongoDB (ObjectId)
 *         description: ID del personaje
 *     responses:
 *       200:
 *         description: Personaje encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Personaje'
 *       404:
 *         description: Personaje no encontrado
 *   put:
 *     summary: Actualizar un personaje existente
 *     tags: [Personaje]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *           description: ID de MongoDB (ObjectId)
 *         description: ID del personaje
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PersonajeInput'
 *     responses:
 *       200:
 *         description: Personaje actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Personaje'
 *       400:
 *         description: Error de validación
 *       404:
 *         description: Personaje no encontrado
 *   delete:
 *     summary: Eliminar un personaje por ID
 *     tags: [Personaje]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *           description: ID de MongoDB (ObjectId)
 *         description: ID del personaje
 *     responses:
 *       200:
 *         description: Personaje eliminado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                 id:
 *                   type: string
 *                   description: ID de MongoDB (ObjectId)
 *       404:
 *         description: Personaje no encontrado
 */
/**
 * @swagger
 * /api/personajes:
 *   post:
 *     summary: Crear un nuevo personaje
 *     tags: [Personaje]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PersonajeInput'
 *     responses:
 *       201:
 *         description: Personaje creado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Personaje'
 *       400:
 *         description: Error de validación
 */
router.post('/api/personajes', async (req, res) => {
  try {
    const { Nombre, Ciudad, Categoria, Saga, combo1Name, combo2Name, combo3Name, ultraName } = req.body;
    if (!esStringLetras(Nombre) || !esStringLetras(Ciudad) || !esStringLetras(Categoria) || !esStringLetras(Saga) || !esStringLetras(combo1Name) || !esStringLetras(combo2Name) || !esStringLetras(combo3Name) || !esStringLetras(ultraName)) {
      return res.status(400).json({ error: 'Todos los campos deben ser solo letras y espacios.' });
    }
    // Validar categoría permitida
    const categoriasPermitidas = ['Héroe', 'Villano', 'Antihéroe', 'Antivillano'];
    if (!categoriasPermitidas.includes(Categoria)) {
      return res.status(400).json({ error: `Categoría inválida. Debe ser una de: ${categoriasPermitidas.join(', ')}` });
    }
    // Validar que no exista un personaje con el mismo nombre
    const existe = await PersonajeMongo.findOne({ Nombre });
    if (existe) {
      return res.status(400).json({ error: 'Ya existe un personaje con ese nombre.' });
    }
    // Crear personaje en MongoDB
    const nuevoPersonaje = new PersonajeMongo({
      Nombre,
      Ciudad,
      Categoria,
      Saga,
      combo1Name,
      combo2Name,
      combo3Name,
      ultraName,
      Vida: 100,
      Energia: 50,
      Combo: 0,
      Ultra: 0,
      Estado: 'Normal'
    });
    await nuevoPersonaje.save();
    res.status(201).json(toPublicPersonaje(nuevoPersonaje));
  } catch (err) {
    res.status(400).json({ error: 'Error al crear personaje', message: err.message });
  }
});

// PUT /api/personajes/:id
router.put('/api/personajes/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID de personaje inválido. Debe ser un ObjectId de MongoDB.' });
    }
    const { Nombre, Ciudad, Categoria, Saga, combo1Name, combo2Name, combo3Name, ultraName } = req.body;
    if (!esStringLetras(Nombre) || !esStringLetras(Ciudad) || !esStringLetras(Categoria) || !esStringLetras(Saga) || !esStringLetras(combo1Name) || !esStringLetras(combo2Name) || !esStringLetras(combo3Name) || !esStringLetras(ultraName)) {
      return res.status(400).json({ error: 'Todos los campos deben ser solo letras y espacios.' });
    }
    const categoriasPermitidas = ['Héroe', 'Villano', 'Antihéroe', 'Antivillano'];
    if (!categoriasPermitidas.includes(Categoria)) {
      return res.status(400).json({ error: `Categoría inválida. Debe ser una de: ${categoriasPermitidas.join(', ')}` });
    }
    // Validar que no exista otro personaje con el mismo nombre
    const existe = await PersonajeMongo.findOne({ Nombre, _id: { $ne: id } });
    if (existe) {
      return res.status(400).json({ error: 'Ya existe un personaje con ese nombre.' });
    }
    const actualizado = await PersonajeMongo.findByIdAndUpdate(id, req.body, { new: true });
    if (!actualizado) {
      return res.status(404).json({ error: 'Personaje no encontrado' });
    }
    res.json(toPublicPersonaje(actualizado));
  } catch (err) {
    res.status(400).json({ error: 'Error al actualizar personaje', message: err.message });
  }
});

// DELETE /api/personajes/:id
router.delete('/api/personajes/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID de personaje inválido. Debe ser un ObjectId de MongoDB.' });
    }
    const eliminado = await PersonajeMongo.findByIdAndDelete(id);
    if (!eliminado) {
      return res.status(404).json({ error: 'Personaje no encontrado' });
    }
    res.json({ mensaje: 'Personaje eliminado', id });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar personaje', message: err.message });
  }
});

module.exports = router; 