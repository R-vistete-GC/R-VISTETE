document.addEventListener('DOMContentLoaded', function() {
    // Función para mostrar/ocultar campos de precios
    function actualizarCamposPrecios(tipo) {
        console.log('Tipo seleccionado:', tipo); // Debug

        const camposVenta = document.getElementById('precio_venta_container');
        const camposAlquiler = document.getElementById('precio_alquiler_container');
        const camposDeposito = document.getElementById('deposito_container');

        // Ocultar todos los campos primero
        camposVenta.style.display = 'none';
        camposAlquiler.style.display = 'none';
        camposDeposito.style.display = 'none';

        // Quitar required de todos los campos
        document.getElementById('precio_venta').required = false;
        document.getElementById('precio_alquiler').required = false;
        document.getElementById('deposito').required = false;

        // Mostrar y hacer required según el tipo
        switch(tipo) {
            case 'venta':
                camposVenta.style.display = 'block';
                document.getElementById('precio_venta').required = true;
                break;
            case 'alquiler':
                camposAlquiler.style.display = 'block';
                camposDeposito.style.display = 'block';
                document.getElementById('precio_alquiler').required = true;
                document.getElementById('deposito').required = true;
                break;
            case 'venta y alquiler':
                camposVenta.style.display = 'block';
                camposAlquiler.style.display = 'block';
                camposDeposito.style.display = 'block';
                document.getElementById('precio_venta').required = true;
                document.getElementById('precio_alquiler').required = true;
                document.getElementById('deposito').required = true;
                break;
        }
    }

    // Agregar event listeners a los radio buttons
    const radiosTipo = document.querySelectorAll('input[name="tipo"]');
    radiosTipo.forEach(radio => {
        radio.addEventListener('change', function() {
            console.log('Radio changed:', this.value); // Debug
            actualizarCamposPrecios(this.value);
        });
    });

    // Event listener para el botón de editar
    const botonesEditar = document.querySelectorAll('[data-bs-target="#editarPublicacionModal"]');
    botonesEditar.forEach(boton => {
        boton.addEventListener('click', function() {
            const tipo = this.getAttribute('data-tipo');
            console.log('Tipo al abrir modal:', tipo); // Debug

            // Marcar el radio button correspondiente
            const radioTipo = document.querySelector(`input[name="tipo"][value="${tipo}"]`);
            if (radioTipo) {
                radioTipo.checked = true;
                // Llamar a la función inmediatamente después de marcar el radio
                actualizarCamposPrecios(tipo);
            }

            // Establecer los valores de los campos si existen
            const precioVenta = this.getAttribute('data-precio-venta');
            const precioAlquiler = this.getAttribute('data-precio-alquiler');
            const deposito = this.getAttribute('data-deposito');

            if (precioVenta) document.getElementById('precio_venta').value = precioVenta;
            if (precioAlquiler) document.getElementById('precio_alquiler').value = precioAlquiler;
            if (deposito) document.getElementById('deposito').value = deposito;
        });
    });
});