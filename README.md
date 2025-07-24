# Body HTML Extractor - Extensión de Chrome

Una extensión de Chrome que permite extraer el HTML completo del elemento `<body>` de cualquier página web, similar a la funcionalidad "Copiar outerHTML" de las DevTools.

## 🚀 Características

- ✅ Extrae el HTML completo del `<body>` incluyendo etiquetas de apertura y cierre
- 🖱️ Modo click: activa/desactiva extracción con un simple click en la página
- 🛡️ Bypassa protecciones contra clic derecho y selección de texto
- 📋 Copia automáticamente al portapapeles
- 🎯 Notificaciones visuales de confirmación
- 🎨 Interfaz moderna y fácil de usar

## 📦 Instalación

### Método 1: Instalación Manual (Recomendado)

1. **Descarga los archivos**: Guarda todos los archivos en una carpeta llamada `body-html-extractor`

2. **Crear iconos**: Necesitas crear 3 iconos para la extensión:
   - `icon16.png` (16x16 píxeles)
   - `icon48.png` (48x48 píxeles) 
   - `icon128.png` (128x128 píxeles)

3. **Abrir Chrome**: Ve a `chrome://extensions/`

4. **Habilitar modo desarrollador**: Activa el toggle "Modo de desarrollador" en la esquina superior derecha

5. **Cargar extensión**: Haz click en "Cargar extensión sin empaquetar" y selecciona la carpeta `body-html-extractor`

6. **¡Listo!**: La extensión aparecerá en tu barra de herramientas

### Método 2: Crear iconos simples

Si no tienes iconos, puedes crear archivos PNG simples o usar este comando para generar iconos básicos:

```html
<!-- Guarda esto como icon-generator.html y ábrelo en el navegador -->
<!DOCTYPE html>
<html>
<head><title>Generador de Iconos</title></head>
<body>
    <canvas id="canvas" width="128" height="128"></canvas>
    <script>
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        
        // Fondo gradiente
        const gradient = ctx.createLinearGradient(0, 0, 128, 128);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 128, 128);
        
        // Texto
        ctx.fillStyle = 'white';
        ctx.font = 'bold 60px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🔍', 64, 85);
        
        // Descargar para diferentes tamaños
        ['16', '48', '128'].forEach(size => {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = size;
            tempCanvas.height = size;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(canvas, 0, 0, size, size);
            
            const link = document.createElement('a');
            link.download = `icon${size}.png`;
            link.href = tempCanvas.toDataURL();
            link.click();
        });
    </script>
</body>
</html>
```

## 🎯 Cómo usar

### Modo Manual
1. Haz click en el icono de la extensión
2. Asegúrate de que "Modo Click" esté desactivado
3. Haz click en "📋 Extraer HTML del Body"
4. El HTML se copiará automáticamente al portapapeles

### Modo Click
1. Haz click en el icono de la extensión
2. Activa el toggle "Modo Click"
3. Haz click en cualquier parte de la página web
4. El HTML se copiará automáticamente al portapapeles

## 🛡️ Funcionalidades de Seguridad

La extensión automáticamente:
- Desactiva protecciones JavaScript contra clic derecho
- Remueve estilos CSS que impiden la selección de texto
- Bypassa eventos que bloquean el menú contextual
- Permite la extracción de HTML incluso en sitios protegidos

## 📁 Estructura de Archivos

```
body-html-extractor/
├── manifest.json       # Configuración de la extensión
├── popup.html          # Interfaz de usuario
├── popup.js            # Lógica del popup
├── content.js          # Script principal de extracción
├── icon16.png          # Icono 16x16
├── icon48.png          # Icono 48x48
├── icon128.png         # Icono 128x128
└── README.md           # Este archivo
```

## 🔧 Permisos Requeridos

- `activeTab`: Para acceder a la pestaña activa
- `scripting`: Para inyectar scripts en las páginas web

## 🐛 Solución de Problemas

### La extensión no aparece
- Verifica que el modo desarrollador esté activado
- Revisa que todos los archivos estén en la carpeta correcta
- Asegúrate de que el `manifest.json` sea válido

### No se copia el HTML
- Verifica los permisos del portapapeles en tu navegador
- Intenta refrescar la página y volver a intentar
- Revisa la consola de DevTools para errores

### El modo click no funciona
- Asegúrate de que la extensión tenga permisos en la página
- Algunos sitios muy seguros pueden bloquear la funcionalidad
- Intenta usar el modo manual como alternativa

## 🔄 Actualizaciones

Para actualizar la extensión:
1. Reemplaza los archivos en la carpeta
2. Ve a `chrome://extensions/`
3. Haz click en el botón de refrescar de la extensión

## ⚠️ Consideraciones Legales

Esta extensión está diseñada para propósitos de desarrollo y análisis web legítimos. Úsala responsablemente y respeta los términos de servicio de los sitios web que visites.

## 🤝 Contribuciones

Si encuentras bugs o tienes sugerencias de mejora, no dudes en reportarlos.