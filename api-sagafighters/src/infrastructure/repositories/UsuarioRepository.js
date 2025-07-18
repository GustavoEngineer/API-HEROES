const Usuario = require('../../domain/models/UsuarioMongo');

const crearUsuario = async (nombre, correo, contrasena) => {
  const usuario = new Usuario({ nombre, correo, contrasena });
  return await usuario.save();
};

const buscarPorCorreo = async (correo) => {
  return await Usuario.findOne({ correo });
};

module.exports = {
  crearUsuario,
  buscarPorCorreo
}; 