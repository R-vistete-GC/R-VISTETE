
document.addEventListener('DOMContentLoaded', function() {
    // Manejo de la imagen
    const imagePreview = document.getElementById('imagePreview');
    const imageInput = document.getElementById('imageInput');
    const previewImage = imagePreview.querySelector('img');
    const uploadPlaceholder = imagePreview.querySelector('.upload-placeholder');

    imagePreview.addEventListener('click', () => imageInput.click());

    imageInput.addEventListener('change', function(e) {
        handleImageSelection(e.target.files[0]);
    });

    // Drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        imagePreview.addEventListener(eventName, preventDefaults);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    imagePreview.addEventListener('drop', function(e) {
        const file = e.dataTransfer.files[0];
        handleImageSelection(file);
    });

    function handleImageSelection(file) {
        if (file && file.type.startsWith('image/')) {
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
});
