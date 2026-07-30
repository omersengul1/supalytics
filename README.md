# supalytics

Supabase projeleriniz için **cihaz-üstü kullanıcı analitiği**. Kaç kişi girmiş, kimler girmiş, şu an kaç kişi çevrimiçi, günlük/haftalık aktif, kayıt büyümesi, MFA kullanımı, hangi sağlayıcıdan ve hangi platformdan — hepsi telefonunuzda, şık ve karanlık bir panelde. **Birden fazla Supabase projesi** bağlanabilir; üstteki seçiciden tek dokunuşla aralarında geçilir.

Sunucu yok. Telemetri yok. `service_role` yok. Arayüz telefon diline göre otomatik **Türkçe / İngilizce**.

## Güvenlik modeli (önce bunu okuyun)

- **Tanrı anahtarı asla.** Uygulama yalnızca herkese açık `anon` anahtar + sizin kendi Supabase Auth hesabınızla çalışır. `service_role` hiçbir ekranda istenmez, hiçbir yerde saklanmaz.
- **Yetki veritabanında.** Tüm veri `security definer` RPC'lerden gelir; her RPC ilk satırda `analytics.is_admin()` kontrolü yapar. `analytics.admins` tablosunda olmayan herkes — anon anahtarı ele geçirenler dahil — `forbidden` alır. İstemciye güvenilmez.
- **Sırlar Keychain'de.** Bağlantı bilgileri ve oturum yalnızca iOS Keychain / Android Keystore'da (`expo-secure-store`) durur; sırlar asla düz dosyaya/AsyncStorage'a yazılmaz, loglanmaz. (Sır içermeyen arayüz tercihleri — tema, metrik seçimi — AsyncStorage'dadır. Güvenli depolama çalışmayan bir istemcide uygulama sırları kaydetmeyi reddeder ve bunu açıkça söyler.)
- **Tek ağ trafiği:** kendi Supabase projeleriniz — artı, kullanıcılarınızın profil fotoğrafları görüntülenirken fotoğrafın barındığı adres (ör. Google/GitHub avatar sunucusu). Bunun dışında hiçbir domain'e istek atılmaz; demo modu tamamen çevrimdışıdır.

### Neden service_role yok?

`service_role` anahtarı RLS'i baypas eder, veritabanınızdaki her şeyi okuyup yazabilir. Bir mobil cihazda durmaması gerekir — çalınan telefon veya sızan yedek, bütün veritabanınız demektir. supalytics bunun yerine yetkiyi veritabanının içine koyar: herkese açık `anon` anahtar tek başına hiçbir şey açmaz; veri ancak `analytics.admins` listesindeki bir hesabın oturumuyla akar.

### Neden "Supabase hesabınla giriş yap" yok?

Supabase'in yönetim API'sine OAuth ile bağlanmak teknik olarak mümkün; ama o token **tüm organizasyonlarınızdaki tüm projelere** (service_role anahtarlarını çekmek dahil) yönetim erişimi verir — telefonda durmaması gereken ikinci bir tanrı anahtarıdır ve ayrıca kendi OAuth uygulamanızı kaydetmenizi gerektirir. supalytics bunun yerine proje başına `anon` anahtar + admin oturumu ister ve çoklu projeyi uygulama içindeki seçiciyle çözer: aynı düşük yetkili model, daha az kurulum.

## Kurulum

```bash
npm install
npx expo start
```

iPhone/Android'de **Expo Go** ile QR'ı okutun (Mac gerekmez). Gerisini uygulama içindeki sihirbaz anlatır:

