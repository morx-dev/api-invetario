const jwt = require('jsonwebtoken');

// MIDDLEWARE 1: Verificar que el usuario inició sesión (Tiene un Token válido)
const verificarToken = (req, res, next) => {
  try {
    // 1. Obtener el token que viene en la cabecera de la petición (Authorization)
    const authHeader = req.headers['authorization'];
    
    // El estándar profesional es mandar: "Bearer eyJhbGci..."
    // Así que separamos el string por el espacio y agarramos solo el token
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Acceso denegado. No se proporcionó un token de seguridad.' });
    }

    // 2. Verificar si el token es real y no ha sido manipulado
    const datosVerificados = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. Inyectamos los datos del usuario (id, email, rol) dentro de la petición 'req'
    // para que cualquier controlador que se ejecute después sepa quién está operando
    req.usuario = datosVerificados;

    // 4. ¡Crucial! 'next()' le dice a Express: "Todo bien, dale pase al siguiente controlador"
    next();

  } catch (error) {
    return res.status(403).json({ error: 'Token inválido o vencido. Inicia sesión de nuevo.' });
  }
};

// MIDDLEWARE 2: Verificar si el usuario es Administrador
const esAdmin = (req, res, next) => {
  // Como 'verificarToken' se ejecuta antes, aquí ya tenemos acceso a 'req.usuario'
  if (req.usuario && req.usuario.rol === 'ADMIN') {
    next(); // Es admin, dale pase libre
  } else {
    return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de ADMINISTRADOR.' });
  }
};

module.exports = {
  verificarToken,
  esAdmin
};