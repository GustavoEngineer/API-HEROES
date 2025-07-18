const express = require('express');
const router = express.Router();
const BatallaMongo = require('../../domain/models/BatallaMongo');
const mongoose = require('mongoose');
const PersonajeRepo = require('../../infrastructure/repositories/PersonajeRepository');
const authMiddleware = require('../../shared/authMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     Batalla:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID único generado por MongoDB (ObjectId)
 *         Personaje1:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               description: ID de MongoDB (ObjectId) del personaje 1
 *             nombre:
 *               type: string
 *               description: Nombre del personaje 1
 *         Personaje2:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               description: ID de MongoDB (ObjectId) del personaje 2
 *             nombre:
 *               type: string
 *               description: Nombre del personaje 2
 *         Estado:
 *           type: string
 *         Ganador:
 *           type: string
 *           nullable: true
 *         TurnoActual:
 *           type: integer
 *         historial:
 *           type: array
 *           items:
 *             type: object
 *       example:
 *         id: "665b1e2f8b3c2a0012a4d123"
 *         Personaje1:
 *           id: "665b1e2f8b3c2a0012a4d111"
 *           nombre: "Vegeta"
 *         Personaje2:
 *           id: "665b1e2f8b3c2a0012a4d112"
 *           nombre: "Goku"
 *         Estado: "En curso"
 *         Ganador: null
 *         TurnoActual: 1
 *         historial: []
 *     CrearBatallaInput:
 *       type: object
 *       properties:
 *         personaje1Id:
 *           type: integer
 *         personaje2Id:
 *           type: integer
 *       required: [personaje1Id, personaje2Id]
 *     AccionBatallaInput:
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
 *     ResultadoAccion:
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
 *     ErrorAccion:
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
 */

/**
 * @swagger
 * tags:
 *   - name: Batalla
 *     description: Batallas 1v1
 */

/**
 * @swagger
 * /api/batallas:
 *   post:
 *     summary: Crear una nueva batalla 1vs1
 *     security:
 *       - BearerAuth: []
 *     tags: [Batalla]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               personaje1Id:
 *                 type: string
 *                 pattern: '^[a-fA-F0-9]{24}$'
 *                 description: ID de MongoDB (ObjectId) del primer personaje
 *               personaje2Id:
 *                 type: string
 *                 pattern: '^[a-fA-F0-9]{24}$'
 *                 description: ID de MongoDB (ObjectId) del segundo personaje
 *             required:
 *               - personaje1Id
 *               - personaje2Id
 *           example:
 *             personaje1Id: "687950b99358be9dc62e544d"
 *             personaje2Id: "687950b99358be9dc62e5452"
 *     responses:
 *       201:
 *         description: Batalla creada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Batalla'
 *       400:
 *         description: Error de validación
 *       404:
 *         description: Personaje no encontrado
 *   get:
 *     summary: Obtener todas las batallas del usuario autenticado
 *     security:
 *       - BearerAuth: []
 *     tags: [Batalla]
 *     responses:
 *       200:
 *         description: Lista de batallas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Batalla'
 */

/**
 * @swagger
 * /api/batallas/accion:
 *   post:
 *     summary: Ejecutar una acción en una batalla 1vs1 por turnos
 *     security:
 *       - BearerAuth: []
 *     tags: [Batalla]
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
 *                 description: ID de MongoDB (ObjectId) de la batalla
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
 *         description: Resultado de la acción y estado actualizado de la batalla
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResultadoAccion'
 *       400:
 *         description: Error de validación o acción inválida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorAccion'
 *       404:
 *         description: Batalla o personaje no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorAccion'
 */

/**
 * @swagger
 * /api/batallas/reglas:
 *   get:
 *     summary: Obtener las reglas básicas del juego y los movimientos posibles
 *     security:
 *       - BearerAuth: []
 *     tags: [Batalla]
 *     responses:
 *       200:
 *         description: Reglas y movimientos del juego
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reglas:
 *                   type: string
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
 * /api/batallas/{id}:
 *   get:
 *     summary: Obtener una batalla por ID
 *     security:
 *       - BearerAuth: []
 *     tags: [Batalla]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *           description: ID de MongoDB (ObjectId)
 *         description: ID de la batalla
 *     responses:
 *       200:
 *         description: Batalla encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Batalla'
 *       404:
 *         description: Batalla no encontrada
 *   delete:
 *     summary: Eliminar una batalla por ID
 *     security:
 *       - BearerAuth: []
 *     tags: [Batalla]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *           description: ID de MongoDB (ObjectId)
 *         description: ID de la batalla
 *     responses:
 *       200:
 *         description: Batalla eliminada
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
 *         description: Batalla no encontrada
 */

/**
 * @swagger
 * /api/batallas/{id}/historial:
 *   get:
 *     summary: Obtener el historial de una partida por ID
 *     security:
 *       - BearerAuth: []
 *     tags: [Batalla]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *           description: ID de MongoDB (ObjectId)
 *         description: ID de la batalla
 *     responses:
 *       200:
 *         description: Historial de la partida
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 historial:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       golpe:
 *                         type: integer
 *                       atacante:
 *                         type: string
 *                       defensor:
 *                         type: string
 *                       accion:
 *                         type: string
 *                       dano:
 *                         type: integer
 *                       estadoAtacante:
 *                         type: object
 *                       estadoDefensor:
 *                         type: object
 *                 resumen:
 *                   type: object
 *                   properties:
 *                     ganador:
 *                       type: string
 *                     estadoFinal:
 *                       type: object
 *     404:
 *       description: Batalla no encontrada
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               error:
 *                 type: string
 */

// Utilidad para clonar estado base de personaje para batalla
function estadoBase(personaje) {
  return {
    ID: personaje.PersonajeID,
    Nombre: personaje.Nombre,
    HP: 100,
    Energia: 50,
    Combo: 0,
    Ultra: 0,
    Estado: 'Normal'
  };
}

// Utilidad para limitar valores entre min y max
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// Utilidad para obtener un entero aleatorio en un rango [min, max]
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Utilidad para obtener acciones posibles según el estado actual del jugador
function accionesPosibles(jugador) {
  const posibles = [];
  posibles.push('Ataque Básico');
  if (jugador.Energia >= 20) posibles.push('Ataque Fuerte');
  if (jugador.Combo >= 30 && jugador.Energia >= 30) posibles.push('Combo');
  posibles.push('Defender');
  posibles.push('Cargar Energía');
  if (jugador.Ultra >= 100 && !jugador.UltraUsado) posibles.push('Ultra Move');
  return posibles;
}

// Utilidad para validar enteros positivos estrictos (si no existe ya)
function esEnteroPositivo(valor) {
  return typeof valor === 'number' && Number.isInteger(valor) && valor > 0;
}
// Utilidad para validar string solo letras y espacios
function esStringLetras(valor) {
  return typeof valor === 'string' && /^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$/.test(valor.trim());
}

function toPublicBatalla(batalla) {
  if (!batalla) return null;
  const obj = batalla.toObject ? batalla.toObject() : batalla;
  return {
    id: obj._id,
    Personaje1: obj.personaje1 || obj.Personaje1,
    Personaje2: obj.personaje2 || obj.Personaje2,
    Estado: obj.estado || obj.Estado,
    Ganador: obj.ganador || obj.Ganador,
    TurnoActual: obj.turnoActual || obj.TurnoActual,
    historial: obj.historial || []
  };
}

router.use(authMiddleware);

// POST /api/batallas - Crear nueva batalla
router.post('/api/batallas', async (req, res) => {
  try {
    const { personaje1Id, personaje2Id } = req.body;
    if (!mongoose.Types.ObjectId.isValid(personaje1Id) || !mongoose.Types.ObjectId.isValid(personaje2Id)) {
      return res.status(400).json({ error: 'IDs de personajes requeridos y deben ser ObjectId válidos de MongoDB.' });
    }
    if (personaje1Id === personaje2Id) {
      return res.status(400).json({ error: '⚠️ No se puede iniciar una batalla con el mismo personaje.' });
    }
    // Buscar personajes en MongoDB
    const PersonajeMongo = require('../../domain/models/PersonajeMongo');
    const p1 = await PersonajeMongo.findById(personaje1Id);
    const p2 = await PersonajeMongo.findById(personaje2Id);
    if (!p1 || !p2) {
      return res.status(404).json({ error: '⚠️ Uno o ambos personajes no existen.' });
    }
    // Turno inicial aleatorio
    const turno = Math.random() < 0.5 ? 1 : 2;
    const nuevaBatalla = new BatallaMongo({
      personaje1: p1._id,
      personaje2: p2._id,
      estado: 'En curso',
      turnoActual: turno,
      ganador: null,
      activa: true,
      historial: [],
      estadoPersonaje1: {
        ID: p1._id,
        Nombre: p1.Nombre,
        HP: 100,
        Energia: 50,
        Combo: 0,
        Ultra: 0,
        Estado: 'Normal',
        UltraUsado: false
      },
      estadoPersonaje2: {
        ID: p2._id,
        Nombre: p2.Nombre,
        HP: 100,
        Energia: 50,
        Combo: 0,
        Ultra: 0,
        Estado: 'Normal',
        UltraUsado: false
      },
      usuario: req.user.id
    });
    await nuevaBatalla.save();
    res.status(201).json(toPublicBatalla(nuevaBatalla));
  } catch (err) {
    res.status(500).json({ error: '⚠️ Error al crear batalla', message: err.message });
  }
});

// GET /api/batallas - Listar todas las batallas del usuario autenticado
router.get('/api/batallas', async (req, res) => {
  try {
    const batallas = await BatallaMongo.find({ usuario: req.user.id });
    res.json(batallas);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener batallas', message: err.message });
  }
});

// GET /api/batallas/:id - Obtener una batalla por ID
router.get('/api/batallas/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID de batalla inválido. Debe ser un ObjectId de MongoDB.' });
    }
    const batalla = await BatallaMongo.findById(id).populate('personaje1 personaje2');
    if (!batalla) {
      return res.status(404).json({ error: 'Batalla no encontrada' });
    }
    if (String(batalla.usuario) !== String(req.user.id)) {
      return res.status(403).json({ error: 'No tienes permiso para ver esta batalla' });
    }
    res.json(toPublicBatalla(batalla));
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener batalla', message: err.message });
  }
});

