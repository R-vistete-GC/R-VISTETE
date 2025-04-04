
let currentPublicacionId = null;

function mostrarDetallePublicacion(publicacionId) {
    currentPublicacionId = publicacionId;
    const publicacionCard = document.querySelector(`[data-publicacion-id="${publicacionId}"]`);
    
    // Obtener los datos de la publicación
    const imagen = publicacionCard.querySelector('.card-img-top').src;
    const titulo = publicacionCard.querySelector('.card-title').textContent;
    const descripcion = publicacionCard.querySelector('.card-text').textContent;
    const precio = publicacionCard.querySelector('.text-success').textContent;
    
    // Actualizar el modal con los datos
    document.getElementById('modalImagen').src = imagen;
    document.getElementById('modalTitulo').textContent = titulo;
    document.getElementById('modalDescripcion').textContent = descripcion;
    document.getElementById('modalPrecio').textContent = precio;
    
    // Mostrar el modal
    const modal = new bootstrap.Modal(document.getElementById('modalDetallePublicacion'));
    modal.show();
}

// Función para mostrar el modal de compra/alquiler (reutilizada del inicio.html)
function mostrarModalCompra(publicacionId, tipo) {
    const publicacionCard = document.querySelector(`[data-publicacion-id="${publicacionId}"]`);
    const imagen = publicacionCard.querySelector('.card-img-top').src;
    const titulo = publicacionCard.querySelector('.card-title').textContent;
    const precioTexto = publicacionCard.querySelector('.text-success').textContent;
    const precio = parseFloat(precioTexto.replace('$', ''));

    document.getElementById('modalImagenPrenda').src = imagen;
    document.getElementById('modalTituloPrenda').textContent = titulo;
    document.getElementById('modalPrecioPrenda').textContent = precioTexto;
    document.getElementById('modalPublicacionId').value = publicacionId;
    document.getElementById('modalTipoOperacion').value = tipo;

    const camposAlquiler = document.getElementById('camposAlquiler');
    const depositoRow = document.getElementById('depositoRow');
    if (tipo === 'alquiler') {
        camposAlquiler.style.display = 'block';
        depositoRow.style.display = 'flex';
        document.getElementById('deposito').textContent = `$${(precio * 0.5).toFixed(2)}`;
    } else {
        camposAlquiler.style.display = 'none';
        depositoRow.style.display = 'none';
    }

    document.getElementById('subtotal').textContent = precioTexto;
    actualizarTotal();

    document.getElementById('btnAccionTexto').textContent = tipo === 'compra' ? 'Pagar ahora' : 'Reservar y pagar';

    const modalTitle = document.querySelector('#modalCompra .modal-title');
    modalTitle.textContent = tipo === 'compra' ? 'Comprar Prenda' : 'Alquilar Prenda';

    // Cerrar el modal de detalle y mostrar el modal de compra
    const modalDetalle = bootstrap.Modal.getInstance(document.getElementById('modalDetallePublicacion'));
    modalDetalle.hide();
    
    const modalCompra = new bootstrap.Modal(document.getElementById('modalCompra'));
    modalCompra.show();
}

// Función para actualizar el total (reutilizada del inicio.html)
function actualizarTotal() {
    const subtotalTexto = document.getElementById('subtotal').textContent;
    const subtotal = parseFloat(subtotalTexto.replace('$', ''));
    const envio = 5.00;
    let total = subtotal + envio;

    if (document.getElementById('modalTipoOperacion').value === 'alquiler') {
        const depositoTexto = document.getElementById('deposito').textContent;
        const deposito = parseFloat(depositoTexto.replace('$', ''));
        total += deposito;
    }

    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
}
