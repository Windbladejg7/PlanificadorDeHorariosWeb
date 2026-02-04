import "./src/style.css"

// Función para controlar el indicador de carga
const setLoader = (show: boolean, text: string = "Cargando...") => {
    const loader = document.getElementById('loader-container');
    const label = document.getElementById('loader-text');
    if (loader && label) {
        label.innerText = text;
        loader.style.display = show ? 'flex' : 'none';
    }
};

// Manejo del Submit exclusivo para Login
document.getElementById('auth-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const emailInput = document.getElementById('auth-email') as HTMLInputElement;
    const passwordInput = document.getElementById('auth-password') as HTMLInputElement;

    // Activar loader
    setLoader(true, "Verificando credenciales...");

    try {
        const response = await fetch("https://planificadordehorarios.onrender.com/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: emailInput.value,
                password: passwordInput.value,
            })
        });

        if (response.ok) {
            const data = await response.json();
            
            // Persistencia de sesión
            if (data.token) {
                localStorage.setItem('user_token', data.token);
            }

            // Éxito: Ir al home
            window.location.href = "/index.html";
        } else {
            // Manejo de errores del Back-end (401, 404, etc)
            const errorData = await response.json().catch(() => ({}));
            alert(`Error: ${errorData.message || 'Credenciales incorrectas'}`);
        }
    } catch (error) {
        console.error("Error en la conexión:", error);
        alert("El servidor no responde. Revisa si el Back-end está corriendo.");
    } finally {
        // Desactivar siempre el loader al terminar la petición
        setLoader(false);
    }
});













