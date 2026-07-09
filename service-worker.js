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

// ==========================================
// 📢 BİLDİRİM MERKEZİ VE MEGAFON MOTORU
// ==========================================

// 1. Yönetici Megafonu (Toplu Bildirim) İşlevi
window.sendMassNotification = function() {
    let msg = document.getElementById('adminMassMessage').value.trim();
    if(!msg) return showToast("Lütfen göndermek için bir mesaj yazın.", "warning");
    
    showCustomConfirm("TOPLU BİLDİRİM GÖNDERİMİ", "Bu mesaj sistemdeki TÜM OYUNCULARIN profiline anlık bildirim olarak düşecektir. Onaylıyor musunuz?", () => {
        let btn = document.activeElement; let orig = btn.innerText;
        btn.innerText = "⏳ GÖNDERİLİYOR..."; btn.disabled = true;
        
        let updates = {};
        let now = Date.now();
        // Sistemdeki herkese bu bildirimi işle
        Object.values(globalUsers).forEach(u => {
            if(u && u.id && u.id !== 'ADMIN') {
                let newRef = database.ref(`the_35_gold_league/users/${u.id}/alerts`).push();
                updates[`the_35_gold_league/users/${u.id}/alerts/${newRef.key}`] = { text: `📢 <strong>YÖNETİCİ DUYURUSU:</strong> ${msg}`, time: now };
            }
        });
        
        // Tek seferde veritabanına bas (Performanslı kayıt)
        database.ref().update(updates).then(() => {
            showToast("Duyuru tüm oyunculara başarıyla gönderildi!", "success");
            document.getElementById('adminMassMessage').value = '';
            btn.innerText = orig; btn.disabled = false;
        }).catch(err => {
            showToast("Hata: " + err.message, "error");
            btn.innerText = orig; btn.disabled = false;
        });
    });
}

// 2. Kura Motorlarına "Otomatik Turnuva Başlangıç" Bildirimi Ekleme (Kanca)
let originalStartPending = window.startPendingTournament;
window.startPendingTournament = function(btn) {
    let t = allTourneys[currentTid]; 
    let tName = t.settings.customName || "Turnuva";
    
    // Eski fonksiyonu çalıştır (Kurayı Çeker)
    originalStartPending(btn);
    
    // Kuradan hemen sonra o turnuvadaki oyunculara bildirim at
    setTimeout(() => {
        if(allTourneys[currentTid] && allTourneys[currentTid].settings.status === 'active') {
            _arr(allTourneys[currentTid].players).forEach(p => {
                addAlertToUser(p.id, `🎉 <strong>TURNUVA BAŞLADI!</strong> <em>[${tName}]</em> kuraları çekildi ve fikstürünüz oluşturuldu. Fikstür sekmesinden rakiplerinizi görebilirsiniz. Başarılar!`);
            });
        }
    }, 2000); // Veritabanı kaydının bitmesi için 2 saniye bekler
}

let originalStartManual = window.startManualTournament;
window.startManualTournament = function(btn) {
    let cName = document.getElementById('leagueCustomName_m').value.trim() || `İZMİR 35 KORTENİS LİGİ`;
    
    // Eski fonksiyonu çalıştır (Kurayı Çeker)
    originalStartManual(btn);
    
    // Kuradan hemen sonra seçili oyunculara bildirim at
    setTimeout(() => {
        let checked = document.querySelectorAll('.admin-chk:checked');
        Array.from(checked).forEach(cb => {
            addAlertToUser(cb.value, `🎉 <strong>TURNUVA BAŞLADI!</strong> <em>[${cName}]</em> kuraları çekildi ve fikstürünüz oluşturuldu. Fikstür sekmesinden rakiplerinizi görebilirsiniz. Başarılar!`);
        });
    }, 2000);
}
