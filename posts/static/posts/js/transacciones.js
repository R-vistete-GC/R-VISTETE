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
            
            console.log('Datos de la publicación para modal Alquiler:', { publicacionId, precio, imagen, titulo });

            // Actualizar el modal con la información usando los IDs correctos del HTML
            const inputId = document.getElementById('publicacionIdAlquiler');
            const imgPreview = document.getElementById('prendaImagenAlquiler');
            const tituloModal = document.getElementById('prendaTituloAlquiler');
            const precioDiaModal = document.getElementById('precioPorDia');
            const depositoModal = document.getElementById('depositoSeguridad');
            const totalModal = document.getElementById('totalPagar');

            if (inputId) inputId.value = publicacionId;
            if (imgPreview) imgPreview.src = imagen;
            if (tituloModal) tituloModal.textContent = titulo;
            
            // Actualizar precios (Precio alquiler = Precio, Deposito = Precio, Total = Precio * 2)
            if (precioDiaModal) precioDiaModal.textContent = `$${precio.toFixed(2)}`;
            if (depositoModal) depositoModal.textContent = `$${precio.toFixed(2)}`;
            if (totalModal) totalModal.textContent = `$${(precio * 2).toFixed(2)}`;

            // Resetear el formulario de alquiler y establecer fecha mínima
            const alquilerForm = document.getElementById('alquilerForm');
            if(alquilerForm) alquilerForm.reset();
            const fechaInicioInput = document.getElementById('fechaInicio');
            if(fechaInicioInput) fechaInicioInput.min = new Date().toISOString().split('T')[0];
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
            
            console.log('Datos de la publicación para modal Compra:', { publicacionId, precio, imagen, titulo });
            
            // Actualizar el modal con la información usando los IDs correctos del HTML
            document.getElementById('publicacionId').value = publicacionId; // ID del input oculto
            document.getElementById('modalImagenPrenda').src = imagen; // ID de la imagen
            document.getElementById('modalTituloPrenda').textContent = titulo; // ID del título
            document.getElementById('modalPrecioPrenda').textContent = `$${precio}`; // ID del precio

            // Actualizar resumen de costos (si aplica)
            const subtotalElement = document.getElementById('subtotal');
            if (subtotalElement) subtotalElement.textContent = `$${precio}`;
            const totalElement = document.getElementById('total');
            const envio = 5.00; // Asumiendo un costo de envío fijo
            if (totalElement) totalElement.textContent = `$${(parseFloat(precio) + envio).toFixed(2)}`;

            // Resetear el formulario
            const compraForm = document.getElementById('formCompraAlquiler');
            if(compraForm) compraForm.reset();
            
            // Asegurarse de que los campos de alquiler estén ocultos
            const camposAlquiler = document.getElementById('camposAlquiler');
            if (camposAlquiler) camposAlquiler.style.display = 'none';
            const depositoRow = document.getElementById('depositoRow');
            if (depositoRow) depositoRow.style.display = 'none';
            
            // Cambiar texto del botón de acción
            const btnAccionTexto = document.getElementById('btnAccionTexto');
            if (btnAccionTexto) btnAccionTexto.textContent = 'Comprar ahora';
        });

        // Manejar el envío del formulario de compra
        const compraForm = document.getElementById('formCompraAlquiler');
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

