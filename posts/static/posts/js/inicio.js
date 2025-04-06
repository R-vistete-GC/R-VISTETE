document.addEventListener('DOMContentLoaded', function() {
    // Inicializar los tooltips de Bootstrap
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Manejar likes
    document.querySelectorAll('.btn-like').forEach(function(button) {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const publicacionId = this.dataset.publicacionId;
            const likeCount = this.querySelector('.like-count');
            const icon = this.querySelector('i');

            fetch(`/likes/toggle/${publicacionId}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.liked) {
                    icon.classList.remove('far');
                    icon.classList.add('fas');
                } else {
                    icon.classList.remove('fas');
                    icon.classList.add('far');
                }
                likeCount.textContent = data.count;
            });
        });
    });

    // Manejar favoritos
    document.querySelectorAll('.btn-favorite').forEach(function(button) {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const publicacionId = this.dataset.publicacionId;
            const icon = this.querySelector('i');

            fetch(`/favoritos/toggle/${publicacionId}/`, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.is_favorite) {
                    icon.classList.remove('far');
                    icon.classList.add('fas');
                } else {
                    icon.classList.remove('fas');
                    icon.classList.add('far');
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