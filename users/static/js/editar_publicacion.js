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
            const tipo = this.getAttribute('data-tipo');
            const precioVenta = this.getAttribute('data-precio-venta');
            const precioAlquiler = this.getAttribute('data-precio-alquiler');
            const deposito = this.getAttribute('data-deposito');

            // Llenar el formulario con los datos
            document.getElementById('publicacion_id').value = publicacionId;
            document.getElementById('titulo').value = titulo;
            document.getElementById('descripcion').value = descripcion;
            document.getElementById('imagen_actual').src = imagen;
            document.getElementById('tipo').value = tipo;
            
            // Mostrar/ocultar campos de precios según el tipo
            actualizarCamposPrecios(tipo);
            
            // Llenar precios si existen
            if (precioVenta) document.getElementById('precio_venta').value = precioVenta;
            if (precioAlquiler) document.getElementById('precio_alquiler').value = precioAlquiler;
            if (deposito) document.getElementById('deposito').value = deposito;
        });
    });

    // Función para actualizar campos de precios
    function actualizarCamposPrecios(tipo) {
        const camposVenta = document.getElementById('campos_venta');
        const camposAlquiler = document.getElementById('campos_alquiler');

        // Ocultar todos los campos primero
        camposVenta.style.display = 'none';
        camposAlquiler.style.display = 'none';

        // Mostrar campos según el tipo seleccionado
        switch(tipo) {
            case 'venta':
                camposVenta.style.display = 'block';
                break;
            case 'alquiler':
                camposAlquiler.style.display = 'block';
                break;
            case 'venta y alquiler':
                camposVenta.style.display = 'block';
                camposAlquiler.style.display = 'block';
                break;
        }
    }

    // Agregar listeners para los radio buttons
    document.querySelectorAll('input[name="tipo"]').forEach(radio => {
        radio.addEventListener('change', function() {
            actualizarCamposPrecios(this.value);
        });
    });
});

// En el JavaScript que maneja el formulario de edición
function guardarEdicion() {
    const form = document.getElementById('formEditarPublicacion');
    const formData = new FormData(form);
    
    fetch('/posts/editar-publicacion/', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Cerrar modal y actualizar la página
            bootstrap.Modal.getInstance(document.getElementById('editarPublicacionModal')).hide();
            location.reload();
        } else {
            alert(data.error);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al guardar los cambios');
    });
}