document.addEventListener('DOMContentLoaded', function() {
    // Manejar eliminación de favoritos
    document.querySelectorAll('.btn-remove-favorite').forEach(function(button) {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const publicacionId = this.dataset.publicacionId;
            const card = this.closest('.favorite-card');

            fetch(`/favoritos/toggle/${publicacionId}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (!data.is_favorite && card) {
                    card.remove();
                    // Actualizar contador de favoritos en el nav
                    const favCount = document.querySelector('.nav-link .badge');
                    if (favCount) {
                        const currentCount = parseInt(favCount.textContent);
                        favCount.textContent = currentCount - 1;
                    }
                }
            });
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