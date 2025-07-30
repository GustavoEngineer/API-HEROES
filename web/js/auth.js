// Sistema de Autenticación con API Real
document.addEventListener('DOMContentLoaded', function() {
    
    // Verificar si ya está autenticado
    if (apiService && apiService.isAuthenticated()) {
        // Si ya está autenticado, redirigir al dashboard
        if (window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html')) {
            window.location.href = 'dashboard.html';
        }
    }
    
    // Login Form Handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const submitBtn = this.querySelector('.submit-btn');
            
            // Validación básica
            if (!email || !password) {
                showMessage('Por favor completa todos los campos', 'error');
                return;
            }
            
            try {
                // Mostrar estado de carga
                setLoadingState(submitBtn, true);
                
                // Intentar login con la API
                const response = await apiService.login(email, password);
                
                showMessage('¡Login exitoso!', 'success');
                
                // Guardar información del usuario
                if (response.usuario) {
                    localStorage.setItem('userSession', JSON.stringify(response.usuario));
                }
                
                // Redirigir al dashboard después de 2 segundos
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 2000);
                
            } catch (error) {
                console.error('Error en login:', error);
                showMessage(error.message || 'Error al iniciar sesión', 'error');
            } finally {
                setLoadingState(submitBtn, false);
            }
        });
    }
    
    // Register Form Handler
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const submitBtn = this.querySelector('.submit-btn');
            
            // Validación
            if (!firstName || !lastName || !username || !email || !password) {
                showMessage('Por favor completa todos los campos', 'error');
                return;
            }
            
            if (password.length < 6) {
                showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
                return;
            }
            
            try {
                // Mostrar estado de carga
                setLoadingState(submitBtn, true);
                
                // Crear nombre completo
                const nombre = `${firstName} ${lastName}`;
                
                // Intentar registro con la API
                await apiService.register(nombre, email, password);
                
                showMessage('¡Cuenta creada exitosamente!', 'success');
                
                // Limpiar formulario
                registerForm.reset();
                
                // Redirigir al login después de 2 segundos
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
                
            } catch (error) {
                console.error('Error en registro:', error);
                showMessage(error.message || 'Error al crear la cuenta', 'error');
            } finally {
                setLoadingState(submitBtn, false);
            }
        });
    }
    
    // Message display function
    function showMessage(message, type) {
        // Remove existing messages
        const existingMessage = document.querySelector('.auth-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `auth-message auth-message-${type}`;
        messageDiv.textContent = message;
        
        // Add styles
        messageDiv.style.cssText = `
            position: fixed;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            padding: 1rem 2rem;
            border-radius: 8px;
            font-family: 'Orbitron', monospace;
            font-weight: 600;
            z-index: 10000;
            animation: slideDown 0.3s ease;
            ${type === 'success' ? 
                'background: linear-gradient(135deg, #00CED1, #008B8B); color: white; box-shadow: 0 0 20px rgba(0, 206, 209, 0.5);' : 
                'background: linear-gradient(135deg, #FF69B4, #FF1493); color: white; box-shadow: 0 0 20px rgba(255, 105, 180, 0.5);'
            }
        `;
        
        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideDown {
                from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
                to { transform: translateX(-50%) translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        // Add to page
        document.body.appendChild(messageDiv);
        
        // Remove message after 4 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 4000);
    }
    
    // Add loading state to buttons
    function setLoadingState(button, isLoading) {
        if (isLoading) {
            button.disabled = true;
            button.textContent = 'CARGANDO...';
            button.style.opacity = '0.7';
        } else {
            button.disabled = false;
            button.textContent = button.getAttribute('data-original-text') || 'LOGIN';
            button.style.opacity = '1';
        }
    }
    
    // Store original button text
    const submitButtons = document.querySelectorAll('.submit-btn');
    submitButtons.forEach(button => {
        button.setAttribute('data-original-text', button.textContent);
    });
    
    // Función para cerrar sesión (puede ser llamada desde otros archivos)
    window.logout = function() {
        if (apiService) {
            apiService.logout();
        }
        window.location.href = '../index.html';
    };
}); 

 