import './style.css'
import {renderizarHorario} from "../horario"

export interface Aula {
    nombre: string;
    bloques: any[];
}

interface Materia {
    nombre: string;
    opcionesDeAula: Aula[];
}

const dropZone = document.querySelector<HTMLDivElement>('#drop-zone');
const fileInput = document.querySelector<HTMLInputElement>('#file-input');
const fileList = document.querySelector<HTMLDivElement>('#file-list');
const statusText = document.getElementById('status-text');
const statusContainer = document.getElementById('status-container');


dropZone?.addEventListener('click', () => fileInput?.click());

dropZone?.addEventListener('dragover', (e: DragEvent) => {
    e.preventDefault();
    dropZone.classList.add('drop-zone--over');
});

['dragleave', 'dragend'].forEach(type => {
    dropZone?.addEventListener(type, () => {
        dropZone.classList.remove('drop-zone--over');
    });
});

// Manejar la caída de archivos
dropZone?.addEventListener('drop', async (e: DragEvent) => {
    e.preventDefault();
    dropZone.classList.remove('drop-zone--over');

    if (e.dataTransfer?.files.length) {
        await handleFiles(e.dataTransfer.files);
    }
});

// Manejar selección por click
fileInput?.addEventListener('change', async () => {
    if (fileInput.files?.length) {
        await handleFiles(fileInput.files);
    }
});

async function handleFiles(files: FileList): Promise<void> {
    const file = files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];

    // 1. Validar Tipo de Archivo
    if (!allowedTypes.includes(file.type)) {
        alert("Formato no permitido. Solo JPG, PNG o PDF.");
        if (fileInput) fileInput.value = ""; // Reset
        return;
    }


    // --- Lógica de UI (lo que ya tenías) ---
    if (fileList) {
        fileList.innerHTML = "";
        const container = document.createElement('div');
        container.className = 'file-item';
        container.innerHTML = `
            <span>📄 ${file.name} ( ${(file.size / 1024).toFixed(2)} KB)</span>
            <button id="remove-file">✕</button>
        `;
        fileList.appendChild(container);

        document.getElementById('remove-file')?.addEventListener('click', () => {
            fileList.innerHTML = "";
            if (fileInput) fileInput.value = "";
        });
    }

    // --- Lógica de envío (EL RETO) ---
    try {
        if (statusText) statusText.innerText = "Procesando imagen...";
        statusContainer?.classList.add('is-loading');
        dropZone?.classList.add('drop-zone--loading');

        const formData = new FormData();
        formData.append('file', file); // 'archivo' debe coincidir con el C#

        const response = await fetch('https://planificadordehorarios.onrender.com/imagen/subir', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error("Error en la subida");

        const materias: Materia[] = await response.json();
        console.log("Respuesta de la API:", materias);
        mostrarModalMaterias(materias);

    } catch (error) {
        if (statusText) statusText.innerText = "Error al subir el archivo.";
        console.error("Fallo el fetch:", error);
    } finally {
        statusContainer?.classList.remove('is-loading');
        if (statusText) statusText.innerText = "";
        dropZone?.classList.remove('drop-zone--loading');
    }
}




function mostrarModalMaterias(materias: Materia[]) {
    const modal = document.getElementById('modal-materias');
    const container = document.getElementById('checkbox-list');

    if (!modal || !container) return;

    // 1. Generar Checkboxes directamente (Ya vienen únicas del backend)
    // Usamos m.nombre porque ya está normalizado desde C#
    container.innerHTML = materias.map((materia, index) => `
        <div class="checkbox-item">
            <input type="checkbox" id="mat-${index}" value="${materia.nombre}" class="materia-check">
            <label for="mat-${index}">${materia.nombre}</label>
        </div>
    `).join('');

    // 2. Mostrar Modal
    modal.classList.add('is-visible');

    // 3. Botón Aceptar
    document.getElementById('btn-aceptar')!.onclick = async() => {
        const nombresSeleccionados = Array.from(
            document.querySelectorAll<HTMLInputElement>('.materia-check:checked')
        ).map(cb => cb.value);

        // 4. Filtrar el arreglo de objetos complejos
        // Como el backend ya normalizó, el match es directo y exacto
        const materiasFinales = materias.filter(m =>
            nombresSeleccionados.includes(m.nombre)
        );

        console.log("Materias listas para planificar:", materiasFinales);

        const requestBody = {
            materias: materiasFinales // La clave debe llamarse igual que en el record
        };

        try {
            const response = await fetch("https://planificadordehorarios.onrender.com/horarios", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestBody) // Enviamos el objeto envuelto
            });

            if (response.ok) {
                const data = await response.json();
                console.log("Horarios generados:", data);

                // Guardar y redirigir
                localStorage.setItem('horarioResultado', JSON.stringify(data));
                window.location.href = '../horario.html';
            }
        } catch (error) {
            console.error("Error al generar horarios:", error);
        }

        // Aquí llamarías a tu siguiente función, por ejemplo:
        // generarHorario(materiasFinales);

        modal.classList.remove('is-visible');
    };

    // 4. Botón Cancelar
    document.getElementById('btn-cancelar')!.onclick = () => {
        modal.classList.remove('is-visible');
    };
}




















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