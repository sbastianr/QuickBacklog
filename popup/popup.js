document.addEventListener('DOMContentLoaded', () => {
    const projectSelect = document.getElementById('projectSelect');
    const sendBtn = document.getElementById('sendBtn');
    const statusMessage = document.getElementById('statusMessage');
    const configBtn = document.getElementById('configBtn');
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const fileCount = document.getElementById('fileCount');

    const huContainer = document.getElementById('huContainer');
    const huDropdown = document.getElementById('huDropdown');
    const huSelected = document.getElementById('huSelected');
    const huOptions = document.getElementById('huOptions');
    const huAddForm = document.getElementById('huAddForm');
    const saveHuBtn = document.getElementById('saveHuBtn');
    const cancelHuBtn = document.getElementById('cancelHuBtn');
    const taskTitle = document.getElementById('taskTitle');
    const taskCode = document.getElementById('taskCode');

    const attachmentPreview = document.getElementById('attachmentPreview');
    const clearBtn = document.getElementById('clearBtn');

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

    // 2. Gestión de Dropdown de HUs
    huSelected.addEventListener('click', () => {
        const isHidden = huOptions.style.display === 'none';
        huOptions.style.display = isHidden ? 'block' : 'none';
    });

    // Cerrar dropdown al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!huDropdown.contains(e.target)) {
            huOptions.style.display = 'none';
        }
    });

    projectSelect.addEventListener('change', () => {
        const project = projectSelect.value;
        if (project) {
            huContainer.style.display = 'block';
            huSelected.textContent = "Selecciona Historia de Usuario...";
            taskTitle.value = '';
            taskCode.value = '';
            loadHUs(project);
        } else {
            huContainer.style.display = 'none';
        }
    });

    function loadHUs(project) {
        const key = `hus_${project}`;
        chrome.storage.local.get([key], (res) => {
            const hus = res[key] || [];
            renderHUOptions(hus, project);
        });
    }

    function renderHUOptions(hus, project) {
        huOptions.innerHTML = '';

        // Listar HUs
        hus.forEach((hu, index) => {
            const option = document.createElement('div');
            option.className = 'dropdown-option';
            option.innerHTML = `
                <div class="hu-info"><b>${hu.code}</b> ${hu.name}</div>
                <span class="del-mini" title="Eliminar">&times;</span>
            `;

            option.addEventListener('click', (e) => {
                if (e.target.className !== 'del-mini') {
                    selectHU(hu.code, hu.name);
                    huOptions.style.display = 'none';
                }
            });

            option.querySelector('.del-mini').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteHU(index, project);
            });

            huOptions.appendChild(option);
        });

        // Botón Añadir al final
        const addBtn = document.createElement('div');
        addBtn.className = 'btn-add-option';
        addBtn.textContent = "+ Añadir Nueva Historia";
        addBtn.addEventListener('click', () => {
            huOptions.style.display = 'none';
            huAddForm.style.display = 'flex';
        });
        huOptions.appendChild(addBtn);
    }

    function selectHU(code, name) {
        huSelected.innerHTML = `<b>${code}</b> ${name}`;
        taskTitle.value = name;
        taskCode.value = code;
    }

    function deleteHU(index, project) {
        const key = `hus_${project}`;
        chrome.storage.local.get([key], (res) => {
            const hus = res[key] || [];
            hus.splice(index, 1);
            chrome.storage.local.set({ [key]: hus }, () => loadHUs(project));
        });
    }

    // Modal de añadir HU
    saveHuBtn.addEventListener('click', () => {
        const project = projectSelect.value;
        const code = document.getElementById('huCodeManual').value.trim();
        const name = document.getElementById('huNameManual').value.trim();

        if (!code || !name) {
            alert("Completa ambos campos");
            return;
        }

        const key = `hus_${project}`;
        chrome.storage.local.get([key], (res) => {
            const hus = res[key] || [];
            hus.push({ code, name });
            chrome.storage.local.set({ [key]: hus }, () => {
                document.getElementById('huCodeManual').value = '';
                document.getElementById('huNameManual').value = '';
                huAddForm.style.display = 'none';
                loadHUs(project);
            });
        });
    });

    cancelHuBtn.addEventListener('click', () => {
        huAddForm.style.display = 'none';
    });

    // 3. Abrir configuración
    configBtn.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });

    // 4. Manejo de archivos (Dropzone & Paste)
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

    // SOPORTE PARA PEGAR IMÁGENES (Ctrl+V)
    document.addEventListener('paste', async (e) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                const base64 = await toBase64(file);
                const name = `pasted_img_${new Date().getTime()}.png`;
                attachments.push({
                    name: name,
                    content: base64.split(',')[1],
                    contentType: file.type
                });
                fileCount.textContent = `${attachments.length} archivo(s)`;
                statusMessage.textContent = "📸 Imagen pegada con éxito";
                statusMessage.style.color = "var(--primary)";
                setTimeout(() => {
                    if (statusMessage.textContent === "📸 Imagen pegada con éxito") statusMessage.textContent = "";
                }, 2000);
            }
        }
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

    // 5. Botón Limpiar Todo
    clearBtn.addEventListener('click', () => {
        // Reset inputs
        taskTitle.value = '';
        taskCode.value = '';
        document.getElementById('taskDescription').value = '';
        document.getElementById('taskTime').value = '';
        document.getElementById('timeUnit').value = 'min';

        // Reset Select & HU
        projectSelect.selectedIndex = 0;
        huContainer.style.display = 'none';
        huSelected.textContent = "Selecciona Historia de Usuario...";

        // Reset Files
        attachments = [];
        fileCount.textContent = '';

        // Status
        statusMessage.textContent = "✨ Formulario limpio";
        statusMessage.style.color = "var(--text-secondary)";
        setTimeout(() => { statusMessage.textContent = ""; }, 2000);
    });

    // 6. Enviar a Azure DevOps vía n8n
    sendBtn.addEventListener('click', async () => {
        const title = taskTitle.value;
        const code = taskCode.value;
        const description = document.getElementById('taskDescription').value;
        const project = projectSelect.value;
        const taskTime = document.getElementById('taskTime').value;
        const timeUnit = document.getElementById('timeUnit').value;

        if (!title || !project) {
            alert("Selecciona una Historia de Usuario del desplegable.");
            return;
        }

        // VALIDACIÓN DE TIEMPO: Máximo 8 horas
        if (taskTime) {
            const timeVal = parseFloat(taskTime);
            if (timeUnit === 'h' && timeVal > 8) {
                alert("El tiempo no puede ser superior a 8 horas.");
                return;
            }
            if (timeUnit === 'min' && timeVal > 480) {
                alert("El tiempo no puede ser superior a 480 minutos (8 horas).");
                return;
            }
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
                    code,
                    description,
                    project,
                    time: taskTime,
                    timeUnit: timeUnit,
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

                    // Solo limpiar los campos de la tarea, no todo si el usuario quiere seguir
                    document.getElementById('taskDescription').value = '';
                    document.getElementById('taskTime').value = '';
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
