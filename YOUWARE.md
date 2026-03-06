# SaludTrack - PWA de Mediciones de Salud

Aplicación Web Progresiva (PWA) para el registro y seguimiento de mediciones de salud personales, desarrollada con HTML5, CSS3 y JavaScript nativo.

## 🏥 Descripción

SaludTrack permite a los usuarios registrar y dar seguimiento a sus mediciones de salud como presión arterial, glucosa, peso, etc. Incluye funcionalidad offline completa y sincronización automática con Firebase.

## 🚀 Características

- **Autenticación**: Login con Google Sign-In (Firebase Authentication)
- **Gestión de Mediciones**: Formularios dinámicos para diferentes tipos de mediciones
- **Historial**: Listado cronológico con filtros y gráficos
- **PWA Completa**: Funciona offline con Service Worker y IndexedDB
- **Sincronización**: Datos locales se sincronizan automáticamente

## 📁 Estructura del Proyecto

```
pwa-salud/
├── index.html              # Página de login
├── dashboard.html          # Panel principal
├── manifest.json           # Configuración PWA
├── service-worker.js       # Service Worker
├── offline.html            # Página offline
├── css/
│   ├── styles.css          # Estilos principales
│   └── responsive.css      # Estilos responsivos
├── js/
│   ├── firebase-config.js  # ⚠️ Configurar con tus credenciales
│   ├── app.js              # Lógica página login
│   ├── dashboard.js        # Lógica dashboard
│   ├── auth.js             # Autenticación
│   ├── firestore.js        # Operaciones Firestore
│   ├── sync.js             # Sincronización offline
│   └── utils.js            # Utilidades
├── lib/
│   └── indexeddb.js        # Gestión IndexedDB
└── assets/
    └── icons/              # Iconos PWA (SVG)
```

## ⚙️ Configuración

### 1. Firebase

Editar `js/firebase-config.js` con tus credenciales de Firebase:

```javascript
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123"
};
```

### 2. Habilitar en Firebase Console

- Authentication > Sign-in method > Google
- Firestore Database > Crear base de datos
- Configurar reglas de seguridad (ver README.md)

## 🌐 Despliegue

La carpeta `pwa-salud/` debe servirse como un sitio estático. Compatible con:
- Firebase Hosting
- Netlify
- Vercel
- GitHub Pages
- Cualquier servidor web estático

## 📱 Instalación PWA

- **Android**: Chrome > Menú > "Añadir a pantalla de inicio"
- **iOS**: Safari > Compartir > "Añadir a pantalla de inicio"
- **Desktop**: Icono de instalación en barra de direcciones

## 🔧 Tecnologías

- HTML5, CSS3, JavaScript ES6+ (vanilla)
- Firebase (Authentication, Firestore)
- Chart.js (gráficos)
- Service Workers, IndexedDB
- Web App Manifest

## 📖 Documentación

Ver `README.md` en la carpeta `pwa-salud/` para instrucciones detalladas.
