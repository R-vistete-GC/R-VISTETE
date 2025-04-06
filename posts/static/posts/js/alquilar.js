document.addEventListener('DOMContentLoaded', function() {
    const modalAlquilar = document.getElementById('modalAlquilar');
    const alquilerForm = document.getElementById('alquilerForm');
    const btnConfirmarAlquiler = document.getElementById('btnConfirmarAlquiler');
    const spinnerAlquiler = btnConfirmarAlquiler.querySelector('.spinner-border');
    
    let precioBase = 0;
    let publicacionActual = null;

    // Función para formatear precio en COP
    function formatearPrecioCOP(precio) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(precio);
    }

    // Función para calcular días entre fechas
    function calcularDias(fechaInicio, fechaFin) {
        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaFin);
        const diferencia = fin.getTime() - inicio.getTime();
        return Math.ceil(diferencia / (1000 * 3600 * 24));
    }

    // Función para actualizar el resumen del alquiler
    function actualizarResumen() {
        const fechaInicio = document.getElementById('fechaInicio').value;
        const fechaFin = document.getElementById('fechaFin').value;
        
        if (fechaInicio && fechaFin && precioBase > 0) {
            const dias = calcularDias(fechaInicio, fechaFin);
            if (dias > 0) {
                const subtotal = precioBase * dias;
                const deposito = precioBase * 0.5; // 50% del precio base como depósito
                const total = subtotal + deposito;

                document.getElementById('precioPorDia').textContent = formatearPrecioCOP(precioBase);
                document.getElementById('diasAlquiler').textContent = dias;
                document.getElementById('depositoSeguridad').textContent = formatearPrecioCOP(deposito);
                document.getElementById('totalPagar').textContent = formatearPrecioCOP(total);
            }
        }
    }

    // Event listener para cuando se abre el modal
    if (modalAlquilar) {
        modalAlquilar.addEventListener('show.bs.modal', function(event) {
            console.log('Modal alquiler abriendo...');
            const button = event.relatedTarget;
            if (!button) {
                console.log('No se encontró el botón que activó el modal');
                return;
            }

            // Obtener datos de la publicación del botón
            const publicacionId = button.getAttribute('data-publicacion-id');
            const titulo = button.getAttribute('data-titulo');
            const precio = parseFloat(button.getAttribute('data-precio'));
            const imagen = button.getAttribute('data-imagen');

            console.log('Datos obtenidos del botón:', {
                publicacionId,
                titulo,
                precio,
                imagen
            });

            // Actualizar la información en el modal
            const prendaImagen = document.getElementById('prendaImagenAlquiler');
            const prendaTitulo = document.getElementById('prendaTituloAlquiler');
            const prendaPrecio = document.getElementById('prendaPrecioAlquiler');
            const publicacionIdInput = document.getElementById('publicacionIdAlquiler');

            console.log('Elementos del modal:', {
                prendaImagen: !!prendaImagen,
                prendaTitulo: !!prendaTitulo,
                prendaPrecio: !!prendaPrecio,
                publicacionIdInput: !!publicacionIdInput
            });

            if (prendaImagen) {
                prendaImagen.src = imagen;
                console.log('Imagen actualizada:', imagen);
            }
            if (prendaTitulo) prendaTitulo.textContent = titulo;
            if (prendaPrecio) prendaPrecio.textContent = formatearPrecioCOP(precio) + ' por día';
            if (publicacionIdInput) publicacionIdInput.value = publicacionId;

            precioBase = precio;
            
            // Establecer fecha mínima como hoy
            const today = new Date().toISOString().split('T')[0];
            const fechaInicio = document.getElementById('fechaInicio');
            const fechaFin = document.getElementById('fechaFin');
            
            if (fechaInicio) fechaInicio.min = today;
            if (fechaFin) fechaFin.min = today;
            
            // Limpiar el formulario
            alquilerForm.reset();
            actualizarResumen();
        });
    } else {
        console.log('No se encontró el modal de alquiler');
    }

    // Event listeners para actualizar el resumen cuando cambian las fechas
    document.getElementById('fechaInicio')?.addEventListener('change', actualizarResumen);
    document.getElementById('fechaFin')?.addEventListener('change', actualizarResumen);

    // Event listener para el botón de confirmar alquiler
    if (btnConfirmarAlquiler) {
        btnConfirmarAlquiler.addEventListener('click', async function(e) {
            e.preventDefault();
            
            // Validar el formulario
            if (!alquilerForm.checkValidity()) {
                alquilerForm.reportValidity();
                return;
            }

            // Validar las fechas
            const fechaInicio = document.getElementById('fechaInicio').value;
            const fechaFin = document.getElementById('fechaFin').value;
            if (new Date(fechaFin) <= new Date(fechaInicio)) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error en las fechas',
                    text: 'La fecha de devolución debe ser posterior a la fecha de inicio'
                });
                return;
            }

            // Mostrar spinner y deshabilitar botón
            spinnerAlquiler.classList.remove('d-none');
            btnConfirmarAlquiler.disabled = true;

            try {
                const formData = new FormData(alquilerForm);
                const response = await fetch('/procesar_alquiler/', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });

                const data = await response.json();

                if (data.success) {
                    // Cerrar modal y mostrar mensaje de éxito
                    const modalInstance = bootstrap.Modal.getInstance(modalAlquilar);
                    modalInstance.hide();
                    
                    Swal.fire({
                        icon: 'success',
                        title: '¡Alquiler Confirmado!',
                        text: data.message,
                        showConfirmButton: true
                    }).then((result) => {
                        if (result.isConfirmed) {
                            window.location.href = '/mis_alquileres/';
                        }
                    });
                } else {
                    throw new Error(data.message || 'Error al procesar el alquiler');
                }
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.message || 'Ocurrió un error al procesar el alquiler'
                });
            } finally {
                // Ocultar spinner y habilitar botón
                spinnerAlquiler.classList.add('d-none');
                btnConfirmarAlquiler.disabled = false;
            }
        });
    }
}); 