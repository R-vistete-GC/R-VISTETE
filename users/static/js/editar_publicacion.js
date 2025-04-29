document.addEventListener('DOMContentLoaded', function() {
    // Debug para verificar que el script se está cargando
    console.log('Script de edición cargado');

    // Agregamos el evento click a todos los botones de edición
    const botonesEditar = document.querySelectorAll('[data-bs-target="#editarPublicacionModal"]');
    botonesEditar.forEach(boton => {
        boton.addEventListener('click', function(event) {
            console.log('Botón de editar clickeado');
            const publicacionId = this.getAttribute('data-publicacion-id');
            const titulo = this.getAttribute('data-titulo');
            const descripcion = this.getAttribute('data-descripcion');
            const imagen = this.getAttribute('data-imagen');

            // Llenar el formulario con los datos
            document.getElementById('publicacion_id').value = publicacionId;
            document.getElementById('titulo').value = titulo;
            document.getElementById('descripcion').value = descripcion;
            document.getElementById('imagen_actual').src = imagen;

            // Abrir el modal manualmente
            const modal = new bootstrap.Modal(document.getElementById('editarPublicacionModal'));
            modal.show();
        });
    });
});