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
        console.log("Datos obtenidos:", data); // Para debugging
        return data;
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

// Event listener para el formulario
document.addEventListener('DOMContentLoaded', function() {
    const formCompra = document.getElementById('formCompraAlquiler');
    if (formCompra) {
        formCompra.addEventListener('submit', procesarCompra);
        console.log('Event listener agregado al formulario de compra');
    } else {
        console.error('No se encontró el formulario de compra');
    }
});

