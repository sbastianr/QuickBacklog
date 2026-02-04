document.addEventListener('DOMContentLoaded', () => {
    const projectSelect = document.getElementById('projectSelect');
    const sendBtn = document.getElementById('sendBtn');
    const statusMessage = document.getElementById('statusMessage');
    const configBtn = document.getElementById('configBtn');
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const fileCount = document.getElementById('fileCount');

    let attachments = [];

    // 1. Cargar proyectos seleccionados desde storage
    chrome.storage.local.get(['selectedProjects', 'submitWebhook', 'azureToken'], (res) => {
        if (res.selectedProjects && res.selectedProjects.length > 0) {
            res.selectedProjects.forEach(project => {
                const option = document.createElement('option');
                option.value = project;
                option.textContent = project;
                projectSelect.appendChild(option);
            });
        } else {
            const option = document.createElement('option');
            option.textContent = "No hay proyectos configurados";
            option.disabled = true;
            projectSelect.appendChild(option);
        }

        if (!res.submitWebhook || !res.azureToken) {
            statusMessage.textContent = "⚠️ Configura el Webhook y el PAT en opciones.";
            statusMessage.style.color = "#ffb900";
        }
    });

    // 2. Abrir configuración
    configBtn.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });

    // 3. Manejo de archivos (Dropzone)
    dropzone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', handleFiles);

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('active');
    });

    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('active'));

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('active');
        handleFiles({ target: { files: e.dataTransfer.files } });
    });

    async function handleFiles(e) {
        const files = Array.from(e.target.files);
        for (const file of files) {
            const base64 = await toBase64(file);
            attachments.push({
                name: file.name,
                content: base64.split(',')[1], // Solo el contenido base64
                contentType: file.type
            });
        }
        fileCount.textContent = `${attachments.length} archivo(s)`;
    }

    const toBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });

    // 4. Enviar a Azure DevOps vía n8n
    sendBtn.addEventListener('click', async () => {
        const title = document.getElementById('taskTitle').value;
        const description = document.getElementById('taskDescription').value;
        const project = projectSelect.value;

        if (!title || !project) {
            alert("Título y Proyecto son obligatorios.");
            return;
        }

        sendBtn.disabled = true;
        statusMessage.textContent = "Enviando...";
        statusMessage.style.color = "white";

        chrome.storage.local.get(['submitWebhook', 'azureToken'], async (res) => {
            if (!res.submitWebhook) {
                statusMessage.textContent = "Error: Webhook no configurado.";
                sendBtn.disabled = false;
                return;
            }

            try {
                const payload = {
                    title,
                    description,
                    project,
                    pat: res.azureToken,
                    attachments
                };

                const response = await fetch(res.submitWebhook, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    statusMessage.textContent = "✅ ¡User Story creada con éxito!";
                    statusMessage.style.color = "#28a745";
                    // Limpiar campos
                    document.getElementById('taskTitle').value = '';
                    document.getElementById('taskDescription').value = '';
                    attachments = [];
                    fileCount.textContent = '';
                } else {
                    throw new Error("Error en el servidor");
                }
            } catch (error) {
                statusMessage.textContent = "❌ Error al enviar la tarea.";
                statusMessage.style.color = "#f44336";
            } finally {
                sendBtn.disabled = false;
            }
        });
    });
});
