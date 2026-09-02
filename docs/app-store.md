# App Store Connect — Supalytics

Copy the fields below into [App Store Connect](https://appstoreconnect.apple.com).  
**Privacy policy URL** (after you push `PRIVACY.md` to `main`):

```
https://github.com/omersengul1/supalytics/blob/main/PRIVACY.md
```

**Bundle ID:** `com.supalytics.app`  
**Primary category:** Developer Tools  
**Secondary category (optional):** Business  

---

## App Privacy (questionnaire hints)

Use these answers when Apple asks about data collection. The developer does **not** receive user data on their servers.

| Data type | Collected by app? | Linked to user? | Used for tracking? | Notes |
|-----------|-------------------|-----------------|--------------------|-------|
| Email address | Yes (on device) | Yes | No | Admin login to user's own Supabase; stored in Keychain only |
| Password / credentials | Yes (on device) | Yes | No | Keychain only; never sent to Supalytics |
| User content (analytics) | Yes (displayed) | Yes | No | Fetched from user's Supabase; not relayed to developer |
| Photos (avatars) | Optional | No | No | Loaded from URLs in user's Supabase metadata |
| Crash data | No | — | — | No third-party crash SDK |
| Identifiers for advertising | No | — | — | |

**Tracking:** No — app does not track users across apps/websites owned by other companies.

---

## English (U.S.) — Primary locale

### Subtitle (30 characters max)

```
Supabase auth analytics
```

### Promotional text (170 characters max, optional)

```
Your Supabase users on your phone—no middleware, no telemetry. DAU, signups, live sessions, multi-project. Face ID lock. Try demo mode first.
```

### Description

```
Supalytics is a beautiful, dark analytics dashboard for your Supabase Auth users—entirely on your iPhone. No Supalytics servers. No telemetry. No service_role key.

YOUR DATA STAYS YOURS
• Connect with your public anon key + your own admin account only
• Credentials and sessions live in the iOS Keychain
• Optional Face ID / Touch ID lock before the panel opens
• Demo mode works fully offline with sample data

WHAT YOU CAN SEE
• Active users today, this week, and this month (DAU · WAU · MAU)
• Total signups, daily growth, and sparkline trends
• Who is online right now and today’s sign-ins
• MFA adoption, unverified accounts, open sessions
• Sign-in providers (Google, Apple, email, …) and device platforms
• Searchable user list with avatars and per-user login history
• 7 / 30 / 90-day charts for activity and signups
• Live activity feed

MULTI-PROJECT
Manage several Supabase projects and switch between them in one tap.

SETUP IN ~5 MINUTES
The in-app wizard generates a tailored SQL script for the metrics you pick. Paste it once in the Supabase SQL Editor, then connect with your project URL, anon key, and admin credentials. The app verifies admin access with a real RPC call—and refuses service_role keys.

BUILT FOR DEVELOPERS WHO CARE ABOUT SECURITY
Authorization is enforced inside your database (security definer RPCs + admin allowlist), not on the client. The anon key alone cannot read your users.

Turkish and English UI. Open source. Apache-2.0.
```

### Keywords (100 characters max, comma-separated, no spaces after commas)

```
supabase,analytics,dashboard,auth,users,DAU,metrics,postgres,mobile,admin,sessions,MFA,signup
```

Character count: 94

### What’s New (version 1.0.0)

```
Initial App Store release. Supabase user analytics on your device—multi-project support, charts, user list, Face ID lock, and offline demo mode.
```

### Support URL

```
https://github.com/omersengul1/supalytics/issues
```

### Marketing URL (optional)

```
https://github.com/omersengul1/supalytics
```

---

## Turkish — Secondary locale

### Alt başlık (en fazla 30 karakter)

```
Supabase kullanıcı analitiği
```

### Tanıtım metni (isteğe bağlı)

```
Supabase kullanıcılarınız cebinizde—ara katman yok, telemetri yok. DAU, kayıtlar, canlı oturumlar, çoklu proje. Face ID kilidi. Önce demo modunu deneyin.
```

### Açıklama

```
Supalytics, Supabase Auth kullanıcılarınız için şık ve karanlık bir analitik paneli—tamamen iPhone’unuzda. Supalytics sunucusu yok. Telemetri yok. service_role anahtarı yok.

VERİNİZ SİZDE KALIR
• Yalnızca herkese açık anon anahtar + kendi yönetici hesabınızla bağlanın
• Kimlik bilgileri ve oturum iOS Keychain’de saklanır
• İsteğe bağlı Face ID / Touch ID kilidi
• Demo modu tamamen çevrimdışı örnek veriyle çalışır

NELERİ GÖRÜRSÜNÜZ
• Bugün / bu hafta / bu ay aktif kullanıcılar (DAU · WAU · MAU)
• Toplam kayıt, günlük büyüme ve trend grafikleri
• Şu an çevrimiçi olanlar ve bugünkü girişler
• MFA kullanımı, doğrulanmamış hesaplar, açık oturumlar
• Giriş sağlayıcıları (Google, Apple, e-posta, …) ve cihaz platformları
• Avatarlı, aranabilir kullanıcı listesi ve kişi başı giriş geçmişi
• 7 / 30 / 90 günlük aktivite ve kayıt grafikleri
• Canlı işlem akışı

ÇOKLU PROJE
Birden fazla Supabase projesini ekleyin; tek dokunuşla aralarında geçin.

~5 DAKİKADA KURULUM
Uygulama içi sihirbaz, seçtiğiniz metriklere göre SQL script’i üretir. Supabase SQL Editor’de bir kez çalıştırın; proje URL’si, anon anahtar ve yönetici bilgileriyle bağlanın. Uygulama admin yetkisini gerçek bir RPC ile doğrular—service_role anahtarını reddeder.

GÜVENLİK ÖNCELİKLİ
Yetki istemcide değil veritabanınızda (security definer RPC + admin listesi). Anon anahtar tek başına kullanıcı verinizi açamaz.

Türkçe ve İngilizce arayüz. Açık kaynak. Apache-2.0.
```

### Anahtar kelimeler

```
supabase,analitik,panel,auth,kullanıcı,DAU,metrik,postgres,mobil,yönetici,oturum,MFA,kayıt
```

### Sürüm notları (1.0.0)

```
İlk App Store sürümü. Supabase kullanıcı analitiği cihazınızda—çoklu proje, grafikler, kullanıcı listesi, Face ID kilidi ve çevrimdışı demo modu.
```

---

## Review notes (for Apple reviewer)

Paste into **App Review Information → Notes** if needed:

```
Supalytics is a developer tool that connects to the user's own Supabase project.

To test without a Supabase account:
1. Launch the app → Get started → pick any metrics → "Browse with demo data"
2. The full dashboard works offline with deterministic sample data.

To test with a real project (optional):
1. Choose "Connect my project" and follow the SQL + API wizard
2. Requires a Supabase project with the setup SQL run once

No service_role key is accepted. No data is sent to Supalytics servers.
Face ID permission is used only for the optional app lock in Settings.

Demo account: not required — demo mode is built in.
```

---

## Screenshots checklist

Minimum for iPhone (6.7" display, e.g. iPhone 15 Pro Max):

1. Overview tab — hero metrics + cards  
2. Users tab — searchable list with avatars  
3. Charts tab — 7/30/90 day graphs  
4. Settings — projects + Face ID lock  
5. Onboarding — manifesto or connect flow (optional)

Use Xcode Simulator or a physical device; EAS build is not required for screenshots.
