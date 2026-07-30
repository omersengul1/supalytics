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
  errPermissionDenied:
    "Fonksiyon veritabanında var ama yetki API’ye henüz yansımamış olabilir — Supabase’in şema önbelleği yeni grant’ları birkaç dakika geç yansıtır. SQL Editor’de tek başına şunu çalıştırıp önbelleği hemen tazele: notify pgrst, 'reload schema'; sonra tekrar dene. Hâlâ olmuyorsa kurulum SQL’ini (en alttaki \">>> EDIT ME\" dahil) baştan sona yeniden çalıştır.",
  errConnectGeneric: 'Bağlantı kurulamadı.',
  whoamiDebug: (role: string | null, uid: string | null, isAdmin: boolean) =>
    `Teşhis: veritabanı bu isteği rol="${role ?? 'yok'}", uid=${uid ?? 'yok'}, admin listesinde=${isAdmin ? 'evet' : 'hayır'} olarak görüyor.`,
  errSecureStore:
    'Bu cihazdaki Expo Go / istemci sürümünde güvenli depolama (Keychain) çalışmıyor; bağlantı bilgileri kalıcı kaydedilemez. Önce mağazadan Expo Go’yu güncellemeyi deneyin. Demo modu bundan etkilenmez.',

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
    'Script’in en altındaki ">>> EDIT ME" satırı seni işte bu admin listesine ekler — kendi user ID’nle. Onsuz veritabanı isteğin kimden geldiğini "admin listesinde yok" diye değerlendirir ve sana bile forbidden döner. Bir sonraki ekrandaki e-posta/şifre de tam bu yüzden var: uygulamanın veritabanına "ben o admin hesabıyım" diye kanıtlamasının tek yolu, senin adına gerçek bir Supabase Auth girişi yapmak. Yeni hesap açmana gerek yok — projendeki var olan bir kullanıcıyı kullan.',
  ],
  sqlWhyArchive:
    'Ayrıca aktiflik/cihaz verileri için: Supabase giriş loglarını kalıcı tutmaz. Script, kayıtları her gece kendi tablona kopyalayan bir arşiv işi (pg_cron) kurar — telefonun her gece açık olmasını bekleyemeyiz, bu iş veritabanında çalışmak zorunda.',
  sqlScopeNote: (n: number) =>
    `Bu script seçimine göre üretildi (${n} metrik). Sonradan yeni metrik açarsan Ayarlar’daki güncel script’i tekrar çalıştırman yeterli — script tekrar çalıştırmaya dayanıklıdır.`,
  sqlStepsTitle: 'ADIMLAR',
  sqlSteps: [
    'Tarayıcıda supabase.com/dashboard’da projeni aç. Sol kenar çubuğunda "</> SQL Editor" sekmesine tıkla.',
    'Sağ üstteki yeşil "+ New query" butonuna bas. Karşına boş, siyah bir kod kutusu açılacak.',
    'Aşağıdaki "Kopyala" butonuna dokun, sonra o boş kutuya dokunup yapıştır (basılı tut → Yapıştır, ya da Ctrl/Cmd+V).',
    'Sağ alttaki (ya da sağ üstteki) yeşil "Run" butonuna bas — Ctrl/Cmd+Enter da çalışır. Altta "Success. No rows returned" gibi bir sonuç görmelisin, kırmızı hata değil.',
    'Sol menüden Authentication → Users’a git, kendi hesabının satırına dokun ve "User UID" değerini kopyala.',
    'Az önce yapıştırdığın script’in en altında ">>> EDIT ME" yazan bloğu bul. "insert into..." ile başlayıp "on conflict..." ile biten 3 satırın başındaki "-- " işaretlerini sil, "BURAYA-KENDI-USER-ID-NIZ" yazan yeri ID’n ile değiştir, SADECE o 3 satırı seçip tekrar Run’la.',
  ],
  sqlPasteLabel: '↓ BU SCRIPT’İ KOPYALA VE SQL EDITOR’DEKİ BOŞ KUTUYA YAPIŞTIR ↓',
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
  fieldEmailHelp:
    'Yeni hesap değil — projendeki var olan bir Auth kullanıcısı; SQL adımında admin yaptığın kişi',
  fieldPassword: 'ŞİFRE',
  fieldPasswordHelp: 'Bu hesabın Supabase şifresi; yalnızca giriş yapmak için kullanılır',
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
  cardOnlineNow: 'Şu an çevrimiçi',
  cardOnlineNowSub: 'son 15 dk · sen hariç',
  cardLoginsToday: 'Bugünkü girişler',
  cardLoginsTodaySub: 'oturum açma sayısı',
  cardOpenSessions: 'Açık oturumlar',
  cardOpenSessionsSub: 'tüm cihazlarda etkin',
  cardGrowth: 'Haftalık büyüme',
  cardGrowthSub: (cur: string, prev: string) => `bu hafta ${cur} · önceki ${prev}`,
  cardUnconfirmed: 'Doğrulanmamış',
  cardUnconfirmedSub: 'e-posta/telefon onayı yok',
  cardMfa: 'MFA kullanan',
  cardMfaSub: 'doğrulanmış faktörlü hesap',
  cardTopProvider: 'En çok sağlayıcı',
  cardTopDevice: 'En çok cihaz',
  topUsersTitle: 'EN AKTİF KULLANICILAR',
  topUserEvents: (n: string) => `${n} giriş`,
  activityTitle: 'SON HAREKETLER',
  unknownUser: 'bilinmeyen kullanıcı',

  // ---- kart detayları (cohort) ----
  cohortTitles: {
    online: 'Şu an çevrimiçi',
    dau: 'Bugün aktif olanlar',
    wau: 'Bu hafta aktif olanlar',
    logins: 'Bugün giriş yapanlar',
    signups: 'Yeni kayıtlar · 30 gün',
  } as Record<'online' | 'dau' | 'wau' | 'logins' | 'signups', string>,
  cohortHints: {
    online: 'Son 15 dakikada etkinlik sinyali olan kullanıcılar (sen hariç).',
    dau: 'Bugün giriş yapan ya da oturumu etkin olan herkes.',
    wau: 'Son 7 günde en az bir kez aktif olan kullanıcılar.',
    logins: 'Bugün oturum açan kullanıcılar ve giriş sayıları.',
    signups: 'Son 30 günde hesap oluşturanlar, en yeniden eskiye.',
  } as Record<'online' | 'dau' | 'wau' | 'logins' | 'signups', string>,
  cohortEmpty: 'Bu pencerede kimse yok.',

  // ---- proje seçici ----
  projectPickerTitle: 'PROJELER',
  projectDemo: 'Demo verileri',
  projectAdd: 'Yeni proje bağla',
  projectAddSub: 'Aynı SQL kurulumuyla başka bir Supabase projesi',
  projectActiveSub: 'aktif proje',
  addProjectTitle: 'Proje bağla',
  addProjectIntro:
    'Her proje kendi bağlantı bilgisi ve oturumuyla saklanır; üstteki proje seçicisinden tek dokunuşla aralarında geçebilirsin. Yeni projede de önce kurulum SQL’ini çalıştırmış olman gerekir (Ayarlar → Kurulum SQL’i).',
  removeProjectTitle: 'Projeyi kaldır',
  removeProjectBody: (label: string) =>
    `"${label}" bağlantısı ve oturumu bu cihazdan silinecek. Supabase projene hiçbir şey olmaz.`,
  removeProjectConfirm: 'Kaldır',
  projectRenameHint: 'ada dokunup değiştirebilirsin',
  renameProjectTitle: 'Projeyi yeniden adlandır',
  renameProjectPlaceholder: 'Görünen ad',
  renameProjectSave: 'Kaydet',
  fieldProjectName: 'PROJE ADI (İSTEĞE BAĞLI)',
  fieldProjectNameHelp: 'Üst barda görünen ad; boş bırakırsan URL’den türetilir',
  fieldProjectNamePlaceholder: 'ör. Glaze',

  // ---- kullanıcılar ----
  usersTitle: 'Kullanıcılar',
  searchPlaceholder: 'İsim veya e-posta ara…',
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
  secProjects: 'PROJELER',
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
  errPermissionDenied:
    "The function exists but the API may not have picked up the grant yet — Supabase's schema cache can lag a few minutes behind new grants. Run this on its own in the SQL Editor to refresh it right away: notify pgrst, 'reload schema'; then try again. If it still fails, re-run the full setup SQL (including the \">>> EDIT ME\" block) from top to bottom.",
  errConnectGeneric: 'Could not connect.',
  whoamiDebug: (role: string | null, uid: string | null, isAdmin: boolean) =>
    `Diagnostic: the database sees this request as role="${role ?? 'none'}", uid=${uid ?? 'none'}, on admin list=${isAdmin ? 'yes' : 'no'}.`,
  errSecureStore:
    'Secure storage (Keychain) is not working in this Expo Go / client build; connection details cannot be saved persistently. Try updating Expo Go from the store first. Demo mode is unaffected.',

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
    'The ">>> EDIT ME" line at the bottom of the script is what adds you to that admin list — with your own user ID. Without it, the database has no way to tell who’s asking and returns forbidden to everyone, including you. The email/password on the next screen exist for the same reason: the only way for the app to prove to the database "I am that admin" is to actually sign in as that account. No need to create a new one — use a user that already exists in your project.',
  ],
  sqlWhyArchive:
    'Also, for activity/device data: Supabase does not keep sign-in logs permanently. The script sets up a nightly archive job (pg_cron) that copies them into your own table — we can’t expect your phone to be awake every night, so this must run in the database.',
  sqlScopeNote: (n) =>
    `This script was generated for your selection (${n} metrics). If you enable more later, just re-run the up-to-date script from Settings — it is safe to run repeatedly.`,
  sqlStepsTitle: 'STEPS',
  sqlSteps: [
    'In a browser, open supabase.com/dashboard and go into your project. Click the "</> SQL Editor" tab in the left sidebar.',
    'Press the green "+ New query" button, top right. An empty black code box opens.',
    'Tap the "Copy" button below, then tap into that empty box and paste (press and hold → Paste, or Ctrl/Cmd+V).',
    'Press the green "Run" button (bottom or top right) — Ctrl/Cmd+Enter also works. You should see something like "Success. No rows returned" below, not a red error.',
    'Go to Authentication → Users in the left sidebar, tap your own account’s row, and copy its "User UID".',
    'In the script you just pasted, find the ">>> EDIT ME" block at the very bottom. Remove the leading "-- " from the 3 lines starting with "insert into..." and ending with "on conflict...", replace "PASTE-YOUR-USER-ID-HERE" with your ID, select just those 3 lines, and press Run again.',
  ],
  sqlPasteLabel: '↓ COPY THIS SCRIPT AND PASTE IT INTO THE EMPTY SQL EDITOR BOX ↓',
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
  fieldEmailHelp:
    'Not a new account — an existing Auth user in your project; the one you made admin in the SQL step',
  fieldPassword: 'PASSWORD',
  fieldPasswordHelp: 'That account’s Supabase password; used only to sign in',
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
  cardOnlineNow: 'Online now',
  cardOnlineNowSub: 'last 15 min · excluding you',
  cardLoginsToday: 'Logins today',
  cardLoginsTodaySub: 'sign-in count',
  cardOpenSessions: 'Open sessions',
  cardOpenSessionsSub: 'active across devices',
  cardGrowth: 'Weekly growth',
  cardGrowthSub: (cur, prev) => `this week ${cur} · prev ${prev}`,
  cardUnconfirmed: 'Unconfirmed',
  cardUnconfirmedSub: 'no email/phone confirmation',
  cardMfa: 'Using MFA',
  cardMfaSub: 'accounts with a verified factor',
  cardTopProvider: 'Top provider',
  cardTopDevice: 'Top device',
  topUsersTitle: 'MOST ACTIVE USERS',
  topUserEvents: (n) => `${n} sign-ins`,
  activityTitle: 'RECENT ACTIVITY',
  unknownUser: 'unknown user',

  cohortTitles: {
    online: 'Online now',
    dau: 'Active today',
    wau: 'Active this week',
    logins: 'Signed in today',
    signups: 'New signups · 30 days',
  },
  cohortHints: {
    online: 'Users with an activity signal in the last 15 minutes (excluding you).',
    dau: 'Everyone who signed in or had an active session today.',
    wau: 'Users active at least once in the last 7 days.',
    logins: 'Users who signed in today, with their sign-in counts.',
    signups: 'Accounts created in the last 30 days, newest first.',
  },
  cohortEmpty: 'Nobody in this window.',

  projectPickerTitle: 'PROJECTS',
  projectDemo: 'Demo data',
  projectAdd: 'Connect another project',
  projectAddSub: 'Another Supabase project with the same SQL setup',
  projectActiveSub: 'active project',
  addProjectTitle: 'Connect a project',
  addProjectIntro:
    'Each project is stored with its own connection details and session; switch between them in one tap from the project picker up top. The new project also needs the setup SQL run first (Settings → Setup SQL).',
  removeProjectTitle: 'Remove project',
  removeProjectBody: (label) =>
    `The "${label}" connection and session will be erased from this device. Nothing happens to your Supabase project.`,
  removeProjectConfirm: 'Remove',
  projectRenameHint: 'tap to rename',
  renameProjectTitle: 'Rename project',
  renameProjectPlaceholder: 'Display name',
  renameProjectSave: 'Save',
  fieldProjectName: 'PROJECT NAME (OPTIONAL)',
  fieldProjectNameHelp: 'Shown in the top bar; derived from the URL if left empty',
  fieldProjectNamePlaceholder: 'e.g. Glaze',

  usersTitle: 'Users',
  searchPlaceholder: 'Search name or email…',
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
  secProjects: 'PROJECTS',
  secAppearance: 'APPEARANCE',
  sqlModalTitle: 'Setup SQL',
  close: 'Close',
};

export const T: Strings = lang === 'tr' ? tr : en;
