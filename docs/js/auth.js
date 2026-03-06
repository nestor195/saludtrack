/**
 * Authentication Module
 * =====================
 * Gestión de autenticación con Firebase.
 */

const Auth = (function() {
    let currentUser = null;
    let authStateListeners = [];

    /**
     * Inicializa el módulo de autenticación
     */
    function init() {
        const { auth } = window.firebaseApp;
        
        // Escuchar cambios en el estado de autenticación
        auth.onAuthStateChanged(async (user) => {
            currentUser = user;
            
            if (user) {
                // Usuario autenticado
                console.log('Usuario autenticado:', user.email);
                
                // Guardar/actualizar datos del usuario en Firestore
                await Firestore.saveUser(user);
                
                // Guardar en caché local
                await IndexedDBManager.cacheUser({
                    uid: user.uid,
                    nombre: user.displayName,
                    email: user.email,
                    photo_url: user.photoURL
                });
            } else {
                console.log('No hay usuario autenticado');
            }
            
            // Notificar a los listeners
            authStateListeners.forEach(listener => listener(user));
        });
    }

    /**
     * Inicia sesión con Google
     */
    async function signInWithGoogle() {
        const { auth, googleProvider } = window.firebaseApp;
        
        try {
            Utils.showSyncIndicator(true);
            
            const result = await auth.signInWithPopup(googleProvider);
            const user = result.user;
            
            Utils.showToast(`¡Bienvenido, ${user.displayName}!`, 'success');
            
            return { success: true, user };
        } catch (error) {
            console.error('Error en login con Google:', error);
            
            let message = 'Error al iniciar sesión';
            
            switch (error.code) {
                case 'auth/popup-closed-by-user':
                    message = 'Inicio de sesión cancelado';
                    break;
                case 'auth/popup-blocked':
                    message = 'El navegador bloqueó la ventana emergente';
                    break;
                case 'auth/account-exists-with-different-credential':
                    message = 'Ya existe una cuenta con este email';
                    break;
                case 'auth/network-request-failed':
                    message = 'Error de conexión. Verifica tu internet.';
                    break;
            }
            
            Utils.showToast(message, 'error');
            return { success: false, error };
        } finally {
            Utils.showSyncIndicator(false);
        }
    }

    /**
     * Cierra la sesión
     */
    async function signOut() {
        const { auth } = window.firebaseApp;
        
        try {
            await auth.signOut();
            
            // Limpiar caché local
            await IndexedDBManager.clearAll();
            
            Utils.showToast('Sesión cerrada', 'success');
            
            // Redirigir a la página de login
            window.location.href = 'index.html';
            
            return { success: true };
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            Utils.showToast('Error al cerrar sesión', 'error');
            return { success: false, error };
        }
    }

    /**
     * Obtiene el usuario actual
     */
    function getCurrentUser() {
        return currentUser;
    }

    /**
     * Verifica si hay usuario autenticado
     */
    function isAuthenticated() {
        return currentUser !== null;
    }

    /**
     * Obtiene el UID del usuario actual
     */
    function getCurrentUserId() {
        return currentUser ? currentUser.uid : null;
    }

    /**
     * Obtiene el email del usuario actual
     */
    function getCurrentUserEmail() {
        return currentUser ? currentUser.email : null;
    }

    /**
     * Obtiene el nombre del usuario actual
     */
    function getCurrentUserName() {
        return currentUser ? currentUser.displayName : null;
    }

    /**
     * Obtiene la foto del usuario actual
     */
    function getCurrentUserPhoto() {
        return currentUser ? currentUser.photoURL : null;
    }

    /**
     * Añade un listener para cambios en el estado de autenticación
     */
    function onAuthStateChanged(callback) {
        authStateListeners.push(callback);
        
        // Retornar función para remover el listener
        return () => {
            authStateListeners = authStateListeners.filter(l => l !== callback);
        };
    }

    /**
     * Verifica si el usuario es administrador
     * Por defecto, todos los usuarios autenticados pueden ser admin
     * Puedes personalizar esto según tus necesidades
     */
    function isAdmin() {
        // Implementar lógica de admin según tus necesidades
        // Por ejemplo, verificar un claim personalizado:
        // return currentUser?.getIdTokenResult().then(idTokenResult => idTokenResult.claims.admin);
        
        // Por ahora, retornamos true para usuarios autenticados
        return isAuthenticated();
    }

    /**
     * Espera a que la autenticación se inicialice
     */
    function waitForAuth() {
        return new Promise((resolve) => {
            if (currentUser !== undefined) {
                resolve(currentUser);
            } else {
                const unsubscribe = onAuthStateChanged((user) => {
                    unsubscribe();
                    resolve(user);
                });
            }
        });
    }

    // API pública
    return {
        init,
        signInWithGoogle,
        signOut,
        getCurrentUser,
        isAuthenticated,
        getCurrentUserId,
        getCurrentUserEmail,
        getCurrentUserName,
        getCurrentUserPhoto,
        onAuthStateChanged,
        isAdmin,
        waitForAuth
    };
})();

// Exportar para uso global
window.Auth = Auth;
