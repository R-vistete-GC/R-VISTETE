let currentPublicacionId = null;
let comentariosModal;

// Asegurar que el modal se inicialice después de que el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    comentariosModal = new bootstrap.Modal(document.getElementById('comentariosModal'));
    
    // Inicialización de tooltips para las barras de sentimiento
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl, {
            trigger: 'hover'
        });
    });
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
                    <small>ChatGPT: ${comentario.sentimiento_chatgpt}</small><br>
                    <small>TextBlob: ${comentario.sentimiento_textblob}</small>
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

    // Mostrar/ocultar campos según el tipo de operación
    const camposAlquiler = document.getElementById('camposAlquiler');
    const depositoRow = document.getElementById('depositoRow');
    const preciosPorDia = document.getElementById('preciosPorDia');
    const diasAlquiler = document.getElementById('diasAlquiler');

    if (tipo === 'alquiler') {
        camposAlquiler.style.display = 'block';
        depositoRow.style.display = 'flex';
        preciosPorDia.style.display = 'flex';
        diasAlquiler.style.display = 'flex';
        
        // Configurar precio por día y depósito
        document.getElementById('precioPorDia').textContent = precioTexto;
        document.getElementById('deposito').textContent = `$${(precio * 0.5).toFixed(2)}`;
        
        // Resetear y configurar fechas
        const fechaInicio = document.getElementById('fechaInicio');
        const fechaFin = document.getElementById('fechaFin');
        const hoy = new Date();
        
        fechaInicio.min = hoy.toISOString().split('T')[0];
        fechaInicio.value = '';
        fechaFin.value = '';
        
        // Limpiar campos adicionales
        document.getElementById('instruccionesDevolucion').value = '';
        document.getElementById('terminosCheck').checked = false;
    } else {
        camposAlquiler.style.display = 'none';
        depositoRow.style.display = 'none';
        preciosPorDia.style.display = 'none';
        diasAlquiler.style.display = 'none';
    }

    // Actualizar subtotal y total
    document.getElementById('subtotal').textContent = precioTexto;
    actualizarTotal();

    // Actualizar texto del botón y título
    document.getElementById('btnAccionTexto').textContent = tipo === 'compra' ? 'Pagar ahora' : 'Reservar y pagar';
    const modalTitle = document.querySelector('#modalCompra .modal-title');
    modalTitle.textContent = tipo === 'compra' ? 'Comprar Prenda' : 'Alquilar Prenda';

    // Mostrar el modal
    const modalCompra = new bootstrap.Modal(document.getElementById('modalCompra'));
    modalCompra.show();
}

// Función para calcular días entre fechas
function calcularDias(fechaInicio, fechaFin) {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const diferencia = fin - inicio;
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
}

// Función para actualizar el total
function actualizarTotal() {
    const subtotalTexto = document.getElementById('subtotal').textContent;
    const subtotal = parseFloat(subtotalTexto.replace('$', ''));
    const envio = 5.00;
    let total = subtotal + envio;

    if (document.getElementById('modalTipoOperacion').value === 'alquiler') {
        const fechaInicio = document.getElementById('fechaInicio').value;
        const fechaFin = document.getElementById('fechaFin').value;
        
        if (fechaInicio && fechaFin) {
            const dias = calcularDias(fechaInicio, fechaFin);
            if (dias > 0) {
                document.getElementById('numeroDias').textContent = dias;
                const precioPorDia = subtotal;
                const subtotalAlquiler = precioPorDia * dias;
                const deposito = subtotal * 0.5;
                
                document.getElementById('subtotal').textContent = `$${subtotalAlquiler.toFixed(2)}`;
                total = subtotalAlquiler + envio + deposito;
            }
        }
    }

    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
}

// Validar fechas de alquiler
document.getElementById('fechaInicio').addEventListener('change', function() {
    const fechaInicio = new Date(this.value);
    const fechaFinInput = document.getElementById('fechaFin');
    fechaFinInput.min = this.value;
    
    if (fechaFinInput.value && new Date(fechaFinInput.value) <= fechaInicio) {
        fechaFinInput.value = '';
    }
    
    actualizarTotal();
});