// GET /api/batallas/reglas - Obtener reglas y movimientos
router.get('/api/batallas/reglas', (req, res) => {
  res.json({
    reglas: [
      'Batallas 1v1 por turnos. El turno se alterna automáticamente tras cada acción válida.',
      'Ambos jugadores inician con 100 HP, 50 energía, 0 combo y 0 ultra.',
      'El objetivo es reducir el HP del oponente a 0 para ganar la partida.',
      'Ultra Move solo puede usarse una vez por jugador y requiere 100 de ultra.',
      'Los movimientos requieren recursos y aplican efectos inmediatos.',
      'No se permiten acciones si la batalla terminó.',
      'Solo se aceptan datos válidos: IDs enteros positivos, strings solo letras y espacios.',
      '🌟 Contraataque: Si defiendes un Ataque Fuerte o un Combo y tienes al menos 10 de energía, ejecutas un contraataque automático que inflige 5 de daño al oponente y consume 10 de energía. No interrumpe el ataque enemigo.'
    ],
    movimientos: [
      {
        nombre: 'Ataque Básico',
        descripcion: 'Ataque simple que inflige daño bajo y suma combo.',
        requisitos: 'No requiere energía.',
        efectos: 'Daño: 12-16. +10 combo. +7 ultra. El oponente gana +10 ultra por recibir daño.'
      },
      {
        nombre: 'Ataque Fuerte',
        descripcion: 'Ataque potente que consume energía y suma combo.',
        requisitos: 'Requiere 20 de energía.',
        efectos: 'Daño: 22-28. +15 combo. +8 ultra. El oponente gana +10 ultra por recibir daño. Si el oponente defiende y tiene al menos 10 de energía, ejecuta un contraataque automático de 5 de daño.'
      },
      {
        nombre: 'Combo',
        descripcion: 'Ataque especial que consume combo y energía, daño variable según combo.',
        requisitos: 'Requiere al menos 30 de combo y 30 de energía.',
        efectos: 'Daño: 30-38 (combo 30-59), 45-55 (combo 60-89), 60-75 (combo 90+). +10 ultra. El oponente gana +10 ultra por recibir daño. Si el oponente defiende y tiene al menos 10 de energía, ejecuta un contraataque automático de 5 de daño.'
      },
      {
        nombre: 'Defender',
        descripcion: 'Reduce el daño recibido y otorga bonificaciones si recibe golpe.',
        requisitos: 'Ninguno.',
        efectos: 'Reduce daño recibido 50-70%. Si recibe golpe: +10 energía, +20 ultra. Si defiende un Ataque Fuerte o Combo y tiene al menos 10 de energía, ejecuta un contraataque automático de 5 de daño.'
      },
      {
        nombre: 'Cargar Energía',
        descripcion: 'Recupera energía y ultra, pero queda vulnerable ese turno.',
        requisitos: 'Ninguno.',
        efectos: '+30 energía, +15 ultra. Queda vulnerable. Si recibe golpe: +10 ultra.'
      },
      {
        nombre: 'Ultra Move',
        descripcion: 'Ataque definitivo, solo una vez por jugador.',
        requisitos: 'Ultra al 100%, no haberlo usado antes.',
        efectos: 'Daño: 90-110. Ultra se reinicia a 0. El oponente gana +10 ultra por recibir daño.'
      }
    ],
    efectosEspeciales: [
      '🌟 Contraataque: Si defiendes un Ataque Fuerte o un Combo y tienes al menos 10 de energía, ejecutas un contraataque automático que inflige 5 de daño al oponente y consume 10 de energía. No interrumpe el ataque enemigo.'
    ]
  });
});

