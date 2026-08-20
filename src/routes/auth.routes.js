const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Ruta para registrar usuarios: POST /api/auth/registrar
router.post('/registrar', authController.registrar);
router.post('/login', authController.login);


module.exports = router;