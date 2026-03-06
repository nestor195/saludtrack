/**
 * App - Main Application Logic
 * ============================
 * Lógica principal para la página de login/registro.
 */

(function() {
    'use strict';

    // Referencias a elementos del DOM
    let elements = {};

    /**
     * Inicializa la aplicación
     */
    async function init() {
        console.log('Inicializando SaludTrack...');
        
        // Inicializar IndexedDB
        await IndexedDBManager.init();
        
        // Capturar referencias a elementos
        cacheElements();
        
        // Configurar event listeners
        setupEventListeners();
        
        // Inicializar autenticación
        Auth.init();
        
        // Verificar estado de autenticación
        checkAuthState();
    }

    /**
     * Cachea referencias a elementos del DOM
     */
    function cacheElements() {
        elements = {
            googleLoginBtn: document.getElementById('google-login-btn'),
            splashScreen: document.getElementById('splash-screen'),
            app: document.getElementById('app')
        };
    }

    /**
     * Configura event listeners
     */
    function setupEventListeners() {
        // Botón de login con Google
        if (elements.googleLoginBtn) {
            elements.googleLoginBtn.addEventListener('click', handleGoogleLogin);
        }
        
        // Escuchar cambios en el estado de autenticación
        Auth.onAuthStateChanged(handleAuthChange);
    }

    /**
     * Verifica el estado de autenticación inicial
     */
    async function checkAuthState() {
        try {
            // Esperar a que Firebase determine el estado de autenticación
            const unsubscribe = firebase.auth().onAuthStateChanged(async (user) => {
                unsubscribe();
                
                if (user) {
                    // Usuario ya autenticado - redirigir al dashboard
                    console.log('Usuario ya autenticado, redirigiendo...');
                    window.location.href = 'dashboard.html';
                } else {
                    // No hay usuario - mostrar pantalla de login
                    Utils.hideSplash();
                }
            });
        } catch (error) {
            console.error('Error al verificar autenticación:', error);
            Utils.hideSplash();
        }
    }

    /**
     * Maneja el click en el botón de Google Login
     */
    async function handleGoogleLogin() {
        // Deshabilitar botón mientras se procesa
        elements.googleLoginBtn.disabled = true;
        
        try {
            const result = await Auth.signInWithGoogle();
            
            if (result.success) {
                // La redirección se maneja en handleAuthChange
            }
        } catch (error) {
            console.error('Error en login:', error);
        } finally {
            // Rehabilitar botón
            elements.googleLoginBtn.disabled = false;
        }
    }

    /**
     * Maneja cambios en el estado de autenticación
     */
    function handleAuthChange(user) {
        if (user) {
            // Usuario autenticado - redirigir al dashboard
            window.location.href = 'dashboard.html';
        }
    }

    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
