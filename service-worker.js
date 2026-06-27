const CACHE_NAME = "kortenis-v1";
const ASSETS_TO_CACHE = [
  "./index.html",
  // İleride buraya başka görseller veya CSS dosyaları eklerseniz yazabilirsiniz
];

// Kurulum Aşaması (Önbelleğe Alma)
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Önbellek (Cache) başarıyla açıldı.");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Veri Çekme Aşaması (Hızlı Yükleme)
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Önbellekte varsa onu ver, yoksa internetten (ağdan) çek
      return response || fetch(event.request);
    })
  );
});