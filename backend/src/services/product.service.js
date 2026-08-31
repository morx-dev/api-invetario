// Importamos la instancia centralizada de Prisma Client desde la capa de configuración
const prisma = require('../config/database');

/**
 * Registra un nuevo producto en la base de datos.
 * @param {Object} datos - Objeto con nombre, stock y precio.
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
 * @param {number|string} id - Identificador único del producto.
 */
const obtenerPorId = async (id) => {
  return await prisma.producto.findUnique({
    where: { id: Number(id) }, // Aseguramos la conversión a número para la consulta SQL
  });
};

/**
 * Ejecuta una transacción ACID para actualizar el producto y registrar
 * simultáneamente el movimiento en la tabla de historial.
 * 
 * @param {number|string} id - ID del producto a actualizar.
 * @param {Object} datosActualizar - Campos modificados (nombre, precio, stock).
 * @param {number} diferencia - Unidades aumentadas (+) o disminuidas (-).
 * @param {string} motivo - Razón del cambio de stock.
 */
const actualizarConHistorial = async (id, datosActualizar, diferencia, motivo) => {
  // Determinamos si es una ENTRADA o SALIDA de inventario
  const tipoMovimiento = diferencia > 0 ? 'ENTRADA' : 'SALIDA';
  
  // Si no viene un motivo personalizado, asignamos un texto descriptivo por defecto
  const motivoFinal =
    motivo || (tipoMovimiento === 'ENTRADA' ? 'Abastecimiento manual' : 'Despacho manual');

  // $transaction garantiza atomicidad: si falla una operación, se revierte todo (Rollback)
  const [productoActualizado] = await prisma.$transaction([
    // Operación 1: Actualiza la tabla Producto
    prisma.producto.update({
      where: { id: Number(id) },
      data: datosActualizar,
    }),
    // Operación 2: Crea el registro en HistorialMovimiento vinculado por FK
    prisma.historialMovimiento.create({
      data: {
        productoId: Number(id),
        cantidad: diferencia,
        tipo: tipoMovimiento,
        motivo: motivoFinal,
      },
    }),
  ]);

  return productoActualizado; // Retorna el producto resultante de la transacción
};

/**
 * Actualiza los datos del producto (nombre o precio) sin tocar el stock ni generar historial.
 * 
 * @param {number|string} id - ID del producto.
 * @param {Object} datosActualizar - Objeto con los nuevos valores.
 */
const actualizarSinHistorial = async (id, datosActualizar) => {
  return await prisma.producto.update({
    where: { id: Number(id) },
    data: datosActualizar,
  });
};

/**
 * Elimina un producto de la base de datos (y su historial en cascada si está configurado en Prisma).
 * 
 * @param {number|string} id - ID del producto a eliminar.
 */
const eliminar = async (id) => {
  return await prisma.producto.delete({
    where: { id: Number(id) },
  });
};

/**
 * Obtiene el historial de movimientos de inventario ordenados del más reciente al más antiguo,
 * incluyendo los datos del producto asociado mediante un JOIN implícito.
 */
const obtenerHistorialMovimientos = async () => {
  return await prisma.historialMovimiento.findMany({
    orderBy: { creadoEn: 'desc' }, // Orden cronológico descendente
    include: { producto: true },    // Realiza el JOIN relacional con la tabla Producto
  });
};

// Exportación de los métodos del servicio para ser consumidos por el controlador
module.exports = {
  crear,
  obtenerTodos,
  obtenerPorId,
  actualizarConHistorial,
  actualizarSinHistorial,
  eliminar,
  obtenerHistorialMovimientos,
};