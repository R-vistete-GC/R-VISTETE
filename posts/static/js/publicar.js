document.addEventListener('DOMContentLoaded', function() {
    // Manejo de la imagen
    const imagePreview = document.getElementById('imagePreview');
    const imageInput = document.getElementById('imageInput');
    const previewImage = imagePreview?.querySelector('img');
    const uploadPlaceholder = imagePreview?.querySelector('.upload-placeholder');

    if (imagePreview && imageInput) {
        imagePreview.addEventListener('click', () => {
            console.log('Clic en imagePreview');
            imageInput.click(); // Esto abre el explorador de archivos
        });

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
    const tipoAmbos = document.getElementById('tipoAmbos');
    const precioVentaSection = document.getElementById('precioVentaSection');
    const precioAlquilerSection = document.getElementById('precioAlquilerSection');
    const depositoSection = document.getElementById('depositoSection');

    function updateFormFields() {
        const isVenta = tipoVenta.checked;
        const isAlquiler = tipoAlquiler.checked;
        const isAmbos = tipoAmbos.checked;

        // Mostrar/ocultar campos según el tipo
        precioVentaSection.style.display = (isVenta || isAmbos) ? 'block' : 'none';
        precioAlquilerSection.style.display = (isAlquiler || isAmbos) ? 'block' : 'none';
        depositoSection.style.display = (isAlquiler || isAmbos) ? 'block' : 'none';

        // Actualizar required
        precioVentaSection.querySelector('input').required = (isVenta || isAmbos);
        precioAlquilerSection.querySelector('input').required = (isAlquiler || isAmbos);
        depositoSection.querySelector('input').required = (isAlquiler || isAmbos);
    }

    // Agregar event listeners
    [tipoVenta, tipoAlquiler, tipoAmbos].forEach(radio => {
        radio.addEventListener('change', updateFormFields);
    });

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
    let isSubmitting = false; // Flag para evitar envíos múltiples

    if (publicarForm) {
        publicarForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            // Si ya se está enviando, ignorar
            if (isSubmitting) {
                return;
            }

            // Marcar como enviando
            isSubmitting = true;

            try {
                const formData = new FormData(this);

                // Deshabilitar el botón de submit
                const submitButton = this.querySelector('button[type="submit"]');
                const originalText = submitButton.innerHTML;
                submitButton.disabled = true;
                submitButton.innerHTML = 'Publicando...';

                const response = await fetch('/inicio/publicar/', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (result.success) {
                    // Mostrar mensaje de éxito
                    Swal.fire({
                        icon: 'success',
                        title: '¡Éxito!',
                        text: 'Publicación creada exitosamente'
                    }).then(() => {
                        window.location.reload();
                    });
                } else {
                    throw new Error(result.error || 'Error al crear la publicación');
                }
            } catch (error) {
                console.error('Error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.message
                });
            } finally {
                // Restaurar el estado del botón y del formulario
                const submitButton = this.querySelector('button[type="submit"]');
                submitButton.disabled = false;
                submitButton.innerHTML = originalText;
                isSubmitting = false;
            }
        });

        // Remover cualquier otro event listener que pueda estar causando el doble envío
        const publicarButton = document.getElementById('btnPublicar');
        if (publicarButton) {
            publicarButton.onclick = null;
        }
    }

    // Manejo de campos de precio
    const tipoVenta = document.getElementById('tipoVenta');
    const tipoAlquiler = document.getElementById('tipoAlquiler');
    const tipoAmbos = document.getElementById('tipoAmbos');
    
    const precioVentaSection = document.getElementById('precioVentaSection');
    const precioAlquilerSection = document.getElementById('precioAlquilerSection');
    const depositoSection = document.getElementById('depositoSection');

    function actualizarCamposPrecio() {
        // Obtener el tipo seleccionado
        const isVenta = tipoVenta.checked;
        const isAlquiler = tipoAlquiler.checked;
        const isAmbos = tipoAmbos.checked;

        // Mostrar/ocultar campos
        precioVentaSection.style.display = (isVenta || isAmbos) ? 'block' : 'none';
        precioAlquilerSection.style.display = (isAlquiler || isAmbos) ? 'block' : 'none';
        depositoSection.style.display = (isAlquiler || isAmbos) ? 'block' : 'none';

        // Actualizar required
        precioVentaSection.querySelector('input').required = (isVenta || isAmbos);
        precioAlquilerSection.querySelector('input').required = (isAlquiler || isAmbos);
        depositoSection.querySelector('input').required = (isAlquiler || isAmbos);
    }

    // Event listeners para los radio buttons
    [tipoVenta, tipoAlquiler, tipoAmbos].forEach(radio => {
        radio.addEventListener('change', actualizarCamposPrecio);
    });

    // Ejecutar al cargar la página
    actualizarCamposPrecio();

    // Referencias a los elementos del formulario
    const tipoVenta = document.getElementById('tipoVenta');
    const tipoAlquiler = document.getElementById('tipoAlquiler');
    const tipoVentaAlquiler = document.getElementById('tipoVentaAlquiler');
    
    const precioVentaContainer = document.getElementById('precioVentaContainer');
    const precioAlquilerContainer = document.getElementById('precioAlquilerContainer');
    const depositoContainer = document.getElementById('depositoContainer');

    // Función para manejar la visibilidad de los campos
    function actualizarCamposFormulario() {
        // Ocultar todos los campos primero
        precioVentaContainer.style.display = 'none';
        precioAlquilerContainer.style.display = 'none';
        depositoContainer.style.display = 'none';

        // Obtener los inputs
        const precioVentaInput = document.getElementById('precioVenta');
        const precioAlquilerInput = document.getElementById('precioAlquiler');
        const depositoInput = document.getElementById('deposito');

        // Desactivar required en todos
        precioVentaInput.required = false;
        precioAlquilerInput.required = false;
        depositoInput.required = false;

        // Mostrar campos según el tipo seleccionado
        if (tipoVenta.checked) {
            precioVentaContainer.style.display = 'block';
            precioVentaInput.required = true;
        } 
        else if (tipoAlquiler.checked) {
            precioAlquilerContainer.style.display = 'block';
            depositoContainer.style.display = 'block';
            precioAlquilerInput.required = true;
            depositoInput.required = true;
        } 
        else if (tipoVentaAlquiler.checked) {
            precioVentaContainer.style.display = 'block';
            precioAlquilerContainer.style.display = 'block';
            depositoContainer.style.display = 'block';
            precioVentaInput.required = true;
            precioAlquilerInput.required = true;
            depositoInput.required = true;
        }
    }

    // Agregar event listeners a los radio buttons
    [tipoVenta, tipoAlquiler, tipoVentaAlquiler].forEach(radio => {
        radio.addEventListener('change', actualizarCamposFormulario);
    });

    // Ejecutar una vez al cargar la página
    actualizarCamposFormulario();
});
