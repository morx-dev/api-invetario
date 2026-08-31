// Manejo del Login (Solo se ejecuta en index.html)
const loginForm = document.getElementById('loginForm');

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const alertContainer = document.getElementById('alertContainer');

    try {
      const respuesta = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        alertContainer.innerHTML = `<div class="alert alert-danger">${datos.error}</div>`;
        return;
      }

      localStorage.setItem('token', datos.token);
      localStorage.setItem('usuario', JSON.stringify(datos.usuario));
      localStorage.setItem('rol', datos.usuario.rol);

      window.location.href = 'dashboard.html';
    } catch (error) {
      alertContainer.innerHTML = `<div class="alert alert-danger">No se pudo conectar con el servidor backend.</div>`;
    }
  });
}

// Función global para cerrar sesión
function cerrarSesion() {
  localStorage.clear();
  window.location.href = 'index.html';
}