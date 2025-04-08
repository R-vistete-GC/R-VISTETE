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
                // Verificar elementos del DOM
                const elementos = {
                    publicacionId: document.getElementById('publicacionId'),
                    tipoOperacion: document.getElementById('tipoOperacion'),
                    imagenElement: document.getElementById('modalImagenPrenda'),
                    tituloElement: document.getElementById('modalTituloPrenda'),
                    precioElement: document.getElementById('modalPrecioPrenda'),
                    subtotalElement: document.getElementById('subtotal'),
                    totalElement: document.getElementById('total'),
                    camposAlquiler: document.getElementById('camposAlquiler'),
                    depositoRow: document.getElementById('depositoRow'),
                    btnAccionTexto: document.getElementById('btnAccionTexto'),
                    modalElement: document.getElementById('modalCompra'),
                    formElement: document.getElementById('formCompraAlquiler')
                };

                console.log('Estado de los elementos del DOM:', 
                    Object.entries(elementos)
                        .map(([key, element]) => `${key}: ${element ? 'Encontrado' : 'No encontrado'}`)
                        .join('\n')
                );

                if (!elementos.modalElement) {
                    console.error('Error: No se encontró el modal');
                    return;
                }

                // Actualizar valores
                if (elementos.publicacionId) elementos.publicacionId.value = publicacionId;
                if (elementos.tipoOperacion) elementos.tipoOperacion.value = tipo;
                
                if (elementos.imagenElement) {
                    elementos.imagenElement.src = data.imagen;
                    console.log('Imagen actualizada:', data.imagen);
                }
                
                if (elementos.tituloElement) {
                    elementos.tituloElement.textContent = data.titulo;
                    console.log('Título actualizado:', data.titulo);
                }
                
                if (elementos.precioElement) {
                    elementos.precioElement.textContent = `$${data.precio}`;
                    console.log('Precio actualizado:', data.precio);
                }

                // Actualizar subtotal y total
                const precioBase = parseFloat(data.precio);
                const costoEnvio = 5.00;
                
                if (elementos.subtotalElement) {
                    elementos.subtotalElement.textContent = `$${precioBase.toFixed(2)}`;
                    console.log('Subtotal actualizado:', precioBase.toFixed(2));
                }

                let total = precioBase + costoEnvio;
                
                // Manejar campos específicos según el tipo
                if (tipo === 'alquiler') {
                    if (elementos.camposAlquiler) elementos.camposAlquiler.style.display = 'block';
                    if (elementos.depositoRow) {
                        elementos.depositoRow.style.display = 'flex';
                        const deposito = parseFloat(data.deposito);
                        total += deposito;
                        console.log('Total con depósito:', total.toFixed(2));
                    }
                    if (elementos.btnAccionTexto) elementos.btnAccionTexto.textContent = 'Alquilar ahora';
                } else {
                    if (elementos.camposAlquiler) elementos.camposAlquiler.style.display = 'none';
                    if (elementos.depositoRow) elementos.depositoRow.style.display = 'none';
                    if (elementos.btnAccionTexto) elementos.btnAccionTexto.textContent = 'Comprar ahora';
                }

                if (elementos.totalElement) {
                    elementos.totalElement.textContent = `$${total.toFixed(2)}`;
                    console.log('Total actualizado:', total.toFixed(2));
                }

                // Mostrar el modal
                console.log('Mostrando modal...');
                const modal = new bootstrap.Modal(elementos.modalElement);
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
            .then(response => response.json())
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
                        confirmButtonText: 'Aceptar'
                    }).then(() => {
                        window.location.reload();
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