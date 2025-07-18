const express = require('express');
const router = express.Router();
const registerUser = require('../../application/usecases/registerUser');
const loginUser = require('../../application/usecases/loginUser');

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Autenticación de usuarios (registro y login)
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               correo:
 *                 type: string
 *               contrasena:
 *                 type: string
 *             required:
 *               - nombre
 *               - correo
 *               - contrasena
 *           example:
 *             nombre: "Pepito"
 *             correo: "pepito@email.com"
 *             contrasena: "123456"
 *     responses:
 *       201:
 *         description: Usuario registrado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mensaje:
 *                   type: string
 *                 usuario:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     correo:
 *                       type: string
 *                     nombre:
 *                       type: string
 *       400:
 *         description: Error de validación o usuario ya existe
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Iniciar sesión de usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               correo:
 *                 type: string
 *               contrasena:
 *                 type: string
 *             required:
 *               - correo
 *               - contrasena
 *           example:
 *             correo: "pepito@email.com"
 *             contrasena: "123456"
 *     responses:
 *       200:
 *         description: Login exitoso, retorna token JWT y datos del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 usuario:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     correo:
 *                       type: string
 *                     nombre:
 *                       type: string
 *       400:
 *         description: Credenciales inválidas o error de validación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
// Registro
router.post('/register', async (req, res) => {
  try {
    const { nombre, correo, contrasena } = req.body;
    if (!nombre || !correo || !contrasena) {
      return res.status(400).json({ error: 'Nombre, correo y contraseña son requeridos.' });
    }
    const usuario = await registerUser(nombre, correo, contrasena);
    res.status(201).json({ mensaje: 'Usuario registrado correctamente', usuario: { id: usuario._id, correo: usuario.correo, nombre: usuario.nombre } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { correo, contrasena } = req.body;
    if (!correo || !contrasena) {
      return res.status(400).json({ error: 'Correo y contraseña son requeridos.' });
    }
    const { token, usuario } = await loginUser(correo, contrasena);
    res.json({ token, usuario });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router; 