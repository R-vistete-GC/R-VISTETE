// Función para dar/quitar like
async function toggleLike(publicacionId) {
    try {
        const response = await fetch(`/inicio/api/likes/${publicacionId}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            }
        });

        const data = await response.json();
        
        // Actualizar el botón de like - usando una búsqueda más específica
        const likeBtn = document.querySelector(`button[onclick*="toggleLike(${publicacionId})"]`);
        if (!likeBtn) {
            console.error('No se encontró el botón de like');
            return;
        }

        // Buscar el ícono dentro del botón
        const likeIcon = likeBtn.querySelector('i');
        if (!likeIcon) {
            console.error('No se encontró el ícono de like');
            return;
        }
        
        if (data.status === 'added') {
            // Asegurarnos de que tenga las clases correctas para el estado activo
            likeIcon.className = 'fas fa-thumbs-up text-primary';
        } else {
            // Asegurarnos de que tenga las clases correctas para el estado inactivo
            likeIcon.className = 'fas fa-thumbs-up';
            
            // Si estamos en la página de likes y se quitó el like, mostrar mensaje y remover card
            if (window.location.pathname.includes('/likes/')) {
                // Mostrar mensaje de que se quitó el like
                Swal.fire({
                    title: 'Like removido',
                    text: 'Has quitado el like de esta publicación',
                    icon: 'info',
                    showConfirmButton: false,
                    timer: 1500,
                    position: 'center',
                    customClass: {
                        popup: 'animated fadeOut'
                    }
                });

                // Remover la card con animación
                const card = likeBtn.closest('.col-md-4');
                if (card) {
                    // Aplicar animación de desvanecimiento
                    card.style.transition = 'all 0.3s ease';
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.8)';
                    
                    // Remover la card después de la animación
                    setTimeout(() => {
                        card.remove();
                        
                        // Verificar si quedan likes
                        const remainingCards = document.querySelectorAll('.col-md-4');
                        if (remainingCards.length === 0) {
                            const container = document.querySelector('.container');
                            if (container) {
                                container.innerHTML = `
                                    <h2 class="mb-4"><i class="fas fa-thumbs-up"></i> Mis Likes</h2>
                                    <div class="alert alert-info">
                                        <i class="fas fa-info-circle"></i> No tienes prendas con like.
                                    </div>
                                `;
                            }
                        }
                    }, 300);
                }
            }
        }
        
        // Actualizar el contador en el navbar
        const navLikeCount = document.getElementById('likeCount');
        if (navLikeCount) {
            const newCount = data.user_likes_count || 0;
            navLikeCount.textContent = newCount;
            navLikeCount.style.display = newCount > 0 ? '' : 'none';
        }

        // Actualizar el contador de likes en la publicación si existe
        const likesCountSpan = likeBtn.querySelector('small');
        if (likesCountSpan) {
            likesCountSpan.textContent = data.likes_count || 0;
        }

    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            title: 'Error',
            text: 'Hubo un problema al procesar tu solicitud',
            icon: 'error',
            customClass: {
                popup: 'animated shake'
            }
        });
    }
}

// Función para agregar/quitar de favoritos
async function toggleFavorito(publicacionId) {
    try {
        // Verificar primero si está en favoritos
        const heartIcon = document.querySelector(`button[onclick*="${publicacionId}"] i`);
        const isCurrentlyFavorite = heartIcon && (heartIcon.classList.contains('text-danger') || heartIcon.classList.contains('fa-heart-broken'));

        if (isCurrentlyFavorite) {
            // Si está en favoritos, mostrar confirmación antes de quitar
            const result = await Swal.fire({
                title: '¿Quitar de favoritos?',
                text: '¿Estás seguro de que deseas quitar esta prenda de tus favoritos?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Sí, quitar',
                cancelButtonText: 'Cancelar',
                customClass: {
                    popup: 'animated fadeInDown',
                    confirmButton: 'btn btn-danger',
                    cancelButton: 'btn btn-secondary'
                }
            });

            if (!result.isConfirmed) {
                return; // Si el usuario cancela, no hacer nada
            }
        }

        // Proceder con la acción de toggle
        const response = await fetch(`/inicio/api/favoritos/${publicacionId}/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        if (data.is_favorite) {
            // Si se agregó a favoritos, solo cambiar el color del corazón
            if (heartIcon) {
                heartIcon.className = 'fas fa-heart text-danger';
            }
        } else {
            // Si se quitó de favoritos
            if (window.location.pathname.includes('/favoritos/')) {
                // Si estamos en la página de favoritos, remover la card con animación
                const card = document.querySelector(`button[onclick*="${publicacionId}"]`).closest('.col-md-4');
                if (card) {
                    card.style.transition = 'all 0.3s ease';
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.8)';
                    
                    setTimeout(() => {
                        card.remove();
                        
                        // Verificar si quedan favoritos
                        const remainingCards = document.querySelectorAll('.col-md-4');
                        if (remainingCards.length === 0) {
                            const container = document.querySelector('.container');
                            container.innerHTML = `
                                <h2 class="mb-4"><i class="fas fa-heart text-danger"></i> Mis Favoritos</h2>
                                <div class="alert alert-info">
                                    <i class="fas fa-info-circle"></i> No tienes prendas en favoritos.
                                </div>
                            `;
                        }
                    }, 300);
                }
            } else {
                // Actualizar el ícono si no estamos en la página de favoritos
                if (heartIcon) {
                    heartIcon.className = 'far fa-heart';
                }
            }
        }

        // Actualizar el contador de favoritos en el navbar
        const favCountElement = document.getElementById('favCount');
        if (favCountElement) {
            const newCount = parseInt(favCountElement.textContent) + (data.is_favorite ? 1 : -1);
            favCountElement.textContent = newCount;
            
            // Ocultar el contador si llega a 0
            if (newCount <= 0) {
                favCountElement.style.display = 'none';
            } else {
                favCountElement.style.display = '';
            }
        }

    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            title: 'Error',
            text: 'Hubo un problema al procesar tu solicitud',
            icon: 'error',
            customClass: {
                popup: 'animated shake'
            }
        });
    }
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