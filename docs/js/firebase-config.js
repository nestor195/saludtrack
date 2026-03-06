/**
 * Firebase Configuration
 * ======================
 * Configuración de Firebase para la aplicación SaludTrack.
 * 
 * IMPORTANTE: Reemplaza los valores de configuración con los de tu proyecto Firebase.
 * Puedes encontrar estos valores en la consola de Firebase:
 * https://console.firebase.google.com/project/YOUR_PROJECT_ID/settings/general/
 */

const firebaseConfig = {
    apiKey: "AIzaSyDo30GmrPeIYn31jQNIaoWIC85Eew8gu_E",
    authDomain: "carga-de-datos-e6203.firebaseapp.com",
    projectId: "carga-de-datos-e6203",
    storageBucket: "carga-de-datos-e6203.firebasestorage.app",
    messagingSenderId: "138191639020",
    appId: "1:138191639020:web:1962468915082ccff530c9",
    measurementId: "G-G4NQ7XX45W"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Configurar persistencia de autenticación
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);

// Referencias a servicios
const auth = firebase.auth();
const db = firebase.firestore();

// Habilitar persistencia offline de Firestore
db.enablePersistence()
    .catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn('Múltiples pestañas abiertas, persistencia solo disponible en una pestaña a la vez.');
        } else if (err.code === 'unimplemented') {
            console.warn('El navegador no soporta persistencia offline de Firestore.');
        }
    });

// Configuración de proveedor de Google
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

// Exportar referencias para uso global
window.firebaseApp = {
    auth,
    db,
    googleProvider
};
