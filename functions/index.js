const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
admin.initializeApp();

// Veritabanımız Avrupa'da olduğu için fonksiyonları da Avrupa'ya (europe-west1) kuruyoruz
const myRegion = functions.region('europe-west1');

// =================================================================
// 1. KANCA: SKOR ONAYLARI VE GİRİŞLERİ
// =================================================================
exports.onMatchStatusChange = myRegion.database.ref('/the_35_gold_league/multi_v1/{tourneyId}/matches/{matchId}')
  .onUpdate(async (change, context) => {
    const before = change.before.val();
    const after = change.after.val();

    if (!after.played) return null;

    if (!before.pending && after.pending) {
        const opponentId = (after.enteredBy === after.p1) ? after.p2 : after.p1;
        await sendNotificationToUser(opponentId, "⏳ Skor Onayı Bekleniyor", `${after.p1Name} vs ${after.p2Name} maçının skoru girildi. Lütfen onaylayın.`);
        await sendNotificationToUser('ADMIN', "🔔 Yeni Skor Girildi", `${after.p1Name} vs ${after.p2Name} maçı için onay bekleniyor.`);
    }
    else if (before.pending && !after.pending) {
        await sendNotificationToUser(before.enteredBy, "✅ Skor Onaylandı!", `${after.p1Name} vs ${after.p2Name} maçınızın skoru tablolara işlendi.`);
        await sendNotificationToUser('ADMIN', "🏆 Skor İşlendi", `${after.p1Name} vs ${after.p2Name} maçının skoru onaylandı.`);
    }
    return null;
  });

// =================================================================
// 2. KANCA: SİSTEM UYARILARI VE ANALİZLERİ
// =================================================================
exports.onUserAlertAdded = myRegion.database.ref('/the_35_gold_league/users/{userId}/alerts/{alertId}')
  .onCreate(async (snapshot, context) => {
    const userId = context.params.userId;
    const alertData = snapshot.val();
    
    if (alertData && alertData.text) {
        const cleanText = alertData.text.replace(/<[^>]*>?/gm, '');
        await sendNotificationToUser(userId, "🎾 İzmir 35 Ligi'nden Mesaj", cleanText);
    }
    return null;
  });

// =================================================================
// 3. KANCA: YENİ OYUNCU KAYDI
// =================================================================
exports.onNewUserRegistration = myRegion.database.ref('/the_35_gold_league/users/{userId}')
  .onCreate(async (snapshot, context) => {
    const userData = snapshot.val();
    
    if (userData && userData.name) {
        await sendNotificationToUser('ADMIN', "👤 Yeni Oyuncu Kaydı", `${userData.name} isimli tenisçi sisteme ${userData.tier} kategorisinden katıldı!`);
    }
    return null;
  });
// =================================================================
// BİLDİRİM FIRLATICI YARDIMCI MOTOR (GÜNCEL V12 VERSİYONU)
// =================================================================
async function sendNotificationToUser(userId, title, body) {
    try {
        const userSnap = await admin.database().ref(`/the_35_gold_league/users/${userId}/fcmToken`).once('value');
        const token = userSnap.val();
        
        if (token) {
            // Yeni sistemde Token, payload'un direkt içine yazılır
            const message = {
                notification: { 
                    title: title, 
                    body: body
                },
                token: token 
            };
            // sendToDevice yerine güncel send komutunu kullanıyoruz
            await admin.messaging().send(message);
            console.log(`✅ Bildirim başarıyla fırlatıldı -> Kullanıcı: ${userId}`);
        } else {
            console.log(`❌ HATA: Token bulunamadı -> Kullanıcı: ${userId}`);
        }
    } catch (error) {
        console.error(`🚨 Bildirim hatası -> Kullanıcı: ${userId}`, error);
    }
}
