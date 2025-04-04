
    document.addEventListener('DOMContentLoaded', function() {
        // Inicializar los modales
        const modalEliminar = new bootstrap.Modal(document.getElementById('modalEliminar'));
        const modalVendida = new bootstrap.Modal(document.getElementById('modalVendida'));

        // Manejadores para los botones de acción
        document.querySelectorAll('.btn-outline-danger').forEach(btn => {
            btn.addEventListener('click', function() {
                modalEliminar.show();
            });
        });

        document.querySelectorAll('.btn-outline-success').forEach(btn => {
            btn.addEventListener('click', function() {
                modalVendida.show();
            });
        });
    });
