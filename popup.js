document.addEventListener('DOMContentLoaded', function() {
    const clickModeToggle = document.getElementById('clickMode');
    const extractBtn = document.getElementById('extractBtn');
    const status = document.getElementById('status');
    
    // Sincronizar estado con el content script
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (!tabs[0]) {
            showStatus('Error: No se encontró pestaña activa', 'error');
            return;
        }
        
        // Solicitar estado actual del content script
        chrome.tabs.sendMessage(tabs[0].id, {
            action: 'getState'
        }, function(response) {
            if (chrome.runtime.lastError) {
                console.warn('Content script no disponible, cargando desde storage');
                // Fallback: cargar desde storage
                chrome.storage.local.get(['clickMode'], function(result) {
                    clickModeToggle.checked = result.clickMode || false;
                    updateButtonState();
                });
            } else if (response && response.success) {
                // Usar estado del content script
                clickModeToggle.checked = response.clickMode;
                updateButtonState();
                if (response.clickMode) {
                    showStatus('Modo click activo - Haz click en la página', 'success');
                }
            }
        });
    });
    
    // Manejar cambio de modo click
    clickModeToggle.addEventListener('change', function() {
        const isEnabled = this.checked;
        chrome.storage.local.set({'clickMode': isEnabled});
        
        // Enviar mensaje al content script
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (!tabs[0]) {
                showStatus('Error: No se encontró pestaña activa', 'error');
                return;
            }
            
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'toggleClickMode',
                enabled: isEnabled
            }, function(response) {
                if (chrome.runtime.lastError) {
                    console.error('Error de runtime:', chrome.runtime.lastError);
                    showStatus('Error: Recarga la página e intenta de nuevo', 'error');
                    // Revertir el toggle
                    clickModeToggle.checked = !isEnabled;
                    chrome.storage.local.set({'clickMode': !isEnabled});
                    updateButtonState();
                    return;
                }
            });
        });
        
        updateButtonState();
        showStatus(isEnabled ? 'Modo click activado - Haz click en la página' : 'Modo click desactivado', 'success');
    });
    
    // Manejar extracción manual
    extractBtn.addEventListener('click', function() {
        if (clickModeToggle.checked) return;
        
        showStatus('Extrayendo HTML...', 'info');
        
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (!tabs[0]) {
                showStatus('Error: No se encontró pestaña activa', 'error');
                return;
            }
            
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'extractHTML'
            }, function(response) {
                if (chrome.runtime.lastError) {
                    console.error('Error de runtime:', chrome.runtime.lastError);
                    showStatus('Error: Recarga la página e intenta de nuevo', 'error');
                    return;
                }
                
                if (response && response.success) {
                    showStatus('¡HTML copiado exitosamente!', 'success');
                    // Cerrar popup después de 1 segundo para mejor UX
                    setTimeout(() => {
                        window.close();
                    }, 1000);
                } else {
                    showStatus('Error al extraer HTML', 'error');
                }
            });
        });
    });
    
    function updateButtonState() {
        if (clickModeToggle.checked) {
            extractBtn.disabled = true;
            extractBtn.textContent = '👆 Haz click en la página';
        } else {
            extractBtn.disabled = false;
            extractBtn.textContent = '📋 Extraer HTML del Body';
        }
    }
    
    function showStatus(message, type) {
        status.textContent = message;
        status.className = `status ${type}`;
        status.style.display = 'block';
        
        setTimeout(() => {
            status.style.display = 'none';
        }, 3000);
    }
});
