document.addEventListener('DOMContentLoaded', function() {
    // Evento para cuando se abre el modal
    const editarModal = document.getElementById('editarPublicacionModal');
    if (editarModal) {
        editarModal.addEventListener('show.bs.modal', function(event) {
            const button = event.relatedTarget;
            const publicacionId = button.getAttribute('data-publicacion-id');
            const titulo = button.getAttribute('data-titulo');
            const descripcion = button.getAttribute('data-descripcion');
            const imagen = button.getAttribute('data-imagen');

            // Llenar el formulario con los datos actuales
            document.getElementById('publicacion_id').value = publicacionId;
            document.getElementById('titulo').value = titulo;
            document.getElementById('descripcion').value = descripcion;
            document.getElementById('imagen_actual').src = imagen;

            // Obtener el resto de datos mediante una petición AJAX
            fetch(`/posts/get_publicacion/${publicacionId}/`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        document.getElementById('publico').value = data.publico;
                        document.getElementById('talla').value = data.talla;
                    }
                });
        });
    }
});

function guardarEdicion() {
    const form = document.getElementById('formEditarPublicacion');
    const formData = new FormData(form);

    fetch('/posts/editar_publicacion/', {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Cerrar el modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editarPublicacionModal'));
            modal.hide();
            
            // Actualizar la publicación en la página sin recargar
            actualizarPublicacionEnPagina(data.publicacion);
            
            // Mostrar mensaje de éxito
            alert('Publicación actualizada exitosamente');
        } else {
            alert('Error al actualizar la publicación: ' + data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al procesar la solicitud');
    });
}

function actualizarPublicacionEnPagina(publicacion) {
    const publicacionElement = document.querySelector(`[data-publicacion-id="${publicacion.id}"]`);
    if (publicacionElement) {
        publicacionElement.querySelector('.card-title').textContent = publicacion.titulo;
        publicacionElement.querySelector('.card-text').textContent = publicacion.descripcion;
        // Actualizar otros elementos según sea necesario
    }
}