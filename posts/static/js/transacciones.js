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
function mostrarModalCompra(publicacionId) {
    fetch(`/posts/get_publicacion/${publicacionId}/`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const modalCompra = document.getElementById('modalCompra');
                const form = document.getElementById('formCompra');
                
                // Establecer los valores en los campos ocultos
                form.querySelector('#publicacionId').value = publicacionId;
                form.querySelector('#vendedorId').value = data.usuario_id;
                form.querySelector('#precioFinal').value = data.precio_venta;
                
                // Actualizar otros elementos del modal
                document.getElementById('modalImagenPrenda').src = data.imagen;
                document.getElementById('modalTituloPrenda').textContent = data.titulo;
                document.getElementById('modalPrecioPrenda').textContent = `$${data.precio_venta}`;
                
                // Mostrar el modal
                const modal = new bootstrap.Modal(modalCompra);
                modal.show();
            }
        })
        .catch(error => console.error('Error:', error));
}

// Manejar el envío del formulario
document.getElementById('formCompra').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!document.getElementById('terminos').checked) {
        alert('Debes aceptar los términos y condiciones para continuar.');
        return;
    }

    const formData = new FormData(this);
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
            const modalCompra = bootstrap.Modal.getInstance(document.getElementById('modalCompra'));
            modalCompra.hide();
            alert('¡Compra realizada con éxito!');
            window.location.reload();
        } else {
            alert(data.error || 'Error al procesar la compra');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al procesar la compra');
    }
});

async function procesarCompra(event) {
    event.preventDefault();
    
    // Obtener los valores de los campos
    const publicacionId = document.getElementById('publicacionId').value;
    const vendedorId = document.getElementById('vendedorId').value;
    const direccionEnvio = document.getElementById('direccion_envio').value;
    const metodoPago = document.getElementById('metodo_pago').value;
    const notas = document.getElementById('notas').value || '';
    const precioFinal = document.getElementById('precioFinal').value;

    // Crear FormData
    const formData = new FormData();
    formData.append('publicacion_id', publicacionId);
    formData.append('vendedor_id', vendedorId);
    formData.append('direccion_envio', direccionEnvio);
    formData.append('metodo_pago', metodoPago);
    formData.append('notas', notas);
    formData.append('precio_final', precioFinal);

    try {
        const response = await fetch('/posts/procesar_compra/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
            },
            body: formData
        });

        const data = await response.json();
        
        if (data.success) {
            // Cerrar el modal
            const modalElement = document.getElementById('modalCompra');
            const modal = bootstrap.Modal.getInstance(modalElement);
            modal.hide();
            
            alert('¡Compra realizada con éxito!');
            window.location.reload();
        } else {
            alert(data.error || 'Hubo un error al procesar la compra');
        }
    } catch (error) {
        console.error('Error:', error);
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

    // Para el modal de compra
    const modalCompra = document.getElementById('modalCompra');
    if (modalCompra) {
        modalCompra.addEventListener('show.bs.modal', function(event) {
            const button = event.relatedTarget;
            const publicacionId = button.getAttribute('data-publicacion-id');
            const precio = parseFloat(button.getAttribute('data-precio'));
            const vendedorId = button.getAttribute('data-vendedor');
            
            // Actualizar campos ocultos
            modalCompra.querySelector('#publicacionId').value = publicacionId;
            modalCompra.querySelector('#vendedorId').value = vendedorId;
            
            // Calcular precio final
            const envio = 5.00;
            const precioFinal = precio + envio;
            modalCompra.querySelector('#precioFinal').value = precioFinal;
            
            // Actualizar displays
            modalCompra.querySelector('#modalPrecioPrenda').textContent = `$${precio.toFixed(2)}`;
            modalCompra.querySelector('#subtotal').textContent = `$${precio.toFixed(2)}`;
            modalCompra.querySelector('#total').textContent = `$${precioFinal.toFixed(2)}`;
        });
    }

    // Para el modal de alquiler
    if (modalAlquiler) {
        modalAlquiler.addEventListener('show.bs.modal', function(event) {
            const button = event.relatedTarget;
            const publicacionId = button.getAttribute('data-publicacion-id');
            const precioDia = parseFloat(button.getAttribute('data-precio'));
            const deposito = parseFloat(button.getAttribute('data-deposito'));
            const propietarioId = button.getAttribute('data-propietario');
            
            // Actualizar campos ocultos
            modalAlquiler.querySelector('#alquilerPublicacionId').value = publicacionId;
            modalAlquiler.querySelector('#propietarioId').value = propietarioId;
            modalAlquiler.querySelector('#depositoAlquiler').value = deposito;
            
            // ... resto del código del modal ...
        });
    }
});

// Asegúrate de que el formulario existe antes de agregar el event listener
document.addEventListener('DOMContentLoaded', function() {
    const formCompra = document.getElementById('formCompra');
    
    if (formCompra) {
        formCompra.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            const formData = new FormData(this);
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
                    const modalCompra = bootstrap.Modal.getInstance(document.getElementById('modalCompra'));
                    modalCompra.hide();
                    alert('¡Compra realizada con éxito!');
                    window.location.reload();
                } else {
                    alert(data.error || 'Error al procesar la compra');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error al procesar la compra');
            }
        });
    }

    // Elimina el event listener duplicado al final del archivo
    // document.getElementById('formCompraAlquiler').addEventListener('submit', procesarCompra);
});

