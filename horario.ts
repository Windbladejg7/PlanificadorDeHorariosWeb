import "./src/style.css"
import type { Aula } from "./src/main.ts"

interface Horario {
    dict: Map<string, Aula>
}

const setLoader = (show: boolean, text: string = "Cargando...") => {
    const loader = document.getElementById('loader-container');
    const label = document.getElementById('loader-text');
    if (loader && label) {
        label.innerText = text;
        loader.style.display = show ? 'flex' : 'none';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const rawData = localStorage.getItem('horarioResultado');

    if (!rawData) {
        alert("No hay horarios para mostrar");
        return;
    }

    const horariosGenerados = JSON.parse(rawData);
    let indexActual = 0;

    // Función para mostrar el horario actual
    const actualizarVista = () => {
        renderizarHorario(horariosGenerados[indexActual]);
        document.getElementById('horario-index')!.innerText =
            `Combinación ${indexActual + 1} de ${horariosGenerados.length}`;
    };

    // Listeners para los botones Anterior/Siguiente
    document.getElementById('prev-horario')?.addEventListener('click', () => {
        if (indexActual > 0) { indexActual--; actualizarVista(); }
    });

    document.getElementById('next-horario')?.addEventListener('click', () => {
        if (indexActual < horariosGenerados.length - 1) { indexActual++; actualizarVista(); }
    });

    document.getElementById('save-db-btn')?.addEventListener('click', async () => {
        // 1. Supongamos que tienes una variable global o estado con los horarios generados
        // horarioActual es el objeto que estás renderizando en el grid en ese momento
        const horarioParaGuardar = horariosGenerados[indexActual];

        if (!horarioParaGuardar) return;

        // Activar el loader que hicimos antes
        setLoader(true, "Guardando en tu cuenta...");

        try {
            const response = await fetch("https://planificadordehorarios.onrender.com/horarios/guardar", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem('user_token')}`
                },
                body: JSON.stringify({
                    horario: horarioParaGuardar
                })
            });

            if (response.ok) {
                alert("¡Horario guardado exitosamente en tu perfil!");
            } else {
                alert("Error al guardar. Inténtalo de nuevo.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("No se pudo conectar con el servidor.");
        } finally {
            setLoader(false);
        }
    });

    actualizarVista();
});











const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Generamos un color usando HSL para asegurar que sea "Pastel"
    // Hue (Matiz): basado en el nombre, Saturation: 70%, Lightness: 85%
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 70%, 85%)`;
};

export function renderizarHorario(horario: any) {
    const grid = document.getElementById('grid-horario');
    if (!grid) return;

    // Limpiar bloques anteriores
    const antiguos = grid.querySelectorAll('.materia-block');
    antiguos.forEach(a => a.remove());

    const diasMap: { [key: string]: number } = {
        "monday": 2, "tuesday": 3, "wednesday": 4,
        "thursday": 5, "friday": 6, "saturday": 7, "sunday": 8
    };

    // Accedemos a 'selecciones' según tu JSON
    const selecciones = horario.selecciones;

    Object.entries(selecciones).forEach(([nombreMateria, datosAula]: [string, any]) => {
        // Limpiamos el nombre para el color y el texto (quitamos el \\n)
        const nombreLimpio = nombreMateria.replace(/\\n/g, ' ');
        const color = stringToColor(nombreLimpio);

        datosAula.bloques.forEach((bloque: any) => {
            const el = document.createElement('div');
            el.className = 'materia-block';
            el.style.backgroundColor = color;

            // Nombre de la materia y el aula (si es null ponemos "S/N")
            const aulaTexto = datosAula.nombre ? datosAula.nombre.split('(')[0] : 'S/N';

            el.innerHTML = `
                <div style="font-weight: bold; font-size: 0.7rem;">${nombreLimpio}</div>
                <div style="font-size: 0.6rem; opacity: 0.9;">${aulaTexto}</div>
            `;

            // Cálculo de filas (Grid inicia 07:00, cada fila 30min)
            const [hInicio, mInicio] = bloque.horaInicio.split(':').map(Number);
            const [hFin, mFin] = bloque.horaFin.split(':').map(Number);

            const duracionHoras = hFin - hInicio;
            if (duracionHoras <= 1) {
                el.innerHTML = `<div style="font-weight: bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${nombreLimpio}</div>`;
            } else {
                el.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 2px;">${nombreLimpio}</div>
                <div style="font-size: 0.55rem; opacity: 0.8;">${aulaTexto}</div>
                `;
            }

            const rowStart = ((hInicio - 7) * 2) + (mInicio >= 30 ? 1 : 0) + 2;
            const rowEnd = ((hFin - 7) * 2) + (mFin >= 30 ? 1 : 0) + 2;

            const col = diasMap[bloque.dia.toLowerCase()];
            if (col) {
                el.style.gridColumn = `${col}`;
                el.style.gridRow = `${rowStart} / ${rowEnd}`;
                grid.appendChild(el);
            }
        });
    });
}

function generarLabelsHoras() {
    const grid = document.getElementById('grid-horario');
    if (!grid) return;

    for (let h = 7; h <= 21; h++) {
        const horaStr = `${h}:00`;
        const el = document.createElement('div');
        el.className = 'hora-label';
        el.innerText = horaStr;
        el.style.gridColumn = "1";
        el.style.gridRow = `${((h - 7) * 2) + 2}`;
        grid.appendChild(el);
    }
}

// Llama a esta función una sola vez al cargar la página
generarLabelsHoras();












document.getElementById('download-btn')?.addEventListener('click', async () => {
    // 1. Seleccionamos el contenedor que tiene la tabla
    const tabla = document.querySelector('.tabla-contenedor') as HTMLElement;

    if (!tabla) return;

    // @ts-ignore (evita errores si no tienes los tipos instalados)
    const canvas = await html2canvas(tabla, {
        backgroundColor: "#ffffff", // Asegura fondo blanco
        scale: 2, // Mejora la calidad de la imagen
        logging: false,
        useCORS: true // Por si usas imágenes externas
    });

    const link = document.createElement('a');
    link.download = 'mi-horario-planificado.png';
    link.href = canvas.toDataURL("image/png");
    link.click();
});







// Mostrar/Ocultar Menú
const trigger = document.getElementById('user-menu-trigger');
const dropdown = document.getElementById('user-dropdown');

trigger?.addEventListener('click', () => dropdown?.classList.toggle('active'));

// Ver Perfil (Cargar horarios guardados)
document.getElementById('view-profile-btn')?.addEventListener('click', async () => {
    dropdown?.classList.remove('active');
    const modal = document.getElementById('profile-modal');
    modal?.classList.add('is-visible');


    try {
        const response = await fetch("https://planificadordehorarios.onrender.com/horarios", {
            headers: {
                "Authorization": `Bearer ${localStorage.getItem('user_token')}`
            }
        });

        if (response.ok) {
            const horarios = await response.json();
            renderSavedSchedules(horarios);
        }
    } catch (error) {
        alert("No se pudieron cargar tus horarios");
    }
});

function renderSavedSchedules(horarios: any[]) {
    const container = document.getElementById('saved-schedules-list');
    if (!container) return;

    if (horarios.length === 0) {
        container.innerHTML = "<p class='empty-msg'>Aún no tienes horarios guardados.</p>";
        return;
    }

    // 1. Limpiamos el contenedor antes de inyectar nuevos elementos
    container.innerHTML = "";

    document.querySelector('.close-modal')?.addEventListener('click', () => {
        const modal = document.getElementById('profile-modal');
        modal?.classList.remove('is-visible');
    });

    // 2. Creamos los elementos uno por uno para asignarles el evento correctamente
    horarios.forEach((h, i) => {
        const card = document.createElement('div');
        card.className = "schedule-card";

        // Estructura interna de la card
        card.innerHTML = `<strong>Horario #${i + 1}</strong>
    <p style="font-size: 0.7rem; color: #7f8c8d; margin-top: 5px;"> ${h.fechaCreacion ? new Date(h.fechaCreacion).toLocaleDateString() : 'Sin fecha'}</p>`;

        card.addEventListener('click', () => {
            console.log(`Cargando horario guardado en el índice: ${i}`);

            // Llamamos a la función que pinta el grid (pásale el objeto completo)
            renderizarHorario(horarios[i]);

            // 4. Cerramos el modal automáticamente al seleccionar
            const modal = document.getElementById('profile-modal');
            modal?.classList.remove('is-visible');

            alert("Horario cargado desde tu perfil");
        });

        container.appendChild(card);
    });
}
// Cerrar sesión
document.getElementById('logout-btn')?.addEventListener('click', () => {
    localStorage.removeItem('user_token');
    window.location.href = "/login.html";
});
























const checkAuth = () => {
    const token = localStorage.getItem('user_token');
    const path = window.location.pathname;

    // Si no hay token y no está en login, al calabozo (login)
    if (!token && !path.includes('login.html')) {
        window.location.href = '/login.html';
    }

    // Si ya está logueado e intenta ir al login, mándalo al index
    if (token && path.includes('login.html')) {
        window.location.href = '/index.html';
    }
};

checkAuth();

document.getElementById('logo-home')?.addEventListener('click', () => {
    window.location.href = '/index.html';
});