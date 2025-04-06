// Función para mostrar el modal de comentarios
function mostrarComentarios(publicacionId) {
    console.log('Mostrando comentarios para publicación:', publicacionId);
    
    // Crear el modal dinámicamente si no existe
    let modalElement = document.getElementById('modalComentarios');
    if (!modalElement) {
        modalElement = document.createElement('div');
        modalElement.id = 'modalComentarios';
        modalElement.className = 'modal fade';
        modalElement.setAttribute('tabindex', '-1');
        modalElement.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Comentarios</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="comentarios-container mb-3"></div>
                        <form id="formComentario" class="mt-3">
                            <div class="input-group">
                                <input type="text" class="form-control" placeholder="Escribe un comentario..." id="comentarioInput">
                                <button class="btn btn-primary" type="submit">
                                    <i class="fas fa-paper-plane"></i>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modalElement);
    }

    // Inicializar el modal de Bootstrap
    const modal = new bootstrap.Modal(modalElement);

    // Configurar el formulario de comentarios
    const formComentario = document.getElementById('formComentario');
    formComentario.onsubmit = function(e) {
        e.preventDefault();
        const comentario = document.getElementById('comentarioInput').value;
        if (!comentario.trim()) return;

        console.log('Enviando comentario:', comentario);

        fetch(`/inicio/api/comentarios/agregar/${publicacionId}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ comentario: comentario })
        })
        .then(response => {
            console.log('Respuesta del servidor:', response);
            return response.json();
        })
        .then(data => {
            console.log('Datos recibidos:', data);
            if (data.success) {
                document.getElementById('comentarioInput').value = '';
                cargarComentarios(publicacionId);
            } else {
                console.error('Error al agregar comentario:', data.error);
                alert('Error al agregar el comentario: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error al enviar comentario:', error);
            alert('Error al enviar el comentario. Por favor, intenta de nuevo.');
        });
    };

    // Cargar y mostrar los comentarios
    cargarComentarios(publicacionId);
    
    // Mostrar el modal
    modal.show();
}

// Función para cargar los comentarios
function cargarComentarios(publicacionId) {
    console.log('Cargando comentarios para publicación:', publicacionId);
    const container = document.querySelector('.comentarios-container');
    
    fetch(`/inicio/api/comentarios/get/${publicacionId}/`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => {
        console.log('Status:', response.status);
        console.log('Headers:', Object.fromEntries(response.headers.entries()));
        return response.text().then(text => {
            console.log('Texto de respuesta:', text);
            try {
                return JSON.parse(text);
            } catch (e) {
                console.error('Error al parsear JSON:', e);
                console.log('Texto recibido:', text);
                throw new Error(`Error al parsear respuesta del servidor: ${text}`);
            }
        });
    })
    .then(data => {
        console.log('Datos parseados:', data);
        
        if (!data || typeof data !== 'object') {
            throw new Error('Respuesta inválida del servidor');
        }

        if (!data.success) {
            throw new Error(data.error || 'Error desconocido');
        }

        if (Array.isArray(data.comentarios) && data.comentarios.length > 0) {
            container.innerHTML = data.comentarios.map(comentario => `
                <div class="card mb-2">
                    <div class="card-body py-2">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <strong>${comentario.usuario}</strong>
                            <small class="text-muted">${comentario.fecha}</small>
                        </div>
                        <p class="card-text mb-0">${comentario.texto}</p>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="text-muted text-center">No hay comentarios aún. ¡Sé el primero en comentar!</p>';
        }
    })
    .catch(error => {
        console.error('Error al cargar comentarios:', error);
        container.innerHTML = `
            <div class="alert alert-danger">
                Error al cargar los comentarios: ${error.message}
                <button type="button" class="btn btn-link" onclick="cargarComentarios(${publicacionId})">
                    Intentar de nuevo
                </button>
            </div>
        `;
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