// Variables globales
let clickModeEnabled = false;
let isInitialized = false;

// Verificar si estamos en un contexto válido de extensión
function isExtensionContext() {
    return typeof chrome !== 'undefined' && 
           chrome.runtime && 
           chrome.runtime.id && 
           !chrome.runtime.lastError;
}

// Inicialización más robusta
function initializeExtension() {
    if (isInitialized) return;
    
    // Verificar contexto antes de continuar
    if (!isExtensionContext()) {
        console.warn('Body HTML Extractor: Contexto de extensión no válido, saltando inicialización');
        return;
    }
    
    isInitialized = true;
    console.log('Body HTML Extractor: Inicializando...');
    
    // Verificar que chrome.storage esté disponible
    if (chrome.storage && chrome.storage.local) {
        try {
            chrome.storage.local.get(['clickMode'], function(result) {
                if (chrome.runtime.lastError) {
                    console.warn('Error al cargar configuración:', chrome.runtime.lastError);
                    clickModeEnabled = false;
                } else {
                    clickModeEnabled = result.clickMode || false;
                    console.log('Modo click cargado:', clickModeEnabled);
                    if (clickModeEnabled) {
                        enableClickMode();
                        showNotification('👆 Modo click ACTIVADO - Haz click en cualquier parte', 'success');
                    } else {
                        showNotification('🔍 Body HTML Extractor activado', 'info');
                    }
                }
            });
        } catch (error) {
            console.warn('Error accediendo a chrome.storage:', error);
            clickModeEnabled = false;
            showNotification('🔍 Body HTML Extractor activado', 'info');
        }
    } else {
        console.warn('chrome.storage no disponible, usando valores por defecto');
        clickModeEnabled = false;
        showNotification('🔍 Body HTML Extractor activado', 'info');
    }
    
    // Deshabilitar protecciones contra clic derecho
    disableRightClickProtection();
}

// Inicializar cuando el DOM esté listo - con verificación adicional
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(initializeExtension, 100); // Pequeño delay para asegurar contexto
    });
} else {
    setTimeout(initializeExtension, 100);
}

// Re-inicializar en cambios de página (para SPAs)
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        isInitialized = false;
        setTimeout(initializeExtension, 1000);
    }
}).observe(document, {subtree: true, childList: true});

// Escuchar mensajes del popup - solo si el contexto es válido
if (isExtensionContext() && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        // Verificar contexto en cada mensaje
        if (!isExtensionContext()) {
            console.warn('Contexto de extensión perdido');
            sendResponse({success: false, error: 'Extension context lost'});
            return;
        }
        
        console.log('Mensaje recibido:', request);
        
        if (request.action === 'getState') {
            // Enviar el estado actual al popup
            sendResponse({
                success: true,
                clickMode: clickModeEnabled,
                isInitialized: isInitialized
            });
            
        } else if (request.action === 'toggleClickMode') {
            clickModeEnabled = request.enabled;
            console.log('Cambiando modo click a:', clickModeEnabled);
            
            // Guardar estado si chrome.storage está disponible
            if (chrome.storage && chrome.storage.local) {
                try {
                    chrome.storage.local.set({'clickMode': clickModeEnabled});
                } catch (error) {
                    console.warn('Error guardando configuración:', error);
                }
            }
            
            if (clickModeEnabled) {
                enableClickMode();
                showNotification('👆 Modo click ACTIVADO - Haz click en cualquier parte', 'success');
            } else {
                disableClickMode();
                showNotification('❌ Modo click DESACTIVADO', 'info');
            }
            sendResponse({success: true});
            
        } else if (request.action === 'extractHTML') {
            console.log('Extrayendo HTML...');
            const result = extractBodyHTML();
            sendResponse({success: result});
        }
        
        return true;
    });
}

