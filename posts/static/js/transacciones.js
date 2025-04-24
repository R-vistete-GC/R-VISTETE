// Función para formatear moneda
const formatCurrency = (amount) => {
    return '$' + amount.toFixed(2);
};

// Función para obtener los datos de la publicación
const getPublicacionData = async (publicacionId) => {
    try {
        const response = await fetch(`/posts/get_publicacion/${publicacionId}/`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error al obtener los datos de la publicación:", error);
        return null;
    }
};

// Modal de compra
document.addEventListener('DOMContentLoaded', function () {
    const modalCompra = document.getElementById('modalCompra');
    if (modalCompra) {
        modalCompra.addEventListener('show.bs.modal', async function (event) {
            const button = event.relatedTarget;
            const publicacionId = button?.getAttribute('data-publicacion-id');

            // Obtener los datos de la publicación
            const publicacionData = await getPublicacionData(publicacionId);

            if (publicacionData) {
                // Actualizar campos del modal
                const publicacionInput = document.getElementById('publicacionId');
                const modalImagenPrenda = document.getElementById('modalImagenPrenda');
                const modalTituloPrenda = document.getElementById('modalTituloPrenda');
                const modalPrecioPrenda = document.getElementById('modalPrecioPrenda');
                const subtotalElement = document.getElementById('subtotal');
                const totalElement = document.getElementById('total');

                if (publicacionInput) publicacionInput.value = publicacionData.id || '';
                if (modalImagenPrenda) modalImagenPrenda.src = publicacionData.imagen || '';
                if (modalTituloPrenda) modalTituloPrenda.textContent = publicacionData.titulo || '';
                modalPrecioPrenda.textContent = formatCurrency(publicacionData.precio);

                // Calcular y mostrar el subtotal y total
                const envio = 5.00;
                const subtotal = parseFloat(publicacionData.precio);
                const total = subtotal + envio;

                subtotalElement.textContent = formatCurrency(subtotal);
                totalElement.textContent = formatCurrency(total);
            }
        });
    }
});

// Modal de alquiler
document.addEventListener('DOMContentLoaded', function () {
    const modalAlquiler = document.getElementById('modalAlquiler');
    if (modalAlquiler) {
        modalAlquiler.addEventListener('show.bs.modal', async function (event) {
            const button = event.relatedTarget;
            const publicacionId = button?.getAttribute('data-publicacion-id');

            // Obtener los datos de la publicación
            const publicacionData = await getPublicacionData(publicacionId);

            if (publicacionData) {
                // Actualizar campos del modal
                const publicacionInput = document.getElementById('alquilerPublicacionId');
                const precioDiaElement = document.getElementById('alquilerPrecioDia');
                const depositoElement = document.getElementById('alquilerDeposito');
                const modalImagenPrenda = document.getElementById('modalImagenPrendaAlquiler');
                const modalTituloPrenda = document.getElementById('modalTituloPrendaAlquiler');

                if (publicacionInput) publicacionInput.value = publicacionData.id || '';
                precioDiaElement.textContent = formatCurrency(publicacionData.precio);
                depositoElement.textContent = formatCurrency(publicacionData.deposito);
                modalImagenPrenda.src = publicacionData.imagen || '';
                modalTituloPrenda.textContent = publicacionData.titulo || '';

                // Calcular y mostrar el subtotal y total
                const fechaInicioInput = document.getElementById('fechaInicio');
                const fechaFinInput = document.getElementById('fechaFin');
                const alquilerDiasTotalesElement = document.getElementById('alquilerDiasTotales');
                const alquilerSubtotalElement = document.getElementById('alquilerSubtotal');
                const alquilerTotalElement = document.getElementById('alquilerTotal');

                function calcularAlquiler() {
                    const fechaInicio = fechaInicioInput.value;
                    const fechaFin = fechaFinInput.value;

                    if (fechaInicio && fechaFin) {
                        const dias = calcularDias(fechaInicio, fechaFin);
                        const subtotal = parseFloat(publicacionData.precio) * dias;
                        const total = subtotal + parseFloat(publicacionData.deposito);

                        alquilerDiasTotalesElement.textContent = dias;
                        alquilerSubtotalElement.textContent = formatCurrency(subtotal);
                        alquilerTotalElement.textContent = formatCurrency(total);
                    } else {
                        alquilerDiasTotalesElement.textContent = '-';
                        alquilerSubtotalElement.textContent = '-';
                        alquilerTotalElement.textContent = '-';
                    }
                }

                fechaInicioInput.addEventListener('change', calcularAlquiler);
                fechaFinInput.addEventListener('change', calcularAlquiler);
            }
        });
    }
});

function calcularDias(fechaInicio, fechaFin) {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const diff = fin.getTime() - inicio.getTime();
    const dias = Math.ceil(diff / (1000 * 3600 * 24));
    return dias;
}

