importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

// Mevcut Firebase Ayarların
firebase.initializeApp({
  apiKey: "AIzaSyApCz945HTBQ_BP8jG0TPpPmLgNoqNhV9k",
  authDomain: "device-streaming-c489eab4.firebaseapp.com",
  databaseURL: "https://device-streaming-c489eab4-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "device-streaming-c489eab4",
  storageBucket: "device-streaming-c489eab4.firebasestorage.app",
  messagingSenderId: "627974243795",
  appId: "1:627974243795:web:3f38fdf50b5ab8e3ac1b26"
});

const messaging = firebase.messaging();

// Telefon kapalıyken / Arka plandayken gelen mesajı kilit ekranına basan motor
messaging.onBackgroundMessage((payload) => {
  console.log('Arka plan mesajı alındı:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});