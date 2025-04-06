document.addEventListener('DOMContentLoaded', function() {
    // Manejar la apertura del modal de alquiler
    document.querySelectorAll('.btn-alquilar').forEach(function(button) {
        button.addEventListener('click', function() {
            const publicacionId = this.dataset.publicacionId;
            const precioDia = this.dataset.precioDia;
            const deposito = this.dataset.deposito;

            document.getElementById('alquilerPublicacionId').value = publicacionId;
            document.getElementById('alquilerPrecioDia').textContent = precioDia + '€';
            document.getElementById('alquilerDeposito').textContent = deposito + '€';
        });
    });

    // Manejar la cancelación de alquileres
    document.querySelectorAll('.btn-cancelar-alquiler').forEach(function(button) {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('¿Estás seguro de que deseas cancelar este alquiler?')) {
                const alquilerId = this.dataset.alquilerId;
                fetch(`/alquileres/cancelar/${alquilerId}/`, {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken'),
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        const card = this.closest('.alquiler-card');
                        if (card) {
                            card.remove();
                        }
                    } else {
                        alert(data.message || 'Error al cancelar el alquiler');
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