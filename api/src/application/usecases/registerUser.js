const bcrypt = require('bcryptjs');
const { crearUsuario, buscarPorCorreo } = require('../../infrastructure/repositories/UsuarioRepository');

const registerUser = async (nombre, correo, contrasena) => {
  // Verificar si ya existe el usuario
  const existente = await buscarPorCorreo(correo);
  if (existente) {
    throw new Error('El correo ya está registrado');
  }
  // Hashear la contraseña
  const hash = await bcrypt.hash(contrasena, 10);
  // Crear usuario
  const usuario = await crearUsuario(nombre, correo, hash);
  return usuario;
};

module.exports = registerUser; 