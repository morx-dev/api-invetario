const tablaProductos = document.getElementById('tablaProductos');

if (tablaProductos) {
  cargarProductos();
}

function cargarProductos() {
  const token = localStorage.getItem('token');
  const rolUsuario = localStorage.getItem('rol');

  if ($.fn.DataTable.isDataTable('#miTablaProductos')) {
    $('#miTablaProductos').DataTable().destroy();
  }

  $('#miTablaProductos').DataTable({
    ajax: {
      url: `${API_URL}/productos`,
      type: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
      dataSrc: '',
      error: function () {
        localStorage.clear();
        window.location.href = 'index.html';
      }
    },
    columns: [
      { 
        data: 'id',
        render: (data) => `<strong>#${parseInt(data, 10)}</strong>`
      },
      { data: 'nombre' },
      { 
        data: 'precio',
        render: (data) => `Q${Number(data).toFixed(2)}`
      },
      { 
        data: 'stock',
        render: function (data) {
          const badgeClass = data > 5 ? 'bg-success' : 'bg-danger';
          return `<span class="badge ${badgeClass} p-2">${data} unidades</span>`;
        }
      },
      {
        data: null,
        className: rolUsuario === 'ADMIN' ? '' : 'text-center',
        orderable: false,
        render: function (data, type, row) {
          if (rolUsuario === 'ADMIN') {
            const idLimpio = parseInt(row.id, 10);
            return `
              <button class="btn btn-warning btn-sm me-2" onclick="prepararActualizar(${idLimpio})">✏️ Editar</button>
              <button class="btn btn-danger btn-sm" onclick="eliminarProducto(${idLimpio})">🗑️ Borrar</button>
            `;
          }
          return `<span title="Sin permisos para editar o eliminar">🔒</span>`;
        }
      }
    ],
    language: {
      lengthMenu: "Mostrar _MENU_ registros",
      zeroRecords: "No se encontraron productos",
      info: "Mostrando registros del _START_ al _END_ de un total de _TOTAL_ registros",
      infoEmpty: "Mostrando registros del 0 al 0 de un total de 0 registros",
      infoFiltered: "(filtrado de un total de _MAX_ registros)",
      search: "Buscar:",
      paginate: {
        first: "Primero",
        last: "Último",
        next: "Siguiente",
        previous: "Anterior"
      }
    },
    pageLength: 10,
    responsive: true,
    order: [[0, 'asc']]
  });
}

function obtenerInstanciaModal() {
  const modalEl = document.getElementById('modalProducto');
  if (!modalEl) return null;
  return bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
}

document.addEventListener('DOMContentLoaded', () => {
  const btnAgregarModal = document.getElementById('btnAgregarModal');
  if (btnAgregarModal && localStorage.getItem('rol') === 'ADMIN') {
    btnAgregarModal.classList.remove('d-none');
  }
});

function abrirModalCrear() {
  document.getElementById('formProducto').reset();
  document.getElementById('prodId').value = '';
  document.getElementById('modalTitulo').innerText = 'Agregar Nuevo Producto';
  
  const modal = obtenerInstanciaModal();
  if (modal) modal.show();
}

const formProducto = document.getElementById('formProducto');
if (formProducto) {
  formProducto.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('prodId').value;
    const nombre = document.getElementById('prodNombre').value;
    const precio = parseFloat(document.getElementById('prodPrecio').value);
    const stock = parseInt(document.getElementById('prodStock').value, 10);

    const esEdicion = Boolean(id);
    const url = esEdicion ? `${API_URL}/productos/${parseInt(id, 10)}` : `${API_URL}/productos`;
    const method = esEdicion ? 'PUT' : 'POST';

    // Construcción del objeto del cuerpo de la petición
    const bodyData = { nombre, precio, stock };
    if (esEdicion) {
      bodyData.motivo = 'Actualización manual desde interfaz web';
    }

    try {
      const respuesta = await fetch(url, {
        method: method,
        headers: obtenerHeadersAuth(),
        body: JSON.stringify(bodyData)
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        alert(datos.error || datos.detalles || 'Error al procesar la solicitud');
        return;
      }

      const modal = obtenerInstanciaModal();
      if (modal) modal.hide();
      
      formProducto.reset();
      cargarProductos();
    } catch (error) {
      alert('Error de conexión con el servidor backend.');
    }
  });
}

async function prepararActualizar(id) {
  const idNum = parseInt(id, 10);

  try {
    const respuesta = await fetch(`${API_URL}/productos/${idNum}`, {
      method: 'GET',
      headers: obtenerHeadersAuth()
    });

    const producto = await respuesta.json();

    if (respuesta.ok) {
      document.getElementById('prodId').value = producto.id;
      document.getElementById('prodNombre').value = producto.nombre;
      document.getElementById('prodPrecio').value = producto.precio;
      document.getElementById('prodStock').value = producto.stock;

      document.getElementById('modalTitulo').innerText = `Editar Producto #${producto.id}`;
      
      const modal = obtenerInstanciaModal();
      if (modal) modal.show();
    } else {
      alert(producto.error || 'No se pudo obtener el producto');
    }
  } catch (error) {
    alert('Error al conectar con el servidor.');
  }
}

async function eliminarProducto(id) {
  const idNum = parseInt(id, 10);
  if (!confirm(`¿Estás seguro de que deseas eliminar el producto #${idNum}?`)) return;

  try {
    const respuesta = await fetch(`${API_URL}/productos/${idNum}`, {
      method: 'DELETE',
      headers: obtenerHeadersAuth()
    });

    if (respuesta.ok) {
      cargarProductos();
    } else {
      const datos = await respuesta.json();
      alert(datos.error || 'No se pudo eliminar el producto');
    }
  } catch (error) {
    alert('Error de conexión al intentar eliminar.');
  }
}