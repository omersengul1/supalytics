# Supalytics Privacy Policy

**Last updated:** September 2, 2026  
**Contact:** [GitHub Security Advisories](https://github.com/omersengul1/supalytics/security/advisories/new)

Supalytics (“the app”) is a mobile dashboard for **your own** Supabase projects. This policy explains what the app does with information on your device and over the network.

---

## Summary

- **No Supalytics servers.** The app does not send your data to the developer or to any analytics/telemetry service.
- **Your Supabase only.** When connected, the app talks only to the Supabase project URL you configure, plus third-party hosts that serve user profile images linked from your project (e.g. Google or GitHub avatar URLs).
- **Secrets stay on device.** Connection details and sign-in sessions are stored in the iOS Keychain (or Android Keystore). They are not written to plain files or developer-controlled storage.
- **Demo mode is offline.** Demo data is generated locally and never leaves your device.

---

## Information the app uses

### Stored on your device

| Data | Purpose | Where |
|------|---------|--------|
| Supabase project URL | Connect to your project | Keychain / Keystore |
| Supabase anon (public) key | API authentication to your project | Keychain / Keystore |
| Admin email & password | Sign in to your Supabase Auth account | Keychain / Keystore |
| Auth session tokens | Keep you signed in to your project | Keychain / Keystore |
| UI preferences (theme, metric layout, etc.) | Personalize the app | Secure storage / local preferences |
| Optional biometric lock setting | Require Face ID / Touch ID before opening the panel | Local only |

You can delete all of the above at any time via **Settings → Delete connection & reset**.

### Fetched from your Supabase project

When you connect a real project, the app displays analytics that **you** authorized by running the setup SQL in **your** database (active users, signups, providers, devices, sessions, activity feed, user list, etc.). That data is shown on your device and is not relayed through Supalytics infrastructure.

### Face ID / Touch ID

If you enable biometric lock, the app uses the system biometric API only to unlock the app UI. **Biometric data is never collected or stored by Supalytics**; it is handled entirely by iOS/Android.

### Network traffic

- **Connected mode:** HTTPS requests to your configured Supabase URL, and HTTPS requests to load profile image URLs returned by your project.
- **Demo mode:** No network requests for analytics data.

The app does **not** use advertising identifiers, cross-app tracking, or third-party analytics SDKs.

---

## What we do not collect

Supalytics (the developer) does **not** operate a backend that receives:

- Your Supabase credentials or sessions  
- Your end-user lists or analytics  
- Device identifiers for tracking  
- Crash or usage telemetry to developer servers  

We have no account system for the app itself.

---

## Children

The app is intended for developers and administrators managing their own Supabase projects. It is not directed at children under 13.

---

## Changes

We may update this policy when the app changes. The current version is always in this repository. Material changes will be reflected in the “Last updated” date above.

---

## Your rights

Because data stays on your device and your Supabase project, you control it:

- **Delete local data:** Settings → Delete connection & reset  
- **Revoke access:** Remove your admin email from the `analytics.admins` table in your database, or rotate your Supabase keys and password in the Supabase dashboard  
- **Questions:** Open a [private security advisory](https://github.com/omersengul1/supalytics/security/advisories/new) on GitHub  

---

# Supalytics Gizlilik Politikası

**Son güncelleme:** 2 Eylül 2026  
**İletişim:** [GitHub Güvenlik Bildirimi](https://github.com/omersengul1/supalytics/security/advisories/new)

Supalytics, **kendi** Supabase projeleriniz için bir mobil paneldir. Bu metin, uygulamanın cihazınızdaki ve ağ üzerindeki bilgilerle ne yaptığını açıklar.

---

## Özet

- **Supalytics sunucusu yok.** Uygulama verilerinizi geliştiriciye veya herhangi bir analitik/telemetri hizmetine göndermez.
- **Yalnızca sizin Supabase’iniz.** Bağlı modda uygulama yalnızca yapılandırdığınız Supabase proje adresiyle konuşur; ayrıca projenizden gelen profil fotoğrafı URL’lerinin barındığı üçüncü taraf sunuculara (ör. Google/GitHub avatar) istek atabilir.
- **Sırlar cihazda kalır.** Bağlantı bilgileri ve oturum iOS Keychain / Android Keystore’da saklanır; düz dosyaya veya geliştirici sunucusuna yazılmaz.
- **Demo modu çevrimdışı.** Demo veriler yerelde üretilir, cihazdan çıkmaz.

---

## Uygulamanın kullandığı bilgiler

### Cihazınızda saklananlar

| Veri | Amaç | Konum |
|------|------|--------|
| Supabase proje URL’si | Projenize bağlanmak | Keychain / Keystore |
| Supabase anon (public) anahtarı | API kimlik doğrulama | Keychain / Keystore |
| Yönetici e-posta ve şifre | Supabase Auth oturumu | Keychain / Keystore |
| Oturum belirteçleri | Oturumu açık tutmak | Keychain / Keystore |
| Arayüz tercihleri | Kişiselleştirme | Güvenli depolama / yerel tercihler |
| İsteğe bağlı biyometrik kilit | Face ID / parmak izi ile kilitleme | Yalnızca yerel |

Tümünü **Ayarlar → Bağlantıyı sil ve sıfırla** ile silebilirsiniz.

### Supabase projenizden alınanlar

Gerçek projeye bağlandığınızda, **kendi** veritabanınızda çalıştırdığınız kurulum SQL’i ile yetkilendirdiğiniz analitikler (aktif kullanıcılar, kayıtlar, sağlayıcılar, cihazlar, oturumlar, akış, kullanıcı listesi vb.) cihazınızda gösterilir; Supalytics altyapısı üzerinden aktarılmaz.

### Face ID / Touch ID

Biyometrik kilit açıksa uygulama yalnızca arayüzü açmak için sistem API’sini kullanır. **Biyometrik veri Supalytics tarafından toplanmaz veya saklanmaz**; tamamen iOS/Android tarafından işlenir.

### Ağ trafiği

- **Bağlı mod:** Yapılandırdığınız Supabase adresine HTTPS; profil görselleri için ilgili HTTPS adresleri.
- **Demo mod:** Analitik için ağ isteği yok.

Uygulama reklam tanımlayıcısı, çapraz uygulama izleme veya üçüncü taraf analitik SDK kullanmaz.

---

## Toplamadığımız veriler

Supalytics (geliştirici) şunları alan bir arka uç işletmez:

- Supabase kimlik bilgileriniz veya oturumlarınız  
- Son kullanıcı listeleriniz veya analitiğiniz  
- İzleme amaçlı cihaz tanımlayıcıları  
- Geliştirici sunucularına çökme veya kullanım telemetrisi  

Uygulama için ayrı bir hesap sistemi yoktur.

---

## Çocuklar

Uygulama, kendi Supabase projelerini yöneten geliştiriciler ve yöneticiler içindir; 13 yaş altına yönelik değildir.

---

## Değişiklikler

Uygulama değiştikçe bu metni güncelleyebiliriz. Güncel sürüm her zaman bu depoda yer alır.

---

## Haklarınız

Veri cihazınızda ve Supabase projenizde kaldığı için kontrol sizdedir:

- **Yerel veriyi sil:** Ayarlar → Bağlantıyı sil ve sıfırla  
- **Erişimi kaldır:** Veritabanınızdaki `analytics.admins` listesinden e-postanızı silin veya Supabase panelinden anahtarları/şifreyi yenileyin  
- **Sorular:** GitHub üzerinden [gizli güvenlik bildirimi](https://github.com/omersengul1/supalytics/security/advisories/new)  
