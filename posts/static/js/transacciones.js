// Función para formatear moneda
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP'
    }).format(amount);
};

// Función para calcular días entre fechas
const calcularDias = (fechaInicio, fechaFin) => {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const diferencia = fin.getTime() - inicio.getTime();
    return Math.ceil(diferencia / (1000 * 3600 * 24)) + 1; // +1 porque incluimos ambos días
};

// Manejador del modal de compra
document.addEventListener('DOMContentLoaded', function () {
    const modalCompra = document.getElementById('modalCompra');
    if (modalCompra) {
        modalCompra.addEventListener('show.bs.modal', function (event) {
            const button = event.relatedTarget; // Botón que abrió el modal
            const publicacionId = button?.getAttribute('data-publicacion-id');
            const precio = button?.getAttribute('data-precio');
            const imagen = button?.getAttribute('data-imagen');
            const titulo = button?.getAttribute('data-titulo');

            console.log('Datos de la publicación para modal Compra:', { publicacionId, precio, imagen, titulo });

            // Actualizar campos del modal
            const publicacionInput = document.getElementById('publicacionId');
            const modalImagenPrenda = document.getElementById('modalImagenPrenda');
            const modalTituloPrenda = document.getElementById('modalTituloPrenda');
            const modalPrecioPrenda = document.getElementById('modalPrecioPrenda');
            const subtotalElement = document.getElementById('subtotal');
            const totalElement = document.getElementById('total');

            if (publicacionInput) {
                publicacionInput.value = publicacionId || '';
            } else {
                console.error('El elemento publicacionId no existe');
            }

            if (modalImagenPrenda) {
                modalImagenPrenda.src = imagen || '';
            } else {
                console.error('El elemento modalImagenPrenda no existe');
            }

            if (modalTituloPrenda) {
                modalTituloPrenda.textContent = titulo || '';
            } else {
                console.error('El elemento modalTituloPrenda no existe');
            }

            if (modalPrecioPrenda) {
                modalPrecioPrenda.textContent = formatCurrency(precio || 0);
            } else {
                console.error('El elemento modalPrecioPrenda no existe');
            }

            // Calcular y mostrar el subtotal y total
            const envio = 5.00; // Costo fijo de envío
            const subtotal = parseFloat(precio || 0);
            const total = subtotal + envio;

            if (subtotalElement) {
                subtotalElement.textContent = formatCurrency(subtotal);
            } else {
                console.error('El elemento subtotal no existe');
            }

            if (totalElement) {
                totalElement.textContent = formatCurrency(total);
            } else {
                console.error('El elemento total no existe');
            }
        });

        // Manejar envío del formulario de compra
        const formCompra = document.getElementById('formCompraAlquiler');
        if (formCompra) {
            formCompra.addEventListener('submit', async function (e) {
                e.preventDefault();
                const submitButton = this.querySelector('button[type="submit"]');
                const originalText = submitButton.textContent;
                submitButton.disabled = true;
                submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Procesando...';

                try {
                    const formData = new FormData(this);
                    const response = await fetch('/posts/procesar_compra/', {
                        method: 'POST',
                        body: formData,
                        headers: {
                            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                        }
                    });

                    const data = await response.json();
                    if (response.ok) {
                        // Mostrar mensaje de éxito
                        alert(data.message || 'Compra realizada con éxito');
                        // Cerrar el modal
                        bootstrap.Modal.getInstance(modalCompra).hide();
                        // Redirigir si es necesario
                        if (data.redirect_url) {
                            window.location.href = data.redirect_url;
                        }
                    } else {
                        throw new Error(data.error || 'Error al procesar la compra');
                    }
                } catch (error) {
                    alert(error.message);
                } finally {
                    submitButton.disabled = false;
                    submitButton.textContent = originalText;
                }
            });
        } else {
            console.error('El formulario formCompraAlquiler no existe');
        }
    } else {
        console.error('El modal modalCompra no existe');
    }
});

