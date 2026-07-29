// Tek sözlük, iki dil. Cihaz dili Türkçe ise TR, değilse EN.
// Dil uygulama açılışında bir kez seçilir (telefon diline göre otomatik).

import { getLocales } from 'expo-localization';

export type Lang = 'tr' | 'en';

export const lang: Lang = getLocales()[0]?.languageCode === 'tr' ? 'tr' : 'en';

const tr = {
  // ---- ortak / biçim ----
  justNow: 'az önce',
  never: 'hiç',
  minAgo: (n: number) => `${n} dk önce`,
  hrAgo: (n: number) => `${n} sa önce`,
  dayAgo: (n: number) => `${n} gün önce`,
  months: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
  thousandSuffix: 'B',
  decimalSep: ',',
  deviceOther: 'Diğer',
  deviceUnknown: 'Bilinmiyor',
  providerEmail: 'E-posta',
  providerPhone: 'Telefon',
  providerAnon: 'Anonim',
  actions: {
    login: 'giriş yaptı',
    logout: 'çıkış yaptı',
    user_signedup: 'kaydoldu',
    user_repeated_signup: 'tekrar kayıt denedi',
    token_refreshed: 'oturumu yenilendi',
    token_revoked: 'oturumu kapatıldı',
    user_recovery_requested: 'şifre sıfırlama istedi',
    user_confirmation_requested: 'doğrulama istedi',
    user_modified: 'profilini güncelledi',
    user_updated_password: 'şifresini değiştirdi',
    user_deleted: 'hesabı silindi',
    user_invited: 'davet edildi',
    invite_accepted: 'daveti kabul etti',
    mfa_challenge_verified: 'MFA doğruladı',
  } as Record<string, string>,

  // ---- hatalar ----
  errNoConnection: 'Supabase bağlantısı bulunamadı.',
  errEmptyTotals: 'supalytics_totals boş döndü.',
  errFetchGeneric: 'Veriler alınamadı.',
  errUsersFetch: 'Kullanıcılar alınamadı.',
  errHistoryFetch: 'Geçmiş alınamadı.',
  errMissingRpc:
    'Bu veri için gereken SQL fonksiyonu projede yok. Ayarlar → "Kurulum SQL’i" ekranından güncel script’i çalıştırın.',
  errUrlEmpty: 'Proje URL’si boş olamaz.',
  errUrlInvalid: 'Geçerli bir URL girin (https://…).',
  errUrlHttps: 'URL https:// ile başlamalı.',
  errKeyRequired: 'anon (public) anahtar gerekli.',
  errCredsRequired: 'E-posta ve şifre gerekli.',
  errBadLogin: 'E-posta veya şifre hatalı.',
  errServiceRole:
    'Bu bir service_role anahtarı! Onu asla bir uygulamaya girmeyin — veritabanınızın tamamını açar. Settings → API Keys sayfasındaki "anon / public" anahtarı kullanın.',
  errSecretKey:
    'Bu gizli (secret) bir anahtar. Uygulama yalnızca herkese açık (publishable/anon) anahtarla çalışır.',
  errNotAdmin:
    'Giriş başarılı; ama bu hesap analytics.admins listesinde değil. Kurulum SQL’inin sonundaki ">>> EDIT ME" adımını bu hesabın user ID’siyle çalıştırın, sonra tekrar deneyin.',
  errConnectGeneric: 'Bağlantı kurulamadı.',

  // ---- kilit ekranı ----
  lockTitle: 'supalytics kilitli',
  lockWaiting: 'Kimlik doğrulaması bekleniyor…',
  lockFailed: 'Doğrulama başarısız. Tekrar deneyin.',
  lockRetry: 'Tekrar dene',
  lockPrompt: 'supalytics kilidini aç',
  cancel: 'Vazgeç',
  back: 'Geri',

  // ---- sekmeler ----
  tabOverview: 'Özet',
  tabUsers: 'Kullanıcılar',
  tabCharts: 'Grafikler',
  tabSettings: 'Ayarlar',

  // ---- onboarding: manifesto ----
  manifestoHeadline: 'Veriniz\ncihazınızdan\nçıkmaz.',
  manifestoBody:
    'Supabase projenizin kullanıcı analitiği; sunucusuz, telemetrisiz, tamamen bu cihazın üstünde.',
  manifestoWhyTitle: 'NEDEN SERVICE_ROLE İSTEMİYORUZ?',
  manifestoWhyBody:
    'service_role anahtarı veritabanınızdaki her şeyi okuyup yazabilen bir tanrı anahtarıdır ve bir telefonda asla durmamalıdır. supalytics yalnızca herkese açık anon anahtar + sizin admin hesabınızla çalışır; yetki kontrolü veritabanında, security definer fonksiyonların içindedir.',
  start: 'Başla',
  next: 'Devam',

  // ---- onboarding: metrik seçimi ----
  metricsTitle: 'Hangi verileri görmek istiyorsun?',
  metricsHint: 'Kurulum da panel de seçimine göre şekillenir. En az bir tane seç; sonradan Ayarlar’dan değiştirebilirsin.',
  metricLabels: {
    active: 'Aktif kullanıcılar',
    signups: 'Kayıtlar',
    providers: 'Sağlayıcılar',
    devices: 'Cihazlar',
    sessions: 'Son oturumlar',
    activity: 'İşlem akışı',
  },
  metricDescs: {
    active: 'Bugün / bu hafta / bu ay kaç kişi girdi (DAU · WAU · MAU)',
    signups: 'Kaç kullanıcı var, günde kaç yeni kayıt geliyor',
    providers: 'Google mı, Apple mı, e-posta mı — hangi yolla katılıyorlar',
    devices: 'iOS mu, Android mi — hangi platformdan giriyorlar',
    sessions: 'Toplam oturum sayısı',
    activity: 'Canlı akış: kim, ne zaman, ne yaptı',
  },

  // ---- onboarding: odak ----
  focusTitle: 'Neye odaklanıyorsun?',
  focusHint: 'Özet ekranının sırasını belirler.',
  focusOptions: {
    growth: { title: 'Büyüme', desc: 'Kayıtlar ve yeni kullanıcılar önde' },
    retention: { title: 'Tutundurma', desc: 'Aktiflik ve bağlılık önde' },
    people: { title: 'Kullanıcılar', desc: 'Kim girmiş, ne zaman girmiş' },
  },

  // ---- onboarding: kaynak seçimi ----
  sourceTitle: 'Veri nereden gelsin?',
  sourceHint: 'İkisi arasında sonradan geçiş yapabilirsin.',
  sourceReal: 'Kendi projeme bağlan',
  sourceRealDesc:
    'Bir kerelik SQL kurulumu + API bilgileri gerekir (~5 dk). Adım adım anlatacağız.',
  sourceDemo: 'Demo verilerle gez',
  sourceDemoDesc: 'Hiçbir şey gerekmez; panel deterministik sahte veriyle dolar.',

  // ---- onboarding: SQL kurulumu ----
  sqlTitle: 'Veritabanı kurulumu',
  sqlWhy: [
    'Supabase, kullanıcı verilerini (auth şeması) API’ye hiç açmaz — anon anahtarla auth.users okunamaz. Seçtiğin verileri dışarı çıkarmanın tek temiz yolu, veritabanının içinde tanımlı güvenli fonksiyonlar (RPC). Aşağıdaki script tam olarak bunları kuruyor.',
    'Yetki kontrolü de bu fonksiyonların ilk satırında: admin listesinde olmayan herkes — anon anahtarı ele geçirenler dahil — "forbidden" alır. Bu kontrol telefonda olsaydı anlamı olmazdı; anahtar zaten herkese açık.',
  ],
  sqlWhyArchive:
    'Ayrıca aktiflik/cihaz verileri için: Supabase giriş loglarını kalıcı tutmaz. Script, kayıtları her gece kendi tablona kopyalayan bir arşiv işi (pg_cron) kurar — telefonun her gece açık olmasını bekleyemeyiz, bu iş veritabanında çalışmak zorunda.',
  sqlScopeNote: (n: number) =>
    `Bu script seçimine göre üretildi (${n} metrik). Sonradan yeni metrik açarsan Ayarlar’daki güncel script’i tekrar çalıştırman yeterli — script tekrar çalıştırmaya dayanıklıdır.`,
  sqlStepsTitle: 'ADIMLAR',
  sqlSteps: [
    'Supabase Dashboard’da projeni aç → sol menüden SQL Editor → New query.',
    'Aşağıdaki script’i kopyala, editöre yapıştır ve Run’a bas. Hata görmemelisin.',
    'Authentication → Users sayfasından kendi hesabının ID’sini kopyala.',
    'Script’in en altındaki ">>> EDIT ME" bloğunu aç: iki satırın başındaki "-- " işaretlerini sil, ID’ni yapıştır, o bloğu tekrar Run’la. Bu, senin hesabını admin yapar — bunsuz panel her istekte "forbidden" görür.',
  ],
  sqlCopy: 'Kopyala',
  sqlCopied: 'Kopyalandı ✓',
  sqlDone: 'SQL’i çalıştırdım, devam',

  // ---- onboarding: bağlantı ----
  connectTitle: 'Projeni bağla',
  connectIntro:
    'Bilgiler yalnızca bu cihazın Keychain/Keystore’unda saklanır; hiçbir sunucuya gitmez.',
  whereFindTitle: 'BİLGİLER NEREDE?',
  whereFindBody:
    'Dashboard → projenin ayarları (⚙ Settings) → API Keys. "Project URL" ve "anon / public" anahtarını oradan kopyala. anon anahtar herkese açık olacak şekilde tasarlanmıştır; tek başına hiçbir veri açmaz. service_role / secret anahtarını ASLA girme — uygulama onu istemez ve reddeder.',
  fieldUrl: 'PROJE URL',
  fieldUrlHelp: 'https://xxxx.supabase.co biçiminde',
  fieldAnon: 'ANON ANAHTARI (PUBLIC)',
  fieldAnonHelp: 'API Keys sayfasındaki "anon public" — service_role DEĞİL',
  fieldEmail: 'ADMİN E-POSTA',
  fieldEmailHelp: 'Projendeki bir Auth kullanıcısı; SQL adımında admin yaptığın hesap',
  fieldPassword: 'ŞİFRE',
  connectCta: 'Bağlan ve doğrula',
  connectVerifying: 'Doğrulanıyor…',
  connectChecksAdmin: 'Giriş + admin yetkisi gerçek bir RPC çağrısıyla doğrulanır.',

  // ---- onboarding: renk ----
  accentTitle: 'Vurgu rengin',
  accentHint: 'Canlı veriyi işaretleyen tek renk bu olacak.',
  openPanel: 'Paneli aç',
  accentNames: { supabase: 'Supabase', ice: 'Buz', violet: 'Menekşe', amber: 'Kehribar' },

  // ---- özet ----
  demoBadge: 'DEMO',
  heroActive: 'BUGÜN AKTİF',
  heroUsers: 'KAYITLI KULLANICI',
  deltaVsYesterday: (pct: string) => `${pct} düne göre`,
  newTodaySub: (n: string) => `+${n} bugün`,
  cardWeeklyActive: 'Haftalık aktif',
  cardMonthSub: (n: string) => `Ay: ${n}`,
  cardEngagement: 'Bağlılık',
  cardEngagementSub: 'DAU / MAU',
  cardSignups30: 'Yeni kayıtlar · 30 gün',
  cardSignupsSub: (w: string, d: string) => `+${w} bu hafta · +${d} bugün`,
  cardTotalUsers: 'Kayıtlı kullanıcı',
  cardTotalUsersSub: 'toplam hesap',
  cardSessions: 'Oturumlar',
  cardSessionsSub: '30 günde',
  cardTopProvider: 'En çok sağlayıcı',
  cardTopDevice: 'En çok cihaz',
  activityTitle: 'SON HAREKETLER',
  unknownUser: 'bilinmeyen kullanıcı',

  // ---- kullanıcılar ----
  usersTitle: 'Kullanıcılar',
  searchPlaceholder: 'E-posta ara…',
  lastSeen: (x: string) => `son görülme ${x}`,
  emptySearch: 'Eşleşen kullanıcı yok.',
  emptyUsers: 'Henüz kullanıcı görünmüyor.',
  noEmail: 'e-postasız hesap',
  sheetJoined: (x: string) => `katıldı: ${x}`,
  sheetProviders: 'sağlayıcı',
  sheetEmpty: 'Bu kullanıcı için kayıtlı hareket yok.',
  sheetHistoryOff:
    'Giriş geçmişi bu kurulumda kapalı (aktiflik/cihaz/akış metriği seçilmedi). Ayarlar’dan açıp güncel SQL’i çalıştırırsan zaman çizelgesi burada görünür.',

  // ---- grafikler ----
  chartsTitle: 'Grafikler',
  rangeDays: (n: number) => `${n} gün`,
  chartDau: 'GÜNLÜK AKTİF',
  chartSignups: 'YENİ KAYIT',
  chartProviders: 'SAĞLAYICILAR',
  chartDevices: 'CİHAZLAR',
  noData: 'Veri yok.',
  chartsAllOff: 'Grafik metriği seçili değil. Ayarlar → "Özette göster" bölümünden açabilirsin.',

  // ---- ayarlar ----
  settingsTitle: 'Ayarlar',
  secConnection: 'BAĞLANTI',
  connDemo: 'Demo verileri',
  connDemoSub: 'Hiçbir yere bağlı değilsiniz',
  connProjectSub: 'Supabase projesi',
  connNone: 'Bağlantı bulunamadı',
  showSetupSql: 'Kurulum SQL’i',
  showSetupSqlSub: 'Seçili metriklere göre üretilir',
  wipe: 'Bağlantıyı sil ve sıfırla',
  wipeTitle: 'Bağlantıyı sil ve sıfırla',
  wipeBody:
    'Bağlantı bilgileri, oturum ve tüm tercihler bu cihazdan silinecek. Bu işlem geri alınamaz.',
  wipeConfirm: 'Sil ve sıfırla',
  secSecurity: 'GÜVENLİK',
  bioLabel: 'Face ID / parmak izi kilidi',
  bioUnavailableTitle: 'Biyometri kullanılamıyor',
  bioUnavailableBody: 'Bu cihazda Face ID / parmak izi tanımlı değil.',
  bioPrompt: 'Kilidi etkinleştirmek için doğrula',
  securityNote:
    'Bağlantı bilgileriniz ve oturumunuz yalnızca bu cihazın Keychain/Keystore’unda durur; verileriniz cihazınızdan çıkmaz.',
  secMetrics: 'ÖZETTE GÖSTER',
  secAppearance: 'GÖRÜNÜM',
  sqlModalTitle: 'Kurulum SQL’i',
  close: 'Kapat',
};

