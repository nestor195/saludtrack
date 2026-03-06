/**
 * IndexedDB Manager
 * =================
 * Gestión de almacenamiento local para funcionamiento offline.
 */

const IndexedDBManager = (function() {
    const DB_NAME = 'SaludTrackDB';
    const DB_VERSION = 1;
    let db = null;

    // Store names
    const STORES = {
        MEDICIONES: 'mediciones_pendientes',
        TIPOS: 'tipos_medicion_cache',
        USER: 'user_cache'
    };

    /**
     * Inicializa la base de datos IndexedDB
     */
    async function init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('Error al abrir IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                db = request.result;
                console.log('IndexedDB inicializada correctamente');
                resolve(db);
            };

            request.onupgradeneeded = (event) => {
                const database = event.target.result;

                // Store para mediciones pendientes de sincronizar
                if (!database.objectStoreNames.contains(STORES.MEDICIONES)) {
                    const medStore = database.createObjectStore(STORES.MEDICIONES, { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    medStore.createIndex('fecha', 'creado_en', { unique: false });
                    medStore.createIndex('sincronizado', 'sincronizado', { unique: false });
                }

                // Store para caché de tipos de medición
                if (!database.objectStoreNames.contains(STORES.TIPOS)) {
                    const tiposStore = database.createObjectStore(STORES.TIPOS, { 
                        keyPath: 'id' 
                    });
                    tiposStore.createIndex('orden', 'orden', { unique: false });
                }

                // Store para caché de datos de usuario
                if (!database.objectStoreNames.contains(STORES.USER)) {
                    database.createObjectStore(STORES.USER, { 
                        keyPath: 'uid' 
                    });
                }
            };
        });
    }

    /**
     * Obtiene la conexión a la base de datos
     */
    async function getDB() {
        if (!db) {
            await init();
        }
        return db;
    }

    /**
     * Guarda una medición pendiente
     */
    async function savePendingMedicion(medicion) {
        const database = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([STORES.MEDICIONES], 'readwrite');
            const store = transaction.objectStore(STORES.MEDICIONES);
            
            const data = {
                ...medicion,
                sincronizado: false,
                creado_en: new Date().toISOString()
            };
            
            const request = store.add(data);
            
            request.onsuccess = () => {
                console.log('Medición guardada localmente:', request.result);
                resolve(request.result);
            };
            
            request.onerror = () => {
                console.error('Error al guardar medición:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Obtiene todas las mediciones pendientes de sincronizar
     */
    async function getPendingMediciones() {
        const database = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([STORES.MEDICIONES], 'readonly');
            const store = transaction.objectStore(STORES.MEDICIONES);
            const request = store.getAll();
            
            request.onsuccess = () => {
                const pending = request.result.filter(m => !m.sincronizado);
                resolve(pending);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * Marca una medición como sincronizada
     */
    async function markMedicionSynced(id) {
        const database = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([STORES.MEDICIONES], 'readwrite');
            const store = transaction.objectStore(STORES.MEDICIONES);
            const getRequest = store.get(id);
            
            getRequest.onsuccess = () => {
                const data = getRequest.result;
                if (data) {
                    data.sincronizado = true;
                    data.synced_at = new Date().toISOString();
                    const putRequest = store.put(data);
                    putRequest.onsuccess = () => resolve(true);
                    putRequest.onerror = () => reject(putRequest.error);
                } else {
                    resolve(false);
                }
            };
            
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    /**
     * Elimina una medición pendiente
     */
    async function deletePendingMedicion(id) {
        const database = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([STORES.MEDICIONES], 'readwrite');
            const store = transaction.objectStore(STORES.MEDICIONES);
            const request = store.delete(id);
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Guarda tipos de medición en caché
     */
    async function cacheTipos(tipos) {
        const database = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([STORES.TIPOS], 'readwrite');
            const store = transaction.objectStore(STORES.TIPOS);
            
            // Limpiar caché anterior
            store.clear();
            
            // Guardar nuevos tipos
            tipos.forEach(tipo => {
                store.put(tipo);
            });
            
            transaction.oncomplete = () => {
                console.log('Tipos de medición cacheados:', tipos.length);
                resolve(true);
            };
            
            transaction.onerror = () => {
                reject(transaction.error);
            };
        });
    }

    /**
     * Obtiene tipos de medición desde caché
     */
    async function getCachedTipos() {
        const database = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([STORES.TIPOS], 'readonly');
            const store = transaction.objectStore(STORES.TIPOS);
            const index = store.index('orden');
            const request = index.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Guarda datos de usuario en caché
     */
    async function cacheUser(userData) {
        const database = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([STORES.USER], 'readwrite');
            const store = transaction.objectStore(STORES.USER);
            const request = store.put(userData);
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Obtiene datos de usuario desde caché
     */
    async function getCachedUser(uid) {
        const database = await getDB();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction([STORES.USER], 'readonly');
            const store = transaction.objectStore(STORES.USER);
            const request = store.get(uid);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Limpia todos los datos de caché
     */
    async function clearAll() {
        const database = await getDB();
        const storeNames = Object.values(STORES);
        
        return new Promise((resolve, reject) => {
            const transaction = database.transaction(storeNames, 'readwrite');
            
            storeNames.forEach(storeName => {
                transaction.objectStore(storeName).clear();
            });
            
            transaction.oncomplete = () => {
                console.log('Caché limpiada completamente');
                resolve(true);
            };
            
            transaction.onerror = () => reject(transaction.error);
        });
    }

    /**
     * Obtiene el número de mediciones pendientes
     */
    async function getPendingCount() {
        const pending = await getPendingMediciones();
        return pending.length;
    }

    // API pública
    return {
        init,
        savePendingMedicion,
        getPendingMediciones,
        markMedicionSynced,
        deletePendingMedicion,
        cacheTipos,
        getCachedTipos,
        cacheUser,
        getCachedUser,
        clearAll,
        getPendingCount
    };
})();

// Exportar para uso global
window.IndexedDBManager = IndexedDBManager;