document.getElementById('fechaFin').addEventListener('change', function() {
    actualizarTotal();
});

// Manejar el envío del formulario
document.getElementById('formCompraAlquiler').addEventListener('submit', function(e) {
    e.preventDefault();
    const tipo = document.getElementById('modalTipoOperacion').value;
    const publicacionId = document.getElementById('modalPublicacionId').value;
    const direccion = document.getElementById('direccion').value;
    const metodoPago = document.querySelector('input[name="metodoPago"]:checked').value;
    const notas = document.getElementById('notas').value;

    if (!document.getElementById('terminosCheck').checked) {
        alert('Debes aceptar los términos y condiciones para continuar.');
        return;
    }

    let data = {
        publicacion_id: publicacionId,
        tipo: tipo,
        direccion: direccion,
        metodo_pago: metodoPago,
        notas: notas
    };

    if (tipo === 'alquiler') {
        const fechaInicio = document.getElementById('fechaInicio').value;
        const fechaFin = document.getElementById('fechaFin').value;
        const instruccionesDevolucion = document.getElementById('instruccionesDevolucion').value;

        if (!fechaInicio || !fechaFin) {
            alert('Las fechas son obligatorias para el alquiler.');
            return;
        }

        const dias = calcularDias(fechaInicio, fechaFin);
        if (dias <= 0) {
            alert('El período de alquiler debe ser de al menos un día.');
            return;
        }

        Object.assign(data, {
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            instrucciones_devolucion: instruccionesDevolucion,
            dias_alquiler: dias,
            terminos_aceptados: true
        });
    }

    // Enviar datos al servidor
    fetch('/inicio/procesar-operacion/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            const modalCompra = bootstrap.Modal.getInstance(document.getElementById('modalCompra'));
            modalCompra.hide();
            // Opcional: recargar la página o actualizar la UI
            window.location.reload();
        } else {
            alert(data.error || 'Hubo un error al procesar la operación.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Hubo un error al procesar la operación. Por favor, intenta de nuevo.');
    });
});

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
    fetch(`/posts/toggle_like/${publicacionId}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        const button = document.querySelector(`button[data-publicacion-id="${publicacionId}"]`);
        
        if (data.liked) {
            button.classList.remove('btn-outline-primary');
            button.classList.add('btn-primary');
        } else {
            button.classList.remove('btn-primary');
            button.classList.add('btn-outline-primary');
        }
        
        // Actualizar el contador
        const text = button.textContent;
        button.innerHTML = `<i class="fas fa-thumbs-up"></i> ${data.count}`;
    });
}

function toggleFavorito(publicacionId) {
    fetch(`/posts/toggle_favorito/${publicacionId}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        const button = document.querySelector(`button[data-publicacion-id="${publicacionId}"]`);
        
        if (data.favorited) {
            button.classList.remove('btn-outline-danger');
            button.classList.add('btn-danger');
        } else {
            button.classList.remove('btn-danger');
            button.classList.add('btn-outline-danger');
        }
        
        // Actualizar el contador
        const text = button.textContent;
        button.innerHTML = `<i class="fas fa-heart"></i> ${data.count}`;
    });
}

// Función para resaltar y hacer scroll a una publicación específica
document.addEventListener('DOMContentLoaded', function() {
    // Obtener el ID de la publicación de la URL si existe
    const urlParams = new URLSearchParams(window.location.search);
    const publicacionId = urlParams.get('publicacion');

    if (publicacionId) {
        const publicacionCard = document.querySelector(`[data-publicacion-id="${publicacionId}"]`);
        if (publicacionCard) {
            // Hacer scroll a la publicación
            publicacionCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Resaltar la publicación temporalmente
            publicacionCard.style.transition = 'all 0.3s ease';
            publicacionCard.style.boxShadow = '0 0 20px rgba(0, 123, 255, 0.5)';
            publicacionCard.style.transform = 'scale(1.02)';
            
            // Quitar el resaltado después de un momento
            setTimeout(() => {
                publicacionCard.style.boxShadow = '';
                publicacionCard.style.transform = '';
            }, 2000);
        }
    }
});
