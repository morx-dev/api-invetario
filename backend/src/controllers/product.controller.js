const productService = require('../services/product.service');

// 1. AGREGAR PRODUCTO (POST)
const crearProducto = async (req, res) => {
  try {
    const { nombre, stock, precio } = req.body;

    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ error: 'El nombre del producto es obligatorio' });
    }
    if (Number(precio) <= 0) {
      return res.status(400).json({ error: 'El precio debe ser un número positivo mayor a cero' });
    }
    if (Number(stock) < 0) {
      return res.status(400).json({ error: 'El stock inicial no puede ser un número negativo' });
    }

    const nuevoProducto = await productService.crear({
      nombre: nombre.trim(),
      stock: Number(stock),
      precio: Number(precio),
    });

    res.status(201).json(nuevoProducto);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el producto', detalles: error.message });
  }
};

// 2. OBTENER PRODUCTOS (GET)
const obtenerProductos = async (req, res) => {
  try {
    const productos = await productService.obtenerTodos();
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

// 3. OBTENER UN PRODUCTO POR ID (GET /api/productos/:id)
const obtenerProductoPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const producto = await productService.obtenerPorId(id);

    if (!producto) {
      return res.status(404).json({ error: `No se encontró el producto con ID ${id}` });
    }

    res.json(producto);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el producto', detalles: error.message });
  }
};

// 4. ACTUALIZAR PRODUCTO COMPLETO (PUT /api/productos/:id)
const actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, precio, stock, motivo } = req.body;
    
    // 1. Extraer el ID del usuario autenticado directamente del token JWT (middleware auth)
    const usuarioId = req.usuario?.id || req.user?.id; 

    const productoActual = await productService.obtenerPorId(id);

    if (!productoActual) {
      return res.status(404).json({ error: `No se encontró el producto con ID ${id}` });
    }

    // 2. Mapear solo los campos enviados
    const datosActualizar = {};
    if (nombre !== undefined) datosActualizar.nombre = nombre.trim();
    if (precio !== undefined) datosActualizar.precio = Number(precio);

    let nuevoStock = productoActual.stock;
    if (stock !== undefined && stock !== null) {
      nuevoStock = Number(stock);
      datosActualizar.stock = nuevoStock;
    }

    const diferencia = nuevoStock - productoActual.stock;

    // 3. Si cambió el stock, registramos la transacción en el historial de inventario
    if (diferencia !== 0) {
      // Asignar motivo por defecto si no viene en el body
      const motivoTexto = motivo || (diferencia > 0 ? 'ENTRADA (Ajuste manual de stock)' : 'SALIDA (Ajuste manual de stock)');

      const productoActualizado = await productService.actualizarConHistorial(
        id,
        datosActualizar,
        diferencia,
        motivoTexto,
        usuarioId // <-- Enviar el usuarioId para la relación en la tabla Historial
      );

      return res.json({
        mensaje: 'Producto e historial actualizados con éxito',
        producto: productoActualizado,
      });
    }

    // 4. Si solo cambió el nombre o precio sin modificar el stock
    const productoActualizado = await productService.actualizarSinHistorial(id, datosActualizar);

    return res.json({ mensaje: 'Producto actualizado con éxito', producto: productoActualizado });

  } catch (error) {
    // CRUCIAL: Ver el error real en la terminal/Docker
    console.error("Error en actualizarProducto:", error);
    return res.status(500).json({ 
      error: 'Error al actualizar el producto', 
      detalles: error.message 
    });
  }
};

// 5. ELIMINAR PRODUCTO (DELETE)
const eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    await productService.eliminar(id);
    res.json({ mensaje: `Producto con ID ${id} y todo su historial fueron eliminados` });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el producto', detalles: error.message });
  }
};

// 6. OBTENER TODO EL HISTORIAL DE MOVIMIENTOS
const obtenerHistorial = async (req, res) => {
  try {
    const historial = await productService.obtenerHistorialMovimientos();
    res.json(historial);
  } catch (error) {
    res.status(500).json({
      error: 'Error al obtener el historial de movimientos',
      detalles: error.message,
    });
  }
};

module.exports = {
  crearProducto,
  obtenerProductos,
  obtenerProductoPorId,
  actualizarProducto,
  eliminarProducto,
  obtenerHistorial,
};