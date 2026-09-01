// Importamos la instancia centralizada de Prisma Client desde la capa de configuración
const prisma = require('../config/database');

/**
 * Registra un nuevo producto en la base de datos.
 */
const crear = async (datos) => {
  return await prisma.producto.create({
    data: {
      nombre: datos.nombre,
      stock: datos.stock,
      precio: datos.precio,
    },
  });
};

/**
 * Obtiene la lista completa de productos registrados.
 */
const obtenerTodos = async () => {
  return await prisma.producto.findMany();
};

/**
 * Busca un producto específico por su ID primario.
 */
const obtenerPorId = async (id) => {
  return await prisma.producto.findUnique({
    where: { id: Number(id) },
  });
};

/**
 * Ejecuta una transacción ACID para actualizar el producto y registrar
 * simultáneamente el movimiento en la tabla de historial.
 */
const actualizarConHistorial = async (id, datosActualizar, diferencia, motivo, usuarioId) => {
  // Determinamos si es una ENTRADA o SALIDA de inventario
  const tipoMovimiento = diferencia > 0 ? 'ENTRADA' : 'SALIDA';
  
  // Si no viene un motivo personalizado, asignamos un texto descriptivo por defecto
  const motivoFinal =
    motivo || (tipoMovimiento === 'ENTRADA' ? 'Abastecimiento manual' : 'Despacho manual');

  // $transaction garantiza atomicidad
  const [productoActualizado] = await prisma.$transaction([
    // Operación 1: Actualiza la tabla Producto
    prisma.producto.update({
      where: { id: Number(id) },
      data: datosActualizar,
    }),
    // Operación 2: Crea el registro en historialmovimiento (nombre exacto del schema)
    prisma.historialmovimiento.create({
      data: {
        productoId: Number(id),
        cantidad: diferencia,
        tipo: tipoMovimiento,
        motivo: motivoFinal,
        usuarioId: usuarioId ? Number(usuarioId) : null, // Asocia el usuario que hizo el cambio
      },
    }),
  ]);

  return productoActualizado;
};

/**
 * Actualiza los datos del producto sin tocar el stock ni generar historial.
 */
const actualizarSinHistorial = async (id, datosActualizar) => {
  return await prisma.producto.update({
    where: { id: Number(id) },
    data: datosActualizar,
  });
};

/**
 * Elimina un producto de la base de datos.
 */
const eliminar = async (id) => {
  return await prisma.producto.delete({
    where: { id: Number(id) },
  });
};

/**
 * Obtiene el historial de movimientos de inventario ordenados.
 */
const obtenerHistorialMovimientos = async () => {
  return await prisma.historialmovimiento.findMany({
    orderBy: { creadoEn: 'desc' },
    include: { producto: true, usuario: true }, // Incluye la relación con el producto y el usuario
  });
};

module.exports = {
  crear,
  obtenerTodos,
  obtenerPorId,
  actualizarConHistorial,
  actualizarSinHistorial,
  eliminar,
  obtenerHistorialMovimientos,
};