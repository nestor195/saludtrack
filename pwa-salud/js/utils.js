/**
 * Utility Functions
 * =================
 * Funciones utilitarias para la aplicación SaludTrack.
 */

const Utils = (function() {
    
    /**
     * Formatea una fecha para mostrar
     */
    function formatDate(date, includeTime = true) {
        const d = new Date(date);
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        
        if (includeTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
        }
        
        return d.toLocaleDateString('es-ES', options);
    }

    /**
     * Formatea una fecha para input datetime-local
     */
    function formatDateTimeLocal(date = new Date()) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    /**
     * Formatea una fecha para input date
     */
    function formatDateInput(date = new Date()) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    }

    /**
     * Obtiene la fecha de hace N días
     */
    function getDateDaysAgo(days) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date;
    }

    /**
     * Convierte fecha a ISO string
     */
    function toISOString(date) {
        return new Date(date).toISOString();
    }

    /**
     * Muestra un toast de notificación
     */
    function showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                ${type === 'success' 
                    ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'
                    : type === 'error'
                    ? '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'
                    : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'
                }
            </svg>
            <span>${escapeHtml(message)}</span>
        `;

        container.appendChild(toast);

        // Remover después de la duración
        setTimeout(() => {
            toast.style.animation = 'toastOut 0.3s ease forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    /**
     * Escapa HTML para prevenir XSS
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Muestra el indicador de sincronización
     */
    function showSyncIndicator(show = true) {
        const indicator = document.getElementById('sync-indicator');
        const headerSync = document.getElementById('sync-status');
        
        if (indicator) {
            indicator.classList.toggle('hidden', !show);
        }
        if (headerSync) {
            headerSync.classList.toggle('hidden', !show);
        }
    }

    /**
     * Muestra el indicador de offline
     */
    function showOfflineIndicator(show = true) {
        const indicator = document.getElementById('offline-indicator');
        const headerOffline = document.getElementById('offline-status');
        
        if (indicator) {
            indicator.classList.toggle('hidden', !show);
        }
        if (headerOffline) {
            headerOffline.classList.toggle('hidden', !show);
        }
    }

    /**
     * Verifica si hay conexión a internet
     */
    function isOnline() {
        return navigator.onLine;
    }

    /**
     * Genera un ID único
     */
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Debounce function
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Valida un valor numérico
     */
    function validateNumber(value, min = null, max = null) {
        const num = parseFloat(value);
        
        if (isNaN(num)) {
            return { valid: false, error: 'Ingresa un número válido' };
        }
        
        if (min !== null && num < min) {
            return { valid: false, error: `El valor mínimo es ${min}` };
        }
        
        if (max !== null && num > max) {
            return { valid: false, error: `El valor máximo es ${max}` };
        }
        
        return { valid: true, value: num };
    }

    /**
     * Formatea un número con decimales
     */
    function formatNumber(num, decimals = 0) {
        return parseFloat(num).toFixed(decimals);
    }

    /**
     * Obtiene la hora actual formateada
     */
    function getCurrentTime() {
        return new Date().toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Oculta el splash screen
     */
    function hideSplash() {
        const splash = document.getElementById('splash-screen');
        const app = document.getElementById('app');
        
        if (splash) {
            splash.classList.add('fade-out');
            setTimeout(() => {
                splash.style.display = 'none';
            }, 500);
        }
        
        if (app) {
            app.classList.remove('hidden');
        }
    }

    /**
     * Muestra el splash screen
     */
    function showSplash() {
        const splash = document.getElementById('splash-screen');
        const app = document.getElementById('app');
        
        if (splash) {
            splash.style.display = 'flex';
            splash.classList.remove('fade-out');
        }
        
        if (app) {
            app.classList.add('hidden');
        }
    }

    /**
     * Obtiene parámetros de URL
     */
    function getUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        for (const [key, value] of params) {
            result[key] = value;
        }
        return result;
    }

    /**
     * Obtiene el hash de la URL
     */
    function getUrlHash() {
        return window.location.hash.slice(1);
    }

    /**
     * Establece el hash de la URL
     */
    function setUrlHash(hash) {
        window.location.hash = hash;
    }

    /**
     * Copia texto al portapapeles
     */
    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            showToast('Copiado al portapapeles', 'success');
            return true;
        } catch (err) {
            console.error('Error al copiar:', err);
            showToast('No se pudo copiar', 'error');
            return false;
        }
    }

    /**
     * Convierte datos a CSV
     */
    function toCSV(data, headers) {
        const csvRows = [];
        
        // Headers
        csvRows.push(headers.join(','));
        
        // Data rows
        for (const row of data) {
            const values = headers.map(header => {
                const value = row[header];
                // Escapar comillas y envolver en comillas si contiene comas
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            });
            csvRows.push(values.join(','));
        }
        
        return csvRows.join('\n');
    }

    /**
     * Descarga un archivo
     */
    function downloadFile(content, filename, mimeType = 'text/plain') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Obtiene el icono para un tipo de medición
     */
    function getMedicionIcon(nombre) {
        const icons = {
            'Presión Arterial': '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
            'Glucosa': '<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>',
            'Peso': '<path d="M12 3v18M3 12h18"/>',
            'Frecuencia Cardíaca': '<path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z"/>'
        };
        
        return icons[nombre] || '<circle cx="12" cy="12" r="10"/>';
    }

    /**
     * Obtiene el color para un tipo de medición
     */
    function getMedicionColor(nombre) {
        const colors = {
            'Presión Arterial': '#ef4444',
            'Glucosa': '#f59e0b',
            'Peso': '#10b981',
            'Frecuencia Cardíaca': '#ec4899'
        };
        
        return colors[nombre] || '#2563eb';
    }

    // API pública
    return {
        formatDate,
        formatDateTimeLocal,
        formatDateInput,
        getDateDaysAgo,
        toISOString,
        showToast,
        escapeHtml,
        showSyncIndicator,
        showOfflineIndicator,
        isOnline,
        generateId,
        debounce,
        validateNumber,
        formatNumber,
        getCurrentTime,
        hideSplash,
        showSplash,
        getUrlParams,
        getUrlHash,
        setUrlHash,
        copyToClipboard,
        toCSV,
        downloadFile,
        getMedicionIcon,
        getMedicionColor
    };
})();

// Exportar para uso global
window.Utils = Utils;
