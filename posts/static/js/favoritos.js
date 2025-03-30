
function quitarFavorito(publicacionId, button) {
    if (!confirm('¿Estás seguro de que quieres quitar esta prenda de tus favoritos?')) {
        return;
    }

    fetch(`/inicio/api/favoritos/${publicacionId}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCookie('csrftoken'),
        },
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'removed') {
            // Eliminar la tarjeta con una animación
            const card = button.closest('.col-md-4');
            card.style.transition = 'all 0.3s ease';
            card.style.opacity = '0';
            card.style.transform = 'scale(0.8)';
            setTimeout(() => {
                card.remove();
                // Si no quedan favoritos, recargar la página
                if (document.querySelectorAll('.col-md-4').length === 0) {
                    window.location.reload();
                }
            }, 300);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Hubo un error al quitar el favorito. Por favor, intenta de nuevo.');
    });
}

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


