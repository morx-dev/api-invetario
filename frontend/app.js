const API_URL = 'http://localhost:3000/api';

// 1. Escuchar cuando el usuario envíe el formulario de Login
const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Evita que la página se recargue sola

        // Capturar los valores que escribió el usuario
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const alertContainer = document.getElementById('alertContainer');

        try {
            // HACIENDO EL FETCH (La petición HTTP real desde el navegador)
            const respuesta = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                // Si el backend responde con 400 o 401, mostramos el error
                alertContainer.innerHTML = `<div class="alert alert-danger">${datos.error}</div>`;
                return;
            }

            // ¡ÉXITO! Guardamos el token y los datos del usuario en el LocalStorage
            localStorage.setItem('token', datos.token);
            localStorage.setItem('usuario', JSON.stringify(datos.usuario));

            // Redireccionar al Dashboard del inventario
            window.location.href = 'dashboard.html';

        } catch (error) {
            alertContainer.innerHTML = `<div class="alert alert-danger">No se pudo conectar con el servidor backend.</div>`;
        }
    });
}

// =========================================================
// LÓGICA PARA EL DASHBOARD (CARGAR PRODUCTOS DESDE EL BACKEND)
// =========================================================

// Esta función se ejecutará automáticamente si estamos en la página del dashboard
const tablaProductos = document.getElementById('tablaProductos');

if (tablaProductos) {
    // Ejecutar la carga apenas abra la pantalla
    cargarProductos();
}

async function cargarProductos() {
    // 1. Extraer el token de seguridad guardado en el navegador
    const token = localStorage.getItem('token');

    try {
        // 2. Hacer la petición GET incluyendo el token en las cabeceras (Headers)
        const respuesta = await fetch(`${API_URL}/productos`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, // Mandamos la pulsera de acceso
                'Content-Type': 'application/json'
            }
        });

        const productos = await respuesta.json();

        // Si el token expiró o nos lo rebotó el servidor, mandarlo al login
        if (!respuesta.ok) {
            localStorage.clear();
            window.location.href = 'index.html';
            return;
        }

        // 3. Si la base de datos está vacía, mostrar aviso
        if (productos.length === 0) {
            tablaProductos.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted">No hay productos registrados en el inventario.</td>
                </tr>`;
            return;
        }

        // 4. LIMPIAR la tabla e inyectar los productos dinámicamente
        tablaProductos.innerHTML = ''; // Borra el "Cargando inventario..."

        productos.forEach(producto => {
            tablaProductos.innerHTML += `
                <tr>
                    <td><strong>#${producto.id}</strong></td>
                    <td>${producto.nombre}</td>
                    <td>Q${Number(producto.precio).toFixed(2)}</td>
                    <td>
                        <span class="badge ${producto.stock > 5 ? 'bg-success' : 'bg-danger'} p-2">
                            ${producto.stock} unidades
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-warning btn-sm me-2" onclick="prepararActualizar(${producto.id})">✏️ Editar</button>
                        <button class="btn btn-danger btn-sm" onclick="eliminarProducto(${producto.id})">🗑️ Borrar</button>
                    </td>
                </tr>
            `;
        });

    } catch (error) {
        tablaProductos.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger">Error de conexión con el servidor.</td>
            </tr>`;
    }
}
