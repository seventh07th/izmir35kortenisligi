// VERSİYONU GÜNCELLEDİK (v4'den v5'e çıktı)
const CACHE_NAME = "kortenis-v5"; 
const ASSETS_TO_CACHE = [
  "./index.html",
];

// Kurulum Aşaması
self.addEventListener("install", (event) => {
  self.skipWaiting(); // YENİ: Beklemeyi reddet, güncellemeyi anında kur!
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Önbellek (Cache) başarıyla açıldı.");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// YENİ: Eski Sürüm (v1) Temizleme Motoru
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("Eski sürüm silindi, yeni sürüme geçiliyor:", cache);
            return caches.delete(cache); // Eski dosyaları telefondan zorla sil
          }
        })
      );
    })
  );
  self.clients.claim(); // Yeni uygulamanın kontrolü hemen devralmasını sağla
});

// Veri Çekme Aşaması
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
