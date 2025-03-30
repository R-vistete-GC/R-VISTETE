
// Función para dar/quitar like
function toggleLike(publicacionId) {
    fetch(`/inicio/api/likes/${publicacionId}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        }
    })
    .then(response => response.json())
    .then(data => {
        const likeBtn = document.querySelector(`button[onclick="toggleLike(${publicacionId})"] i`);
        if (data.status === 'added') {
            likeBtn.classList.add('text-primary');
        } else {
            likeBtn.classList.remove('text-primary');
        }
    });
}

// Función para agregar/quitar de favoritos
function toggleFavorito(publicacionId) {
    fetch(`/inicio/api/favoritos/${publicacionId}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        }
    })
    .then(response => response.json())
    .then(data => {
        const favBtn = document.querySelector(`button[onclick="toggleFavorito(${publicacionId})"] i`);
        if (data.status === 'added') {
            favBtn.classList.add('text-danger');
        } else {
            favBtn.classList.remove('text-danger');
        }
    });
}

// Función para agregar comentario
function addComment(publicacionId) {
    const comentarioInput = document.getElementById('comentarioInput');
    const comentario = comentarioInput.value.trim();
    if (!comentario) return;

    fetch(`/inicio/api/comentarios/agregar/${publicacionId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        },
        body: JSON.stringify({ comentario: comentario })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            // Agregar el nuevo comentario al inicio de la lista
            const comentariosList = document.querySelector('.comentarios-list');
            const nuevoComentario = `
                <div class="card mb-2">
                    <div class="card-body py-2">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <strong>${data.usuario_nombre}</strong>
                            <small class="text-muted">${data.fecha}</small>
                        </div>
                        <p class="card-text mb-0">${data.comentario}</p>
                    </div>
                </div>`;
            
            if (comentariosList.querySelector('.text-muted.text-center')) {
                comentariosList.innerHTML = nuevoComentario;
            } else {
                comentariosList.insertAdjacentHTML('afterbegin', nuevoComentario);
            }

            // Limpiar el input
            comentarioInput.value = '';
        }
    });
}

// Reutilizar las funciones de compra/alquiler del inicio.html
function mostrarModalCompra(publicacionId, tipo) {
    const imagen = document.querySelector('.card-img-top').src;
    const titulo = document.querySelector('.card-title').textContent;
    const precioTexto = document.querySelector('.text-success').textContent;
    const precio = parseFloat(precioTexto.replace('$', ''));

    document.getElementById('modalImagenPrenda').src = imagen;
    document.getElementById('modalTituloPrenda').textContent = titulo;
    document.getElementById('modalPrecioPrenda').textContent = precioTexto;
    document.getElementById('modalPublicacionId').value = publicacionId;
    document.getElementById('modalTipoOperacion').value = tipo;

    const camposAlquiler = document.getElementById('camposAlquiler');
    const depositoRow = document.getElementById('depositoRow');
    if (tipo === 'alquiler') {
        camposAlquiler.style.display = 'block';
        depositoRow.style.display = 'flex';
        document.getElementById('deposito').textContent = `$${(precio * 0.5).toFixed(2)}`;
    } else {
        camposAlquiler.style.display = 'none';
        depositoRow.style.display = 'none';
    }

    document.getElementById('subtotal').textContent = precioTexto;
    actualizarTotal();

    document.getElementById('btnAccionTexto').textContent = tipo === 'compra' ? 'Pagar ahora' : 'Reservar y pagar';

    const modalTitle = document.querySelector('#modalCompra .modal-title');
    modalTitle.textContent = tipo === 'compra' ? 'Comprar Prenda' : 'Alquilar Prenda';

    const modalCompra = new bootstrap.Modal(document.getElementById('modalCompra'));
    modalCompra.show();
}

function actualizarTotal() {
    const subtotalTexto = document.getElementById('subtotal').textContent;
    const subtotal = parseFloat(subtotalTexto.replace('$', ''));
    const envio = 5.00;
    let total = subtotal + envio;

    if (document.getElementById('modalTipoOperacion').value === 'alquiler') {
        const depositoTexto = document.getElementById('deposito').textContent;
        const deposito = parseFloat(depositoTexto.replace('$', ''));
        total += deposito;
    }

    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
}
