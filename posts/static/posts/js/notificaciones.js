document.addEventListener('DOMContentLoaded', function() {
    // Cargar notificaciones
    function cargarNotificaciones() {
        fetch('/notificaciones/obtener/', {
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        })
        .then(response => response.json())
        .then(data => {
            const panel = document.getElementById('notificationsPanel');
            if (!panel) return;

            const container = panel.querySelector('.notifications-content') || panel;
            container.innerHTML = '';

            if (data.notificaciones && data.notificaciones.length > 0) {
                data.notificaciones.forEach(notif => {
                    const notifElement = crearElementoNotificacion(notif);
                    container.appendChild(notifElement);
                });
                panel.querySelector('.notifications-empty')?.classList.add('d-none');
            } else {
                panel.querySelector('.notifications-empty')?.classList.remove('d-none');
            }

            // Actualizar contador
            actualizarContadorNotificaciones(data.no_leidas);
        });
    }

    // Crear elemento de notificación
    function crearElementoNotificacion(notif) {
        const div = document.createElement('div');
        div.className = `notification-item ${notif.leida ? '' : 'unread'}`;
        div.innerHTML = `
            <div class="notification-content">
                <i class="fas ${obtenerIconoNotificacion(notif.tipo)}"></i>
                <div class="notification-text">
                    <p>${notif.mensaje}</p>
                    <small>${notif.tiempo_transcurrido}</small>
                </div>
            </div>
        `;
        return div;
    }

    // Obtener ícono según tipo de notificación
    function obtenerIconoNotificacion(tipo) {
        const iconos = {
            'like': 'fa-heart',
            'comentario': 'fa-comment',
            'seguidor': 'fa-user-plus',
            'compra': 'fa-shopping-cart',
            'alquiler': 'fa-key'
        };
        return iconos[tipo] || 'fa-bell';
    }

    // Actualizar contador de notificaciones
    function actualizarContadorNotificaciones(cantidad) {
        const badge = document.querySelector('.nav-link .badge');
        if (badge) {
            badge.textContent = cantidad;
            badge.classList.toggle('d-none', cantidad === 0);
        }
    }

    // Marcar notificaciones como leídas
    function marcarComoLeidas() {
        fetch('/notificaciones/marcar-leidas/', {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.querySelectorAll('.notification-item.unread').forEach(item => {
                    item.classList.remove('unread');
                });
                actualizarContadorNotificaciones(0);
            }
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

    // Cargar notificaciones inicialmente
    cargarNotificaciones();

    // Recargar notificaciones cada minuto
    setInterval(cargarNotificaciones, 60000);
}); 