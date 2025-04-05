// Funciones para formatear moneda
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
document.addEventListener('DOMContentLoaded', function() {
    const modalCompra = document.getElementById('modalCompra');
    if (modalCompra) {
        modalCompra.addEventListener('show.bs.modal', function(event) {
            const button = event.relatedTarget;
            const publicacionId = button.getAttribute('data-publicacion-id');
            const precio = button.getAttribute('data-precio');
            
            // Actualizar campos del modal
            document.getElementById('compraPublicacionId').value = publicacionId;
            document.getElementById('compraPrecio').textContent = formatCurrency(precio);
            
            // Resetear el formulario
            document.getElementById('compraForm').reset();
        });

        // Manejar envío del formulario de compra
        document.getElementById('compraForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const submitButton = this.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Procesando...';

            try {
                const formData = new FormData(this);
                const response = await fetch('/comprar/', {
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
    }
});

// Manejador del modal de alquiler
document.addEventListener('DOMContentLoaded', function() {
    const modalAlquiler = document.getElementById('modalAlquiler');
    if (modalAlquiler) {
        let precioPorDia = 0;
        let deposito = 0;

        modalAlquiler.addEventListener('show.bs.modal', function(event) {
            const button = event.relatedTarget;
            const publicacionId = button.getAttribute('data-publicacion-id');
            precioPorDia = parseFloat(button.getAttribute('data-precio-dia'));
            deposito = parseFloat(button.getAttribute('data-deposito'));
            
            // Actualizar campos del modal
            document.getElementById('alquilerPublicacionId').value = publicacionId;
            document.getElementById('alquilerPrecioDia').textContent = formatCurrency(precioPorDia);
            document.getElementById('alquilerDeposito').textContent = formatCurrency(deposito);
            
            // Resetear el formulario
            document.getElementById('alquilerForm').reset();
            
            // Establecer fecha mínima como hoy
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('fechaInicio').min = today;
            document.getElementById('fechaFin').min = today;
        });

        // Actualizar cálculos cuando cambien las fechas
        const actualizarCalculos = () => {
            const fechaInicio = document.getElementById('fechaInicio').value;
            const fechaFin = document.getElementById('fechaFin').value;

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

        document.getElementById('fechaInicio').addEventListener('change', actualizarCalculos);
        document.getElementById('fechaFin').addEventListener('change', actualizarCalculos);

        // Validar que la fecha de fin no sea anterior a la de inicio
        document.getElementById('fechaInicio').addEventListener('change', function() {
            document.getElementById('fechaFin').min = this.value;
        });

        // Manejar envío del formulario de alquiler
        document.getElementById('alquilerForm').addEventListener('submit', async function(e) {
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
    }
}); 