// POST /api/batallas/accion - Ejecutar acción en batalla
router.post('/api/batallas/accion', async (req, res) => {
  try {
    const { batallaId, personajeId, accion } = req.body;
    if (!mongoose.Types.ObjectId.isValid(batallaId) || !mongoose.Types.ObjectId.isValid(personajeId) || !esStringLetras(accion)) {
      return res.status(400).json({ error: 'Datos requeridos: batallaId y personajeId (ObjectId válidos), accion (solo letras y espacios).', posiblesAcciones: [] });
    }
    const batalla = await BatallaMongo.findById(batallaId);
    if (!batalla) {
      return res.status(404).json({ error: '⚠️ Batalla no encontrada.', posiblesAcciones: [] });
    }
    // Buscar personaje válido en la batalla
    const idsValidos = [String(batalla.estadoPersonaje1.ID), String(batalla.estadoPersonaje2.ID)];
    if (!idsValidos.includes(String(personajeId))) {
      // Listar personajes válidos de la batalla
      const personajesDisponibles = [
        { id: batalla.estadoPersonaje1.ID, nombre: batalla.estadoPersonaje1.Nombre },
        { id: batalla.estadoPersonaje2.ID, nombre: batalla.estadoPersonaje2.Nombre }
      ];
      return res.status(400).json({ error: '⚠️ El personaje no participa en esta batalla.', personajesDisponibles, posiblesAcciones: [] });
    }
    if (!batalla.activa || batalla.estado === 'Finalizada') {
      return res.status(400).json({ error: '⚠️ La batalla ya ha finalizado.', posiblesAcciones: [] });
    }
    // Determinar jugador actual y oponente
    let jugador, oponente, turnoJugador;
    if (batalla.turnoActual === 1) {
      jugador = batalla.estadoPersonaje1;
      oponente = batalla.estadoPersonaje2;
      turnoJugador = 1;
    } else {
      jugador = batalla.estadoPersonaje2;
      oponente = batalla.estadoPersonaje1;
      turnoJugador = 2;
    }
    if (String(jugador.ID) !== String(personajeId)) {
      return res.status(400).json({ error: '⚠️ No es el turno de este personaje.', posiblesAcciones: [] });
    }
    // Resetear estados de defensa/vulnerabilidad al inicio del turno
    if (jugador.Estado === 'Defendiendo' || jugador.Estado === 'Vulnerable') {
      jugador.Estado = 'Normal';
    }
    let mensaje = '';
    let efectos = {};
    let danoReal = 0;
    // Acciones
    switch (accion) {
      case 'Ataque Básico': {
        const dano = randomInt(12, 16);
        danoReal = dano;
        oponente.HP = clamp(oponente.HP - dano, 0, 100);
        jugador.Combo = clamp(jugador.Combo + 10, 0, 100);
        jugador.Ultra = clamp(jugador.Ultra + 7, 0, 100);
        mensaje = `🗡️ ${jugador.Nombre} realizó un Ataque Básico a ${oponente.Nombre}, causando ${dano} de daño. ¡Gana +10 combo y +7 ultra!`;
        efectos = { dano, comboGanado: 10, ultraGanado: 7 };
        break;
      }
      case 'Ataque Fuerte': {
        if (jugador.Energia < 20) {
          return res.status(400).json({ error: '⚠️ No tienes suficiente energía para Ataque Fuerte. Prueba con Ataque Básico, Defender o Cargar Energía.', posiblesAcciones: accionesPosibles(jugador) });
        }
        const dano = randomInt(22, 28);
        danoReal = dano;
        oponente.HP = clamp(oponente.HP - dano, 0, 100);
        jugador.Energia = clamp(jugador.Energia - 20, 0, 100);
        jugador.Combo = clamp(jugador.Combo + 15, 0, 100);
        jugador.Ultra = clamp(jugador.Ultra + 8, 0, 100);
        mensaje = `💪 ${jugador.Nombre} realizó un Ataque Fuerte a ${oponente.Nombre}, causando ${dano} de daño. ¡Gana +15 combo y +8 ultra!`;
        efectos = { dano, energiaGastada: 20, comboGanado: 15, ultraGanado: 8 };
        break;
      }
      case 'Combo': {
        if (jugador.Combo < 30) {
          return res.status(400).json({ error: '⚠️ Necesitas al menos 30 de combo para usar Combo. Prueba con Ataque Básico, Defender o Cargar Energía.', posiblesAcciones: accionesPosibles(jugador) });
        }
        if (jugador.Energia < 30) {
          return res.status(400).json({ error: '⚠️ No tienes suficiente energía para Combo. Prueba con Ataque Básico, Defender o Cargar Energía.', posiblesAcciones: accionesPosibles(jugador) });
        }
        let danoCombo = 0;
        let nombreCombo = jugador.combo1Name;
        if (jugador.Combo >= 30 && jugador.Combo < 60) {
          danoCombo = randomInt(30, 38);
          nombreCombo = jugador.combo1Name;
        } else if (jugador.Combo >= 60 && jugador.Combo < 90) {
          danoCombo = randomInt(45, 55);
          nombreCombo = jugador.combo2Name;
        } else if (jugador.Combo >= 90) {
          danoCombo = randomInt(60, 75);
          nombreCombo = jugador.combo3Name;
        }
        danoReal = danoCombo;
        oponente.HP = clamp(oponente.HP - danoCombo, 0, 100);
        jugador.Energia = clamp(jugador.Energia - 30, 0, 100);
        jugador.Combo = clamp(jugador.Combo - 30, 0, 100);
        jugador.Ultra = clamp(jugador.Ultra + 10, 0, 100);
        mensaje = `💥 ${jugador.Nombre} realizó su combo "${nombreCombo}" contra ${oponente.Nombre}, causando ${danoCombo} de daño. ¡Gana +10 ultra!`;
        efectos = { dano: danoCombo, energiaGastada: 30, comboGastado: 30, ultraGanado: 10, nombreCombo };
        break;
      }
      case 'Defender':
        jugador.Estado = 'Defendiendo';
        mensaje = `🛡️ ${jugador.Nombre} se puso en defensa.`;
        efectos = { defensa: true };
        break;
      case 'Cargar Energía':
        jugador.Energia = clamp(jugador.Energia + 30, 0, 100);
        jugador.Ultra = clamp(jugador.Ultra + 15, 0, 100);
        jugador.Estado = 'Vulnerable';
        mensaje = `⚡ ${jugador.Nombre} cargó energía y quedó vulnerable.`;
        efectos = { energiaGanada: 30, ultraGanado: 15 };
        break;
      case 'Ultra Move': {
        if (jugador.Ultra < 100) {
          return res.status(400).json({ error: '⚠️ La barra de ultra debe estar al 100% para usar Ultra Move. Prueba con Ataque Básico, Defender o Cargar Energía.', posiblesAcciones: accionesPosibles(jugador) });
        }
        if (jugador.UltraUsado) {
          return res.status(400).json({ error: '⚠️ Ultra Move solo puede usarse una vez por ronda. Prueba con Ataque Básico, Defender o Cargar Energía.', posiblesAcciones: accionesPosibles(jugador) });
        }
        const dano = randomInt(90, 110);
        danoReal = dano;
        oponente.HP = clamp(oponente.HP - dano, 0, 100);
        jugador.UltraUsado = true;
        jugador.Ultra = 0;
        mensaje = `💥 ${jugador.Nombre} usó su ultra "${jugador.ultraName}" contra ${oponente.Nombre}, causando ${dano} de daño. ¡Gana +10 ultra!`;
        efectos = { dano, ultraGastado: 100, nombreUltra: jugador.ultraName };
        break;
      }
      default:
        return res.status(400).json({ error: '⚠️ Acción no válida. Prueba con Ataque Básico, Defender, Combo, Cargar Energía o Ultra Move.', posiblesAcciones: accionesPosibles(jugador) });
    }
    // Si el oponente estaba defendiendo, reducir daño y aplicar bonus
    let contraataqueRealizado = false;
    if (oponente.Estado === 'Defendiendo' && ['Ataque Básico', 'Ataque Fuerte', 'Combo', 'Ultra Move'].includes(accion)) {
      const reduccion = Math.random() * 0.2 + 0.5;
      const danoOriginal = efectos.dano || 0;
      const danoReducido = Math.round(danoOriginal * reduccion);
      oponente.HP = clamp(oponente.HP + danoOriginal - danoReducido, 0, 100);
      oponente.Energia = clamp(oponente.Energia + 10, 0, 100);
      oponente.Ultra = clamp(oponente.Ultra + 20, 0, 100);
      efectos.danoReducido = danoReducido;
      efectos.defensaBonus = { energiaGanada: 10, ultraGanado: 20 };
      danoReal = danoReducido;
      // 🌟 Contraataque especial
      if ((accion === 'Ataque Fuerte' || accion === 'Combo') && oponente.Energia >= 10) {
        jugador.HP = clamp(jugador.HP - 5, 0, 100);
        oponente.Energia = clamp(oponente.Energia - 10, 0, 100);
        contraataqueRealizado = true;
        efectos.contraataque = {
          mensaje: `${oponente.Nombre} realizó un contraataque automático y causó 5 de daño a ${jugador.Nombre}.`,
          dano: 5,
          energiaGastada: 10
        };
      }
    }
    // Si el jugador estaba vulnerable y fue atacado, gana ultra extra
    if (jugador.Estado === 'Vulnerable' && ['Ataque Básico', 'Ataque Fuerte', 'Combo', 'Ultra Move'].includes(accion)) {
      jugador.Ultra = clamp(jugador.Ultra + 10, 0, 100); // +5 extra
      efectos.ultraGanadoPorVulnerable = 10;
    }
    // Cada vez que un personaje recibe daño, gana +10 ultra adicional
    if (danoReal > 0) {
      oponente.Ultra = clamp(oponente.Ultra + 10, 0, 100); // +5 extra
      efectos.ultraGanadoPorRecibirDanio = 10;
    }
    // Verificar si la batalla termina
    let ganador = null;
    if (oponente.HP <= 0) {
      batalla.estado = 'Finalizada';
      batalla.activa = false;
      batalla.ganador = jugador.Nombre;
      ganador = jugador.Nombre;
      mensaje = `🏆 ${jugador.Nombre} ha derrotado a ${oponente.Nombre}! ¡Gana la batalla!`;
    }
    // Cambiar turno si la batalla sigue
    if (batalla.estado !== 'Finalizada') {
      batalla.turnoActual = turnoJugador === 1 ? 2 : 1;
    }
    // Determinar el ID del personaje que sigue por atacar
    let idTurnoSiguiente = null;
    if (batalla.estado !== 'Finalizada') {
      idTurnoSiguiente = (turnoJugador === 1) ? batalla.estadoPersonaje2.ID : batalla.estadoPersonaje1.ID;
    }
    // Inicializar historial si no existe
    if (!Array.isArray(batalla.historial)) batalla.historial = [];
    // Al registrar en el historial, incluir el contraataque si ocurrió
    let registroHistorial = {
      golpe: batalla.historial.length + 1,
      atacante: jugador.Nombre,
      defensor: oponente.Nombre,
      accion,
      dano: danoReal,
      estadoAtacante: { ...jugador },
      estadoDefensor: { ...oponente }
    };
    if (accion === 'Combo') registroHistorial.nombreCombo = efectos.nombreCombo;
    if (accion === 'Ultra Move') registroHistorial.nombreUltra = efectos.nombreUltra;
    if (contraataqueRealizado) {
      registroHistorial.contraataque = {
        mensaje: `${oponente.Nombre} realizó un contraataque automático y causó 5 de daño a ${jugador.Nombre}.`,
        dano: 5,
        energiaGastada: 10
      };
    }
    batalla.historial.push(registroHistorial);
    // Guardar cambios correctamente usando .save()
    batalla.markModified('historial');
    batalla.markModified('estadoPersonaje1');
    batalla.markModified('estadoPersonaje2');
    await batalla.save();
    // Respuesta detallada
    res.json({
      mensaje,
      efectos,
      estado: {
        [jugador.Nombre]: { ...jugador },
        [oponente.Nombre]: { ...oponente }
      },
      turnoSiguiente: idTurnoSiguiente,
      ganador
    });
  } catch (err) {
    res.status(500).json({ error: '⚠️ Error al ejecutar acción', message: err.message });
  }
});

