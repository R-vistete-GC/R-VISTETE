document.addEventListener('DOMContentLoaded', function() {
    // Manejo de la imagen
    const imagePreview = document.getElementById('imagePreview');
    const imageInput = document.getElementById('imageInput');
    const previewImage = imagePreview?.querySelector('img');
    const uploadPlaceholder = imagePreview?.querySelector('.upload-placeholder');

    if (imagePreview && imageInput) {
        imagePreview.addEventListener('click', () => imageInput.click());

        imageInput.addEventListener('change', function(e) {
            handleImageSelection(e.target.files[0]);
        });

        // Drag and drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            imagePreview.addEventListener(eventName, preventDefaults);
        });

        imagePreview.addEventListener('drop', function(e) {
            const file = e.dataTransfer.files[0];
            handleImageSelection(file);
        });
    }

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function handleImageSelection(file) {
        if (file && file.type.startsWith('image/') && previewImage && uploadPlaceholder) {
            const reader = new FileReader();
            reader.onload = function(e) {
                previewImage.src = e.target.result;
                previewImage.style.display = 'block';
                uploadPlaceholder.style.display = 'none';
                imagePreview.classList.remove('empty');
            }
            reader.readAsDataURL(file);
        }
    }

    // Manejo del tipo de publicación
    const tipoVenta = document.getElementById('tipoVenta');
    const tipoAlquiler = document.getElementById('tipoAlquiler');
    const depositoSection = document.getElementById('depositoSection');
    const depositoInput = document.getElementById('deposito');

    if (tipoVenta && tipoAlquiler && depositoSection && depositoInput) {
        function updateTipoUI() {
            if (tipoAlquiler.checked) {
                depositoSection.style.display = 'block';
                depositoInput.required = true;
            } else {
                depositoSection.style.display = 'none';
                depositoInput.required = false;
                depositoInput.value = '';
            }
        }

        tipoVenta.addEventListener('change', updateTipoUI);
        tipoAlquiler.addEventListener('change', updateTipoUI);
    }

    // Estilo activo para los radio buttons
    const tipoChecks = document.querySelectorAll('.tipo-toggle .form-check');
    tipoChecks.forEach(check => {
        const radio = check.querySelector('input[type="radio"]');
        radio.addEventListener('change', function() {
            tipoChecks.forEach(c => c.classList.remove('active'));
            if (this.checked) {
                check.classList.add('active');
            }
        });
    });

    // Manejo del formulario de publicación
    const publicarForm = document.getElementById('publicarForm');
    
    if (publicarForm) {
        publicarForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Verificar que se haya seleccionado una imagen
            const imageFile = imageInput?.files[0];
            if (!imageFile) {
                alert('Por favor selecciona una imagen para la publicación');
                return;
            }

            // Verificar que se haya seleccionado al menos un estilo
            const estilosSeleccionados = document.querySelectorAll('input[name="estilo[]"]:checked');
            if (estilosSeleccionados.length === 0) {
                alert('Por favor selecciona al menos un estilo');
                return;
            }

            // Verificar que se haya seleccionado al menos un color
            const coloresSeleccionados = document.querySelectorAll('input[name="colores[]"]:checked');
            if (coloresSeleccionados.length === 0) {
                alert('Por favor selecciona al menos un color');
                return;
            }
            
            const formData = new FormData(this);
            
            // Deshabilitar el botón y mostrar estado de carga
            const submitButton = this.querySelector('button[type="submit"]');
            if (submitButton) {
                const originalText = submitButton.innerHTML;
                submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Publicando...';
                submitButton.disabled = true;

                fetch('/inicio/publicar/', {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Cerrar el modal si existe
                        const modal = document.getElementById('modalPublicar');
                        if (modal) {
                            const modalInstance = bootstrap.Modal.getInstance(modal);
                            if (modalInstance) {
                                modalInstance.hide();
                            }
                        }
                        
                        alert(data.message);
                        window.location.href = data.redirect_url;
                    } else {
                        throw new Error(data.error || 'Error al publicar');
                    }
                })
                .catch(error => {
                    alert('Error: ' + error.message);
                })
                .finally(() => {
                    // Restaurar el botón
                    submitButton.innerHTML = originalText;
                    submitButton.disabled = false;
                });
            }
        });
    }
});
