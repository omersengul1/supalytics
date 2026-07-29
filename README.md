# supalytics

Supabase projeleriniz için **cihaz-üstü kullanıcı analitiği**. Kaç kişi girmiş, kimler girmiş, en son ne zaman girmiş, günlük/haftalık aktif kullanıcı, hangi sağlayıcıdan ve hangi platformdan — hepsi telefonunuzda, şık ve karanlık bir panelde.

Sunucu yok. Telemetri yok. `service_role` yok.

## Güvenlik modeli (önce bunu okuyun)

- **Tanrı anahtarı asla.** Uygulama yalnızca herkese açık `anon` anahtar + sizin kendi Supabase Auth hesabınızla çalışır. `service_role` hiçbir ekranda istenmez, hiçbir yerde saklanmaz.
- **Yetki veritabanında.** Tüm veri `security definer` RPC'lerden gelir; her RPC ilk satırda `analytics.is_admin()` kontrolü yapar. `analytics.admins` tablosunda olmayan herkes — anon anahtarı ele geçirenler dahil — `forbidden` alır. İstemciye güvenilmez.
- **Sırlar Keychain'de.** Bağlantı bilgileri, oturum ve tercihler yalnızca iOS Keychain / Android Keystore'da (`expo-secure-store`) durur. Düz dosya yok, AsyncStorage yok, log yok.
- **Tek ağ trafiği:** kendi Supabase projeniz. Başka hiçbir domain'e istek atılmaz.

### Neden service_role yok?

`service_role` anahtarı RLS'i baypas eder, veritabanınızdaki her şeyi okuyup yazabilir. Bir mobil cihazda durmaması gerekir — çalınan telefon veya sızan yedek, bütün veritabanınız demektir. supalytics bunun yerine yetkiyi veritabanının içine koyar: herkese açık `anon` anahtar tek başına hiçbir şey açmaz; veri ancak `analytics.admins` listesindeki bir hesabın oturumuyla akar.

## Kurulum

### 1. Veritabanı (bir kez)

[`supabase/setup.sql`](supabase/setup.sql) dosyasını Supabase **SQL Editor**'de baştan sona çalıştırın. Script:

- `analytics` şemasını (admin listesi + giriş arşivi) kurar,
- 8 adet `supalytics_*` RPC'sini tanımlar (`revoke`/`grant` kapanışıyla),
- Supabase'in kalıcı olmayan `auth.audit_log_entries` logunu her gece `analytics.login_history`'ye arşivleyen `pg_cron` işini kurar ve ilk backfill'i yapar.

Sonra dosyanın en altındaki `>>> EDIT ME` bloğunu kendi `user_id`'nizle açın — admin eklemeden panel her istekte `forbidden` görür.

### 2. Uygulama

```bash
npm install
npx expo start
```

iPhone/Android'de **Expo Go** ile QR'ı okutun (Mac gerekmez). Açılışta:

1. Proje URL'si, `anon` anahtarı ve admin hesabınızın e-posta/şifresi ile **Bağlan ve doğrula** — ya da hiçbir şey bağlamadan **"Şimdilik demo verilerle gez"**.
2. Odağınızı seçin (Büyüme / Tutundurma / Kullanıcılar) — Özet ekranının sırası buna göre dizilir.
3. Özet'te görünecek metrikleri ve vurgu renginizi seçin.

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

- `expo-secure-store` Android'de 2048 bayttan büyük değerlerde uyarı verir; Supabase oturum JSON'u büyüyebilir. Şimdilik çalışır; v2'de oturum şifreli depolamaya taşınabilir.
- Arşivlenen giriş kayıtlarındaki `user_agent`, giriş anına yakın `auth.sessions` kaydından alınır; oturum arşivden önce silindiyse cihaz "Bilinmiyor" düşer.
- "Aktif" tanımı: `login` veya `token_refreshed` olayı.

## Katkı ve lisans

PR'lar açık. Her yeni bağımlılık PR'da gerekçelendirilir. Güvenlik bildirimleri için [SECURITY.md](SECURITY.md).

[Apache-2.0](LICENSE)
