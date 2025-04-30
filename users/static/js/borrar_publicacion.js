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
        },
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Cerrar el modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('borrarPublicacionModal'));
            modal.hide();
            
            // Eliminar la publicación del DOM
            const publicacionElement = document.querySelector(`[data-publicacion-id="${publicacionIdABorrar}"]`);
            if (publicacionElement) {
                publicacionElement.closest('.col-12, .col-sm-6, .col-lg-4').remove();
            }
            
            // Mostrar mensaje de éxito usando SweetAlert2
            Swal.fire({
                title: '¡Éxito!',
                text: 'Publicación eliminada exitosamente',
                icon: 'success',
                confirmButtonText: 'OK'
            });
        } else {
            Swal.fire({
                title: 'Error',
                text: data.error || 'Error al eliminar la publicación',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        Swal.fire({
            title: 'Error',
            text: 'Error al eliminar la publicación',
            icon: 'error',
            confirmButtonText: 'OK'
        });
    });
}