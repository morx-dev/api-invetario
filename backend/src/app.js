// 1. IMPORTACIÓN DE MÓDULOS Y DEPENDENCIAS
// Importa la librería Express, que es el framework que nos permite crear el servidor web y gestionar rutas de forma fácil.
const express = require('express');

// Carga las variables de entorno definidas en tu archivo `.env` (como DATABASE_URL o el PORT).
// Esto hace que `process.env` tenga acceso a esas credenciales secretas o configuraciones.
require('dotenv').config();

// 2. IMPORTACIÓN DE RUTAS MODULARES
// Importa el archivo de rutas que creamos para los productos. 
// Este archivo contiene los caminos específicos (como GET, POST, PUT, DELETE para los productos).
const productRoutes = require('./routes/product.routes');
const authRoutes = require('./routes/auth.routes')
const cors = require('cors'); // Arriba con las importaciones


// 3. INICIALIZACIÓN DEL SERVIDOR
// Crea una instancia de la aplicación Express. 'app' será el objeto principal para configurar todo nuestro backend.
const app = express();

// 4. CONFIGURACIÓN DE MIDDLEWARES
// Este middleware es vital. Le enseña a tu servidor a entender y procesar datos que vienen en formato JSON
// dentro del cuerpo de las peticiones (el `req.body` que mandas desde Thunder Client). Sin esto, recibirías 'undefined'.
app.use(express.json());
app.use(cors());

// 5. REGISTRO DE RUTAS BASE (ENRUTAMIENTO)
// Aquí defines el prefijo principal. Le dices a Express: "Cualquier petición HTTP que empiece con '/api/productos'
// debe ser redirigida y manejada por el archivo 'productRoutes'".
app.use('/api/productos', productRoutes);
app.use('/api/auth', authRoutes);

// 6. ENCENDIDO DEL SERVIDOR
// Define el puerto donde escuchará el servidor. Intenta leer la variable PORT del archivo `.env`, 
// y si no existe o no está definida, usa el puerto 3000 por defecto.
const PORT = process.env.PORT || 3000;

// Pone al servidor en modo "escucha" (activo) en el puerto seleccionado.
// Cuando el servidor se levanta con éxito, ejecuta la función flecha que muestra el mensaje en tu terminal.
app.listen(PORT, () => {
  console.log(`Servidor corriendo con éxito en el puerto ${PORT}`);
});