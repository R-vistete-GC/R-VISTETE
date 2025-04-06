document.addEventListener('DOMContentLoaded', function() {
    // Toggle para mostrar/ocultar contraseña
    const togglePassword = document.querySelector('.password-toggle');
    const password = document.querySelector('#password');

    if (togglePassword && password) {
        togglePassword.addEventListener('click', function() {
            const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
            password.setAttribute('type', type);
            
            // Cambiar el ícono
            const icon = this.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            }
        });
    }

    // Validación del formulario
    const loginForm = document.querySelector('#loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = this.querySelector('#username').value;
            const password = this.querySelector('#password').value;
            const errorMessage = this.querySelector('.error-message');
            
            if (!username || !password) {
                if (errorMessage) {
                    errorMessage.textContent = 'Por favor, completa todos los campos';
                    errorMessage.style.display = 'block';
                }
                return;
            }

            // Mostrar spinner
            const submitButton = this.querySelector('button[type="submit"]');
            const originalText = submitButton.innerHTML;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Iniciando sesión...';
            submitButton.disabled = true;

            // Enviar formulario
            this.submit();
        });
    }

    // Limpiar mensajes de error al escribir
    document.querySelectorAll('#loginForm input').forEach(input => {
        input.addEventListener('input', function() {
            const errorMessage = document.querySelector('.error-message');
            if (errorMessage) {
                errorMessage.style.display = 'none';
            }
        });
    });
}); 