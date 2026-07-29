# supalytics

Supabase projeleriniz için **cihaz-üstü kullanıcı analitiği**. Kaç kişi girmiş, kimler girmiş, en son ne zaman girmiş, günlük/haftalık aktif kullanıcı, hangi sağlayıcıdan ve hangi platformdan — hepsi telefonunuzda, şık ve karanlık bir panelde.

Sunucu yok. Telemetri yok. `service_role` yok. Arayüz telefon diline göre otomatik **Türkçe / İngilizce**.

## Güvenlik modeli (önce bunu okuyun)

- **Tanrı anahtarı asla.** Uygulama yalnızca herkese açık `anon` anahtar + sizin kendi Supabase Auth hesabınızla çalışır. `service_role` hiçbir ekranda istenmez, hiçbir yerde saklanmaz.
- **Yetki veritabanında.** Tüm veri `security definer` RPC'lerden gelir; her RPC ilk satırda `analytics.is_admin()` kontrolü yapar. `analytics.admins` tablosunda olmayan herkes — anon anahtarı ele geçirenler dahil — `forbidden` alır. İstemciye güvenilmez.
- **Sırlar Keychain'de.** Bağlantı bilgileri ve oturum yalnızca iOS Keychain / Android Keystore'da (`expo-secure-store`) durur; sırlar asla düz dosyaya/AsyncStorage'a yazılmaz, loglanmaz. (Sır içermeyen arayüz tercihleri — tema, metrik seçimi — AsyncStorage'dadır. Güvenli depolama çalışmayan bir istemcide uygulama sırları kaydetmeyi reddeder ve bunu açıkça söyler.)
- **Tek ağ trafiği:** kendi Supabase projeniz. Başka hiçbir domain'e istek atılmaz.

### Neden service_role yok?

`service_role` anahtarı RLS'i baypas eder, veritabanınızdaki her şeyi okuyup yazabilir. Bir mobil cihazda durmaması gerekir — çalınan telefon veya sızan yedek, bütün veritabanınız demektir. supalytics bunun yerine yetkiyi veritabanının içine koyar: herkese açık `anon` anahtar tek başına hiçbir şey açmaz; veri ancak `analytics.admins` listesindeki bir hesabın oturumuyla akar.

## Kurulum

```bash
npm install
npx expo start
```

iPhone/Android'de **Expo Go** ile QR'ı okutun (Mac gerekmez). Gerisini uygulama içindeki sihirbaz anlatır:

1. **Ne görmek istiyorsun?** Önce metriklerini seçersin (aktif kullanıcılar, kayıtlar, sağlayıcılar, cihazlar, oturumlar, işlem akışı).
2. **Veri kaynağı:** "Demo verilerle gez" dersen hiçbir kurulum gerekmez. "Kendi projeme bağlan" dersen…
3. **SQL adımı:** Uygulama, *seçtiğin metriklere göre daraltılmış* kurulum SQL'ini gerekçeleriyle birlikte gösterir — minik bir **Kopyala** butonuyla. Supabase **SQL Editor**'e yapıştırıp çalıştırırsın; en alttaki `>>> EDIT ME` bloğuyla kendi hesabını admin yaparsın (adımlar tek tek ekranda yazar).
4. **API adımı:** Project URL + `anon (public)` anahtar + admin hesabının e-posta/şifresi. Bilgilerin Dashboard'da nerede olduğu ekranda anlatılır; `service_role`/secret anahtar yapıştırırsan uygulama **reddeder**. "Bağlan ve doğrula" hem girişi hem admin yetkisini gerçek bir RPC çağrısıyla test eder.

Aynı SQL rehberi sonradan **Ayarlar → "Kurulum SQL'i"** ekranından da açılır (metrik seçimini değiştirirsen güncel script'i oradan alıp tekrar çalıştırman yeterlidir; script tekrar çalıştırmaya dayanıklıdır).

Depodaki [`supabase/setup.sql`](supabase/setup.sql), tüm metrikleri kapsayan tam sürümdür; uygulamadaki üreteçle aynı gövdeyi paylaşır. Script:

- `analytics` şemasını (admin listesi + giriş arşivi) kurar,
- `supalytics_*` RPC'lerini tanımlar (`revoke`/`grant` kapanışıyla),
- Supabase'in kalıcı olmayan `auth.audit_log_entries` logunu her gece `analytics.login_history`'ye arşivleyen `pg_cron` işini kurar ve ilk backfill'i yapar. Aktiflik/cihaz/akış metrikleri seçilmediyse uygulamanın ürettiği "çekirdek" script bu arşiv katmanını hiç kurmaz.

## Ekranlar

| Ekran | İçerik |
|---|---|
| **Özet** | "Bugün aktif" hero sayısı + düne göre delta, seçtiğiniz metrik kartları (haftalık aktif, bağlılık, kayıtlar + sparkline, sağlayıcı, cihaz), son hareketler akışı |
| **Kullanıcılar** | Aranabilir kullanıcı listesi, son görülme, sağlayıcı glifleri; satıra dokununca giriş zaman çizelgesi |
| **Grafikler** | 7/30/90 günlük aktif ve kayıt serileri, sağlayıcı/cihaz kırılımları |
| **Ayarlar** | Bağlantı durumu ve sıfırlama, Face ID/parmak izi kilidi, metrik anahtarları, vurgu rengi |

*Ekran görüntüleri yakında.*

## Demo modu

Hiçbir şey bağlamadan tüm arayüz deterministik sahte veriyle gezilebilir (seed'li PRNG — her render aynı sayıları üretir). Gerçek moda geçmek için Ayarlar → "Bağlantıyı sil ve sıfırla" ile onboarding'e dönün.

## Bilinen sınırlar

- Expo Go'da `ExpoSecureStore... is not a function` benzeri bir hata görürseniz telefonunuzdaki **Expo Go güncel değil** demektir — mağazadan güncelleyin. Uygulama bu durumda çökmez: demo modu tam çalışır, gerçek bağlantı ise sırları kaydedemeyeceğini söyleyip durur.

- `expo-secure-store` Android'de 2048 bayttan büyük değerlerde uyarı verir; Supabase oturum JSON'u büyüyebilir. Şimdilik çalışır; v2'de oturum şifreli depolamaya taşınabilir.
- Arşivlenen giriş kayıtlarındaki `user_agent`, giriş anına yakın `auth.sessions` kaydından alınır; oturum arşivden önce silindiyse cihaz "Bilinmiyor" düşer.
- "Aktif" tanımı: `login` veya `token_refreshed` olayı.

## Katkı ve lisans

PR'lar açık. Her yeni bağımlılık PR'da gerekçelendirilir. Güvenlik bildirimleri için [SECURITY.md](SECURITY.md).

[Apache-2.0](LICENSE)
