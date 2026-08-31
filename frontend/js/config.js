const API_URL = 'http://localhost:3000/api';

// Configuración genérica para enviar peticiones con Bearer Token
function obtenerHeadersAuth() {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}