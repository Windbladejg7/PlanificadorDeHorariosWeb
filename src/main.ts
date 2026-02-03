import './style.css'

const url = "http://localhost:5046";

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
fileInput?.addEventListener('change', async() => {
    if (fileInput.files?.length) {
        await handleFiles(fileInput.files);
    }
});

async function handleFiles(files: FileList): Promise<void> {
    const file = files[0];
    if (!file) return;

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
        if (statusText) statusText.innerText = "Subiendo imagen...";
        statusContainer?.classList.add('is-loading');
        dropZone?.classList.add('drop-zone--loading');

        const formData = new FormData();
        formData.append('file', file); // 'archivo' debe coincidir con el C#

        const response = await fetch('http://localhost:5046/imagen/subir', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error("Error en la subida");

        const datos = await response.json();
        console.log("Respuesta de la API:", datos);
        
    } catch (error) {
        if (statusText) statusText.innerText = "Error al subir el archivo.";
        console.error("Fallo el fetch:", error);
    }finally{
        statusContainer?.classList.remove('is-loading');
        if (statusText) statusText.innerText = "";
        dropZone?.classList.remove('drop-zone--loading');
    }
}

