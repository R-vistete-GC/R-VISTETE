document.addEventListener('DOMContentLoaded', function() {
    // Manejar la apertura del modal de venta
    document.querySelectorAll('.btn-vender').forEach(function(button) {
        button.addEventListener('click', function() {
            const publicacionId = this.dataset.publicacionId;
            const precio = this.dataset.precio;

            document.getElementById('compraPublicacionId').value = publicacionId;
            document.getElementById('compraPrecio').textContent = precio + '€';
        });
    });

    // Manejar la cancelación de ventas
    document.querySelectorAll('.btn-cancelar-venta').forEach(function(button) {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('¿Estás seguro de que deseas cancelar esta venta?')) {
                const ventaId = this.dataset.ventaId;
                fetch(`/ventas/cancelar/${ventaId}/`, {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken'),
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        const card = this.closest('.venta-card');
                        if (card) {
                            card.remove();
                        }
                    } else {
                        alert(data.message || 'Error al cancelar la venta');
                    }
                });
            }
        });
    });

    // Función auxiliar para obtener el token CSRF
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
}); 