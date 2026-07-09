// VERSİYONU GÜNCELLEDİK (v9'dan v1'a çıktı)
const CACHE_NAME = "kortenis-v10"; 
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

// ==========================================
// AKILLI GETİRME MOTORU (NETWORK-FIRST)
// ==========================================
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                // 1. ADIM: İnternet varsa en güncel dosyayı Vercel'den çeker.
                // Çektiği bu en yeni dosyayı hemen telefonun hafızasına da (önbellek) kopyalar.
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            })
            .catch(() => {
                // 2. ADIM: Eğer oyuncunun interneti çekmiyorsa veya uçak modundaysa,
                // çökme ekranı yerine telefonun hafızasına kaydettiği en son versiyonu gösterir.
                return caches.match(event.request);
            })
    );
});