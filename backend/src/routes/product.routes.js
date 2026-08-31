const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
// Importamos nuestros dos middlewares de protección
const { verificarToken, esAdmin } = require('../middlewares/auth.middleware');

// REGLAS DE SEGURIDAD PARA NUESTRO INVENTARIO:
// 1. Cualquier usuario logueado (Admin o Empleado) puede VER los productos e historial
router.get('/', verificarToken, productController.obtenerProductos);
router.get('/historial', verificarToken, productController.obtenerHistorial);
router.get('/:id', verificarToken, productController.obtenerProductoPorId); // <- RUTA AGREGADA

// 2. SOLO los usuarios con rol ADMIN pueden CREAR, MODIFICAR o ELIMINAR productos
router.post('/', verificarToken, esAdmin, productController.crearProducto);
router.put('/:id', verificarToken, esAdmin, productController.actualizarProducto);
router.delete('/:id', verificarToken, esAdmin, productController.eliminarProducto);

module.exports = router;