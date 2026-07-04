# Gelecek Envanteri ✦

Şehre Dönüş (1 Şubat 2028) için ev envanteri PWA'sı. Excel'in yerini alır: oda → kategori → ürün hiyerarşisi, wishlist karşılaştırma, taksit/borç takibi, Google Drive eşitleme. Sunucu yok, hesap yok, veri senin.

**İçe aktarılan başlangıç verisi:** 7 oda · 36 kategori · 156 ürün (Salon'daki 19 birebir kopya satır tekilleştirildi; *Market Listesi* sayfası bilinçli olarak dahil edilmedi — o bir alışveriş manifestosu, envanter değil).

---

## 1 · Yayına alma (GitHub Pages)

Mounjaro Tracker ile aynı akış:

1. GitHub'da yeni repo aç (ör. `gelecek-envanteri`), bu klasördeki **5 dosyayı** köke yükle:
   `index.html · sw.js · manifest.webmanifest · icon-192.png · icon-512.png · apple-touch-icon.png`
2. Settings → Pages → Branch: `main`, klasör `/ (root)` → Save.
3. 1-2 dk sonra adres: `https://KULLANICIADIN.github.io/gelecek-envanteri/`
4. iPhone'da Safari ile aç → Paylaş → **Ana Ekrana Ekle**. Tam ekran, çevrimdışı çalışır.

> Repo **public** olabilir: içinde hiçbir kişisel veri yok. Verilerin cihazında (localStorage) ve kendi Drive'ında yaşar.

## 2 · Google Drive eşitleme kurulumu (bir kere, ~5 dk)

Uygulama verini Drive'ının **appDataFolder** denen gizli, uygulamaya özel bölmesinde tek dosya olarak tutar (`ge-data.json`). Drive arayüzünde görünmez, kotandan yer yemez denecek kadar küçüktür.

1. [console.cloud.google.com](https://console.cloud.google.com) → yeni proje (ör. `gelecek-envanteri`).
2. **APIs & Services → Library → Google Drive API → Enable.**
3. **OAuth consent screen:**
   - User type: **External** → Create
   - App name + kendi e-postan, kaydet.
   - Publishing status **Testing**'de kalabilir → **Test users**'a kendi Gmail'ini ekle. (Sadece sen kullanacağın için doğrulama sürecine hiç girme.)
4. **Credentials → Create credentials → OAuth client ID:**
   - Application type: **Web application**
   - Authorized JavaScript origins: `https://KULLANICIADIN.github.io`
   - Redirect URI **gerekmez**, client secret **gerekmez** (token akışı tarayıcıda biter).
5. Çıkan `xxxxx.apps.googleusercontent.com` kimliğini kopyala → uygulamada **Ayarlar → Eşitleme** alanına yapıştır → Kaydet → **Bağlan**.

Bundan sonrası otomatik: değişiklikler ~4 sn sonra sessizce Drive'a yazılır; uygulama açılışında Drive'dan çekilip alan-bazında birleştirilir (her kayıt için en yeni `updatedAt` kazanır — iki cihazda aynı anda farklı ürünleri düzenlesen bile çakışma olmaz). Yeni cihazda: aynı adres → Ana Ekrana Ekle → Client ID yapıştır → Bağlan → her şey iner.

**Testing modu notu:** Google, Testing modundaki uygulamaların token'larını 7 günde bir düşürür; uygulama açılışta sessizce yenilemeyi dener, olmadıysa Ayarlar'da "Yeniden bağlan" görürsün — tek dokunuş. Bundan kurtulmak istersen consent ekranını "In production"a alıp yalnızca `drive.appdata` scope'u ile yayınlarsın; hassas scope olmadığı için doğrulama istemez.

## 3 · Mimari (ileride genişletmek için)

- **Tek dosya, sıfır build.** `index.html` içinde CSS + vanilla JS. TypeScript şart koşulmuştu; bilinçli olarak vazgeçildi — sebep aşağıda, "Kararlar" bölümünde.
- **State:** tek JSON ağacı → `localStorage['ge_state_v1']`. Şema sürümlü (`v:1`); ileride alan eklemek = `migrate()` fonksiyonuna bir satır.
- **Varlıklar:** `rooms[] · cats[] · products[] · tagBank[]`, hepsi `{id, updatedAt, deleted?}` taşır. Silme = tombstone (eşitleme için şart); 60 günden eski tombstone'lar push sırasında temizlenir.
- **Ürün şeması** ileriye açık: `warranty`, `invoiceUrl`, `maintenanceAt` gibi alanlar eklemek kırıcı değildir — eski kayıtlar `??=` ile varsayılan alır.
- **Finans türetilmiş veridir:** hiçbir toplam saklanmaz; `finance()` her render'da durum `Satın Alındı` + fiyat + taksit + başlangıç ayından hesaplar. Aylık yük = fiyat/taksit; kalan borç = kalan ay × aylık.
- **Eşitleme:** GIS token client (`drive.appdata` scope) → Drive REST v3. Kayıt-bazında last-write-wins merge `mergeRemote()` içinde; iki yönlü fark tespiti (`changedLocal` / `aheadLocal`).
- **Yeni modül eklemek** (ör. Market Listesi): state'e `groceries[]` ekle, `NAV`'a sekme, `render{X}()` yaz, dispatcher'a iki satır. Eşitleme otomatik kapsar (mergeArr listesine anahtarı ekle).

## 4 · Kararlar / bilinçli sapmalar

- **TypeScript yok.** Tek dosyalı, build'siz, GitHub Pages'a sürükle-bırak dağıtım isteğiyle TS çelişiyordu (derleyici + çıktı dosyaları = senin tarafında npm zinciri). Tip güvenliği yerine dar yüzeyli şema + `migrate()` + savunmacı `??=` tercih edildi. İstersen sonraki sürümde Vite + TS'e taşınır; state şeması buna hazır.
- **Market Listesi** içe aktarılmadı — envanter değil, tekrarlayan alışveriş manifesti. İleride ayrı modül olarak eklenebilir (yukarıdaki tarif).
- **Salon** sayfasındaki 19 birebir kopya satır tekilleştirildi (aynı ürün adı + kategori, tüm meta alanları boş).
- Eski Excel durumları (`İndirim bekleniyor`, `Zaten vardı`…) taşınmadı: dosyada hiçbir üründe durum işaretli değildi, şablon sıfırdı. Yeni durum seti: **İhtiyaç → Araştırılıyor → Wishlist → Alınacak → Satın Alındı**. "İndirim bekleniyor" ihtiyacın olursa etiket olarak yaşar (etiket sistemi serbest).

## 5 · Küçük notlar 

- **Yedek:** Ayarlar → "Verileri dışa aktar" tarihli JSON indirir; "Yedekten geri yükle" aynı dosyayı merge eder (silmez, birleştirir).
- **Tema:** Oto/Açık/Koyu — Oto, iOS sistem temasını takip eder.
- **Arşiv mantığı:** Wishlist'te "Bunu seç" → seçilen alternatifin markası/fiyatı/linki ürüne yazılır, diğerleri arşive iner (silinmez, kart altında ARŞİV bölümünde durur, geri alınabilir).
- claude.ai önizlemesinde localStorage kısıtlı olduğundan uygulama **geçici depolama modu**na düşer ve bunu ayarlar sayfasının altında söyler; GitHub Pages'ta bu mod hiç görünmez.
