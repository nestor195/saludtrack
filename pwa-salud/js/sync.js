/**
 * Sync Module
 * ===========
 * Sincronización de datos offline con Firestore.
 */

const Sync = (function() {
    let isSyncing = false;
    let syncInterval = null;
    const SYNC_INTERVAL_MS = 30000; // 30 segundos

    /**
     * Inicializa el módulo de sincronización
     */
    function init() {
        // Escuchar cambios de conexión
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        // Verificar estado inicial
        if (Utils.isOnline()) {
            // Intentar sincronizar datos pendientes
            syncPendingData();
        } else {
            Utils.showOfflineIndicator(true);
        }
        
        // Configurar sincronización periódica
        startPeriodicSync();
        
        console.log('Módulo de sincronización inicializado');
    }

    /**
     * Maneja el evento de conexión recuperada
     */
    async function handleOnline() {
        console.log('Conexión recuperada');
        Utils.showOfflineIndicator(false);
        Utils.showToast('Conexión recuperada', 'success');
        
        // Sincronizar datos pendientes
        await syncPendingData();
    }

    /**
     * Maneja el evento de pérdida de conexión
     */
    function handleOffline() {
        console.log('Sin conexión');
        Utils.showOfflineIndicator(true);
        Utils.showToast('Sin conexión - Los datos se guardarán localmente', 'warning');
    }

    /**
     * Inicia la sincronización periódica
     */
    function startPeriodicSync() {
        if (syncInterval) {
            clearInterval(syncInterval);
        }
        
        syncInterval = setInterval(async () => {
            if (Utils.isOnline() && Auth.isAuthenticated() && !isSyncing) {
                const pendingCount = await IndexedDBManager.getPendingCount();
                if (pendingCount > 0) {
                    syncPendingData();
                }
            }
        }, SYNC_INTERVAL_MS);
    }

    /**
     * Detiene la sincronización periódica
     */
    function stopPeriodicSync() {
        if (syncInterval) {
            clearInterval(syncInterval);
            syncInterval = null;
        }
    }

    /**
     * Sincroniza datos pendientes con Firestore
     */
    async function syncPendingData() {
        if (isSyncing || !Utils.isOnline() || !Auth.isAuthenticated()) {
            return;
        }
        
        isSyncing = true;
        Utils.showSyncIndicator(true);
        
        try {
            const pendingMediciones = await IndexedDBManager.getPendingMediciones();
            
            if (pendingMediciones.length === 0) {
                console.log('No hay datos pendientes para sincronizar');
                return;
            }
            
            console.log(`Sincronizando ${pendingMediciones.length} mediciones pendientes...`);
            
            let synced = 0;
            let failed = 0;
            
            for (const medicion of pendingMediciones) {
                try {
                    // Intentar guardar en Firestore
                    const result = await Firestore.saveMedicion(medicion);
                    
                    if (result.success && !result.offline) {
                        // Marcar como sincronizado en IndexedDB
                        await IndexedDBManager.markMedicionSynced(medicion.id);
                        synced++;
                    } else {
                        failed++;
                    }
                } catch (error) {
                    console.error('Error al sincronizar medición:', error);
                    failed++;
                }
            }
            
            if (synced > 0) {
                Utils.showToast(`${synced} mediciones sincronizadas`, 'success');
            }
            
            if (failed > 0) {
                Utils.showToast(`${failed} mediciones pendientes de sincronizar`, 'warning');
            }
            
            console.log(`Sincronización completada: ${synced} exitosas, ${failed} fallidas`);
            
        } catch (error) {
            console.error('Error en sincronización:', error);
        } finally {
            isSyncing = false;
            Utils.showSyncIndicator(false);
        }
    }

    /**
     * Fuerza la sincronización inmediata
     */
    async function forceSync() {
        if (!Utils.isOnline()) {
            Utils.showToast('No hay conexión a internet', 'error');
            return { success: false, reason: 'offline' };
        }
        
        if (!Auth.isAuthenticated()) {
            Utils.showToast('Debes iniciar sesión primero', 'error');
            return { success: false, reason: 'unauthenticated' };
        }
        
        await syncPendingData();
        
        const pendingCount = await IndexedDBManager.getPendingCount();
        return { 
            success: pendingCount === 0, 
            pendingCount 
        };
    }

    /**
     * Obtiene el número de mediciones pendientes
     */
    async function getPendingCount() {
        return await IndexedDBManager.getPendingCount();
    }

    /**
     * Verifica si hay sincronización en proceso
     */
    function isInSyncing() {
        return isSyncing;
    }

    /**
     * Limpia datos sincronizados antiguos de IndexedDB
     */
    async function cleanOldData() {
        // Esta función puede expandirse para limpiar datos antiguos
        // que ya fueron sincronizados y no son necesarios localmente
        console.log('Limpieza de datos antiguos completada');
    }

    // API pública
    return {
        init,
        forceSync,
        getPendingCount,
        isInSyncing,
        syncPendingData,
        startPeriodicSync,
        stopPeriodicSync,
        cleanOldData
    };
})();

// Exportar para uso global
window.Sync = Sync;