// Función para extraer HTML del body
function extractBodyHTML() {
    try {
        console.log('Iniciando extracción de HTML...');
        
        const body = document.body;
        if (!body) {
            console.error('No se encontró el elemento body');
            showNotification('❌ Error: No se encontró el elemento body', 'error');
            return false;
        }
        
        // Obtener el HTML completo del body incluyendo las etiquetas de apertura y cierre
        const bodyHTML = body.outerHTML;
        console.log('HTML extraído, longitud:', bodyHTML.length);
        
        // Copiar al portapapeles usando la API moderna
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(bodyHTML).then(() => {
                console.log('Copiado exitosamente con clipboard API');
                showNotification('✅ HTML del BODY copiado exitosamente!', 'success');
                showCopySuccess();
            }).catch(err => {
                console.error('Error con clipboard API:', err);
                fallbackCopyToClipboard(bodyHTML);
            });
        } else {
            console.log('Usando método fallback para copiar');
            fallbackCopyToClipboard(bodyHTML);
        }
        
        return true;
    } catch (error) {
        console.error('Error al extraer HTML:', error);
        showNotification('❌ Error al extraer HTML: ' + error.message, 'error');
        return false;
    }
}

// Función fallback para copiar al portapapeles
function fallbackCopyToClipboard(text) {
    try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
            console.log('Copiado exitosamente con método fallback');
            showNotification('✅ HTML del BODY copiado exitosamente!', 'success');
            showCopySuccess();
        } else {
            throw new Error('execCommand falló');
        }
    } catch (err) {
        console.error('Error en fallback:', err);
        showNotification('❌ Error al copiar: ' + err.message, 'error');
    }
}

// Habilitar modo click
function enableClickMode() {
    console.log('Habilitando modo click...');
    document.addEventListener('click', handleClick, true);
    document.body.style.cursor = 'copy';
    
    // Agregar indicador visual persistente
    addPersistentIndicator();
}

// Deshabilitar modo click
function disableClickMode() {
    console.log('Deshabilitando modo click...');
    document.removeEventListener('click', handleClick, true);
    document.body.style.cursor = '';
    
    // Remover indicador visual
    removePersistentIndicator();
}

// Manejar click en modo click
function handleClick(event) {
    if (clickModeEnabled) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        
        console.log('Click detectado en modo click');
        
        // Mostrar feedback visual inmediato
        showClickFeedback(event.clientX, event.clientY);
        
        // Extraer HTML
        extractBodyHTML();
    }
}

// Deshabilitar protecciones contra clic derecho y selección
function disableRightClickProtection() {
    // Deshabilitar prevención de menú contextual
    document.addEventListener('contextmenu', function(e) {
        e.stopPropagation();
    }, true);
    
    // Deshabilitar prevención de selección
    document.addEventListener('selectstart', function(e) {
        e.stopPropagation();
    }, true);
    
    // Deshabilitar prevención de arrastrar
    document.addEventListener('dragstart', function(e) {
        e.stopPropagation();
    }, true);
    
    // Remover estilos CSS que deshabilitan la selección
    const style = document.createElement('style');
    style.textContent = `
        * {
            -webkit-user-select: text !important;
            -moz-user-select: text !important;
            -ms-user-select: text !important;
            user-select: text !important;
        }
    `;
    document.head.appendChild(style);
    
    // Deshabilitar eventos JavaScript que previenen clic derecho
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
        if (script.innerHTML.includes('contextmenu') || 
            script.innerHTML.includes('selectstart') ||
            script.innerHTML.includes('dragstart') ||
            script.innerHTML.includes('oncontextmenu') ||
            script.innerHTML.includes('onselectstart')) {
            script.remove();
        }
    });
}

