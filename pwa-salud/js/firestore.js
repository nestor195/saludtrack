/**
 * Firestore Module
 * ================
 * Operaciones con Firestore.
 */

const Firestore = (function() {
    const COLLECTIONS = {
        TIPOS_MEDICION: 'tipos_medicion',
        USUARIOS: 'usuarios',
        MEDICIONES: 'mediciones'
    };

    /**
     * Obtiene la referencia a Firestore
     */
    function getDb() {
        return window.firebaseApp.db;
    }

    /**
     * Guarda/actualiza datos del usuario
     */
    async function saveUser(user) {
        const db = getDb();
        const userRef = db.collection(COLLECTIONS.USUARIOS).doc(user.uid);
        
        const userData = {
            uid: user.uid,
            nombre: user.displayName || '',
            email: user.email,
            photo_url: user.photoURL || '',
            ultimo_login: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        try {
            const doc = await userRef.get();
            
            if (!doc.exists) {
                // Nuevo usuario
                userData.creacion = firebase.firestore.FieldValue.serverTimestamp();
                await userRef.set(userData);
                console.log('Nuevo usuario creado:', user.email);
            } else {
                // Usuario existente - actualizar último login
                await userRef.update({
                    ultimo_login: firebase.firestore.FieldValue.serverTimestamp(),
                    nombre: userData.nombre,
                    photo_url: userData.photo_url
                });
                console.log('Usuario actualizado:', user.email);
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error al guardar usuario:', error);
            return { success: false, error };
        }
    }

    /**
     * Obtiene los datos del usuario
     */
    async function getUser(uid) {
        const db = getDb();
        
        try {
            const doc = await db.collection(COLLECTIONS.USUARIOS).doc(uid).get();
            
            if (doc.exists) {
                return { success: true, data: { id: doc.id, ...doc.data() } };
            } else {
                return { success: false, error: 'Usuario no encontrado' };
            }
        } catch (error) {
            console.error('Error al obtener usuario:', error);
            return { success: false, error };
        }
    }

    // ================================
    // TIPOS DE MEDICIÓN
    // ================================

    /**
     * Obtiene todos los tipos de medición activos
     */
    async function getTiposMedicion() {
        const db = getDb();
        
        try {
            const snapshot = await db.collection(COLLECTIONS.TIPOS_MEDICION)
                .where('activo', '==', true)
                .orderBy('orden')
                .get();
            
            const tipos = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Guardar en caché local
            await IndexedDBManager.cacheTipos(tipos);
            
            return { success: true, data: tipos };
        } catch (error) {
            console.error('Error al obtener tipos de medición:', error);
            
            // Intentar obtener desde caché
            const cached = await IndexedDBManager.getCachedTipos();
            if (cached.length > 0) {
                return { success: true, data: cached, fromCache: true };
            }
            
            return { success: false, error };
        }
    }

    /**
     * Crea un nuevo tipo de medición
     */
    async function createTipoMedicion(data) {
        const db = getDb();
        
        try {
            const tipoData = {
                ...data,
                activo: true,
                creado_en: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            const docRef = await db.collection(COLLECTIONS.TIPOS_MEDICION).add(tipoData);
            
            Utils.showToast('Tipo de medición creado', 'success');
            
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Error al crear tipo de medición:', error);
            Utils.showToast('Error al crear tipo de medición', 'error');
            return { success: false, error };
        }
    }

    /**
     * Actualiza un tipo de medición
     */
    async function updateTipoMedicion(id, data) {
        const db = getDb();
        
        try {
            await db.collection(COLLECTIONS.TIPOS_MEDICION).doc(id).update({
                ...data,
                actualizado_en: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            Utils.showToast('Tipo de medición actualizado', 'success');
            
            return { success: true };
        } catch (error) {
            console.error('Error al actualizar tipo de medición:', error);
            Utils.showToast('Error al actualizar tipo de medición', 'error');
            return { success: false, error };
        }
    }

    /**
     * Elimina (desactiva) un tipo de medición
     */
    async function deleteTipoMedicion(id) {
        const db = getDb();
        
        try {
            await db.collection(COLLECTIONS.TIPOS_MEDICION).doc(id).update({
                activo: false,
                eliminado_en: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            Utils.showToast('Tipo de medición eliminado', 'success');
            
            return { success: true };
        } catch (error) {
            console.error('Error al eliminar tipo de medición:', error);
            Utils.showToast('Error al eliminar tipo de medición', 'error');
            return { success: false, error };
        }
    }

    // ================================
    // MEDICIONES DEL USUARIO
    // ================================

    /**
     * Guarda una nueva medición
     */
    async function saveMedicion(medicion) {
        const db = getDb();
        const userId = Auth.getCurrentUserId();
        
        if (!userId) {
            return { success: false, error: 'Usuario no autenticado' };
        }
        
        const medicionData = {
            ...medicion,
            user_id: userId,
            creado_en: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Verificar si hay conexión
        if (!Utils.isOnline()) {
            // Guardar localmente
            const localId = await IndexedDBManager.savePendingMedicion(medicionData);
            Utils.showToast('Guardado localmente - Se sincronizará cuando tengas conexión', 'warning');
            return { success: true, localId, offline: true };
        }
        
        try {
            const docRef = await db.collection(COLLECTIONS.USUARIOS)
                .doc(userId)
                .collection(COLLECTIONS.MEDICIONES)
                .add(medicionData);
            
            Utils.showToast('Medición guardada correctamente', 'success');
            
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Error al guardar medición:', error);
            
            // Intentar guardar localmente como respaldo
            const localId = await IndexedDBManager.savePendingMedicion(medicionData);
            Utils.showToast('Guardado localmente', 'warning');
            
            return { success: true, localId, offline: true };
        }
    }

    /**
     * Obtiene las mediciones del usuario
     */
    async function getMediciones(filters = {}) {
        const db = getDb();
        const userId = Auth.getCurrentUserId();
        
        if (!userId) {
            return { success: false, error: 'Usuario no autenticado' };
        }
        
        try {
            let query = db.collection(COLLECTIONS.USUARIOS)
                .doc(userId)
                .collection(COLLECTIONS.MEDICIONES)
                .orderBy('fechayhora', 'desc');
            
            // Aplicar filtros
            if (filters.tipoId) {
                query = query.where('medicion_id', '==', filters.tipoId);
            }
            
            if (filters.fechaInicio) {
                const startDate = new Date(filters.fechaInicio);
                startDate.setHours(0, 0, 0, 0);
                query = query.where('fechayhora', '>=', startDate);
            }
            
            if (filters.fechaFin) {
                const endDate = new Date(filters.fechaFin);
                endDate.setHours(23, 59, 59, 999);
                query = query.where('fechayhora', '<=', endDate);
            }
            
            // Limitar resultados
            query = query.limit(100);
            
            const snapshot = await query.get();
            
            const mediciones = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            return { success: true, data: mediciones };
        } catch (error) {
            console.error('Error al obtener mediciones:', error);
            return { success: false, error };
        }
    }

    /**
     * Elimina una medición
     */
    async function deleteMedicion(medicionId) {
        const db = getDb();
        const userId = Auth.getCurrentUserId();
        
        if (!userId) {
            return { success: false, error: 'Usuario no autenticado' };
        }
        
        try {
            await db.collection(COLLECTIONS.USUARIOS)
                .doc(userId)
                .collection(COLLECTIONS.MEDICIONES)
                .doc(medicionId)
                .delete();
            
            Utils.showToast('Medición eliminada', 'success');
            
            return { success: true };
        } catch (error) {
            console.error('Error al eliminar medición:', error);
            Utils.showToast('Error al eliminar medición', 'error');
            return { success: false, error };
        }
    }

    /**
     * Obtiene estadísticas de mediciones
     */
    async function getEstadisticas(tipoId, dias = 30) {
        const db = getDb();
        const userId = Auth.getCurrentUserId();
        
        if (!userId) {
            return { success: false, error: 'Usuario no autenticado' };
        }
        
        const fechaInicio = new Date();
        fechaInicio.setDate(fechaInicio.getDate() - dias);
        
        try {
            const snapshot = await db.collection(COLLECTIONS.USUARIOS)
                .doc(userId)
                .collection(COLLECTIONS.MEDICIONES)
                .where('medicion_id', '==', tipoId)
                .where('fechayhora', '>=', fechaInicio)
                .orderBy('fechayhora', 'asc')
                .get();
            
            const mediciones = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Calcular estadísticas
            const valores = mediciones.map(m => m.valor).filter(v => v !== null);
            const valores2 = mediciones.map(m => m.valor2).filter(v => v !== null && v !== undefined);
            
            const stats = {
                total: mediciones.length,
                promedio: valores.length > 0 ? valores.reduce((a, b) => a + b, 0) / valores.length : null,
                promedio2: valores2.length > 0 ? valores2.reduce((a, b) => a + b, 0) / valores2.length : null,
                minimo: valores.length > 0 ? Math.min(...valores) : null,
                minimo2: valores2.length > 0 ? Math.min(...valores2) : null,
                maximo: valores.length > 0 ? Math.max(...valores) : null,
                maximo2: valores2.length > 0 ? Math.max(...valores2) : null,
                ultima: mediciones.length > 0 ? mediciones[mediciones.length - 1] : null,
                primera: mediciones.length > 0 ? mediciones[0] : null
            };
            
            return { success: true, data: stats, mediciones };
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            return { success: false, error };
        }
    }

    /**
     * Inicializa los tipos de medición predefinidos
     */
    async function initializeDefaultTipos() {
        const db = getDb();
        
        const tiposDefault = [
            {
                nombre: 'Presión Arterial',
                descripcion: 'Medición de presión sistólica y diastólica',
                unidad: 'mmHg',
                requiere_dos_valores: true,
                activo: true,
                orden: 1
            },
            {
                nombre: 'Glucosa',
                descripcion: 'Nivel de glucosa en sangre',
                unidad: 'mg/dL',
                requiere_dos_valores: false,
                activo: true,
                orden: 2
            },
            {
                nombre: 'Peso',
                descripcion: 'Peso corporal',
                unidad: 'kg',
                requiere_dos_valores: false,
                activo: true,
                orden: 3
            }
        ];
        
        try {
            // Verificar si ya existen tipos
            const snapshot = await db.collection(COLLECTIONS.TIPOS_MEDICION)
                .where('activo', '==', true)
                .limit(1)
                .get();
            
            if (snapshot.empty) {
                // Crear tipos por defecto
                for (const tipo of tiposDefault) {
                    await db.collection(COLLECTIONS.TIPOS_MEDICION).add({
                        ...tipo,
                        creado_en: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
                console.log('Tipos de medición por defecto creados');
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error al inicializar tipos:', error);
            return { success: false, error };
        }
    }

    // API pública
    return {
        saveUser,
        getUser,
        getTiposMedicion,
        createTipoMedicion,
        updateTipoMedicion,
        deleteTipoMedicion,
        saveMedicion,
        getMediciones,
        deleteMedicion,
        getEstadisticas,
        initializeDefaultTipos
    };
})();

// Exportar para uso global
window.Firestore = Firestore;
