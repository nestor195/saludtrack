# SaludTrack - PWA de Registro de Mediciones de Salud

Una Aplicación Web Progresiva (PWA) desarrollada con HTML5, CSS3 y JavaScript nativo para el registro y seguimiento de mediciones de salud personales.

## 🏥 Características Principales

### Autenticación
- ✅ Login con Google Sign-In (Firebase Authentication)
- ✅ Mantenimiento de sesión activa
- ✅ Cierre de sesión seguro
- ✅ Almacenamiento de información de usuario en Firestore

### Gestión de Mediciones
- ✅ **Tipos predefinidos**: Presión arterial, Glucosa, Peso
- ✅ **Formulario dinámico** que se adapta según el tipo de medición
- ✅ **Presión arterial**: Captura de valores sistólico/diastólico
- ✅ Validación de datos antes de guardar
- ✅ Observaciones opcionales

### Visualización de Historial
- ✅ Listado cronológico de mediciones
- ✅ Filtros por tipo de medición y rango de fechas
- ✅ Vista de lista y gráficos (Chart.js)
- ✅ Estadísticas básicas

### Funcionalidad PWA
- ✅ Manifest.json completo
- ✅ Service Worker para funcionamiento offline
- ✅ Estrategia de caché para assets estáticos
- ✅ Pantalla de carga personalizada
- ✅ Instalable en dispositivos móviles

### Sincronización Offline
- ✅ Almacenamiento local con IndexedDB
- ✅ Sincronización automática con Firestore al recuperar conexión
- ✅ Indicador visual de estado de conexión

## 🚀 Instalación y Configuración

### Requisitos Previos
- Cuenta de Firebase con proyecto creado
- Navegador moderno (Chrome, Firefox, Safari, Edge)

### Paso 1: Configurar Firebase

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilita **Authentication** con proveedor Google
3. Habilita **Firestore Database**
4. Ve a Configuración del proyecto > General > Tus aplicaciones
5. Agrega una nueva aplicación web y copia la configuración

### Paso 2: Configurar la Aplicación

Edita el archivo `js/firebase-config.js` y reemplaza los valores con tu configuración:

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

### Paso 3: Configurar Reglas de Firestore

En Firebase Console > Firestore > Reglas, configura:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Tipos de medición - lectura para todos los autenticados
    match /tipos_medicion/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Usuarios - solo pueden acceder a su propio documento
    match /usuarios/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Mediciones del usuario
      match /mediciones/{medicionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

### Paso 4: Servir la Aplicación

Para desarrollo local, puedes usar cualquier servidor estático:

```bash
# Con Python
python -m http.server 8080

# Con Node.js (npx)
npx serve .

# Con PHP
php -S localhost:8080
```

Para producción, despliega en Firebase Hosting, Netlify, Vercel o cualquier hosting estático.

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
│   ├── firebase-config.js  # Configuración Firebase
│   ├── app.js              # Lógica página login
│   ├── dashboard.js        # Lógica dashboard
│   ├── auth.js             # Autenticación
│   ├── firestore.js        # Operaciones Firestore
│   ├── sync.js             # Sincronización offline
│   └── utils.js            # Utilidades
├── lib/
│   └── indexeddb.js        # Gestión IndexedDB
└── assets/
    ├── icons/              # Iconos PWA
    └── images/             # Imágenes del sitio
```

## 💾 Estructura de Datos en Firestore

### Colección: `tipos_medicion`
```javascript
{
    nombre: "Presión Arterial",
    descripcion: "Medición de presión sistólica y diastólica",
    unidad: "mmHg",
    requiere_dos_valores: true,
    activo: true,
    orden: 1
}
```

### Colección: `usuarios`
```javascript
{
    uid: "firebase-uid",
    nombre: "Juan Pérez",
    email: "juan@email.com",
    photo_url: "https://...",
    creacion: timestamp,
    ultimo_login: timestamp
}
```

### Subcolección: `usuarios/{uid}/mediciones`
```javascript
{
    medicion_nombre: "Presión Arterial",
    medicion_id: "tipo-id",
    fechayhora: timestamp,
    valor: 120,           // Sistólica o valor único
    valor2: 80,           // Diastólica (opcional)
    medicion_observacion: "Después del desayuno",
    creado_en: timestamp
}
```

## 🎨 Diseño

- **Mobile-first**: Diseño responsivo optimizado para móviles
- **Material Design**: Principios de diseño modernos
- **Accesibilidad**: Etiquetas ARIA, contraste adecuado
- **Tema**: Colores azules profesionales con acentos

## 🔧 Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript ES6+ (vanilla)
- **Backend**: Firebase (Authentication, Firestore)
- **Gráficos**: Chart.js
- **PWA**: Service Workers, Web App Manifest, IndexedDB

## 📱 Instalación como PWA

### En Android (Chrome)
1. Visita la aplicación en Chrome
2. Toca el menú (tres puntos)
3. Selecciona "Añadir a pantalla de inicio"

### En iOS (Safari)
1. Visita la aplicación en Safari
2. Toca el botón de compartir
3. Selecciona "Añadir a pantalla de inicio"

### En Desktop (Chrome/Edge)
1. Visita la aplicación
2. Haz clic en el icono de instalación en la barra de direcciones
3. O usa el menú > Instalar aplicación

## 🔒 Seguridad

- Autenticación obligatoria para acceder a datos
- Reglas de Firestore restrictivas
- Validación de datos en cliente
- Escape de HTML para prevenir XSS

## 🌐 Compatibilidad

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 📝 Licencia

Este proyecto es de código abierto. Puedes usarlo y modificarlo libremente.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request para sugerencias y mejoras.

---

Desarrollado con ❤️ para el seguimiento de salud personal
