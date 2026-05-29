// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// TU CONFIGURACIÓN REAL DE FIREBASE (Usa exactamente la misma de tu index.html)
const firebaseConfig = {
    apiKey: "AIzaSyBoB3CCORIJN23iND5SJ5yRzXyxCgrKlb8",
    authDomain: "fag-brc.firebaseapp.com",
    projectId: "fag-brc",
    storageBucket: "fag-brc.firebasestorage.app",
    messagingSenderId: "614181842111",
    appId: "1:614181842111:web:f0f887f065b14317e9aa0a"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Esto se encarga de recibir la notificación cuando la app está CERRADA en Android
messaging.onBackgroundMessage((payload) => {
    console.log('Notificación recibida en segundo plano: ', payload);

    const notificationTitle = payload.notification.title || "¡Alerta BRC!";
    const notificationOptions = {
        body: payload.notification.body || "Cambio de estado",
        icon: 'https://cdn-icons-png.flaticon.com/512/3602/3602149.png', // Tu ícono del manifest
        badge: 'https://cdn-icons-png.flaticon.com/512/3602/3602149.png',
        vibrate: [200, 100, 200], // Hace que el celular vibre al llegar
        tag: 'brc-status-alert',
        renotify: true
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
