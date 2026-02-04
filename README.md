# QuickBacklog 🚀

**QuickBacklog** es una extensión de Chrome (Manifest V3) diseñada para agilizar el proceso de creación de Historias de Usuario (HU) en Azure DevOps. Permite a los desarrolladores y product owners capturar ideas rápidamente y enviarlas a través de un Webhook de **n8n** para su procesamiento y registro automático.

## 📌 Características

- **Diseño Moderno e Intuitivo:** Interfaz limpia basada en Web Components y Vanilla CSS.
- **Configuración Dinámica:** Página de opciones para gestionar URLs de Webhooks, tokens de acceso (PAT) y múltiples proyectos.
- **Selección de Proyectos:** Dropdown dinámico que se llena con los proyectos configurados por el usuario.
- **Adjuntos de Archivos:** Soporte para adjuntar imágenes o documentos mediante Drag & Drop, convirtiéndolos automáticamente a Base64 para el envío.
- **Validación Integrada:** Asegura que toda la información necesaria esté completa antes del envío.

## 🛠️ Requisitos Pasos Previos

Para que la extensión funcione correctamente, necesitas:
1. Un **Webhook de n8n** configurado para recibir peticiones POST.
2. Un **Personal Access Token (PAT)** de Azure DevOps (si tu flujo de n8n lo requiere).
3. Tener los archivos de la extensión en una carpeta local.

## 🚀 Cómo Usar

### 1. Instalación en Chrome
1. Abre Google Chrome y navega a `chrome://extensions/`.
2. Activa el **Modo de desarrollador** (esquina superior derecha).
3. Haz clic en **Cargar descomprimida** (Load unpacked).
4. Selecciona la carpeta raíz del proyecto `QuickBacklog`.

### 2. Configuración Inicial
Antes de usarla por primera vez, debes configurar tus credenciales:
1. Haz clic derecho en el icono de la extensión (o ve a sus detalles) y selecciona **Opciones**.
2. Introduce la **URL del Webhook de n8n**.
3. (Opcional) Introduce tu **Azure PAT**.
4. Añade tus proyectos (Nombre e ID).
5. Haz clic en **Guardar Configuración**.

### 3. Crear una Historia de Usuario
1. Haz clic en el icono de la extensión en la barra de herramientas.
2. Selecciona el **Proyecto** deseado.
3. Escribe el **Nombre de la HU** y una **Descripción** detallada.
4. (Opcional) Arrastra o selecciona archivos para adjuntar.
5. Haz clic en **Subir a Backlog**.

---

## 📡 Estructura del JSON de Envío

La extensión envía un objeto JSON con el siguiente formato al Webhook configurado:

```json
{
  "project": "ID-DEL-PROYECTO",
  "title": "Nombre de la HU",
  "description": "Detalles de la historia...",
  "files": [
    {
      "name": "captura.png",
      "type": "image/png",
      "content": "iVBORw0KG..." // Base64 sin el prefijo data:image/png;base64,
    }
  ],
  "timestamp": "2024-02-04T12:00:00.000Z",
  "azurePat": "tu-token-aqui"
}
```

---
*Desarrollado con ❤️ para mejorar la productividad en equipos de desarrollo.*
