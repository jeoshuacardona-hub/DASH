async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch('/api/user/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            throw new Error('Session expired');
        }
    } catch (error) {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    }
}

// Ejecutar verificación al cargar la página
checkAuth();
