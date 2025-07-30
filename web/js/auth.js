// API Configuration
const API_BASE_URL = 'http://localhost:3000';

// Authentication System with API Integration
document.addEventListener('DOMContentLoaded', function() {
    
    // Login Form Handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const submitBtn = this.querySelector('.submit-btn');
            
            // Set loading state
            setLoadingState(submitBtn, true);
            
            try {
                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        correo: email,
                        contrasena: password
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Store token and user data
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.usuario));
                    
                    showMessage('¡Login exitoso!', 'success');
                    
                    // Redirect to dashboard after 2 seconds
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 2000);
                } else {
                    showMessage(data.error || 'Error en el login', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showMessage('Error de conexión. Verifica que la API esté corriendo.', 'error');
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
            
            const nombre = document.getElementById('nombre').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const submitBtn = this.querySelector('.submit-btn');
            
            // Simple validation
            if (!nombre || !email || !password) {
                showMessage('Por favor completa todos los campos', 'error');
                return;
            }
            
            if (password.length < 6) {
                showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
                return;
            }
            
            // Set loading state
            setLoadingState(submitBtn, true);
            
            try {
                const response = await fetch(`${API_BASE_URL}/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        nombre: nombre,
                        correo: email,
                        contrasena: password
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    showMessage('¡Cuenta creada exitosamente!', 'success');
                    
                    // Clear form
                    registerForm.reset();
                    
                    // Redirect to login after 2 seconds
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
                    showMessage(data.error || 'Error en el registro', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showMessage('Error de conexión. Verifica que la API esté corriendo.', 'error');
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
            const originalText = button.getAttribute('data-original-text') || 
                               (button.closest('#loginForm') ? 'LOGIN' : 'CREATE ACCOUNT');
            button.textContent = originalText;
            button.style.opacity = '1';
        }
    }
    
    // Store original button text
    const submitButtons = document.querySelectorAll('.submit-btn');
    submitButtons.forEach(button => {
        button.setAttribute('data-original-text', button.textContent);
    });
}); 

 