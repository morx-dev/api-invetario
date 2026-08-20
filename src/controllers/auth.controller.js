const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// REGISTRO DE USUARIOS
const registrar = async (req, res) => {
  try {
    const { email, password, rol } = req.body;

    // 1. Validar que vengan los datos obligatorios
    if (!email || !password) {
      return res.status(400).json({ error: 'El email y la contraseña son obligatorios' });
    }

    // 2. Verificar si el email ya existe en MySQL
    const usuarioExiste = await prisma.usuario.findUnique({
      where: { email }
    });

    if (usuarioExiste) {
      return res.status(400).json({ error: 'Este correo electrónico ya está registrado' });
    }

    // 3. ENCRIPTAR LA CONTRASEÑA (Seguridad)
    // El "salt" son las rondas de procesamiento del algoritmo (10 es el estándar balanceado)
    const salt = await bcrypt.genSalt(10);
    const passwordEncriptada = await bcrypt.hash(password, salt);

    // 4. Guardar el nuevo usuario en MySQL
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        email: email.trim(),
        password: passwordEncriptada,
        rol: rol ? rol.toUpperCase() : "EMPLEADO" // Si no mandan rol, por defecto es EMPLEADO
      }
    });

    // 5. Responder con éxito (¡OJO! Nunca devolvemos el password en el JSON de respuesta)
    res.status(201).json({
      mensaje: "Usuario registrado con éxito",
      usuario: {
        id: nuevoUsuario.id,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol
      }
    });

  } catch (error) {
    res.status(500).json({ error: 'Error al registrar el usuario', detalles: error.message });
  }
};

// NUEVA FUNCIÓN: INICIO DE SESIÓN (LOGIN)
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validar entrada básica
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    // 2. Buscar si el usuario existe en MySQL
    const usuario = await prisma.usuario.findUnique({
      where: { email }
    });

    if (!usuario) {
      // Por seguridad, usamos un mensaje genérico para no dar pistas a atacantes
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // 3. COMPARAR CONTRASEÑAS
    // bcrypt toma la contraseña plana que metió el usuario y la compara matemáticamente con el hash de MySQL
    const passwordCorrecto = await bcrypt.compare(password, usuario.password);

    if (!passwordCorrecto) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // 4. GENERAR EL TOKEN JWT (La Llave de Acceso)
    // Guardamos dentro del token el ID y el ROL del usuario para usarlos después
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '8h' } // El token vencerá automáticamente en 8 horas
    );

    // 5. Devolver la respuesta con el Token
    res.json({
      mensaje: "Inicio de sesión exitoso",
      usuario: {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol
      },
      token: token // Este string gigante es el que usará Thunder Client
    });

  } catch (error) {
    res.status(500).json({ error: 'Error al iniciar sesión', detalles: error.message });
  }
};

module.exports = {
  registrar,
  login // <-- No olvides exportarlo
};