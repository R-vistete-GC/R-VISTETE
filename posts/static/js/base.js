
    document.addEventListener('DOMContentLoaded', function() {
        // Inicializar dropdowns
        var dropdowns = document.querySelectorAll('.dropdown-toggle');
        dropdowns.forEach(dropdown => {
            new bootstrap.Dropdown(dropdown);
        });

        // Cerrar paenl de notificaciones al hacer clic fuera
        document.addEventListener('click', function(event) {
            var panel = document.getElementById('notificationsPanel');
            var bellIcon = document.querySelector('.fa-bell').parentElement;
            
            if (!panel.contains(event.target) && !bellIcon.contains(event.target) && panel.classList.contains('show')) {
                panel.classList.remove('show');
            }
        });

        // Manejo del tipo de publicación
        const tipoPublicacion = document.getElementById('tipoPublicacion');
        const depositoSection = document.getElementById('depositoSection');
        const depositoInput = document.getElementById('deposito');

        tipoPublicacion.addEventListener('change', function() {
            if (this.value === 'alquiler') {
                depositoSection.style.display = 'block';
                depositoInput.required = true;
            } else {
                depositoSection.style.display = 'none';
                depositoInput.required = false;
                depositoInput.value = '';
            }
        });

        // Manejo del formulario
        const publicarForm = document.getElementById('publicarForm');
        publicarForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            try {
                // Obtener todos los campos del formulario
                const formData = new FormData(this);
                
                // Crear el objeto de datos
                const data = {
                    titulo: formData.get('titulo'),
                    descripcion: formData.get('descripcion'),
                    imagen_url: formData.get('imagen_url'),
                    tipo: formData.get('tipo'),
                    precio: parseFloat(formData.get('precio')),
                    publico: formData.get('publico'),
                    talla: formData.get('talla'),
                    estilo: Array.from(document.querySelectorAll('select[name="estilo[]"] option:checked')).map(opt => opt.value),
                    colores: Array.from(document.querySelectorAll('select[name="colores[]"] option:checked')).map(opt => opt.value)
                };

                // Agregar depósito solo si es alquiler
                if (data.tipo === 'alquiler' && formData.get('deposito')) {
                    data.deposito = parseFloat(formData.get('deposito'));
                }

                // Validar campos requeridos
                const camposRequeridos = {
                    titulo: 'Título',
                    imagen_url: 'URL de la imagen',
                    tipo: 'Tipo de publicación',
                    precio: 'Precio',
                    publico: 'Público objetivo',
                    talla: 'Talla'
                };

                for (const [campo, nombre] of Object.entries(camposRequeridos)) {
                    if (!data[campo]) {
                        throw new Error(`El campo ${nombre} es requerido`);
                    }
                }

                if (!data.estilo.length) {
                    throw new Error('Debes seleccionar al menos un estilo');
                }

                if (!data.colores.length) {
                    throw new Error('Debes seleccionar al menos un color');
                }

                // Validar que la URL de la imagen sea válida
                try {
                    new URL(data.imagen_url);
                } catch {
                    throw new Error('La URL de la imagen no es válida');
                }

                // Validar que el precio sea positivo
                if (data.precio <= 0) {
                    throw new Error('El precio debe ser mayor que 0');
                }

                // Obtener el token CSRF
                const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]').value;

                console.log('Datos a enviar:', data);

                // Enviar la solicitud
                const response = await fetch('/inicio/publicar/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken
                    },
                    body: JSON.stringify(data)
                });

                // Manejar la respuesta
                if (!response.ok) {
                    const text = await response.text();
                    console.error('Respuesta del servidor:', text);
                    throw new Error(`Error del servidor (${response.status}): ${response.statusText}`);
                }

                const result = await response.json();
                
                if (result.success) {
                    // Cerrar el modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('modalPublicar'));
                    modal.hide();
                    
                    // Mostrar mensaje de éxito
                    alert('Publicación creada exitosamente');
                    
                    // Recargar la página
                    window.location.reload();
                } else {
                    throw new Error(result.error || 'Error desconocido al crear la publicación');
                }
            } catch (error) {
                console.error('Error:', error);
                alert(error.message);
            }
        });
    });

    function toggleNotifications() {
        var panel = document.getElementById('notificationsPanel');
        panel.classList.toggle('show');
    }
  