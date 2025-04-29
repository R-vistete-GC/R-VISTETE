// Función para formatear moneda
const formatCurrency = (amount) => {
    return '$' + amount.toFixed(2);
};

// Función para obtener los datos de la publicación
async function getPublicacionData(publicacionId) {
    try {
        const response = await fetch(`/posts/get_publicacion/${publicacionId}/`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return {
            ...data,
            precio_alquiler: data.precio_alquiler || '0.00',
            deposito: data.deposito || '0.00'
        };
    } catch (error) {
        console.error("Error al obtener los datos de la publicación:", error);
        return null;
    }
}

// Función para mostrar el modal de compra
async function mostrarModalCompra(publicacionId) {
    try {
        const publicacionData = await getPublicacionData(publicacionId);
        
        if (publicacionData && publicacionData.success) {
            // Actualizar campos del modal
            document.getElementById('publicacionId').value = publicacionId;
            document.getElementById('vendedorId').value = publicacionData.usuario_id;
            document.getElementById('modalImagenPrenda').src = publicacionData.imagen;
            document.getElementById('modalPrecioPrenda').textContent = `$${publicacionData.precio_venta}`;

            // Calcular totales
            const precioVenta = parseFloat(publicacionData.precio_venta) || 0;
            const envio = 5.00;
            const subtotal = precioVenta;
            const total = subtotal + envio;

            // Actualizar campos de precios
            document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
            document.getElementById('total').textContent = `$${total.toFixed(2)}`;

            // Mostrar el modal
            const modalCompra = new bootstrap.Modal(document.getElementById('modalCompra'));
            modalCompra.show();
        } else {
            console.error('No se pudieron obtener los datos de la publicación');
        }
    } catch (error) {
        console.error('Error al mostrar el modal:', error);
    }
}

async function procesarCompra(event) {
    event.preventDefault();
    
    // Crear FormData con los datos del formulario
    const formData = new FormData();
    
    // Agregar los campos manualmente
    formData.append('publicacion_id', document.getElementById('publicacionId').value);
    formData.append('vendedor_id', document.getElementById('vendedorId').value);
    formData.append('direccion_envio', document.getElementById('direccion_envio').value);
    formData.append('metodo_pago', document.getElementById('metodo_pago').value);
    formData.append('notas', document.getElementById('notas').value || '');
    
    // Obtener el token CSRF
    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    
    try {
        const response = await fetch('/posts/procesar_compra/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': csrftoken
            },
            body: formData
        });

        const data = await response.json();
        
        if (data.success) {
            // Cerrar el modal usando Bootstrap
            const modalElement = document.getElementById('modalCompra');
            const modal = bootstrap.Modal.getInstance(modalElement);
            modal.hide();
            
            // Mostrar mensaje de éxito
            alert('¡Compra realizada con éxito!');
            
            // Recargar la página
            window.location.reload();
        } else {
            alert(data.error || 'Hubo un error al procesar la compra');
        }
    } catch (error) {
        console.error('Error al procesar la compra:', error);
        alert('Error al procesar la compra');
    }
}

// Función para mostrar el modal de alquiler
async function mostrarModalAlquiler(publicacionId) {
    try {
        const response = await fetch(`/posts/get_publicacion/${publicacionId}/`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Datos para alquiler:", data); // Para debugging

        // Actualizar campos del modal
        document.getElementById('alquilerPublicacionId').value = publicacionId;
        document.getElementById('modalImagenPrendaAlquiler').src = data.imagen;
        document.getElementById('modalTituloPrendaAlquiler').textContent = data.titulo;
        document.getElementById('alquilerPrecioDia').textContent = data.precio_alquiler;
        document.getElementById('alquilerDeposito').textContent = data.deposito;

        // Establecer fecha mínima de inicio como hoy
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('fechaInicio').min = today;
        document.getElementById('fechaFin').min = today;

        // Mostrar el modal
        const modalAlquiler = new bootstrap.Modal(document.getElementById('modalAlquiler'));
        modalAlquiler.show();

        // Agregar event listeners para las fechas
        setupFechasListeners();
    } catch (error) {
        console.error('Error al mostrar el modal de alquiler:', error);
    }
}

// Función para calcular el total del alquiler
function calcularTotalAlquiler() {
    const fechaInicio = new Date(document.getElementById('fechaInicio').value);
    const fechaFin = new Date(document.getElementById('fechaFin').value);
    const precioDia = parseFloat(document.getElementById('alquilerPrecioDia').textContent.replace('$', ''));
    const deposito = parseFloat(document.getElementById('alquilerDeposito').textContent.replace('$', ''));

    if (fechaInicio && fechaFin && !isNaN(precioDia)) {
        const diferenciaDias = Math.ceil((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24));
        if (diferenciaDias > 0) {
            const subtotal = precioDia * diferenciaDias;
            const total = subtotal + deposito;

            document.getElementById('alquilerDiasTotales').textContent = diferenciaDias;
            document.getElementById('alquilerSubtotal').textContent = `$${subtotal.toFixed(2)}`;
            document.getElementById('alquilerTotal').textContent = `$${total.toFixed(2)}`;
        }
    }
}

// Función para configurar los listeners de las fechas
function setupFechasListeners() {
    const fechaInicio = document.getElementById('fechaInicio');
    const fechaFin = document.getElementById('fechaFin');

    fechaInicio.addEventListener('change', function() {
        fechaFin.min = this.value;
        calcularTotalAlquiler();
    });

    fechaFin.addEventListener('change', calcularTotalAlquiler);
}

// Event listener para el formulario de alquiler
document.addEventListener('DOMContentLoaded', function() {
    const formAlquiler = document.getElementById('alquilerForm');
    if (formAlquiler) {
        formAlquiler.addEventListener('submit', async function(event) {
            event.preventDefault();
            const formData = new FormData(this);
            
            try {
                const response = await fetch('/posts/procesar_alquiler/', {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                    },
                    body: formData
                });

                const data = await response.json();
                
                if (data.success) {
                    const modal = bootstrap.Modal.getInstance(document.getElementById('modalAlquiler'));
                    modal.hide();
                    alert('¡Alquiler realizado con éxito!');
                    window.location.reload();
                } else {
                    alert(data.error || 'Error al procesar el alquiler');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error al procesar el alquiler');
            }
        });
    }

    // Agregar manejo para modal de alquiler
    const modalAlquiler = document.getElementById('modalAlquiler');
    if (modalAlquiler) {
        modalAlquiler.addEventListener('show.bs.modal', function(event) {
            const button = event.relatedTarget;
            const publicacionId = button.getAttribute('data-publicacion-id');
            const precioDia = button.getAttribute('data-precio-dia');
            const deposito = button.getAttribute('data-deposito');
            const titulo = button.getAttribute('data-titulo');
            const imagen = button.getAttribute('data-imagen');
            const propietario = button.getAttribute('data-propietario');

            // Actualizar campos del modal
            modalAlquiler.querySelector('#alquilerPublicacionId').value = publicacionId;
            modalAlquiler.querySelector('#modalImagenPrendaAlquiler').src = imagen;
            modalAlquiler.querySelector('#modalTituloPrendaAlquiler').textContent = titulo;
            modalAlquiler.querySelector('#alquilerPrecioDia').textContent = `$${precioDia}`;
            modalAlquiler.querySelector('#alquilerDeposito').textContent = `$${deposito}`;

            // Establecer fecha mínima
            const today = new Date().toISOString().split('T')[0];
            modalAlquiler.querySelector('#fechaInicio').min = today;
            modalAlquiler.querySelector('#fechaFin').min = today;
        });
    }
});

