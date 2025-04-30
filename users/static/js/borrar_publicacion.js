let publicacionIdABorrar = null;

document.addEventListener('DOMContentLoaded', function() {
    const modalBorrar = document.getElementById('borrarPublicacionModal');
    if (modalBorrar) {
        modalBorrar.addEventListener('show.bs.modal', function(event) {
            const button = event.relatedTarget;
            publicacionIdABorrar = button.getAttribute('data-publicacion-id');
        });
    }
});

function borrarPublicacion() {
    if (!publicacionIdABorrar) return;

    fetch(`/posts/borrar/${publicacionIdABorrar}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Cerrar el modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('borrarPublicacionModal'));
            modal.hide();
            
            // Eliminar el elemento del DOM
            const publicacion = document.querySelector(`[data-publicacion-id="${publicacionIdABorrar}"]`);
            if (publicacion) {
                publicacion.closest('.publicacion-container').remove();
            }
            
            // Mostrar mensaje de éxito
            alert('Publicación eliminada exitosamente');
        } else {
            alert(data.error || 'Error al eliminar la publicación');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al eliminar la publicación');
    });
}