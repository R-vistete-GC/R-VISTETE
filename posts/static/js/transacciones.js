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

// Modal de compra
document.addEventListener('DOMContentLoaded', function () {
    const modalCompra = document.getElementById('modalCompra');
    if (modalCompra) {
        modalCompra.addEventListener('show.bs.modal', function (event) {
            const button = event.relatedTarget;
            const publicacionId = button?.getAttribute('data-publicacion-id');
            const precioVenta = parseFloat(button?.getAttribute('data-precio-venta')) || 0;
            const imagen = button?.getAttribute('data-imagen');
            const titulo = button?.getAttribute('data-titulo');
            const tipo = button?.getAttribute('data-tipo');

            // Actualizar campos del modal
            const publicacionInput = document.getElementById('publicacionId');
            const modalImagenPrenda = document.getElementById('modalImagenPrenda');
            const modalTituloPrenda = document.getElementById('modalTituloPrenda');
            const modalPrecioPrenda = document.getElementById('modalPrecioPrenda');
            const subtotalElement = document.getElementById('subtotal');
            const totalElement = document.getElementById('total');

            if (publicacionInput) publicacionInput.value = publicacionId || '';
            if (modalImagenPrenda) modalImagenPrenda.src = imagen || '';
            if (modalTituloPrenda) modalTituloPrenda.textContent = titulo || '';
            modalPrecioPrenda.textContent = formatCurrency(precioVenta);

            // Calcular y mostrar el subtotal y total
            const envio = 5.00;
            const subtotal = precioVenta;
            const total = subtotal + envio;

            subtotalElement.textContent = formatCurrency(subtotal);
            totalElement.textContent = formatCurrency(total);
        });
    }
});

// Modal de alquiler
document.addEventListener('DOMContentLoaded', function () {
    const modalAlquiler = document.getElementById('modalAlquiler');
    if (modalAlquiler) {
        modalAlquiler.addEventListener('show.bs.modal', function (event) {
            const button = event.relatedTarget;
            const publicacionId = button?.getAttribute('data-publicacion-id');
            const precioPorDia = parseFloat(button?.getAttribute('data-precio-dia')) || 0;
            const deposito = parseFloat(button?.getAttribute('data-deposito')) || 0;
            const imagen = button?.getAttribute('data-imagen');
            const titulo = button?.getAttribute('data-titulo');
            const tipo = button?.getAttribute('data-tipo');

            // Actualizar campos del modal
            const publicacionInput = document.getElementById('alquilerPublicacionId');
            const precioDiaElement = document.getElementById('alquilerPrecioDia');
            const depositoElement = document.getElementById('alquilerDeposito');
            const modalImagenPrenda = document.getElementById('modalImagenPrendaAlquiler');
            const modalTituloPrenda = document.getElementById('modalTituloPrendaAlquiler');

            if (publicacionInput) publicacionInput.value = publicacionId || '';
            precioDiaElement.textContent = formatCurrency(precioPorDia);
            depositoElement.textContent = formatCurrency(deposito);
            modalImagenPrenda.src = imagen || '';
            modalTituloPrenda.textContent = titulo || '';
        });
    }
});

