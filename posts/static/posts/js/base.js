document.addEventListener('DOMContentLoaded', function() {
    // Función para mostrar/ocultar el panel de notificaciones
    window.toggleNotifications = function() {
        const panel = document.getElementById('notificationsPanel');
        if (panel) {
            panel.classList.toggle('show');
        }
    };

    // Cerrar el panel de notificaciones cuando se hace clic fuera de él
    document.addEventListener('click', function(event) {
        const panel = document.getElementById('notificationsPanel');
        const notificationButton = event.target.closest('.nav-link');
        
        if (panel && panel.classList.contains('show') && 
            !panel.contains(event.target) && 
            !notificationButton) {
            panel.classList.remove('show');
        }
    });

    // Inicializar tooltips de Bootstrap
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}); 