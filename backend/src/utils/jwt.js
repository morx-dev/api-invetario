const jwt = require('jsonwebtoken');

const generarToken = (payload) => {
  return jwt.sign(
    payload, 
    process.env.JWT_SECRET || 'secreto_super_seguro_2026', 
    { expiresIn: '8h' }
  );
};

module.exports = { generarToken };