type Strings = typeof tr;

const en: Strings = {
  justNow: 'just now',
  never: 'never',
  minAgo: (n) => `${n} min ago`,
  hrAgo: (n) => `${n} hr ago`,
  dayAgo: (n) => (n === 1 ? '1 day ago' : `${n} days ago`),
  months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  thousandSuffix: 'K',
  decimalSep: '.',
  deviceOther: 'Other',
  deviceUnknown: 'Unknown',
  providerEmail: 'Email',
  providerPhone: 'Phone',
  providerAnon: 'Anonymous',
  actions: {
    login: 'signed in',
    logout: 'signed out',
    user_signedup: 'signed up',
    user_repeated_signup: 'retried signup',
    token_refreshed: 'session refreshed',
    token_revoked: 'session revoked',
    user_recovery_requested: 'requested password reset',
    user_confirmation_requested: 'requested confirmation',
    user_modified: 'updated profile',
    user_updated_password: 'changed password',
    user_deleted: 'account deleted',
    user_invited: 'was invited',
    invite_accepted: 'accepted invite',
    mfa_challenge_verified: 'verified MFA',
  },

  errNoConnection: 'No Supabase connection found.',
  errEmptyTotals: 'supalytics_totals returned empty.',
  errFetchGeneric: 'Could not load data.',
  errUsersFetch: 'Could not load users.',
  errHistoryFetch: 'Could not load history.',
  errMissingRpc:
    'The SQL function this data needs is missing from your project. Run the up-to-date script from Settings → "Setup SQL".',
  errUrlEmpty: 'Project URL cannot be empty.',
  errUrlInvalid: 'Enter a valid URL (https://…).',
  errUrlHttps: 'URL must start with https://.',
  errKeyRequired: 'anon (public) key is required.',
  errCredsRequired: 'Email and password are required.',
  errBadLogin: 'Wrong email or password.',
  errServiceRole:
    'This is a service_role key! Never paste it into an app — it unlocks your entire database. Use the "anon / public" key from Settings → API Keys.',
  errSecretKey:
    'This is a secret key. The app only works with the public (publishable/anon) key.',
  errNotAdmin:
    'Signed in, but this account is not in analytics.admins. Run the ">>> EDIT ME" step at the bottom of the setup SQL with this account’s user ID, then try again.',
  errConnectGeneric: 'Could not connect.',

  lockTitle: 'supalytics is locked',
  lockWaiting: 'Waiting for authentication…',
  lockFailed: 'Authentication failed. Try again.',
  lockRetry: 'Try again',
  lockPrompt: 'Unlock supalytics',
  cancel: 'Cancel',
  back: 'Back',

  tabOverview: 'Overview',
  tabUsers: 'Users',
  tabCharts: 'Charts',
  tabSettings: 'Settings',

  manifestoHeadline: 'Your data\nnever leaves\nyour device.',
  manifestoBody:
    'User analytics for your Supabase project — no server, no telemetry, entirely on this device.',
  manifestoWhyTitle: 'WHY WE NEVER ASK FOR SERVICE_ROLE',
  manifestoWhyBody:
    'The service_role key is a god key that can read and write everything in your database — it must never live on a phone. supalytics works with the public anon key + your own admin account only; authorization lives inside the database, in security definer functions.',
  start: 'Get started',
  next: 'Continue',

  metricsTitle: 'What do you want to see?',
  metricsHint:
    'Both the setup and the dashboard adapt to your picks. Choose at least one; you can change this later in Settings.',
  metricLabels: {
    active: 'Active users',
    signups: 'Signups',
    providers: 'Providers',
    devices: 'Devices',
    sessions: 'Sessions',
    activity: 'Activity feed',
  },
  metricDescs: {
    active: 'How many signed in today / this week / this month (DAU · WAU · MAU)',
    signups: 'How many users you have, how many join per day',
    providers: 'Google, Apple or email — how people join',
    devices: 'iOS or Android — which platforms they sign in from',
    sessions: 'Total session count',
    activity: 'Live feed: who did what, when',
  },

  focusTitle: 'What’s your focus?',
  focusHint: 'Sets the order of the Overview screen.',
  focusOptions: {
    growth: { title: 'Growth', desc: 'Signups and new users first' },
    retention: { title: 'Retention', desc: 'Activity and engagement first' },
    people: { title: 'People', desc: 'Who signed in, and when' },
  },

  sourceTitle: 'Where should the data come from?',
  sourceHint: 'You can switch between the two later.',
  sourceReal: 'Connect my project',
  sourceRealDesc: 'One-time SQL setup + API details (~5 min). We’ll walk you through it.',
  sourceDemo: 'Browse with demo data',
  sourceDemoDesc: 'Nothing required; the dashboard fills with deterministic fake data.',

  sqlTitle: 'Database setup',
  sqlWhy: [
    'Supabase never exposes user data (the auth schema) through the API — the anon key cannot read auth.users. The only clean way to get the data you picked is secure functions (RPCs) defined inside the database. The script below sets up exactly those.',
    'Authorization also lives in the first line of every one of those functions: anyone not on the admin list — including someone who grabs your anon key — gets "forbidden". This check would be meaningless on the phone; the key is public by design.',
  ],
  sqlWhyArchive:
    'Also, for activity/device data: Supabase does not keep sign-in logs permanently. The script sets up a nightly archive job (pg_cron) that copies them into your own table — we can’t expect your phone to be awake every night, so this must run in the database.',
  sqlScopeNote: (n) =>
    `This script was generated for your selection (${n} metrics). If you enable more later, just re-run the up-to-date script from Settings — it is safe to run repeatedly.`,
  sqlStepsTitle: 'STEPS',
  sqlSteps: [
    'Open your project in the Supabase Dashboard → SQL Editor → New query.',
    'Copy the script below, paste it into the editor and press Run. You should see no errors.',
    'Copy your own account’s ID from Authentication → Users.',
    'Open the ">>> EDIT ME" block at the bottom of the script: remove the leading "-- " from the two lines, paste your ID, and Run that block again. This makes your account an admin — without it the panel gets "forbidden" on every request.',
  ],
  sqlCopy: 'Copy',
  sqlCopied: 'Copied ✓',
  sqlDone: 'I ran the SQL — continue',

  connectTitle: 'Connect your project',
  connectIntro:
    'These details are stored only in this device’s Keychain/Keystore; they never touch any server.',
  whereFindTitle: 'WHERE TO FIND THESE',
  whereFindBody:
    'Dashboard → your project’s settings (⚙ Settings) → API Keys. Copy the "Project URL" and the "anon / public" key from there. The anon key is designed to be public; on its own it unlocks nothing. NEVER paste the service_role / secret key — the app doesn’t ask for it and will reject it.',
  fieldUrl: 'PROJECT URL',
  fieldUrlHelp: 'Looks like https://xxxx.supabase.co',
  fieldAnon: 'ANON KEY (PUBLIC)',
  fieldAnonHelp: 'The "anon public" key on the API Keys page — NOT service_role',
  fieldEmail: 'ADMIN EMAIL',
  fieldEmailHelp: 'An Auth user in your project; the account you made admin in the SQL step',
  fieldPassword: 'PASSWORD',
  connectCta: 'Connect & verify',
  connectVerifying: 'Verifying…',
  connectChecksAdmin: 'Sign-in + admin access are verified with a real RPC call.',

  accentTitle: 'Your accent color',
  accentHint: 'The single color that marks live data.',
  openPanel: 'Open the panel',
  accentNames: { supabase: 'Supabase', ice: 'Ice', violet: 'Violet', amber: 'Amber' },

  demoBadge: 'DEMO',
  heroActive: 'ACTIVE TODAY',
  heroUsers: 'TOTAL USERS',
  deltaVsYesterday: (pct) => `${pct} vs yesterday`,
  newTodaySub: (n) => `+${n} today`,
  cardWeeklyActive: 'Weekly active',
  cardMonthSub: (n) => `Month: ${n}`,
  cardEngagement: 'Engagement',
  cardEngagementSub: 'DAU / MAU',
  cardSignups30: 'New signups · 30 days',
  cardSignupsSub: (w, d) => `+${w} this week · +${d} today`,
  cardTotalUsers: 'Total users',
  cardTotalUsersSub: 'all accounts',
  cardSessions: 'Sessions',
  cardSessionsSub: 'in 30 days',
  cardTopProvider: 'Top provider',
  cardTopDevice: 'Top device',
  activityTitle: 'RECENT ACTIVITY',
  unknownUser: 'unknown user',

  usersTitle: 'Users',
  searchPlaceholder: 'Search email…',
  lastSeen: (x) => `last seen ${x}`,
  emptySearch: 'No matching users.',
  emptyUsers: 'No users yet.',
  noEmail: 'account without email',
  sheetJoined: (x) => `joined: ${x}`,
  sheetProviders: 'providers',
  sheetEmpty: 'No recorded activity for this user.',
  sheetHistoryOff:
    'Sign-in history is off in this setup (no activity/device/feed metric selected). Enable one in Settings and re-run the up-to-date SQL to see the timeline here.',

  chartsTitle: 'Charts',
  rangeDays: (n) => `${n} days`,
  chartDau: 'DAILY ACTIVE',
  chartSignups: 'NEW SIGNUPS',
  chartProviders: 'PROVIDERS',
  chartDevices: 'DEVICES',
  noData: 'No data.',
  chartsAllOff: 'No chart metric selected. Enable some under Settings → "Show on Overview".',

  settingsTitle: 'Settings',
  secConnection: 'CONNECTION',
  connDemo: 'Demo data',
  connDemoSub: 'You are not connected to anything',
  connProjectSub: 'Supabase project',
  connNone: 'No connection found',
  showSetupSql: 'Setup SQL',
  showSetupSqlSub: 'Generated from your selected metrics',
  wipe: 'Disconnect & reset',
  wipeTitle: 'Disconnect & reset',
  wipeBody:
    'Connection details, session and all preferences will be erased from this device. This cannot be undone.',
  wipeConfirm: 'Erase & reset',
  secSecurity: 'SECURITY',
  bioLabel: 'Face ID / fingerprint lock',
  bioUnavailableTitle: 'Biometrics unavailable',
  bioUnavailableBody: 'No Face ID / fingerprint is set up on this device.',
  bioPrompt: 'Authenticate to enable the lock',
  securityNote:
    'Your connection details and session live only in this device’s Keychain/Keystore; your data never leaves your device.',
  secMetrics: 'SHOW ON OVERVIEW',
  secAppearance: 'APPEARANCE',
  sqlModalTitle: 'Setup SQL',
  close: 'Close',
};

export const T: Strings = lang === 'tr' ? tr : en;
