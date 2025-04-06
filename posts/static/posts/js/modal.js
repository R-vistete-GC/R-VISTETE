document.addEventListener('DOMContentLoaded', function() {
    // Inicializar todos los modales
    var modals = document.querySelectorAll('.modal');
    modals.forEach(function(modal) {
        new bootstrap.Modal(modal, {
            backdrop: 'static',
            keyboard: false
        });
    });

    // Limpiar formularios al cerrar modales
    document.querySelectorAll('.modal').forEach(function(modal) {
        modal.addEventListener('hidden.bs.modal', function() {
            const forms = this.querySelectorAll('form');
            forms.forEach(form => form.reset());
        });
    });
}); 