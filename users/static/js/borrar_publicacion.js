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

    // Obtener el token CSRF
    const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    // URL correcta usando el nombre de la aplicación 'posts'
    fetch(`/posts/borrar/${publicacionIdABorrar}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken,
            'Content-Type': 'application/json',
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Cerrar el modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('borrarPublicacionModal'));
            modal.hide();
            
            // Eliminar la publicación del DOM
            const publicacionElement = document.querySelector(`.publicacion[data-publicacion-id="${publicacionIdABorrar}"]`);
            if (publicacionElement) {
                publicacionElement.remove();
            }
            
            // Mensaje de éxito
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