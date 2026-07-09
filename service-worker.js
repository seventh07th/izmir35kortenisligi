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
// 🛠️ YÖNETİCİ KONTROL GÜNCELLEMELERİ
// ==========================================
// 1. Üst bar butonlarını duruma göre gösterme/gizleme
let originalAdminSwitch = window.adminSwitchLeague;
window.adminSwitchLeague = function() {
    originalAdminSwitch(); // Eski fonksiyonu çalıştır
    let val = document.getElementById('adminLeagueSelect').value;
    let delBtn = document.getElementById('deleteLeagueBtn');
    let editBtn = document.getElementById('editLeagueBtn');
    let swapBtn = document.getElementById('swapLeagueBtn');
    
    if(val === 'new_pending' || val === 'new_manual' || val === 'notifs' || val === 'tournaments') {
        if(delBtn) delBtn.style.display = 'none';
        if(editBtn) editBtn.style.display = 'none';
        if(swapBtn) swapBtn.style.display = 'none';
    } else {
        let t = allTourneys[val];
        if(!t) return;
        if(delBtn) delBtn.style.display = 'inline-block';
        if(editBtn) editBtn.style.display = 'inline-block';
        if(swapBtn) swapBtn.style.display = (t.settings.status === 'active') ? 'inline-block' : 'none';
    }
}

// 2. Ayarları kaydederken ExtraDays (Ekstra Süre) verisini de kaydetme
let originalOpenEdit = window.openEditTournamentModal;
window.openEditTournamentModal = function() {
    originalOpenEdit();
    if(currentTid && allTourneys[currentTid]) {
        document.getElementById('editTourneyExtraDays').value = allTourneys[currentTid].settings.extraDays || 0;
    }
}

let originalSaveSettings = window.saveTournamentSettings;
window.saveTournamentSettings = function() {
    if(currentTid && allTourneys[currentTid]) {
        allTourneys[currentTid].settings.extraDays = parseInt(document.getElementById('editTourneyExtraDays').value) || 0;
    }
    originalSaveSettings();
}

// 3. FİKSTÜR TAKAS MOTORU
window.openSwapModal = function() {
    if(!currentTid || !allTourneys[currentTid]) return;
    let t = allTourneys[currentTid];
    let s1 = document.getElementById('swapPlayer1');
    let s2 = document.getElementById('swapPlayer2');
    let opts = '<option value="">OYUNCU SEÇİNİZ...</option>';
    _arr(t.players).sort((a,b)=>a.name.localeCompare(b.name)).forEach(p => { opts += `<option value="${p.id}">${p.name}</option>`; });
    s1.innerHTML = opts; s2.innerHTML = opts;
    document.getElementById('adminSwapModal').style.display = 'flex';
}
window.closeSwapModal = function() { document.getElementById('adminSwapModal').style.display = 'none'; }

window.executeSwap = function() {
    let p1Id = document.getElementById('swapPlayer1').value;
    let p2Id = document.getElementById('swapPlayer2').value;

    if(!p1Id || !p2Id) return showToast("Lütfen iki oyuncuyu da seçin.", "warning");
    if(p1Id === p2Id) return showToast("Farklı iki oyuncu seçmelisiniz.", "error");

    showCustomConfirm("FİKSTÜR TAKASI", "Bu iki oyuncunun fikstürdeki (kura ağacındaki) yerleri ve tüm eşleşmeleri tamamen birbiriyle değiştirilecektir. Onaylıyor musunuz?", () => {
        let t = allTourneys[currentTid];
        let p1Obj = _arr(t.players).find(p => p.id === p1Id);
        let p2Obj = _arr(t.players).find(p => p.id === p2Id);

        _arr(t.matches).forEach(m => {
            let isP1 = (m.p1 === p1Id); let isOpp1 = (m.p1 === p2Id);
            let isP2 = (m.p2 === p1Id); let isOpp2 = (m.p2 === p2Id);

            // Eğer birbirleriyle oynuyorlarsa maçı bozma, sadece yerlerini değiştir
            if((isP1 && isOpp2) || (isP2 && isOpp1)) {
                let tempId = m.p1; let tempName = m.p1Name;
                m.p1 = m.p2; m.p1Name = m.p2Name;
                m.p2 = tempId; m.p2Name = tempName;
            } else {
                // Diğer tüm rakiplere karşı rotaları takas et
                if(isP1) { m.p1 = p2Id; m.p1Name = p2Obj.name; } else if(isOpp1) { m.p1 = p1Id; m.p1Name = p1Obj.name; }
                if(isP2) { m.p2 = p2Id; m.p2Name = p2Obj.name; } else if(isOpp2) { m.p2 = p1Id; m.p2Name = p1Obj.name; }
            }

            // Gelişmiş Güvenlik: Eğer maçın hükmen galibi veya normal galibi atandıysa onları da takas et
            if (m.woWinner === p1Id) m.woWinner = p2Id; else if (m.woWinner === p2Id) m.woWinner = p1Id;
            if (m.winnerId === p1Id) m.winnerId = p2Id; else if (m.winnerId === p2Id) m.winnerId = p1Id;
            if (m.enteredBy === p1Id) m.enteredBy = p2Id; else if (m.enteredBy === p2Id) m.enteredBy = p1Id;
        });

        closeSwapModal();
        saveToDb("Fikstür takası başarıyla gerçekleştirildi!");
    });
}
