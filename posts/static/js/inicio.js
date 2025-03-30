let currentPublicacionId = null;
let comentariosModal;

// Asegurar que el modal se inicialice después de que el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    comentariosModal = new bootstrap.Modal(document.getElementById('comentariosModal'));
});

function mostrarComentarios(publicacionId) {
    currentPublicacionId = publicacionId;
    
    // Mostrar spinner y ocultar otros elementos
    document.getElementById('loadingSpinner').style.display = 'block';
    document.getElementById('errorAlert').style.display = 'none';
    document.getElementById('comentariosList').innerHTML = '';
    
    // Mostrar el modal
    comentariosModal.show();
    
    // Cargar los comentarios
    fetch(`/inicio/api/comentarios/get/${publicacionId}/`)
        .then(response => response.json())
        .then(data => {
            document.getElementById('loadingSpinner').style.display = 'none';
            const comentariosList = document.getElementById('comentariosList');
            
            if (data.length === 0) {
                comentariosList.innerHTML = `
                    <div class="text-center text-muted p-3">
                        <i class="fas fa-comments fa-2x mb-2"></i>
                        <p>Sé el primero en comentar</p>
                    </div>`;
                return;
            }
            
            comentariosList.innerHTML = data.map(comentario => `
                <div class="list-group-item">
                    <div class="d-flex justify-content-between align-items-center">
                        <strong>${comentario.usuario_nombre}</strong>
                        <small class="text-muted">${comentario.fecha_comentario}</small>
                    </div>
                    <p class="mb-1">${comentario.comentario}</p>
                </div>
            `).join('');
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('loadingSpinner').style.display = 'none';
            document.getElementById('errorAlert').style.display = 'block';
        });
}

// Manejar el envío de nuevos comentarios
document.getElementById('comentarioForm').addEventListener('submit', function(e) {
    e.preventDefault();
    if (!currentPublicacionId) return;

    const comentarioInput = document.getElementById('comentarioInput');
    const comentario = comentarioInput.value.trim();
    if (!comentario) return;

    // Deshabilitar el botón mientras se envía
    const submitButton = document.getElementById('enviarComentario');
    submitButton.disabled = true;

    fetch(`/inicio/api/comentarios/agregar/${currentPublicacionId}/`, {
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
            const comentariosList = document.getElementById('comentariosList');
            const nuevoComentario = `
                <div class="list-group-item">
                    <div class="d-flex justify-content-between align-items-center">
                        <strong>${data.usuario_nombre}</strong>
                        <small class="text-muted">${data.fecha}</small>
                    </div>
                    <p class="mb-1">${data.comentario}</p>
                </div>
            `;
            
            if (comentariosList.innerHTML.includes('Sé el primero en comentar')) {
                comentariosList.innerHTML = nuevoComentario;
            } else {
                comentariosList.insertAdjacentHTML('afterbegin', nuevoComentario);
            }

            // Actualizar el contador de comentarios en la publicación
            const contadorElement = document.querySelector(`.comentarios-count-${currentPublicacionId}`);
            const contadorActual = parseInt(contadorElement.textContent);
            contadorElement.textContent = contadorActual + 1;

            // Limpiar el input
            comentarioInput.value = '';
        } else {
            alert('Error al agregar el comentario');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al agregar el comentario');
    })
    .finally(() => {
        submitButton.disabled = false;
    });
});

// Función para mostrar el modal de compra/alquiler
function mostrarModalCompra(publicacionId, tipo) {
    // Obtener los datos de la publicación
    const publicacionCard = document.querySelector(`[data-publicacion-id="${publicacionId}"]`).closest('.card');
    const imagen = publicacionCard.querySelector('.card-img-top').src;
    const titulo = publicacionCard.querySelector('.card-title').textContent;
    const precioTexto = publicacionCard.querySelector('.text-success').textContent;
    const precio = parseFloat(precioTexto.replace('$', ''));

    // Actualizar el modal con los datos
    document.getElementById('modalImagenPrenda').src = imagen;
    document.getElementById('modalTituloPrenda').textContent = titulo;
    document.getElementById('modalPrecioPrenda').textContent = precioTexto;
    document.getElementById('modalPublicacionId').value = publicacionId;
    document.getElementById('modalTipoOperacion').value = tipo;

    // Mostrar/ocultar campos de alquiler
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

    // Actualizar subtotal y total
    document.getElementById('subtotal').textContent = precioTexto;
    actualizarTotal();

    // Actualizar texto del botón
    document.getElementById('btnAccionTexto').textContent = tipo === 'compra' ? 'Pagar ahora' : 'Reservar y pagar';

    // Actualizar el título del modal según el tipo
    const modalTitle = document.querySelector('#modalCompra .modal-title');
    modalTitle.textContent = tipo === 'compra' ? 'Comprar Prenda' : 'Alquilar Prenda';

    // Mostrar el modal
    const modalCompra = new bootstrap.Modal(document.getElementById('modalCompra'));
    modalCompra.show();
}

