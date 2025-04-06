// Función para dar/quitar like
function toggleLike(publicacionId) {
    fetch(`/inicio/api/likes/${publicacionId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
    .then(response => response.json())
    .then(data => {
        // Actualizar el botón de like
        const likeBtn = document.querySelector(`button[onclick="toggleLike(${publicacionId})"]`);
        const likeIcon = likeBtn.querySelector('i.fas.fa-thumbs-up');
        const likesCountSpan = likeBtn.querySelector('small');
        
        if (data.status === 'added') {
            likeIcon.classList.add('text-primary');
            if (likesCountSpan) {
                likesCountSpan.textContent = data.likes_count;
            }
        } else {
            likeIcon.classList.remove('text-primary');
            if (likesCountSpan) {
                likesCountSpan.textContent = data.likes_count;
            }
        }
        
        // Actualizar el contador en el navbar
        const navLikeCount = document.querySelector('.nav-link .badge.bg-success');
        if (navLikeCount) {
            navLikeCount.textContent = data.user_likes_count;
            navLikeCount.style.display = data.user_likes_count > 0 ? '' : 'none';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al procesar el like. Por favor, intenta de nuevo.');
    });
}

// Función para agregar/quitar de favoritos
function toggleFavorito(publicacionId) {
    fetch(`/inicio/api/favoritos/${publicacionId}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
    .then(response => response.json())
    .then(data => {
        // Actualizar el botón de favorito
        const favBtn = document.querySelector(`button[onclick="toggleFavorito(${publicacionId})"]`);
        const favIcon = favBtn.querySelector('i.fas.fa-heart');
        
        if (data.status === 'added') {
            favIcon.classList.add('text-danger');
        } else {
            favIcon.classList.remove('text-danger');
        }
        
        // Actualizar el contador en el navbar
        const navFavCount = document.querySelector('.nav-link .badge.bg-success');
        if (navFavCount) {
            navFavCount.textContent = data.favoritos_count;
            navFavCount.style.display = data.favoritos_count > 0 ? '' : 'none';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al procesar el favorito. Por favor, intenta de nuevo.');
    });
}

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