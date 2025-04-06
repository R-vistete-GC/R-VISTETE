document.addEventListener('DOMContentLoaded', function() {
    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');
    const publicarForm = document.getElementById('publicarForm');
    const btnPublicar = document.getElementById('btnPublicar');
    const tipoAlquiler = document.getElementById('tipoAlquiler');
    const depositoSection = document.getElementById('depositoSection');

    // Manejar la vista previa de la imagen
    if (imagePreview) {
        imagePreview.addEventListener('click', () => imageInput.click());
    }

    if (imageInput) {
        imageInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const img = imagePreview.querySelector('img');
                    if (img) {
                        img.src = e.target.result;
                        img.style.display = 'block';
                        const placeholder = imagePreview.querySelector('.upload-placeholder');
                        if (placeholder) {
                            placeholder.style.display = 'none';
                        }
                        imagePreview.classList.remove('empty');
                    }
                }
                reader.readAsDataURL(file);
            }
        });
    }

    // Mostrar/ocultar campo de depósito según tipo de publicación
    if (tipoAlquiler) {
        tipoAlquiler.addEventListener('change', function() {
            if (depositoSection) {
                depositoSection.style.display = this.checked ? 'block' : 'none';
                const deposito = document.getElementById('deposito');
                if (deposito) {
                    deposito.required = this.checked;
                }
            }
        });
    }

    // Manejar el envío del formulario
    if (btnPublicar && publicarForm) {
        btnPublicar.addEventListener('click', function(e) {
            e.preventDefault();

            // Validar que al menos un estilo esté seleccionado
            const estilos = document.querySelectorAll('input[name="estilo[]"]:checked');
            if (estilos.length === 0) {
                Swal.fire({
                    title: 'Error',
                    text: 'Por favor, selecciona al menos un estilo',
                    icon: 'error'
                });
                return;
            }

            // Validar que al menos un color esté seleccionado
            const colores = document.querySelectorAll('input[name="colores[]"]:checked');
            if (colores.length === 0) {
                Swal.fire({
                    title: 'Error',
                    text: 'Por favor, selecciona al menos un color',
                    icon: 'error'
                });
                return;
            }

            // Deshabilitar el botón y mostrar estado de carga
            btnPublicar.disabled = true;
            btnPublicar.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Publicando...';

            // Crear FormData con los datos del formulario
            const formData = new FormData(publicarForm);

            // Enviar la solicitud al servidor
            fetch(publicarForm.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                }
            })
            .then(response => response.json())
            .then(data => {
                // Restaurar el botón
                btnPublicar.disabled = false;
                btnPublicar.innerHTML = 'Publicar';

                if (data.success) {
                    // Mostrar mensaje de éxito
                    Swal.fire({
                        title: '¡Publicado!',
                        text: 'Tu publicación se ha creado correctamente',
                        icon: 'success',
                        confirmButtonText: 'Ok'
                    }).then((result) => {
                        // Redirigir a la página de inicio
                        window.location.href = data.redirect_url || '/inicio/';
                    });
                } else {
                    // Mostrar mensaje de error
                    Swal.fire({
                        title: 'Error',
                        text: data.message || 'No se pudo crear la publicación',
                        icon: 'error',
                        confirmButtonText: 'Ok'
                    });
                }
            })
            .catch(error => {
                // Restaurar el botón
                btnPublicar.disabled = false;
                btnPublicar.innerHTML = 'Publicar';

                // Mostrar mensaje de error
                Swal.fire({
                    title: 'Error',
                    text: 'Ocurrió un error al crear la publicación',
                    icon: 'error',
                    confirmButtonText: 'Ok'
                });
            });
        });
    }
}); 