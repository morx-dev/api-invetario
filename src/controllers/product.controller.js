const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. AGREGAR PRODUCTO (CREATE)
const crearProducto = async (req, res) => {
  try {
    const { nombre, stock, precio } = req.body;

    if (!nombre || nombre.trim() === "") {
      return res.status(400).json({ error: 'El nombre del producto es obligatorio' });
    }
    if (Number(precio) <= 0) {
      return res.status(400).json({ error: 'El precio debe ser un número positivo mayor a cero' });
    }
    if (Number(stock) < 0) {
      return res.status(400).json({ error: 'El stock inicial no puede ser un número negativo' });
    }

    const nuevoProducto = await prisma.producto.create({
      data: { 
        nombre: nombre.trim(), 
        stock: Number(stock), 
        precio: Number(precio) 
      }
    });

    res.status(201).json(nuevoProducto);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el producto', detalles: error.message });
  }
};

// 2. OBTENER PRODUCTOS (READ)
const obtenerProductos = async (req, res) => {
  try {
    const productos = await prisma.producto.findMany();
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

// 3. CAMBIAR STOCK ACTUALIZANDO EL HISTORIAL (UPDATE + HISTORY LOG)
const actualizarStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock, motivo } = req.body; // Ahora el cliente puede enviar un motivo opcional

    if (stock === undefined || stock === null) {
      return res.status(400).json({ error: 'El campo stock es obligatorio para esta actualización' });
    }

    const nuevoStock = Number(stock);
    if (nuevoStock < 0) {
      return res.status(400).json({ error: 'El stock no puede quedar en un número negativo' });
    }

    // Buscar el producto actual en MySQL para saber cuánto stock tenía antes
    const productoActual = await prisma.producto.findUnique({
      where: { id: Number(id) }
    });

    if (!productoActual) {
      return res.status(404).json({ error: `No se encontró el producto con ID ${id}` });
    }

    // Calcular la diferencia de inventario
    const stockAnterior = productoActual.stock;
    const diferencia = nuevoStock - stockAnterior;

    // Si no cambió en nada el stock, no registramos movimiento innecesario
    if (diferencia === 0) {
      return res.json({ mensaje: "El stock es idéntico, no se generaron cambios", producto: productoActual });
    }

    // Determinar si fue Entrada o Salida
    const tipoMovimiento = diferencia > 0 ? "ENTRADA" : "SALIDA";
    const motivoFinal = motivo || (tipoMovimiento === "ENTRADA" ? "Abastecimiento manual" : "Despacho manual");

    // Ejecutar la actualización en MySQL usando una Transacción de Prisma
    // Esto asegura que si una tabla falla, la otra no guarde datos corruptos.
    const [productoActualizado, nuevoHistorial] = await prisma.$transaction([
      // Operación 1: Actualizar la tabla Producto
      prisma.producto.update({
        where: { id: Number(id) },
        data: { stock: nuevoStock }
      }),
      // Operación 2: Escribir la bitácora en HistorialMovimiento
      prisma.historialMovimiento.create({
        data: {
          productoId: Number(id),
          cantidad: diferencia, // Guardará números como +5 o -3
          tipo: tipoMovimiento,
          motivo: motivoFinal
        }
      })
    ]);

    res.json({
      mensaje: "Stock actualizado e historial registrado con éxito",
      producto: productoActualizado,
      movimiento: nuevoHistorial
    });

  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el stock e historial', detalles: error.message });
  }
};

// 4. ELIMINAR PRODUCTO (DELETE)
const eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.producto.delete({
      where: { id: Number(id) }
    });
    res.json({ mensaje: `Producto con ID ${id} y todo su historial fueron eliminados` });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el producto', detalles: error.message });
  }
};

// 5. OBTENER TODO EL HISTORIAL DE MOVIMIENTOS (NUEVO ENDPOINT)
const obtenerHistorial = async (req, res) => {
  try {
    // Retorna los movimientos ordenados desde el más reciente e incluye los datos del producto
    const historial = await prisma.historialMovimiento.findMany({
      orderBy: { creadoEn: 'desc' },
      include: { producto: true } // Hace un JOIN implícito en SQL para traerte los datos del producto vinculado
    });
    res.json(historial);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el historial de movimientos', detalles: error.message });
  }
};

module.exports = {
  crearProducto,
  obtenerProductos,
  actualizarStock,
  eliminarProducto,
  obtenerHistorial // Exportamos nuestra nueva función
};