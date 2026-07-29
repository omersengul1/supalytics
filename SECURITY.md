# Güvenlik Politikası

## Tehdit modeli

supalytics'in tek işi, sizin Supabase projenizin auth verisini sizin cihazınızda göstermek. Tasarım şu senaryolara göre yapıldı:

### Çalınan / kaybolan telefon

- Bağlantı bilgileri ve oturum yalnızca iOS Keychain / Android Keystore'da durur (`expo-secure-store`); dosya sisteminde veya AsyncStorage'da düz kopya yoktur.
- `configureAndroidBackup: false` — sırlar Android yedeklerine girmez.
- İsteğe bağlı Face ID / parmak izi kilidi açıksa, kilit çözülmeden panel içeriği hiç render edilmez.
- Ayarlar → "Bağlantıyı sil ve sıfırla" tüm sırları tek hamlede siler.
- Yine de: cihazın kendisi ele geçirilir ve kilidi açılırsa, oturum da açılır. Bu durumda Supabase panelinden kullanıcının oturumlarını iptal edin ve şifreyi değiştirin.

### Sızan `anon` anahtar

- `anon` anahtar zaten herkese açıktır; supalytics ona ek yetki vermez.
- Bütün veri `security definer` RPC'lerden geçer ve her RPC ilk satırda `analytics.is_admin()` kontrolü yapar. `analytics.admins` tablosunda olmayan her çağrı — anon dahil — `forbidden` alır.
- RPC'lerden `anon` role'ün execute yetkisi açıkça `revoke` edilir; yalnızca `authenticated` çağırabilir (ve o da admin değilse reddedilir).
- `analytics` şeması API'ye hiç açılmaz; tablolarında RLS açıktır ve API rollerine hiçbir grant verilmez.

### Kötü niyetli fork / sahte istemci

- Yetki istemcide değil veritabanındadır: hangi istemci olursa olsun, admin olmayan bir hesap RPC'lerden veri alamaz.
- Uygulama `service_role` anahtarını hiçbir akışta istemez. İsteyen bir fork görürseniz, o fork'un amacı verinizi çalmaktır — resmi dağıtımları kullanın ve anahtarınızı yalnızca `anon` ile sınırlayın.
- Tek ağ hedefi kullanıcının kendi Supabase URL'sidir; üçüncü taraf domain'e istek yoktur. Bağımlılık listesi bilinçli olarak kısadır ve `package-lock.json` pinlidir.

### Veritabanı tarafı

- Tüm fonksiyonlar `set search_path = ''` ile tanımlıdır (search_path zehirlenmesine karşı).
- `security definer` fonksiyonların yüzeyi salt-okunur sorgulardır; hiçbir RPC yazma yapmaz (arşiv fonksiyonu yalnızca `pg_cron`/SQL editöründen çalışır, API'ye açılmaz).
- Sorgu limitleri sabittir (`limit ≤ 200`), istemciden gelen sayılar kelepçelenir.

## Güvenlik açığı bildirimi

Bir açık bulursanız lütfen **herkese açık issue açmayın**. GitHub'ın gizli bildirim kanalını kullanın:

**[Security → Report a vulnerability](https://github.com/omersengul1/supalytics/security/advisories/new)**

72 saat içinde yanıt vermeyi hedefliyoruz. Düzeltme yayımlanana kadar detayları gizli tutmanızı rica ederiz.
