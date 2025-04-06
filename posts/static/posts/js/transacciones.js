// Función para calcular días entre dos fechas
function calcularDias(fechaInicio, fechaFin) {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const diferencia = fin.getTime() - inicio.getTime();
    return Math.ceil(diferencia / (1000 * 3600 * 24));
}

// Función para actualizar el resumen del alquiler
function actualizarResumenAlquiler() {
    const fechaInicio = document.getElementById('fechaInicio').value;
    const fechaFin = document.getElementById('fechaFin').value;
    
    if (fechaInicio && fechaFin) {
        const dias = calcularDias(fechaInicio, fechaFin);
        if (dias < 0) {
            alert('La fecha de devolución debe ser posterior a la fecha de inicio');
            document.getElementById('fechaFin').value = '';
            return;
        }
        
        const precioDia = parseFloat(document.getElementById('alquilerPrecioDia').textContent.replace('€', ''));
        const deposito = parseFloat(document.getElementById('alquilerDeposito').textContent.replace('€', ''));
        
        const subtotal = dias * precioDia;
        const total = subtotal + deposito;
        
        document.getElementById('alquilerDiasTotales').textContent = dias;
        document.getElementById('alquilerSubtotal').textContent = subtotal.toFixed(2) + '€';
        document.getElementById('alquilerTotal').textContent = total.toFixed(2) + '€';
    }
}

// Event listeners para las fechas
document.addEventListener('DOMContentLoaded', function() {
    const fechaInicio = document.getElementById('fechaInicio');
    const fechaFin = document.getElementById('fechaFin');
    
    if (fechaInicio && fechaFin) {
        fechaInicio.addEventListener('change', actualizarResumenAlquiler);
        fechaFin.addEventListener('change', actualizarResumenAlquiler);
    }

    // Modal de Compra
    const modalCompra = document.getElementById('modalCompra');
    if (modalCompra) {
        modalCompra.addEventListener('show.bs.modal', function (event) {
            // Botón que activó el modal
            const button = event.relatedTarget;
            
            // Obtener información de la publicación directamente del botón
            const publicacionId = button.getAttribute('data-publicacion-id');
            const precio = button.getAttribute('data-precio');
            const imagen = button.getAttribute('data-imagen');
            const titulo = button.getAttribute('data-titulo');
            
            // Actualizar el modal con la información
            document.getElementById('compraPublicacionId').value = publicacionId;
            document.getElementById('compraImagenPreview').src = imagen;
            document.getElementById('compraTitulo').textContent = titulo;
            document.getElementById('compraPrecio').textContent = `$${precio}`;
        });

        // Manejar el envío del formulario de compra
        const compraForm = document.getElementById('compraForm');
        compraForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            
            fetch('/inicio/comprar/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Cerrar el modal
                    const modal = bootstrap.Modal.getInstance(modalCompra);
                    modal.hide();
                    
                    // Mostrar mensaje de éxito
                    Swal.fire({
                        title: '¡Compra exitosa!',
                        text: 'Tu compra se ha realizado correctamente',
                        icon: 'success',
                        confirmButtonText: 'Aceptar'
                    }).then(() => {
                        // Recargar la página o actualizar la UI según sea necesario
                        window.location.reload();
                    });
                } else {
                    // Mostrar mensaje de error
                    Swal.fire({
                        title: 'Error',
                        text: data.message || 'Ha ocurrido un error al procesar tu compra',
                        icon: 'error',
                        confirmButtonText: 'Aceptar'
                    });
                }
            })
            .catch(error => {
                console.error('Error:', error);
                Swal.fire({
                    title: 'Error',
                    text: 'Ha ocurrido un error al procesar tu compra',
                    icon: 'error',
                    confirmButtonText: 'Aceptar'
                });
            });
        });
    }
}); 