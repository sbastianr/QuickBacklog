// Guardar la configuración
document.getElementById('saveBtn').addEventListener('click', () => {
    const n8nUrl = document.getElementById('n8nUrl').value;
    const projectsList = document.getElementById('projectsList').value;

    // Validar si el JSON de proyectos es correcto
    try {
        JSON.parse(projectsList);
    } catch (e) {
        document.getElementById('status').textContent = "❌ Error: El formato JSON de proyectos no es válido.";
        document.getElementById('status').style.color = "red";
        return;
    }

    chrome.storage.local.set({
        n8nUrl: n8nUrl,
        projectsList: projectsList
    }, () => {
        const status = document.getElementById('status');
        status.textContent = "✅ Configuración guardada correctamente.";
        status.style.color = "green";
        setTimeout(() => { status.textContent = ""; }, 3000);
    });
});

// Cargar la configuración actual al abrir la página
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['n8nUrl', 'projectsList'], (result) => {
        if (result.n8nUrl) document.getElementById('n8nUrl').value = result.n8nUrl;
        if (result.projectsList) document.getElementById('projectsList').value = result.projectsList;
    });
});