// Mostrar notificación mejorada
function showNotification(message, type = 'info') {
    console.log('Mostrando notificación:', message, type);
    
    // Remover notificación existente
    const existingNotification = document.getElementById('bodyExtractorNotification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Crear nueva notificación
    const notification = document.createElement('div');
    notification.id = 'bodyExtractorNotification';
    
    const colors = {
        success: '#4CAF50',
        error: '#f44336',
        info: '#2196F3'
    };
    
    notification.style.cssText = `
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        background: ${colors[type]} !important;
        color: white !important;
        padding: 15px 20px !important;
        border-radius: 8px !important;
        font-family: Arial, sans-serif !important;
        font-size: 14px !important;
        font-weight: 500 !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
        z-index: 2147483647 !important;
        animation: slideIn 0.3s ease !important;
        max-width: 350px !important;
        word-wrap: break-word !important;
        border: 2px solid rgba(255,255,255,0.3) !important;
    `;
    
    // Agregar animación CSS si no existe
    if (!document.getElementById('bodyExtractorStyles')) {
        const styles = document.createElement('style');
        styles.id = 'bodyExtractorStyles';
        styles.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            @keyframes pulse {
                0% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.05); }
                100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
        `;
        document.head.appendChild(styles);
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto-remover después de 4 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 4000);
}

// Mostrar feedback visual de copia exitosa
function showCopySuccess() {
    const successIcon = document.createElement('div');
    successIcon.style.cssText = `
        position: fixed !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        background: rgba(76, 175, 80, 0.95) !important;
        color: white !important;
        padding: 20px 30px !important;
        border-radius: 50px !important;
        font-family: Arial, sans-serif !important;
        font-size: 18px !important;
        font-weight: bold !important;
        z-index: 2147483647 !important;
        animation: successPop 0.6s ease !important;
        box-shadow: 0 8px 25px rgba(76, 175, 80, 0.4) !important;
        border: 3px solid rgba(255,255,255,0.3) !important;
    `;
    
    successIcon.innerHTML = '✅ HTML COPIADO';
    document.body.appendChild(successIcon);
    
    // Agregar animación de éxito
    if (!document.getElementById('successAnimation')) {
        const successStyles = document.createElement('style');
        successStyles.id = 'successAnimation';
        successStyles.textContent = `
            @keyframes successPop {
                0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
                50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
                100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            }
        `;
        document.head.appendChild(successStyles);
    }
    
    setTimeout(() => {
        if (successIcon.parentNode) {
            successIcon.remove();
        }
    }, 1500);
}

// Mostrar feedback en la posición del click
function showClickFeedback(x, y) {
    const clickFeedback = document.createElement('div');
    clickFeedback.style.cssText = `
        position: fixed !important;
        left: ${x}px !important;
        top: ${y}px !important;
        transform: translate(-50%, -50%) !important;
        background: rgba(33, 150, 243, 0.9) !important;
        color: white !important;
        padding: 8px 12px !important;
        border-radius: 20px !important;
        font-family: Arial, sans-serif !important;
        font-size: 12px !important;
        font-weight: bold !important;
        z-index: 2147483647 !important;
        animation: clickRipple 0.8s ease !important;
        pointer-events: none !important;
    `;
    
    clickFeedback.textContent = '🔍 Extrayendo...';
    document.body.appendChild(clickFeedback);
    
    // Agregar animación de click
    if (!document.getElementById('clickAnimation')) {
        const clickStyles = document.createElement('style');
        clickStyles.id = 'clickAnimation';
        clickStyles.textContent = `
            @keyframes clickRipple {
                0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
                100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
            }
        `;
        document.head.appendChild(clickStyles);
    }
    
    setTimeout(() => {
        if (clickFeedback.parentNode) {
            clickFeedback.remove();
        }
    }, 800);
}

// Agregar indicador persistente para modo click
function addPersistentIndicator() {
    // Remover indicador existente
    removePersistentIndicator();
    
    const indicator = document.createElement('div');
    indicator.id = 'bodyExtractorPersistentIndicator';
    indicator.style.cssText = `
        position: fixed !important;
        bottom: 20px !important;
        left: 20px !important;
        background: rgba(76, 175, 80, 0.9) !important;
        color: white !important;
        padding: 10px 15px !important;
        border-radius: 25px !important;
        font-family: Arial, sans-serif !important;
        font-size: 12px !important;
        font-weight: 500 !important;
        z-index: 2147483646 !important;
        animation: pulse 2s infinite !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
        border: 2px solid rgba(255,255,255,0.3) !important;
        pointer-events: none !important;
    `;
    
    indicator.innerHTML = '👆 MODO CLICK ACTIVO';
    document.body.appendChild(indicator);
}

// Remover indicador persistente
function removePersistentIndicator() {
    const indicator = document.getElementById('bodyExtractorPersistentIndicator');
    if (indicator) {
        indicator.remove();
    }
}

// Agregar indicador visual temporal (mantener para compatibilidad)
function addVisualIndicator() {
    addPersistentIndicator();
}

// Remover indicador visual (mantener para compatibilidad)
function removeVisualIndicator() {
    removePersistentIndicator();
}
