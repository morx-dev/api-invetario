const prisma = require('../config/database');

const buscarPorEmail = async (email) => {
  return await prisma.usuario.findUnique({
    where: { email },
  });
};

const crearUsuario = async (email, passwordEncriptada, rol) => {
  return await prisma.usuario.create({
    data: {
      email,
      password: passwordEncriptada,
      rol: rol ? rol.toUpperCase() : 'EMPLEADO', // Si no mandan rol, por defecto es EMPLEADO
    },
  });
};

module.exports = {
  buscarPorEmail,
  crearUsuario,
};