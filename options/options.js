// Cargar configuración guardada al abrir la página
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['azureToken', 'fetchWebhook', 'submitWebhook', 'selectedProjects'], (res) => {
        if (res.azureToken) document.getElementById('azureToken').value = res.azureToken;
        if (res.fetchWebhook) document.getElementById('fetchWebhook').value = res.fetchWebhook;
        if (res.submitWebhook) document.getElementById('submitWebhook').value = res.submitWebhook;

        if (res.selectedProjects && res.selectedProjects.length > 0) {
            renderProjectChecklist(res.selectedProjects, true); // true indica que ya están seleccionados
        }
    });
});

// Botón para buscar proyectos vía n8n
document.getElementById('fetchBtn').addEventListener('click', async () => {
    const pat = document.getElementById('azureToken').value;
    const webhookUrl = document.getElementById('fetchWebhook').value;
    const statusDiv = document.getElementById('status');

    if (!pat || !webhookUrl) {
        alert("Por favor, ingresa el PAT y el Webhook de búsqueda.");
        return;
    }

    statusDiv.textContent = "Buscando proyectos...";
    document.getElementById('fetchBtn').disabled = true;

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pat: pat })
        });

        if (!response.ok) throw new Error("Error en la respuesta del Webhook");

        const projects = await response.json(); // Se espera un array de strings o {name, id}
        renderProjectChecklist(projects);
        statusDiv.textContent = "Proyectos cargados.";
    } catch (error) {
        console.error(error);
        statusDiv.textContent = "Error al buscar proyectos: " + error.message;
    } finally {
        document.getElementById('fetchBtn').disabled = false;
    }
});

// Función para renderizar la lista de proyectos con checkboxes
function renderProjectChecklist(projects, areAlreadySelected = false) {
    const container = document.getElementById('projectListContainer');
    const list = document.getElementById('projectChecklist');
    list.innerHTML = '';
    container.style.display = 'block';

    projects.forEach(project => {
        const name = typeof project === 'string' ? project : project.name;
        const div = document.createElement('div');
        div.className = 'project-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = name;
        checkbox.id = `pj-${name}`;
        if (areAlreadySelected) checkbox.checked = true;

        const label = document.createElement('label');
        label.htmlFor = `pj-${name}`;
        label.textContent = name;
        label.style.display = 'inline';
        label.style.marginLeft = '8px';

        div.appendChild(checkbox);
        div.appendChild(label);
        list.appendChild(div);
    });
}

// Botón para guardar toda la configuración
document.getElementById('saveBtn').addEventListener('click', () => {
    const azureToken = document.getElementById('azureToken').value;
    const fetchWebhook = document.getElementById('fetchWebhook').value;
    const submitWebhook = document.getElementById('submitWebhook').value;

    const selectedProjects = [];
    document.querySelectorAll('#projectChecklist input[type="checkbox"]:checked').forEach(cb => {
        selectedProjects.push(cb.value);
    });

    chrome.storage.local.set({
        azureToken,
        fetchWebhook,
        submitWebhook,
        selectedProjects
    }, () => {
        const status = document.getElementById('status');
        status.textContent = "✅ Configuración guardada correctamente.";
        status.style.color = "green";
        setTimeout(() => status.textContent = "", 3000);
    });
});