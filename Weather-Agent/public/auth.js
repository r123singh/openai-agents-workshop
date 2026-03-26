// Authentication functionality
class AuthManager {
    constructor() {
        this.currentForm = 'login';
        this.token = localStorage.getItem('authToken');
        this.user = JSON.parse(localStorage.getItem('user'));
        
        this.initializeEventListeners();
        this.checkAuthStatus();
    }

    initializeEventListeners() {
        // Form submissions
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));
        document.getElementById('forgotForm').addEventListener('submit', (e) => this.handleForgotPassword(e));

        // Form switching
        document.getElementById('showRegister').addEventListener('click', (e) => this.showForm('register', e));
        document.getElementById('showLogin').addEventListener('click', (e) => this.showForm('login', e));
        document.getElementById('showForgot').addEventListener('click', (e) => this.showForm('forgot', e));
        document.getElementById('backToLogin').addEventListener('click', (e) => this.showForm('login', e));
    }

    checkAuthStatus() {
        if (this.token && this.user) {
            // User is already logged in, redirect to dashboard
            window.location.href = 'dashboard.html';
        }
    }

    showForm(formType, event) {
        event.preventDefault();
        
        // Hide all forms
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'none';
        document.getElementById('forgotForm').style.display = 'none';

        // Show selected form
        document.getElementById(`${formType}Form`).style.display = 'block';

        // Update links visibility
        document.getElementById('showRegister').style.display = formType === 'login' ? 'block' : 'none';
        document.getElementById('showLogin').style.display = formType === 'register' ? 'block' : 'none';
        document.getElementById('showForgot').style.display = formType === 'login' ? 'block' : 'none';
        document.getElementById('backToLogin').style.display = formType === 'forgot' ? 'block' : 'none';

        // Update header text
        const header = document.querySelector('.auth-header p');
        switch (formType) {
            case 'login':
                header.textContent = 'Sign in to your account';
                break;
            case 'register':
                header.textContent = 'Create your account';
                break;
            case 'forgot':
                header.textContent = 'Reset your password';
                break;
        }

        this.currentForm = formType;
    }

    async handleLogin(event) {
        event.preventDefault();
        this.showLoading();

        const formData = new FormData(event.target);
        const data = {
            email: formData.get('email'),
            password: formData.get('password')
        };

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                this.setAuthData(result.data.token, result.data.user);
                this.showMessage('Login successful! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                this.showMessage(result.message || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showMessage('Network error. Please try again.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async handleRegister(event) {
        event.preventDefault();
        this.showLoading();

        const formData = new FormData(event.target);
        const data = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            password: formData.get('password')
        };

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                this.setAuthData(result.data.token, result.data.user);
                this.showMessage('Account created successfully! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                this.showMessage(result.message || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showMessage('Network error. Please try again.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async handleForgotPassword(event) {
        event.preventDefault();
        this.showLoading();

        const formData = new FormData(event.target);
        const data = {
            email: formData.get('email')
        };

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                this.showMessage(result.message, 'success');
                event.target.reset();
            } else {
                this.showMessage(result.message || 'Password reset failed', 'error');
            }
        } catch (error) {
            console.error('Password reset error:', error);
            this.showMessage('Network error. Please try again.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    setAuthData(token, user) {
        this.token = token;
        this.user = user;
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(user));
    }

    showLoading() {
        document.getElementById('loadingOverlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }

    showMessage(message, type = 'info') {
        // Remove existing messages
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;

        // Insert after header
        const header = document.querySelector('.auth-header');
        header.parentNode.insertBefore(messageDiv, header.nextSibling);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }
}

// Initialize authentication manager when page loads
document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();
});

// Global auth utilities
window.AuthUtils = {
    isAuthenticated() {
        const token = localStorage.getItem('authToken');
        const user = localStorage.getItem('user');
        return !!(token && user);
    },

    getToken() {
        return localStorage.getItem('authToken');
    },

    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    },

    async makeAuthenticatedRequest(url, options = {}) {
        const token = this.getToken();
        if (!token) {
            throw new Error('No authentication token');
        }

        const defaultOptions = {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        };

        const response = await fetch(url, { ...defaultOptions, ...options });
        
        if (response.status === 401) {
            // Token expired or invalid
            this.logout();
            return;
        }

        return response;
    }
};