// Función para mostrar el modal de compra/alquiler
function mostrarModalCompra(publicacionId, tipo) {
    console.log('=== DEBUG: Inicio de mostrarModalCompra ===');
    console.log('Parámetros recibidos:', { publicacionId, tipo });
    
    if (!publicacionId) {
        console.error('Error: No se recibió publicacionId');
        return;
    }

    const url = `/inicio/get_publicacion/${publicacionId}/`;
    console.log('Realizando petición a:', url);
    
    fetch(url)
        .then(response => {
            console.log('Respuesta recibida del servidor:', response.status);
            if (!response.ok) {
                throw new Error(`Error en la respuesta del servidor: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Datos recibidos del servidor:', data);
            
            if (data.success) {
                // Obtener el modal y sus elementos
                const modalElement = document.getElementById('modalCompra');
                if (!modalElement) {
                    console.error('Error: No se encontró el modal');
                    return;
                }

                // Actualizar los campos del formulario
                const formElement = modalElement.querySelector('#formCompraAlquiler');
                if (formElement) {
                    const publicacionIdInput = formElement.querySelector('#publicacionId');
                    const tipoOperacionInput = formElement.querySelector('#tipoOperacion');
                    const vendedorIdInput = formElement.querySelector('#vendedorId');
                    
                    if (publicacionIdInput) publicacionIdInput.value = publicacionId;
                    if (tipoOperacionInput) tipoOperacionInput.value = tipo;
                    if (vendedorIdInput) vendedorIdInput.value = data.vendedor_id;
                }

                // Actualizar la información visual
                const imagenElement = modalElement.querySelector('#modalImagenPrenda');
                const tituloElement = modalElement.querySelector('#modalTituloPrenda');
                const precioElement = modalElement.querySelector('#modalPrecioPrenda');
                const subtotalElement = modalElement.querySelector('#subtotal');
                const totalElement = modalElement.querySelector('#total');
                const depositoRow = modalElement.querySelector('#depositoRow');
                const camposAlquiler = modalElement.querySelector('#camposAlquiler');
                const btnAccionTexto = modalElement.querySelector('#btnAccionTexto');

                if (imagenElement) {
                    imagenElement.src = data.imagen;
                    console.log('Imagen actualizada:', data.imagen);
                }
                
                if (tituloElement) {
                    tituloElement.textContent = data.titulo;
                    console.log('Título actualizado:', data.titulo);
                }
                
                if (precioElement) {
                    precioElement.textContent = `$${data.precio}`;
                    console.log('Precio actualizado:', data.precio);
                }

                // Actualizar subtotal y total
                const precioBase = parseFloat(data.precio);
                const costoEnvio = 5.00;
                
                if (subtotalElement) {
                    subtotalElement.textContent = `$${precioBase.toFixed(2)}`;
                    console.log('Subtotal actualizado:', precioBase.toFixed(2));
                }

                let total = precioBase + costoEnvio;
                
                // Manejar campos específicos según el tipo
                if (tipo === 'alquiler') {
                    if (camposAlquiler) {
                        camposAlquiler.style.display = 'block';
                        // Establecer la fecha mínima para el inicio del alquiler
                        const fechaInicio = camposAlquiler.querySelector('#fechaInicio');
                        if (fechaInicio) {
                            fechaInicio.min = new Date().toISOString().split('T')[0];
                        }
                    }
                    if (depositoRow) {
                        depositoRow.style.display = 'flex';
                        const deposito = precioBase; // El depósito es igual al precio base
                        const depositoElement = modalElement.querySelector('#deposito');
                        if (depositoElement) {
                            depositoElement.textContent = `$${deposito.toFixed(2)}`;
                        }
                        total += deposito;
                        console.log('Total con depósito:', total.toFixed(2));
                    }
                    if (btnAccionTexto) btnAccionTexto.textContent = 'Alquilar ahora';
                } else {
                    if (camposAlquiler) camposAlquiler.style.display = 'none';
                    if (depositoRow) depositoRow.style.display = 'none';
                    if (btnAccionTexto) btnAccionTexto.textContent = 'Comprar ahora';
                }

                if (totalElement) {
                    totalElement.textContent = `$${total.toFixed(2)}`;
                    console.log('Total actualizado:', total.toFixed(2));
                }

                // Mostrar el modal
                console.log('Mostrando modal...');
                const modal = new bootstrap.Modal(modalElement);
                modal.show();
            } else {
                console.error('Error en los datos recibidos:', data.message);
                Swal.fire({
                    title: 'Error',
                    text: data.message || 'No se pudieron cargar los datos de la publicación',
                    icon: 'error'
                });
            }
        })
        .catch(error => {
            console.error('Error en la petición:', error);
            Swal.fire({
                title: 'Error',
                text: 'Error al cargar los datos de la publicación',
                icon: 'error'
            });
        });
}

// Manejar el envío del formulario
document.addEventListener('DOMContentLoaded', function() {
    const formCompraAlquiler = document.getElementById('formCompraAlquiler');
    
    if (formCompraAlquiler) {
        formCompraAlquiler.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const tipoOperacion = formData.get('tipo_operacion');
            
            // Validar campos según el tipo de operación
            if (tipoOperacion === 'compra') {
                // Validar campos para compra
                const metodoPago = formData.get('metodo_pago');
                const direccionEnvio = formData.get('direccion_envio');
                
                if (!metodoPago || !direccionEnvio) {
                    Swal.fire({
                        title: 'Error',
                        text: 'Por favor completa todos los campos requeridos',
                        icon: 'error'
                    });
                    return;
                }
            } else if (tipoOperacion === 'alquiler') {
                // Validar campos adicionales para alquiler
                const fechaInicio = formData.get('fecha_inicio');
                const fechaFin = formData.get('fecha_fin');
                const metodoPago = formData.get('metodo_pago');
                const direccionEnvio = formData.get('direccion_envio');
                
                if (!fechaInicio || !fechaFin || !metodoPago || !direccionEnvio) {
                    Swal.fire({
                        title: 'Error',
                        text: 'Por favor completa todos los campos requeridos, incluyendo las fechas de alquiler',
                        icon: 'error'
                    });
                    return;
                }
                
                // Validar las fechas
                if (!validarFechas()) {
                    return;
                }
            }
            
            // Agregar campos adicionales necesarios
            const precioElement = document.getElementById('modalPrecioPrenda');
            const precio = precioElement ? parseFloat(precioElement.textContent.replace('$', '')) : 0;
            formData.append('precio_final', precio);
            
            // URL según el tipo de operación
            const url = tipoOperacion === 'alquiler' ? '/posts/procesar_alquiler/' : '/posts/procesar_compra/';
            
            // Mostrar indicador de carga
            const submitButton = this.querySelector('button[type="submit"]');
            const originalText = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Procesando...';
            
            // Enviar la solicitud
            fetch(url, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                }
            })
            .then(response => {
                if (!response.ok) {
                    if (response.status === 401) {
                        window.location.href = '/users/login/';
                        throw new Error('Por favor inicia sesión para continuar');
                    }
                    return response.json().then(data => {
                        throw new Error(data.message || 'Error en el servidor');
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // Cerrar el modal
                    const modalElement = document.getElementById('modalCompra');
                    if (modalElement) {
                        const modal = bootstrap.Modal.getInstance(modalElement);
                        if (modal) modal.hide();
                    }
                    
                    // Mostrar mensaje de éxito
                    Swal.fire({
                        title: '¡Éxito!',
                        text: data.message,
                        icon: 'success',
                        confirmButtonText: tipoOperacion === 'compra' ? 'Ver mis compras' : 'Ver mis alquileres',
                        showCancelButton: true,
                        cancelButtonText: 'Cerrar'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            window.location.href = tipoOperacion === 'compra' ? '/compras/mis-compras/' : '/alquileres/mis-alquileres/';
                        } else {
                            window.location.reload();
                        }
                    });
                } else {
                    throw new Error(data.message || 'Error al procesar la transacción');
                }
            })
            .catch(error => {
                Swal.fire({
                    title: 'Error',
                    text: error.message,
                    icon: 'error',
                    confirmButtonText: 'Aceptar'
                });
            })
            .finally(() => {
                // Restaurar el botón
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.innerHTML = originalText;
                }
            });
        });
    }
}); 