const express = require('express');
const router = express.Router();
const Batalla3v3Mongo = require('../../domain/models/Batalla3v3Mongo');
const mongoose = require('mongoose');
const PersonajeRepo = require('../../infrastructure/repositories/PersonajeRepository');
const authMiddleware = require('../../shared/authMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     PersonajeBatalla3v3:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         nombre:
 *           type: string
 *         hp:
 *           type: integer
 *         energia:
 *           type: integer
 *         combo:
 *           type: integer
 *         ultra:
 *           type: integer
 *         estado:
 *           type: string
 *           description: Estado actual (normal, defendiendo, KO, etc.)
 *         historial:
 *           type: array
 *           items:
 *             type: string
 *       required: [id, nombre, hp, energia, combo, ultra, estado]
 *
 *     Batalla3v3:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID único generado por MongoDB (ObjectId)
 *         equipo1:
 *           type: array
 *           items:
 *             type: string
 *             pattern: '^[a-fA-F0-9]{24}$'
 *             description: ID de MongoDB (ObjectId) de un personaje del equipo 1
 *         equipo2:
 *           type: array
 *           items:
 *             type: string
 *             pattern: '^[a-fA-F0-9]{24}$'
 *             description: ID de MongoDB (ObjectId) de un personaje del equipo 2
 *         estado:
 *           type: string
 *         turnoActual:
 *           type: integer
 *         idxActivo1:
 *           type: integer
 *         idxActivo2:
 *           type: integer
 *         rondas:
 *           type: array
 *           items:
 *             type: object
 *         rondaActual:
 *           type: integer
 *         historial:
 *           type: array
 *           items:
 *             type: object
 *         ganador:
 *           type: string
 *           nullable: true
 *       example:
 *         id: "665b1e2f8b3c2a0012a4d123"
 *         equipo1: ["665b1e2f8b3c2a0012a4d111", "665b1e2f8b3c2a0012a4d112", "665b1e2f8b3c2a0012a4d113"]
 *         equipo2: ["665b1e2f8b3c2a0012a4d114", "665b1e2f8b3c2a0012a4d115", "665b1e2f8b3c2a0012a4d116"]
 *         estado: "En curso"
 *         turnoActual: 1
 *         idxActivo1: 0
 *         idxActivo2: 0
 *         rondas: []
 *         rondaActual: 1
 *         historial: []
 *         ganador: null
 *     CrearBatalla3v3Input:
 *       type: object
 *       properties:
 *         equipo1:
 *           type: array
 *           items:
 *             type: string
 *             pattern: '^[a-fA-F0-9]{24}$'
 *             description: ID de MongoDB (ObjectId) de un personaje del equipo 1
 *         equipo2:
 *           type: array
 *           items:
 *             type: string
 *             pattern: '^[a-fA-F0-9]{24}$'
 *             description: ID de MongoDB (ObjectId) de un personaje del equipo 2
 *       required: [equipo1, equipo2]
 *       example:
 *         equipo1: ["665b1e2f8b3c2a0012a4d111", "665b1e2f8b3c2a0012a4d112", "665b1e2f8b3c2a0012a4d113"]
 *         equipo2: ["665b1e2f8b3c2a0012a4d114", "665b1e2f8b3c2a0012a4d115", "665b1e2f8b3c2a0012a4d116"]
 *     AccionBatalla3v3Input:
 *       type: object
 *       properties:
 *         batallaId:
 *           type: integer
 *         personajeId:
 *           type: integer
 *         accion:
 *           type: string
 *           enum: ["Ataque Básico", "Ataque Fuerte", "Combo", "Defender", "Cargar Energía", "Ultra Move"]
 *       required: [batallaId, personajeId, accion]
 *     ResultadoAccion3v3:
 *       type: object
 *       properties:
 *         mensaje:
 *           type: string
 *         efectos:
 *           type: object
 *         estado:
 *           type: object
 *         turnoSiguiente:
 *           type: integer
 *         ganador:
 *           type: string
 *           nullable: true
 *     ErrorAccion3v3:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *         posiblesAcciones:
 *           type: array
 *           items:
 *             type: string
 *       example:
 *         error: "No tienes suficiente energía para Ataque Fuerte."
 *         posiblesAcciones: ["Ataque Básico", "Defender", "Cargar Energía"]
 *     Golpe3v3:
 *       type: object
 *       properties:
 *         golpe:
 *           type: integer
 *         atacante:
 *           type: object
 *           properties:
 *             id: { type: integer }
 *             nombre: { type: string }
 *             hp: { type: integer }
 *             energia: { type: integer }
 *             combo: { type: integer }
 *             ultra: { type: integer }
 *             estado: { type: string }
 *         defensor:
 *           type: object
 *           properties:
 *             id: { type: integer }
 *             nombre: { type: string }
 *             hp: { type: integer }
 *             energia: { type: integer }
 *             combo: { type: integer }
 *             ultra: { type: integer }
 *             estado: { type: string }
 *         accion:
 *           type: string
 *         mensaje:
 *           type: string
 *         efectos:
 *           type: object
 *         turnoSiguiente:
 *           type: integer
 *         idSiguiente:
 *           type: integer
 *         ganador:
 *           type: string
 *           nullable: true
 */

/**
 * @swagger
 * tags:
 *   - name: Batalla3v3
 *     description: Batallas 3v3
 */

/**
 * @swagger
 * /api/batallas3v3:
 *   post:
 *     summary: Crear una nueva batalla 3vs3
 *     security:
 *       - BearerAuth: []
 *     tags: [Batalla3v3]
 *     description: |
 *       Crea una batalla 3v3 entre dos equipos. Cada equipo debe estar compuesto por exactamente 3 personajes diferentes (IDs únicos por equipo y entre equipos).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               equipo1:
 *                 type: array
 *                 items:
 *                   type: string
 *                   pattern: '^[a-fA-F0-9]{24}$'
 *                   description: ID de MongoDB (ObjectId) de un personaje del equipo 1
 *               equipo2:
 *                 type: array
 *                 items:
 *                   type: string
 *                   pattern: '^[a-fA-F0-9]{24}$'
 *                   description: ID de MongoDB (ObjectId) de un personaje del equipo 2
 *             required:
 *               - equipo1
 *               - equipo2
 *           example:
 *             equipo1: ["687950b99358be9dc62e544d", "687950b99358be9dc62e5452", "687950b99358be9dc62e5453"]
 *             equipo2: ["687950b99358be9dc62e5454", "687950b99358be9dc62e5455", "687950b99358be9dc62e5456"]
 *     responses:
 *       201:
 *         description: Batalla 3v3 creada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Batalla3v3'
 *       400:
 *         description: Error de validación (por ejemplo, menos o más de 3 personajes por equipo, IDs repetidos, etc.)
 *       404:
 *         description: Personaje no encontrado
 *   get:
 *     summary: Obtener todas las batallas 3v3 del usuario autenticado
 *     security:
 *       - BearerAuth: []
 *     tags: [Batalla3v3]
 *     responses:
 *       200:
 *         description: Lista de batallas 3v3
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Batalla3v3'
 */

/**
 * @swagger
 * /api/batallas3v3/accion:
 *   post:
 *     summary: Ejecutar una acción en una batalla 3vs3 por turnos
 *     security:
 *       - BearerAuth: []
 *     tags: [Batalla3v3]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               batallaId:
 *                 type: string
 *                 pattern: '^[a-fA-F0-9]{24}$'
 *                 description: ID de MongoDB (ObjectId) de la batalla 3v3
 *               personajeId:
 *                 type: string
 *                 pattern: '^[a-fA-F0-9]{24}$'
 *                 description: ID de MongoDB (ObjectId) del personaje
 *               accion:
 *                 type: string
 *                 description: Acción a ejecutar (solo letras y espacios)
 *             required:
 *               - batallaId
 *               - personajeId
 *               - accion
 *           example:
 *             batallaId: "687a5fcdbaf8f1148368f9f0"
 *             personajeId: "687a5d6ac573beebde5ef374"
 *             accion: "Ataque Básico"
 *     responses:
 *       200:
 *         description: Resultado de la acción y estado actualizado de la batalla 3v3
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Golpe3v3'
 *       400:
 *         description: Error de validación o acción inválida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorAccion3v3'
 *       404:
 *         description: Batalla o personaje no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorAccion3v3'
 */

/**
 * @swagger
 * /api/batallas3v3/reglas:
 *   get:
 *     summary: Obtener las reglas básicas del juego y los movimientos posibles para 3v3
 *     security:
 *       - BearerAuth: []
 *     tags: [Batalla3v3]
 *     responses:
 *       200:
 *         description: Reglas y movimientos del juego 3v3
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reglas:
 *                   type: string
 *                   example: |
 *                     - Los equipos se alternan por turnos: solo el personaje activo de cada equipo puede ejecutar acciones.
 *                     - Si un personaje es derrotado, el siguiente entra automáticamente al inicio del siguiente turno.
 *                     - No se permite el cambio manual de personajes (el cambio es automático al ser derrotado).
 *                     - Todos los recursos (HP, energía, combo, ultra) son individuales por personaje y no se comparten entre miembros del equipo.
 *                     - Gana el equipo que elimine a los tres personajes rivales.
 *                     - Se puede jugar al mejor de 3 rondas (Best of 3), reiniciando vida y recursos en cada ronda, manteniendo el mismo orden de aparición.
 *                 movimientos:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       nombre:
 *                         type: string
 *                       descripcion:
 *                         type: string
 *                       requisitos:
 *                         type: string
 *                       efectos:
 *                         type: string
 *                 efectosEspeciales:
 *                   type: array
 *                   items:
 *                     type: string
 */

/**
 * @swagger
 * /api/batallas3v3/{id}:
 *   get:
 *     summary: Obtener una batalla 3v3 por ID
 *     security:
 *       - BearerAuth: []
 *     tags: [Batalla3v3]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *           description: ID de MongoDB (ObjectId)
 *         description: ID de la batalla 3v3
 *     responses:
 *       200:
 *         description: Batalla 3v3 encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Batalla3v3'
 *       404:
 *         description: Batalla 3v3 no encontrada
 *   delete:
 *     summary: Eliminar una batalla 3v3 por ID
 *     security:
 *       - BearerAuth: []
 *     tags: [Batalla3v3]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *           description: ID de MongoDB (ObjectId)
 *         description: ID de la batalla 3v3
 *     responses:
 *       200:
 *         description: Batalla 3v3 eliminada
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
 *         description: Batalla 3v3 no encontrada
 */

/**
 * @swagger
 * /api/batallas3v3/{id}/historial:
 *   get:
 *     summary: Obtener el historial de acciones de una batalla 3v3 (todas las rondas o una ronda específica)
 *     security:
 *       - BearerAuth: []
 *     tags: [Batalla3v3]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *           description: ID de MongoDB (ObjectId)
 *         description: ID de la batalla 3v3
 *       - in: query
 *         name: ronda
 *         required: false
 *         schema:
 *           type: integer
 *         description: Número de ronda a consultar (si se omite, devuelve todas las rondas)
 *     responses:
 *       200:
 *         description: Historial de la batalla 3v3 (todas las rondas o solo la ronda solicitada)
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     rondas:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           numero:
 *                             type: integer
 *                           inicio:
 *                             type: string
 *                           acciones:
 *                             type: array
 *                             items:
 *                               $ref: '#/components/schemas/Golpe3v3'
 *                           fin:
 *                             type: string
 *                 - type: object
 *                   properties:
 *                     ronda:
 *                       type: object
 *                       properties:
 *                         numero:
 *                           type: integer
 *                         inicio:
 *                           type: string
 *                         acciones:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Golpe3v3'
 *                         fin:
 *                           type: string
 *       404:
 *         description: Batalla 3v3 o ronda no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

function toPublicBatalla3v3(batalla) {
  if (!batalla) return null;
  const obj = batalla.toObject ? batalla.toObject() : batalla;
  return {
    id: obj._id,
    equipo1: obj.equipo1,
    equipo2: obj.equipo2,
    estado: obj.estado,
    turnoActual: obj.turnoActual,
    idxActivo1: obj.idxActivo1,
    idxActivo2: obj.idxActivo2,
    rondas: obj.rondas,
    rondaActual: obj.rondaActual,
    historial: obj.historial,
    ganador: obj.ganador
  };
}

router.use(authMiddleware);

// POST /api/batallas3v3 - Crear nueva batalla 3v3
router.post('/api/batallas3v3', async (req, res) => {
  try {
  const { equipo1, equipo2 } = req.body;
  if (!Array.isArray(equipo1) || !Array.isArray(equipo2) || equipo1.length !== 3 || equipo2.length !== 3) {
    return res.status(400).json({ error: '⚠️ Debes seleccionar exactamente 3 personajes por equipo.' });
  }
  const ids = [...equipo1, ...equipo2];
  if (new Set(ids).size !== 6) {
    return res.status(400).json({ error: '⚠️ No puede haber personajes repetidos entre los equipos.' });
  }
  // Validar que todos los IDs sean ObjectId válidos
  if (!ids.every(id => mongoose.Types.ObjectId.isValid(id))) {
    return res.status(400).json({ error: 'Todos los IDs de personajes deben ser ObjectId válidos de MongoDB.' });
  }
    const PersonajeMongo = require('../../domain/models/PersonajeMongo');
    const personajes1 = await PersonajeMongo.find({ _id: { $in: equipo1 } });
    const personajes2 = await PersonajeMongo.find({ _id: { $in: equipo2 } });
    if (personajes1.length !== 3 || personajes2.length !== 3) {
    return res.status(404).json({ error: '⚠️ Uno o más personajes no existen.' });
  }
  function initPersonaje(p) {
    return {
        id: p._id,
      nombre: p.Nombre,
      hp: 100,
      energia: 50,
      combo: 0,
      ultra: 0,
      estado: 'Normal',
      historial: []
    };
  }
  // Guardar solo los IDs de los personajes en equipo1 y equipo2
  const eq1 = personajes1.map(p => p._id);
  const eq2 = personajes2.map(p => p._id);
    const nuevaBatalla = new Batalla3v3Mongo({
      equipo1: eq1,
      equipo2: eq2,
      estado: 'En curso',
      turnoActual: 1,
    idxActivo1: 0,
    idxActivo2: 0,
    rondas: [{
      numero: 1,
      inicio: `${personajes1[0].Nombre} vs ${personajes2[0].Nombre}`,
      acciones: [],
      fin: null
    }],
      rondaActual: 1,
      historial: [],
      ganador: null,
      usuario: req.user.id
    });
    await nuevaBatalla.save();
    res.status(201).json(toPublicBatalla3v3(nuevaBatalla));
  } catch (err) {
    res.status(500).json({ error: 'Error al crear batalla 3v3', message: err.message });
  }
});

// GET /api/batallas3v3 - Listar todas las batallas 3v3 del usuario autenticado
router.get('/api/batallas3v3', async (req, res) => {
  try {
    const batallas = await Batalla3v3Mongo.find({ usuario: req.user.id }).populate('equipo1 equipo2');
    const mapEquipo = (equipo) => {
      return equipo.map(p => ({
        id: p._id,
        nombre: p.Nombre
      }));
    };
    const batallasConNombres = batallas.map(b => ({
      id: b._id,
      equipo1: mapEquipo(b.equipo1),
      equipo2: mapEquipo(b.equipo2),
      estado: b.estado,
      turnoActual: b.turnoActual,
      idxActivo1: b.idxActivo1,
      idxActivo2: b.idxActivo2,
      rondas: b.rondas,
      rondaActual: b.rondaActual,
      historial: b.historial,
      ganador: b.ganador
    }));
    res.json(batallasConNombres);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener batallas 3v3', message: err.message });
  }
});

// GET /api/batallas3v3/:id - Obtener una batalla 3v3 por ID
router.get('/api/batallas3v3/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID de batalla 3v3 inválido. Debe ser un ObjectId de MongoDB.' });
    }
    const batalla = await Batalla3v3Mongo.findById(id);
    if (!batalla) {
      return res.status(404).json({ error: 'Batalla 3v3 no encontrada' });
    }
    if (String(batalla.usuario) !== String(req.user.id)) {
      return res.status(403).json({ error: 'No tienes permiso para ver esta batalla 3v3' });
    }
    res.json(toPublicBatalla3v3(batalla));
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener batalla 3v3', message: err.message });
  }
});

// POST /api/batallas3v3/accion - Ejecutar acción en batalla 3v3
router.post('/api/batallas3v3/accion', async (req, res) => {
  try {
    const { batallaId, personajeId, accion } = req.body;
    if (!mongoose.Types.ObjectId.isValid(batallaId) || !mongoose.Types.ObjectId.isValid(personajeId) || typeof accion !== 'string') {
      return res.status(400).json({ error: 'Datos requeridos: batallaId y personajeId (ObjectId válidos), accion (string).' });
    }
    const batalla = await Batalla3v3Mongo.findById(batallaId);
    if (!batalla) {
      return res.status(404).json({ error: 'Batalla 3v3 no encontrada.' });
    }
    if (batalla.estado === 'Finalizada' || batalla.ganador) {
      return res.status(400).json({ error: 'La batalla ya ha finalizado.' });
    }
    // Determinar equipo y personaje activo
    const equipoActivo = batalla.turnoActual === 1 ? batalla.equipo1 : batalla.equipo2;
    const equipoOponente = batalla.turnoActual === 1 ? batalla.equipo2 : batalla.equipo1;
    const idxActivo = batalla.turnoActual === 1 ? batalla.idxActivo1 : batalla.idxActivo2;
    const idxOponente = batalla.turnoActual === 1 ? batalla.idxActivo2 : batalla.idxActivo1;
    // Estado de personajes activos (se guarda en rondas)
    let rondaActual = batalla.rondas[batalla.rondaActual - 1];
    if (!rondaActual) {
      rondaActual = { numero: batalla.rondaActual, acciones: [] };
      batalla.rondas.push(rondaActual);
    }
    // Inicializar estados si no existen
    if (!rondaActual.estadoEquipo1) {
      rondaActual.estadoEquipo1 = [
        { id: batalla.equipo1[0], nombre: '', hp: 100, energia: 50, combo: 0, ultra: 0, estado: 'Normal', ultraUsado: false },
        { id: batalla.equipo1[1], nombre: '', hp: 100, energia: 50, combo: 0, ultra: 0, estado: 'Normal', ultraUsado: false },
        { id: batalla.equipo1[2], nombre: '', hp: 100, energia: 50, combo: 0, ultra: 0, estado: 'Normal', ultraUsado: false }
      ];
    }
    if (!rondaActual.estadoEquipo2) {
      rondaActual.estadoEquipo2 = [
        { id: batalla.equipo2[0], nombre: '', hp: 100, energia: 50, combo: 0, ultra: 0, estado: 'Normal', ultraUsado: false },
        { id: batalla.equipo2[1], nombre: '', hp: 100, energia: 50, combo: 0, ultra: 0, estado: 'Normal', ultraUsado: false },
        { id: batalla.equipo2[2], nombre: '', hp: 100, energia: 50, combo: 0, ultra: 0, estado: 'Normal', ultraUsado: false }
      ];
    }
    // Obtener estado actual de los personajes activos
    let jugador = (batalla.turnoActual === 1 ? rondaActual.estadoEquipo1 : rondaActual.estadoEquipo2)[idxActivo];
    let oponente = (batalla.turnoActual === 1 ? rondaActual.estadoEquipo2 : rondaActual.estadoEquipo1)[idxOponente];
    // Cargar nombres si están vacíos
    const PersonajeMongo = require('../../domain/models/PersonajeMongo');
    if (!jugador.nombre) {
      const pj = await PersonajeMongo.findById(jugador.id);
      if (pj) jugador.nombre = pj.Nombre;
    }
    if (!oponente.nombre) {
      const pj = await PersonajeMongo.findById(oponente.id);
      if (pj) oponente.nombre = pj.Nombre;
    }
    // Validar que el personaje que actúa es el activo
    if (String(jugador.id) !== String(personajeId)) {
      return res.status(400).json({ error: 'No es el turno de este personaje.' });
    }
    // Resetear estados de defensa/vulnerabilidad al inicio del turno
    if (jugador.estado === 'Defendiendo' || jugador.estado === 'Vulnerable') {
      jugador.estado = 'Normal';
    }
    let mensaje = '';
    let efectos = {};
    let danoReal = 0;
    // Acciones
    switch (accion) {
      case 'Ataque Básico': {
        const dano = Math.floor(Math.random() * 5) + 12;
        danoReal = dano;
        oponente.hp = Math.max(oponente.hp - dano, 0);
        jugador.combo = Math.min(jugador.combo + 10, 100);
        jugador.ultra = Math.min(jugador.ultra + 7, 100);
        mensaje = `🗡️ ${jugador.nombre} realizó un Ataque Básico a ${oponente.nombre}, causando ${dano} de daño. ¡Gana +10 combo y +7 ultra!`;
        efectos = { dano, comboGanado: 10, ultraGanado: 7 };
        break;
      }
      case 'Ataque Fuerte': {
        if (jugador.energia < 20) {
          return res.status(400).json({ error: 'No tienes suficiente energía para Ataque Fuerte. Prueba con Ataque Básico, Defender o Cargar Energía.' });
        }
        const dano = Math.floor(Math.random() * 7) + 22;
        danoReal = dano;
        oponente.hp = Math.max(oponente.hp - dano, 0);
        jugador.energia = Math.max(jugador.energia - 20, 0);
        jugador.combo = Math.min(jugador.combo + 15, 100);
        jugador.ultra = Math.min(jugador.ultra + 8, 100);
        mensaje = `💪 ${jugador.nombre} realizó un Ataque Fuerte a ${oponente.nombre}, causando ${dano} de daño. ¡Gana +15 combo y +8 ultra!`;
        efectos = { dano, energiaGastada: 20, comboGanado: 15, ultraGanado: 8 };
        break;
      }
      case 'Combo': {
        if (jugador.combo < 30) {
          return res.status(400).json({ error: 'Necesitas al menos 30 de combo para usar Combo. Prueba con Ataque Básico, Defender o Cargar Energía.' });
        }
        if (jugador.energia < 30) {
          return res.status(400).json({ error: 'No tienes suficiente energía para Combo. Prueba con Ataque Básico, Defender o Cargar Energía.' });
        }
        let danoCombo = 0;
        // Obtener nombres de combo del personaje
        let nombreCombo = 'Combo';
        if (!jugador.combo1Name || !jugador.combo2Name || !jugador.combo3Name) {
          // Buscar en la base de datos si no están cargados
          const pj = await PersonajeMongo.findById(jugador.id);
          if (pj) {
            jugador.combo1Name = pj.combo1Name;
            jugador.combo2Name = pj.combo2Name;
            jugador.combo3Name = pj.combo3Name;
          }
        }
        if (jugador.combo >= 30 && jugador.combo < 60) {
          danoCombo = Math.floor(Math.random() * 9) + 30;
          nombreCombo = jugador.combo1Name || 'Combo';
        } else if (jugador.combo >= 60 && jugador.combo < 90) {
          danoCombo = Math.floor(Math.random() * 11) + 45;
          nombreCombo = jugador.combo2Name || 'Combo';
        } else if (jugador.combo >= 90) {
          danoCombo = Math.floor(Math.random() * 16) + 60;
          nombreCombo = jugador.combo3Name || 'Combo';
        }
        danoReal = danoCombo;
        oponente.hp = Math.max(oponente.hp - danoCombo, 0);
        jugador.energia = Math.max(jugador.energia - 30, 0);
        jugador.combo = Math.max(jugador.combo - 30, 0);
        jugador.ultra = Math.min(jugador.ultra + 10, 100);
        mensaje = `💥 ${jugador.nombre} realizó su combo \"${nombreCombo}\" contra ${oponente.nombre}, causando ${danoCombo} de daño. ¡Gana +10 ultra!`;
        efectos = { dano: danoCombo, energiaGastada: 30, comboGastado: 30, ultraGanado: 10, nombreCombo };
        break;
      }
      case 'Defender':
        jugador.estado = 'Defendiendo';
        mensaje = `🛡️ ${jugador.nombre} se puso en defensa.`;
        efectos = { defensa: true };
        break;
      case 'Cargar Energía':
        jugador.energia = Math.min(jugador.energia + 30, 100);
        jugador.ultra = Math.min(jugador.ultra + 15, 100);
        jugador.estado = 'Vulnerable';
        mensaje = `⚡ ${jugador.nombre} cargó energía y quedó vulnerable.`;
        efectos = { energiaGanada: 30, ultraGanado: 15 };
        break;
      case 'Ultra Move': {
        if (jugador.ultra < 100) {
          return res.status(400).json({ error: 'La barra de ultra debe estar al 100% para usar Ultra Move. Prueba con Ataque Básico, Defender o Cargar Energía.' });
        }
        if (jugador.ultraUsado) {
          return res.status(400).json({ error: 'Ultra Move solo puede usarse una vez por ronda. Prueba con Ataque Básico, Defender o Cargar Energía.' });
        }
        const dano = Math.floor(Math.random() * 21) + 90;
        danoReal = dano;
        oponente.hp = Math.max(oponente.hp - dano, 0);
        jugador.ultraUsado = true;
        jugador.ultra = 0;
        mensaje = `💥 ${jugador.nombre} usó su ultra contra ${oponente.nombre}, causando ${dano} de daño.`;
        efectos = { dano, ultraGastado: 100 };
        break;
      }
      default:
        return res.status(400).json({ error: 'Acción no válida. Prueba con Ataque Básico, Defender, Combo, Cargar Energía o Ultra Move.' });
    }
    // Si el oponente estaba defendiendo, reducir daño y aplicar bonus
    let contraataqueRealizado = false;
    if (oponente.estado === 'Defendiendo' && ['Ataque Básico', 'Ataque Fuerte', 'Combo', 'Ultra Move'].includes(accion)) {
      const reduccion = Math.random() * 0.2 + 0.5;
      const danoOriginal = efectos.dano || danoReal;
      const danoReducido = Math.round(danoOriginal * reduccion);
      oponente.hp = Math.min(oponente.hp + danoOriginal - danoReducido, 100);
      oponente.energia = Math.min(oponente.energia + 10, 100);
      oponente.ultra = Math.min(oponente.ultra + 20, 100);
      efectos.danoReducido = danoReducido;
      efectos.defensaBonus = { energiaGanada: 10, ultraGanado: 20 };
      danoReal = danoReducido;
      // Contraataque especial
      if ((accion === 'Ataque Fuerte' || accion === 'Combo') && oponente.energia >= 10) {
        jugador.hp = Math.max(jugador.hp - 5, 0);
        oponente.energia = Math.max(oponente.energia - 10, 0);
        contraataqueRealizado = true;
        efectos.contraataque = {
          mensaje: `${oponente.nombre} realizó un contraataque automático y causó 5 de daño a ${jugador.nombre}.`,
          dano: 5,
          energiaGastada: 10
        };
      }
    }
    // Si el jugador estaba vulnerable y fue atacado, gana ultra extra
    if (jugador.estado === 'Vulnerable' && ['Ataque Básico', 'Ataque Fuerte', 'Combo', 'Ultra Move'].includes(accion)) {
      jugador.ultra = Math.min(jugador.ultra + 10, 100);
      efectos.ultraGanadoPorVulnerable = 10;
    }
    // Cada vez que un personaje recibe daño, gana +10 ultra adicional
    if (danoReal > 0) {
      oponente.ultra = Math.min(oponente.ultra + 10, 100);
      efectos.ultraGanadoPorRecibirDanio = 10;
    }
    // Verificar si el personaje rival es derrotado
    let ganador = null;
    let cambioOponente = false;
    let avanzarRonda = false;
    if (oponente.hp <= 0) {
      avanzarRonda = true;
      // Cambiar al siguiente personaje del equipo rival
      if (batalla.turnoActual === 1) {
        if (batalla.idxActivo2 < 2) {
          batalla.idxActivo2++;
          cambioOponente = true;
        } else {
          batalla.estado = 'Finalizada';
          batalla.ganador = 'Equipo 1';
          ganador = 'Equipo 1';
          mensaje = `🏆 ¡El Equipo 1 ha ganado la batalla!`;
        }
      } else {
        if (batalla.idxActivo1 < 2) {
          batalla.idxActivo1++;
          cambioOponente = true;
        } else {
          batalla.estado = 'Finalizada';
          batalla.ganador = 'Equipo 2';
          ganador = 'Equipo 2';
          mensaje = `🏆 ¡El Equipo 2 ha ganado la batalla!`;
        }
      }
    }
    // Registrar acción en historial y ronda
    if (!Array.isArray(batalla.historial)) batalla.historial = [];
    let registroHistorial = {
      golpe: batalla.historial.length + 1,
      atacante: jugador.nombre,
      defensor: oponente.nombre,
      accion,
      dano: danoReal,
      estadoAtacante: { ...jugador },
      estadoDefensor: { ...oponente }
    };
    if (accion === 'Combo') registroHistorial.nombreCombo = efectos.nombreCombo;
    if (accion === 'Ultra Move') registroHistorial.nombreUltra = jugador.ultraName;
    if (contraataqueRealizado) {
      registroHistorial.contraataque = efectos.contraataque;
    }
    batalla.historial.push(registroHistorial);
    if (!Array.isArray(rondaActual.acciones)) rondaActual.acciones = [];
    rondaActual.acciones.push(registroHistorial);
    // Si hay que avanzar de ronda (alguien muere)
    if (avanzarRonda && batalla.estado !== 'Finalizada') {
      // Finalizar ronda actual
      rondaActual.fin = `Ronda ${batalla.rondaActual} finalizada por KO`;
      // Avanzar ronda
      batalla.rondaActual++;
      // Reiniciar índices de personajes activos
      batalla.idxActivo1 = 0;
      batalla.idxActivo2 = 0;
      // Crear nueva ronda
      const PersonajeMongo = require('../../domain/models/PersonajeMongo');
      const personajes1 = await PersonajeMongo.find({ _id: { $in: batalla.equipo1 } });
      const personajes2 = await PersonajeMongo.find({ _id: { $in: batalla.equipo2 } });
      const nombre1 = personajes1[0]?.Nombre || 'Equipo 1';
      const nombre2 = personajes2[0]?.Nombre || 'Equipo 2';
      const nuevaRonda = {
        numero: batalla.rondaActual,
        inicio: `${nombre1} vs ${nombre2}`,
        acciones: [],
        fin: null,
        estadoEquipo1: [
          { id: batalla.equipo1[0], nombre: personajes1[0]?.Nombre || '', hp: 100, energia: 50, combo: 0, ultra: 0, estado: 'Normal', ultraUsado: false },
          { id: batalla.equipo1[1], nombre: personajes1[1]?.Nombre || '', hp: 100, energia: 50, combo: 0, ultra: 0, estado: 'Normal', ultraUsado: false },
          { id: batalla.equipo1[2], nombre: personajes1[2]?.Nombre || '', hp: 100, energia: 50, combo: 0, ultra: 0, estado: 'Normal', ultraUsado: false }
        ],
        estadoEquipo2: [
          { id: batalla.equipo2[0], nombre: personajes2[0]?.Nombre || '', hp: 100, energia: 50, combo: 0, ultra: 0, estado: 'Normal', ultraUsado: false },
          { id: batalla.equipo2[1], nombre: personajes2[1]?.Nombre || '', hp: 100, energia: 50, combo: 0, ultra: 0, estado: 'Normal', ultraUsado: false },
          { id: batalla.equipo2[2], nombre: personajes2[2]?.Nombre || '', hp: 100, energia: 50, combo: 0, ultra: 0, estado: 'Normal', ultraUsado: false }
        ]
      };
      batalla.rondas.push(nuevaRonda);
    }
    // Cambiar turno si la batalla sigue
    if (batalla.estado !== 'Finalizada') {
      batalla.turnoActual = batalla.turnoActual === 1 ? 2 : 1;
    }
    // Determinar el ID del personaje que sigue por atacar
    let idTurnoSiguiente = null;
    if (batalla.estado !== 'Finalizada') {
      const rondaAct = batalla.rondas[batalla.rondaActual - 1];
      if (batalla.turnoActual === 1) {
        idTurnoSiguiente = rondaAct.estadoEquipo1[batalla.idxActivo1].id;
      } else {
        idTurnoSiguiente = rondaAct.estadoEquipo2[batalla.idxActivo2].id;
      }
    }
    // Guardar cambios
    batalla.markModified('historial');
    batalla.markModified('rondas');
    await batalla.save();
    // Respuesta detallada
    res.json({
      mensaje,
      efectos,
      estado: {
        [jugador.nombre]: { ...jugador },
        [oponente.nombre]: { ...oponente }
      },
      turnoSiguiente: idTurnoSiguiente,
      ganador
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al ejecutar acción 3v3', message: err.message });
  }
});

// DELETE /api/batallas3v3/:id - Eliminar una batalla 3v3
router.delete('/api/batallas3v3/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID de batalla 3v3 inválido. Debe ser un ObjectId de MongoDB.' });
    }
    const eliminado = await Batalla3v3Mongo.findByIdAndDelete(id);
    if (!eliminado) {
      return res.status(404).json({ error: 'Batalla 3v3 no encontrada' });
    }
    res.json({ mensaje: 'Batalla 3v3 eliminada', id });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar batalla 3v3', message: err.message });
  }
});

// GET /api/batallas3v3/:id/historial - Obtener historial de la batalla 3v3
router.get('/api/batallas3v3/:id/historial', async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID de batalla inválido.' });
    }
    const batalla = await Batalla3v3Mongo.findById(id);
  if (!batalla) {
      return res.status(404).json({ error: 'Batalla 3v3 no encontrada' });
    }
    if (String(batalla.usuario) !== String(req.user.id)) {
      return res.status(403).json({ error: 'No tienes permiso para ver el historial de esta batalla 3v3' });
    }
    res.json({ historial: batalla.historial || [], rondas: batalla.rondas || [], ganador: batalla.ganador || null });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener historial', message: err.message });
  }
});

module.exports = router; 