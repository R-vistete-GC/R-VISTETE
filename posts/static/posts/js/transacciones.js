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

// Event listeners para las fechas y modales
document.addEventListener('DOMContentLoaded', function() {
    const fechaInicio = document.getElementById('fechaInicio');
    const fechaFin = document.getElementById('fechaFin');
    
    if (fechaInicio && fechaFin) {
        fechaInicio.addEventListener('change', validarFechas);
        fechaFin.addEventListener('change', validarFechas);
    }

    // Modal de Alquiler
    const modalAlquiler = document.getElementById('modalAlquilar');
    if (modalAlquiler) {
        modalAlquiler.addEventListener('show.bs.modal', function (event) {
            // Botón que activó el modal
            const button = event.relatedTarget;
            
            // Obtener información de la publicación
            const publicacionId = button.getAttribute('data-publicacion-id');
            const precio = parseFloat(button.getAttribute('data-precio'));
            const imagen = button.getAttribute('data-imagen');
            const titulo = button.getAttribute('data-titulo');
            
            console.log('Datos de la publicación:', { publicacionId, precio, imagen, titulo });

            // Actualizar el modal con la información
            const alquilerPublicacionId = document.getElementById('alquilerPublicacionId');
            const alquilerImagenPreview = document.getElementById('alquilerImagenPreview');
            const alquilerTitulo = document.getElementById('alquilerTitulo');
            const alquilerPrecio = document.getElementById('alquilerPrecio');
            const alquilerDeposito = document.getElementById('alquilerDeposito');
            const alquilerTotal = document.getElementById('alquilerTotal');

            if (alquilerPublicacionId) alquilerPublicacionId.value = publicacionId;
            if (alquilerImagenPreview) alquilerImagenPreview.src = imagen;
            if (alquilerTitulo) alquilerTitulo.textContent = titulo;
            
            // Actualizar precios
            if (alquilerPrecio) alquilerPrecio.textContent = `$${precio.toFixed(2)}`;
            if (alquilerDeposito) alquilerDeposito.textContent = `$${precio.toFixed(2)}`;
            if (alquilerTotal) alquilerTotal.textContent = `$${(precio * 2).toFixed(2)}`;

            // Resetear el formulario
            document.getElementById('alquilerForm').reset();
            document.getElementById('fechaInicio').min = new Date().toISOString().split('T')[0];
        });

        // Manejar el envío del formulario de alquiler
        const alquilerForm = document.getElementById('alquilerForm');
        if (alquilerForm) {
            alquilerForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                if (!validarFechas()) {
                    return;
                }

                const formData = new FormData(this);
                
                fetch('/inicio/alquilar/', {
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
                        const modal = bootstrap.Modal.getInstance(modalAlquiler);
                        modal.hide();
                        
                        // Mostrar mensaje de éxito
                        Swal.fire({
                            title: '¡Alquiler confirmado!',
                            text: data.message || 'Tu alquiler se ha procesado correctamente',
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
                            text: data.message || 'Ha ocurrido un error al procesar tu alquiler',
                            icon: 'error',
                            confirmButtonText: 'Aceptar'
                        });
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    Swal.fire({
                        title: 'Error',
                        text: 'Ha ocurrido un error al procesar tu alquiler',
                        icon: 'error',
                        confirmButtonText: 'Aceptar'
                    });
                });
            });
        }
    }

    // Modal de Compra
    const modalCompra = document.getElementById('modalCompra');
    if (modalCompra) {
        modalCompra.addEventListener('show.bs.modal', function (event) {
            // Botón que activó el modal
            const button = event.relatedTarget;
            
            // Obtener información de la publicación
            const publicacionId = button.getAttribute('data-publicacion-id');
            const precio = button.getAttribute('data-precio');
            const imagen = button.getAttribute('data-imagen');
            const titulo = button.getAttribute('data-titulo');
            
            console.log('Datos de la publicación:', { publicacionId, precio, imagen, titulo });
            
            // Actualizar el modal con la información
            document.getElementById('compraPublicacionId').value = publicacionId;
            document.getElementById('compraImagenPreview').src = imagen;
            document.getElementById('compraTitulo').textContent = titulo;
            document.getElementById('compraPrecio').textContent = `$${precio}`;

            // Resetear el formulario
            document.getElementById('compraForm').reset();
        });

        // Manejar el envío del formulario de compra
        const compraForm = document.getElementById('compraForm');
        if (compraForm) {
            compraForm.addEventListener('submit', function(e) {
                e.preventDefault();

                // Validar campos requeridos
                const metodoPago = document.getElementById('metodoPago').value;
                const direccionEnvio = document.getElementById('direccionEnvio').value;

                if (!metodoPago || !direccionEnvio) {
                    Swal.fire({
                        title: 'Error',
                        text: 'Por favor completa todos los campos requeridos',
                        icon: 'error'
                    });
                    return;
                }

                // Deshabilitar el botón y mostrar indicador de carga
                const submitButton = this.querySelector('button[type="submit"]');
                const originalText = submitButton.innerHTML;
                submitButton.disabled = true;
                submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Procesando...';

                // Enviar formulario
                const formData = new FormData(this);
                
                fetch('/inicio/comprar/', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                    }
                })
                .then(response => response.json().then(data => ({ status: response.status, data })))
                .then(({ status, data }) => {
                    if (status === 401) {
                        // Usuario no autenticado
                        window.location.href = '/users/login/';
                        return;
                    }
                    
                    if (data.success) {
                        // Cerrar el modal
                        const modal = bootstrap.Modal.getInstance(modalCompra);
                        modal.hide();
                        
                        // Mostrar mensaje de éxito
                        Swal.fire({
                            title: '¡Compra exitosa!',
                            text: data.message,
                            icon: 'success',
                            confirmButtonText: 'Ver mis compras',
                            showCancelButton: true,
                            cancelButtonText: 'Cerrar'
                        }).then((result) => {
                            if (result.isConfirmed) {
                                window.location.href = '/compras/mis-compras/';
                            } else {
                                window.location.reload();
                            }
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
                })
                .finally(() => {
                    // Restaurar el botón
                    submitButton.disabled = false;
                    submitButton.innerHTML = originalText;
                });
            });
        }
    }
});

// Función para validar las fechas
function validarFechas() {
    const fechaInicio = document.getElementById('fechaInicio');
    const fechaFin = document.getElementById('fechaFin');
    
    if (!fechaInicio || !fechaFin || !fechaInicio.value || !fechaFin.value) {
        return false;
    }

    const inicio = new Date(fechaInicio.value);
    const fin = new Date(fechaFin.value);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (inicio < hoy) {
        Swal.fire({
            title: 'Error',
            text: 'La fecha de inicio no puede ser anterior a hoy',
            icon: 'error'
        });
        fechaInicio.value = '';
        return false;
    }

    if (fin <= inicio) {
        Swal.fire({
            title: 'Error',
            text: 'La fecha de devolución debe ser posterior a la fecha de inicio',
            icon: 'error'
        });
        fechaFin.value = '';
        return false;
    }

    return true;
} 