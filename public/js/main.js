// Global variables
const socket = io();
let currentUser = null;

// Utility function to add cache-busting parameter to API calls
function noCacheUrl(url) {
    const timestamp = new Date().getTime();
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}_nocache=${timestamp}`;
}

// DOM elements
const demoModeBtn = document.getElementById('demo-mode-btn');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const userInfo = document.getElementById('user-info');
const userName = document.getElementById('user-name');
const loginRegister = document.getElementById('login-register');
const logoutBtn = document.getElementById('logout-btn');

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        updateUI();
    }
    
    // Login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const email = document.getElementById('login-email').value;
            
            // Show loading state
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = 'Logging in...';
            submitBtn.disabled = true;
            
            // Make API call
            fetch(noCacheUrl(`/api/users?email=${encodeURIComponent(email)}`))
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Login failed');
                    }
                    return response.json();
                })
                .then(users => {
                    if (users.length > 0) {
                        const user = users[0];
                        console.log('Login successful:', user);
                        currentUser = user;
                        localStorage.setItem('user', JSON.stringify(user));
                        updateUI();
                        
                        // Close the modal - making sure it exists
                        const loginModalEl = document.getElementById('loginModal');
                        if (loginModalEl) {
                            const loginModal = bootstrap.Modal.getInstance(loginModalEl);
                            if (loginModal) {
                                loginModal.hide();
                            } else {
                                // Fallback if getInstance doesn't work
                                const newModal = new bootstrap.Modal(loginModalEl);
                                newModal.hide();
                            }
                        }
                        
                        // Redirect to dashboard
                        window.location.href = '/dashboard';
                    } else {
                        alert('User not found. Please register first.');
                    }
                })
                .catch(error => {
                    console.error('Login error:', error);
                    alert(error.message || 'An error occurred. Please try again.');
                })
                .finally(() => {
                    // Reset button state
                    submitBtn.innerHTML = originalBtnText;
                    submitBtn.disabled = false;
                });
        });
    }
    
    // Register form submission
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            
            // Show loading state
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = 'Registering...';
            submitBtn.disabled = true;
            
            // Make API call
            fetch(noCacheUrl('/api/users'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Pragma': 'no-cache',
                    'Cache-Control': 'no-cache'
                },
                body: JSON.stringify({ name, email })
            })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(data => {
                            throw new Error(data.message || 'Registration failed');
                        });
                    }
                    return response.json();
                })
                .then(user => {
                    console.log('Registration successful:', user);
                    currentUser = user;
                    localStorage.setItem('user', JSON.stringify(user));
                    updateUI();
                    
                    // Close the modal - making sure it exists
                    const registerModalEl = document.getElementById('registerModal');
                    if (registerModalEl) {
                        const registerModal = bootstrap.Modal.getInstance(registerModalEl);
                        if (registerModal) {
                            registerModal.hide();
                        } else {
                            // Fallback if getInstance doesn't work
                            const newModal = new bootstrap.Modal(registerModalEl);
                            newModal.hide();
                        }
                    }
                    
                    // Redirect to dashboard
                    window.location.href = '/dashboard';
                })
                .catch(error => {
                    console.error('Registration error:', error);
                    alert(error.message || 'Registration failed. Please try again.');
                })
                .finally(() => {
                    // Reset button state
                    submitBtn.innerHTML = originalBtnText;
                    submitBtn.disabled = false;
                });
        });
    }
    
    // Logout button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('user');
            currentUser = null;
            updateUI();
            window.location.href = '/';
        });
    }
    
    // Demo mode button
    if (demoModeBtn) {
        demoModeBtn.addEventListener('click', () => {
            console.log('Demo mode button clicked');
            // Initialize demo environment
            fetch(noCacheUrl('/demo/init'), {
                method: 'POST',
                headers: {
                    'Pragma': 'no-cache',
                    'Cache-Control': 'no-cache'
                }
            })
                .then(response => {
                    console.log('Demo init response:', response);
                    return response.json();
                })
                .then(data => {
                    console.log('Demo init data:', data);
                    // Log in as the first demo user
                    const demoUser = data.users[0];
                    console.log('Demo user to store:', demoUser);
                    currentUser = demoUser;
                    localStorage.setItem('user', JSON.stringify(demoUser));
                    
                    // Force clear localStorage cache first
                    localStorage.clear();
                    localStorage.setItem('user', JSON.stringify(demoUser));
                    
                    // Redirect to dashboard
                    window.location.href = '/dashboard';
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Failed to initialize demo. Please try again.');
                });
        });
    }
});

// Update UI based on login state
function updateUI() {
    if (currentUser) {
        // Update user info display
        userInfo.classList.remove('d-none');
        loginRegister.classList.add('d-none');
        userName.textContent = currentUser.name;
    } else {
        // Update login/register display
        userInfo.classList.add('d-none');
        loginRegister.classList.remove('d-none');
    }
}
