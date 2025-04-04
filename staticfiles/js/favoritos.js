function quitarFavorito(publicacionId, button) {
    if (!confirm('¿Estás seguro de que quieres quitar esta prenda de tus favoritos?')) {
        return;
    }

    fetch(`/inicio/api/favoritos/${publicacionId}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
        },
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'removed') {
            // Eliminar la tarjeta con una animación
            const card = button.closest('.col-md-4');
            card.style.transition = 'all 0.3s ease';
            card.style.opacity = '0';
            card.style.transform = 'scale(0.8)';
            setTimeout(() => {
                card.remove();
                // Si no quedan favoritos, recargar la página
                if (document.querySelectorAll('.col-md-4').length === 0) {
                    window.location.reload();
                }
            }, 300);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Hubo un error al quitar el favorito. Por favor, intenta de nuevo.');
    });
}

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

function mostrarModalCompra(publicacionId, tipo) {
    // Obtener la tarjeta de la publicación
    const publicacionCard = document.querySelector(`.card[data-publicacion-id="${publicacionId}"]`);
    if (!publicacionCard) return;

    // Obtener información de la publicación
    const imagen = publicacionCard.querySelector('img').src;
    const titulo = publicacionCard.querySelector('.card-title').textContent;
    const precio = publicacionCard.querySelector('.text-primary').textContent.replace('$', '');

    if (tipo === 'compra') {
        // Actualizar el modal de compra
        document.getElementById('modalImagenPrendaFavoritos').src = imagen;
        document.getElementById('modalTituloPrendaFavoritos').textContent = titulo;
        document.getElementById('modalPrecioPrendaFavoritos').textContent = precio;
        document.getElementById('modalPublicacionIdFavoritos').value = publicacionId;
        
        // Actualizar subtotal y total
        document.getElementById('subtotalFavoritos').textContent = `$${precio}`;
        document.getElementById('totalFavoritos').textContent = `$${(parseFloat(precio) + 5.00).toFixed(2)}`;
    } else {
        // Actualizar el modal de alquiler
        document.getElementById('modalImagenPrendaAlquilerFavoritos').src = imagen;
        document.getElementById('modalTituloPrendaAlquilerFavoritos').textContent = titulo;
        document.getElementById('modalPrecioPrendaAlquilerFavoritos').textContent = precio;
        document.getElementById('modalPublicacionIdAlquilerFavoritos').value = publicacionId;
        
        // Calcular y mostrar el depósito (50% del precio)
        const precioBase = parseFloat(precio);
        const deposito = precioBase * 0.5;
        const precioPorDia = precioBase * 0.1;
        
        document.getElementById('precioPorDiaFavoritos').textContent = `$${precioPorDia.toFixed(2)}`;
        document.getElementById('depositoFavoritos').textContent = `$${deposito.toFixed(2)}`;
        
        // Configurar fechas
        const fechaInicio = document.getElementById('fechaInicioFavoritos');
        const fechaFin = document.getElementById('fechaFinFavoritos');
        
        fechaInicio.min = new Date().toISOString().split('T')[0];
        fechaInicio.value = '';
        fechaFin.value = '';
        
        actualizarTotalAlquiler();
    }
}

function calcularDias() {
    const fechaInicio = new Date(document.getElementById('fechaInicioFavoritos').value);
    const fechaFin = new Date(document.getElementById('fechaFinFavoritos').value);
    
    if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
        return 0;
    }
    
    const diferencia = fechaFin - fechaInicio;
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24)) + 1;
}

function actualizarTotalAlquiler() {
    const precioBase = parseFloat(document.getElementById('modalPrecioPrendaAlquilerFavoritos').textContent.replace('$', ''));
    const precioPorDia = precioBase * 0.1;
    const deposito = precioBase * 0.5;
    const dias = calcularDias();
    
    document.getElementById('numeroDiasFavoritos').textContent = dias;
    
    const subtotalAlquiler = precioPorDia * dias;
    document.getElementById('subtotalAlquilerFavoritos').textContent = `$${subtotalAlquiler.toFixed(2)}`;
    
    const total = subtotalAlquiler + deposito + 5.00; // Incluir envío
    document.getElementById('totalAlquilerFavoritos').textContent = `$${total.toFixed(2)}`;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Event listeners para fechas de alquiler
    const fechaInicio = document.getElementById('fechaInicioFavoritos');
    const fechaFin = document.getElementById('fechaFinFavoritos');

    if (fechaInicio) {
        fechaInicio.addEventListener('change', function() {
            if (fechaFin) {
                fechaFin.min = this.value;
                if (fechaFin.value && new Date(fechaFin.value) <= new Date(this.value)) {
                    fechaFin.value = '';
                }
            }
            actualizarTotalAlquiler();
        });
    }

    if (fechaFin) {
        fechaFin.addEventListener('change', actualizarTotalAlquiler);
    }

    // Event listeners para los formularios
    const formCompra = document.getElementById('formCompraFavoritos');
    const formAlquiler = document.getElementById('formAlquilerFavoritos');

    if (formCompra) {
        formCompra.addEventListener('submit', function(e) {
            e.preventDefault();
            procesarOperacion('compra');
        });
    }

    if (formAlquiler) {
        formAlquiler.addEventListener('submit', function(e) {
            e.preventDefault();
            procesarOperacion('alquiler');
        });
    }
});

function procesarOperacion(tipo) {
    const isCompra = tipo === 'compra';
    const form = document.getElementById(isCompra ? 'formCompraFavoritos' : 'formAlquilerFavoritos');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const data = {
        publicacion_id: document.getElementById(isCompra ? 'modalPublicacionIdFavoritos' : 'modalPublicacionIdAlquilerFavoritos').value,
        tipo_operacion: tipo,
        direccion_envio: document.getElementById(isCompra ? 'direccionFavoritos' : 'direccionAlquilerFavoritos').value,
        metodo_pago: isCompra ? 
            document.querySelector('input[name="metodoPagoFavoritos"]:checked').value :
            document.querySelector('input[name="metodoPagoAlquilerFavoritos"]:checked').value,
        notas: document.getElementById(isCompra ? 'notasFavoritos' : 'instruccionesDevolucionFavoritos').value
    };

    if (!isCompra) {
        Object.assign(data, {
            fecha_inicio: document.getElementById('fechaInicioFavoritos').value,
            fecha_fin: document.getElementById('fechaFinFavoritos').value,
            deposito: parseFloat(document.getElementById('depositoFavoritos').textContent.replace('$', '')),
            dias_alquiler: calcularDias()
        });
    }

    // Enviar datos al servidor
    fetch('/procesar_compra/', {
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
            // Cerrar el modal
            const modalId = isCompra ? 'modalCompraFavoritos' : 'modalAlquilerFavoritos';
            const modal = bootstrap.Modal.getInstance(document.getElementById(modalId));
            modal.hide();
            
            // Mostrar mensaje de éxito
            Swal.fire({
                icon: 'success',
                title: '¡Operación exitosa!',
                text: isCompra ? 
                    'Tu compra se ha procesado correctamente.' : 
                    'Tu alquiler se ha registrado correctamente.',
                confirmButtonText: 'Aceptar'
            }).then(() => {
                window.location.reload();
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.message || 'Ha ocurrido un error al procesar la operación.',
                confirmButtonText: 'Aceptar'
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Ha ocurrido un error al procesar la operación.',
            confirmButtonText: 'Aceptar'
        });
    });
}


