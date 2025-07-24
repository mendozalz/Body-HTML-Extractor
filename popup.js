document.addEventListener('DOMContentLoaded', function() {
    const extractBtn = document.getElementById('extractBtn');
    const status = document.getElementById('status');
    
    console.log('🔍 Popup cargado');
    
    extractBtn.addEventListener('click', function() {
        console.log('🔍 Botón clickeado');
        showStatus('Extrayendo HTML...', 'info');
        
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (!tabs[0]) {
                showStatus('Error: No se encontró pestaña activa', 'error');
                return;
            }
            
            // Primero intentar enviar mensaje
            chrome.tabs.sendMessage(tabs[0].id, {action: 'extractHTML'}, function(response) {
                if (chrome.runtime.lastError) {
                    console.log('🔍 Content script no disponible, inyectando...');
                    // Si falla, inyectar el script manualmente
                    chrome.scripting.executeScript({
                        target: { tabId: tabs[0].id },
                        files: ['content.js']
                    }, function() {
                        if (chrome.runtime.lastError) {
                            showStatus('Error: No se pudo inyectar script', 'error');
                            return;
                        }
                        // Intentar de nuevo después de inyectar
                        setTimeout(() => {
                            chrome.tabs.sendMessage(tabs[0].id, {action: 'extractHTML'}, function(response) {
                                handleResponse(response);
                            });
                        }, 100);
                    });
                } else {
                    handleResponse(response);
                }
            });
        });
    });
    
    function handleResponse(response) {
        if (response && response.success) {
            showStatus('¡HTML copiado exitosamente!', 'success');
            setTimeout(() => window.close(), 1000);
        } else {
            showStatus('Error al extraer HTML', 'error');
        }
    }
    
    function showStatus(message, type) {
        console.log('🔍 Status:', message);
        status.textContent = message;
        status.className = `status ${type}`;
        status.style.display = 'block';
        
        setTimeout(() => {
            status.style.display = 'none';
        }, 3000);
    }
});
