const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { buscarPorCorreo } = require('../../infrastructure/repositories/UsuarioRepository');

const JWT_SECRET = process.env.JWT_SECRET || 'jwt_secret_default';

const loginUser = async (correo, contrasena) => {
  const usuario = await buscarPorCorreo(correo);
  if (!usuario) {
    throw new Error('Credenciales inválidas');
  }
  const valido = await bcrypt.compare(contrasena, usuario.contrasena);
  if (!valido) {
    throw new Error('Credenciales inválidas');
  }
  // Generar JWT
  const token = jwt.sign({ id: usuario._id, correo: usuario.correo, nombre: usuario.nombre }, JWT_SECRET, { expiresIn: '2h' });
  return { token, usuario: { id: usuario._id, correo: usuario.correo, nombre: usuario.nombre } };
};

module.exports = loginUser; 