// Función para actualizar el total
function actualizarTotal() {
    const subtotalTexto = document.getElementById('subtotal').textContent;
    const subtotal = parseFloat(subtotalTexto.replace('$', ''));
    const envio = 5.00;
    let total = subtotal + envio;

    // Agregar depósito si es alquiler
    if (document.getElementById('modalTipoOperacion').value === 'alquiler') {
        const depositoTexto = document.getElementById('deposito').textContent;
        const deposito = parseFloat(depositoTexto.replace('$', ''));
        total += deposito;
    }

    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
}

// Manejar el envío del formulario
document.getElementById('formCompraAlquiler').addEventListener('submit', function(e) {
    e.preventDefault();
    const tipo = document.getElementById('modalTipoOperacion').value;
    const publicacionId = document.getElementById('modalPublicacionId').value;
    const direccion = document.getElementById('direccion').value;
    const metodoPago = document.querySelector('input[name="metodoPago"]:checked').value;

    let data = {
        publicacion_id: publicacionId,
        tipo: tipo,
        direccion: direccion,
        metodo_pago: metodoPago
    };

    if (tipo === 'alquiler') {
        data.fecha_inicio = document.getElementById('fechaInicio').value;
        data.fecha_fin = document.getElementById('fechaFin').value;
    }

    // Aquí iría la llamada al backend para procesar la compra/alquiler
    console.log('Datos del formulario:', data);
    alert('Funcionalidad en desarrollo. Los datos han sido registrados.');
    
    // Cerrar el modal
    const modalCompra = bootstrap.Modal.getInstance(document.getElementById('modalCompra'));
    modalCompra.hide();
});

// Validar fechas de alquiler
document.getElementById('fechaInicio').addEventListener('change', function() {
    const fechaInicio = new Date(this.value);
    const fechaFinInput = document.getElementById('fechaFin');
    fechaFinInput.min = this.value;
    
    if (fechaFinInput.value && new Date(fechaFinInput.value) <= fechaInicio) {
        fechaFinInput.value = '';
    }
});

// Establecer fecha mínima para inicio de alquiler
document.getElementById('fechaInicio').min = new Date().toISOString().split('T')[0];

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function toggleLike(publicacionId) {
    fetch(`/inicio/api/likes/${publicacionId}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        const likeBtn = document.querySelector(`button[onclick="toggleLike(${publicacionId})"]`);
        const likeIcon = likeBtn.querySelector('i');
        const likesCount = likeBtn.querySelector('.likes-count');
        
        if (data.status === 'added') {
            likeBtn.classList.add('active');
            likeIcon.classList.add('text-white');
            if (likesCount) {
                likesCount.textContent = parseInt(likesCount.textContent || '0') + 1;
            }
        } else {
            likeBtn.classList.remove('active');
            likeIcon.classList.remove('text-white');
            if (likesCount) {
                likesCount.textContent = parseInt(likesCount.textContent || '0') - 1;
            }
        }
        
        // Actualizar el contador en el navbar
        const navLikeCount = document.querySelector('.nav-link .badge.bg-primary');
        if (navLikeCount) {
            const currentCount = parseInt(navLikeCount.textContent || '0');
            navLikeCount.textContent = data.status === 'added' ? currentCount + 1 : currentCount - 1;
            navLikeCount.style.display = navLikeCount.textContent === '0' ? 'none' : 'inline';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Hubo un error al procesar tu like. Por favor, intenta de nuevo.');
    });
}

function toggleFavorito(publicacionId) {
    fetch(`/inicio/api/favoritos/${publicacionId}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        const favBtn = document.querySelector(`button[onclick="toggleFavorito(${publicacionId})"]`);
        const favIcon = favBtn.querySelector('i');
        
        if (data.status === 'added') {
            favBtn.classList.add('active');
            favIcon.classList.add('text-white');
        } else {
            favBtn.classList.remove('active');
            favIcon.classList.remove('text-white');
        }
        
        // Actualizar el contador en el navbar
        const navFavCount = document.querySelector('.nav-link .badge.bg-danger');
        if (navFavCount) {
            const currentCount = parseInt(navFavCount.textContent || '0');
            navFavCount.textContent = data.status === 'added' ? currentCount + 1 : currentCount - 1;
            navFavCount.style.display = navFavCount.textContent === '0' ? 'none' : 'inline';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Hubo un error al procesar tu favorito. Por favor, intenta de nuevo.');
    });
}