1. **Ne görmek istiyorsun?** Önce metriklerini seçersin (aktif kullanıcılar, kayıtlar, sağlayıcılar, cihazlar, oturumlar, işlem akışı).
2. **Veri kaynağı:** "Demo verilerle gez" dersen hiçbir kurulum gerekmez. "Kendi projeme bağlan" dersen…
3. **E-posta adımı:** Yönetici e-postanı yazarsın; kurulum SQL'i bu adrese göre **hazır** üretilir.
4. **SQL adımı:** Uygulama, *seçtiğin metriklere göre daraltılmış* script'i gerekçeleriyle gösterir — **Kopyala** → SQL Editor'e yapıştır → **Run**. Hepsi bu: script'te hiçbir şey düzenlemezsin; admin yetkisi e-postana bağlanır (güvenlik şartı: o e-postayla giriş yapan hesabın e-postası **doğrulanmış** olmalı — başkasının adresini doğrulamadan kaydeden biri yetki alamaz).
5. **API adımı:** `anon (public)` anahtarı yapıştırırsın (JWT anahtarlarda Proje URL'si kendiliğinden dolar) + e-posta (önceden dolu) + şifre. `service_role`/secret anahtar yapıştırırsan uygulama **reddeder**. "Bağlan ve doğrula" hem girişi hem admin yetkisini gerçek bir RPC çağrısıyla test eder.

Aynı SQL rehberi sonradan **Ayarlar → "Kurulum SQL'i"** ekranından da açılır (metrik seçimini değiştirirsen güncel script'i oradan alıp tekrar çalıştırman yeterlidir; script tekrar çalıştırmaya dayanıklıdır).

Depodaki [`supabase/setup.sql`](supabase/setup.sql), tüm metrikleri kapsayan tam sürümdür; uygulamadaki üreteçle aynı gövdeyi paylaşır. Script:

- `analytics` şemasını (admin listesi + giriş arşivi) kurar,
- `supalytics_*` RPC'lerini tanımlar (`revoke`/`grant` kapanışıyla),
- Supabase'in kalıcı olmayan `auth.audit_log_entries` logunu her gece `analytics.login_history`'ye arşivleyen `pg_cron` işini kurar ve ilk backfill'i yapar. Aktiflik/cihaz/akış metrikleri seçilmediyse uygulamanın ürettiği "çekirdek" script bu arşiv katmanını hiç kurmaz.
- **v2:** metrikler yalnızca arşivden değil, Supabase'in **canlı** tablolarından da beslenir (`auth.audit_log_entries` + `auth.sessions`): "bugün aktif", cihazlar ve akış, gece arşivi daha hiç çalışmamışken bile dolar. Kullanıcı listesi isim + profil fotoğrafı (`raw_user_meta_data`) döner; "en aktif kullanıcılar" ve genişletilmiş `totals` (çevrimiçi, açık oturum, bugünkü girişler, MFA, doğrulanmamış, haftalık büyüme) eklendi.
- **v3 — audit log'a bağımlılık kalktı:** bazı Supabase projelerinde `auth.audit_log_entries` boştur/yazılmaz. Aktiflik artık üç sinyalin birleşimi: `auth.users.last_sign_in_at` (her girişte güncellenir) + canlı `auth.sessions` hareketi + olay geçmişi. Ayrıca `auth.users` üzerine iki güvenli tetikleyici (`supalytics_track_signin/signup`) her giriş ve kaydı kendi geçmiş tablona yazar — geçmiş, audit log olmadan da birikir. Tetikleyici gövdesi hatayı yutar: analitik, gerçek girişi asla engelleyemez.

> **v1'den yükseltme:** güncel script'i (uygulamada Ayarlar → "Kurulum SQL'i") baştan sona yeniden çalıştırmanız yeterli — dönüş tipi değişen fonksiyonları kendisi düşürüp yeniden kurar, veriye dokunmaz.

## Ekranlar

| Ekran | İçerik |
|---|---|
| **Özet** | "Bugün aktif" hero + düne göre delta, üstte **proje seçici**; kartlar: haftalık aktif, bağlılık, şu an çevrimiçi, bugünkü girişler, kayıtlar + sparkline, haftalık büyüme, doğrulanmamış, MFA, açık oturumlar, sağlayıcı, cihaz; **en aktif kullanıcılar** (avatarlı) ve son hareketler akışı |
| **Kullanıcılar** | Aranabilir liste (isim/e-posta), **profil fotoğrafları**, sonsuz kaydırmayla tüm kullanıcılar; satıra dokununca giriş zaman çizelgesi |
| **Grafikler** | 7/30/90 günlük aktif ve kayıt serileri, sağlayıcı/cihaz kırılımları |
| **Ayarlar** | Bağlantı durumu ve sıfırlama, **proje listesi** (ekle/kaldır), Face ID/parmak izi kilidi, metrik anahtarları, vurgu rengi |

*Ekran görüntüleri yakında.*

## Demo modu

Hiçbir şey bağlamadan tüm arayüz deterministik sahte veriyle gezilebilir (seed'li PRNG — her render aynı sayıları üretir). Gerçek moda geçmek için Ayarlar → "Bağlantıyı sil ve sıfırla" ile onboarding'e dönün.

## Bilinen sınırlar

- Expo Go'da `ExpoSecureStore... is not a function` benzeri bir hata görürseniz telefonunuzdaki **Expo Go güncel değil** demektir — mağazadan güncelleyin. Uygulama bu durumda çökmez: demo modu tam çalışır, gerçek bağlantı ise sırları kaydedemeyeceğini söyleyip durur.
- Alt sekme çubuğu iOS 26'nın Liquid Glass efektini (`expo-glass-effect`) dener; bu native modül Expo Go istemcinizde henüz yoksa uygulama sessizce düz bulanıklaştırma (blur) tasarımına düşer — çökmez.
- "permission denied for function ..." hatası görürseniz kurulum script'i eksik/kısmi çalışmış demektir: script'i en baştan sona (en alttaki `>>> EDIT ME` dahil) SQL Editor'e yeniden yapıştırıp çalıştırın.

- `expo-secure-store` Android'de 2048 bayttan büyük değerlerde uyarı verir; Supabase oturum JSON'u büyüyebilir. Şimdilik çalışır; v2'de oturum şifreli depolamaya taşınabilir.
- Arşivlenen giriş kayıtlarındaki `user_agent`, giriş anına yakın `auth.sessions` kaydından alınır; oturum arşivden önce silindiyse cihaz "Bilinmiyor" düşer.
- "Aktif" tanımı: `login` veya `token_refreshed` olayı.

## Katkı ve lisans

PR'lar açık. Her yeni bağımlılık PR'da gerekçelendirilir. Güvenlik bildirimleri için [SECURITY.md](SECURITY.md).

[Apache-2.0](LICENSE)