// Manejador del modal de alquiler
document.addEventListener('DOMContentLoaded', function () {
    const modalAlquiler = document.getElementById('modalAlquiler');
    if (modalAlquiler) {
        let precioPorDia = 0;
        let deposito = 0;

        modalAlquiler.addEventListener('show.bs.modal', function (event) {
            const button = event.relatedTarget;
            const publicacionId = button?.getAttribute('data-publicacion-id');
            precioPorDia = parseFloat(button?.getAttribute('data-precio-dia')) || 0;
            deposito = parseFloat(button?.getAttribute('data-deposito')) || 0;

            console.log('Datos de la publicación para modal Alquiler:', { publicacionId, precioPorDia, deposito });

            // Validar y actualizar campos del modal
            const publicacionInput = document.getElementById('alquilerPublicacionId');
            const precioDiaElement = document.getElementById('alquilerPrecioDia');
            const depositoElement = document.getElementById('alquilerDeposito');
            const formAlquiler = document.getElementById('alquilerForm');

            if (publicacionInput) {
                publicacionInput.value = publicacionId || '';
            } else {
                console.error('El elemento alquilerPublicacionId no existe');
            }

            if (precioDiaElement) {
                precioDiaElement.textContent = formatCurrency(precioPorDia);
            } else {
                console.error('El elemento alquilerPrecioDia no existe');
            }

            if (depositoElement) {
                depositoElement.textContent = formatCurrency(deposito);
            } else {
                console.error('El elemento alquilerDeposito no existe');
            }

            if (formAlquiler) {
                formAlquiler.reset();
            } else {
                console.error('El formulario alquilerForm no existe');
            }

            // Establecer fecha mínima como hoy
            const today = new Date().toISOString().split('T')[0];
            const fechaInicio = document.getElementById('fechaInicio');
            const fechaFin = document.getElementById('fechaFin');

            if (fechaInicio) fechaInicio.min = today;
            if (fechaFin) fechaFin.min = today;
        });

        // Actualizar cálculos cuando cambien las fechas
        const actualizarCalculos = () => {
            const fechaInicio = document.getElementById('fechaInicio')?.value;
            const fechaFin = document.getElementById('fechaFin')?.value;

            if (fechaInicio && fechaFin) {
                const dias = calcularDias(fechaInicio, fechaFin);
                if (dias > 0) {
                    const subtotal = dias * precioPorDia;
                    const total = subtotal + deposito;

                    document.getElementById('alquilerDiasTotales').textContent = dias;
                    document.getElementById('alquilerSubtotal').textContent = formatCurrency(subtotal);
                    document.getElementById('alquilerTotal').textContent = formatCurrency(total);
                } else {
                    // Resetear valores si las fechas son inválidas
                    document.getElementById('alquilerDiasTotales').textContent = '-';
                    document.getElementById('alquilerSubtotal').textContent = '-';
                    document.getElementById('alquilerTotal').textContent = '-';
                }
            }
        };

        document.getElementById('fechaInicio')?.addEventListener('change', actualizarCalculos);
        document.getElementById('fechaFin')?.addEventListener('change', actualizarCalculos);

        // Validar que la fecha de fin no sea anterior a la de inicio
        document.getElementById('fechaInicio')?.addEventListener('change', function () {
            const fechaFin = document.getElementById('fechaFin');
            if (fechaFin) fechaFin.min = this.value;
        });

        // Manejar envío del formulario de alquiler
        const formAlquiler = document.getElementById('alquilerForm');
        if (formAlquiler) {
            formAlquiler.addEventListener('submit', async function (e) {
                e.preventDefault();
                const submitButton = this.querySelector('button[type="submit"]');
                const originalText = submitButton.textContent;
                submitButton.disabled = true;
                submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Procesando...';

                try {
                    const formData = new FormData(this);
                    const response = await fetch('/alquilar/', {
                        method: 'POST',
                        body: formData,
                        headers: {
                            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                        }
                    });

                    const data = await response.json();
                    if (response.ok) {
                        // Mostrar mensaje de éxito
                        alert(data.message || 'Alquiler realizado con éxito');
                        // Cerrar el modal
                        bootstrap.Modal.getInstance(modalAlquiler).hide();
                        // Redirigir si es necesario
                        if (data.redirect_url) {
                            window.location.href = data.redirect_url;
                        }
                    } else {
                        throw new Error(data.error || 'Error al procesar el alquiler');
                    }
                } catch (error) {
                    alert(error.message);
                } finally {
                    submitButton.disabled = false;
                    submitButton.textContent = originalText;
                }
            });
        } else {
            console.error('El formulario alquilerForm no existe');
        }
    } else {
        console.error('El modal modalAlquiler no existe');
    }
});