router.delete('/api/batallas/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID de batalla inválido. Debe ser un ObjectId de MongoDB.' });
    }
    const eliminado = await BatallaMongo.findByIdAndDelete(id);
    if (!eliminado) {
      return res.status(404).json({ error: 'Batalla no encontrada' });
    }
    res.json({ mensaje: 'Batalla eliminada', id });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar batalla', message: err.message });
  }
});

// Nuevo endpoint para consultar el historial
router.get('/api/batallas/:id/historial', async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID de batalla inválido.' });
    }
    const batalla = await BatallaMongo.findById(id);
    if (!batalla) {
      return res.status(404).json({ error: 'Batalla no encontrada' });
    }
    if (String(batalla.usuario) !== String(req.user.id)) {
      return res.status(403).json({ error: 'No tienes permiso para ver el historial de esta batalla' });
    }
    // Al mostrar el historial, incluir nombreCombo/nombreUltra si existen
    const historial = (batalla.historial || []).map(entry => {
      const registro = { ...entry };
      if (entry.nombreCombo) registro.nombreCombo = entry.nombreCombo;
      if (entry.nombreUltra) registro.nombreUltra = entry.nombreUltra;
      return registro;
    });
    res.json({
      historial,
      resumen: {
        ganador: batalla.ganador || null,
        estadoFinal: {
          [batalla.estadoPersonaje1?.Nombre]: { ...batalla.estadoPersonaje1 },
          [batalla.estadoPersonaje2?.Nombre]: { ...batalla.estadoPersonaje2 }
        }
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener historial', message: err.message });
  }
});

module.exports = router; 