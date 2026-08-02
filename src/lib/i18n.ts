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
  errSessionExpired:
    'Oturumun süresi doldu ve yenilenemedi. Ayarlar’dan projeyi yeniden bağlaman gerekiyor.',
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
    'Giriş başarılı; ama bu hesap admin olarak tanınmıyor. Kurulum SQL’inin sonundaki admin satırının BU hesabın e-postasını içerdiğinden ve e-postanın doğrulanmış olduğundan emin olun (Authentication → Users’ta hesabın yanında "Confirmed" yazmalı), sonra tekrar deneyin.',
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

  // ---- onboarding: yönetici e-postası ----
  adminEmailTitle: 'Yönetici e-postan',
  adminEmailHint:
    'Paneli bu hesapla açacaksın; SQL script’i bu adrese göre HAZIR üretilir — içinde hiçbir şey düzenlemen gerekmez.',
  adminEmailFieldHelp:
    'Projendeki bir Auth kullanıcısının e-postası. Hesap yoksa: uygulamandan bu adresle kayıt olup e-postayı doğrulaman yeterli — yetki otomatik tanınır.',

  // ---- onboarding: SQL kurulumu ----
  sqlTitle: 'Veritabanı kurulumu',
  sqlWhy: [
    'Supabase, kullanıcı verilerini (auth şeması) API’ye hiç açmaz — anon anahtarla auth.users okunamaz. Seçtiğin verileri dışarı çıkarmanın tek temiz yolu, veritabanının içinde tanımlı güvenli fonksiyonlar (RPC). Aşağıdaki script tam olarak bunları kuruyor.',
    'Yetki kontrolü de bu fonksiyonların ilk satırında: admin listesinde olmayan herkes — anon anahtarı ele geçirenler dahil — "forbidden" alır. Bu kontrol telefonda olsaydı anlamı olmazdı; anahtar zaten herkese açık.',
    'Script’in sonundaki satır, admin yetkisini verdiğin e-postaya bağlar: o adresle (doğrulanmış e-posta şartıyla) giriş yapan hesap paneli görebilir. Bağlantı ekranındaki şifre de bu yüzden var: uygulama, senin adına gerçek bir Supabase Auth girişi yaparak "ben o adminim" diye kanıtlar.',
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
    'Script’in en altındaki ">>> EDIT ME" bloğunda iki satırın başındaki "-- " işaretini sil ve admin@ornek.com yerine kendi e-postanı yaz.',
    'Yeşil "Run" butonuna bas — Ctrl/Cmd+Enter da çalışır. Altta "Success" benzeri bir sonuç görmelisin, kırmızı hata değil.',
  ],
  // E-posta bilindiğinde (onboarding) script hazır gelir: düzenleme adımı yok.
  sqlStepsEmbedded: [
    'Tarayıcıda supabase.com/dashboard’da projeni aç. Sol kenar çubuğunda "</> SQL Editor" sekmesine tıkla.',
    'Sağ üstteki yeşil "+ New query" butonuna bas; aşağıdaki "Kopyala" ile script’i boş kutuya yapıştır.',
    'Yeşil "Run" butonuna bas (Ctrl/Cmd+Enter). Altta "Success" benzeri bir sonuç görmelisin — hepsi bu, script’te hiçbir şey düzenlemen gerekmez.',
    'Admin yetkisi e-postana bağlandı; sıradaki ekranda bu e-posta ve şifrenle giriş yapıp doğrulayacağız.',
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
  fieldUrlHelp: 'Anon anahtarını yapıştırınca çoğu projede kendiliğinden dolar; dolmadıysa https://xxxx.supabase.co',
  fieldAnon: 'ANON ANAHTARI (PUBLIC)',
  fieldAnonHelp: 'API Keys sayfasındaki "anon public" — service_role DEĞİL',
  fieldEmail: 'ADMİN E-POSTA',
  fieldEmailHelp: 'Kurulum SQL’inde admin yetkisi bağlanan e-posta',
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
  profileTimelineTitle: 'ZAMAN ÇİZELGESİ',
  profileActivityTitle: 'GİRİŞ YOĞUNLUĞU · 30 GÜN',
  profileSessionsTitle: 'AÇIK OTURUMLAR',
  profileMetaTitle: 'UYGULAMA VERİLERİ',
  profileJoined: 'Katıldı',
  profileLastSeen: 'Son görülme',
  profileDevice: 'Cihaz',
  profileSignins: 'Giriş · 30 gün',
  profilePhone: 'Telefon',
  profileProviders: 'Sağlayıcı',
  badgeConfirmed: 'DOĞRULANMIŞ',
  badgeUnconfirmed: 'DOĞRULANMAMIŞ',
  badgeMfa: 'MFA',
  badgeBanned: 'YASAKLI',
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

  // ---- özet metrik düzenleyici ----
  metricsSectionTitle: 'METRİKLER',
  editMetrics: 'Düzenle',
  editMetricsTitle: 'Metrikleri düzenle',
  editMetricsHint: 'Tutamaçtan sürükleyerek sırala, görmek istemediğin kartı kapat.',
  metricsHiddenTitle: 'GİZLİ',
  metricsLastOne: 'En az bir kart açık kalmalı.',
  dragToReorder: 'sürükleyerek sırala',
  done: 'Bitti',
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
  errSessionExpired:
    'Your session expired and could not be refreshed. Reconnect the project from Settings.',
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
    'Signed in, but this account is not recognized as an admin. Make sure the admin line at the bottom of the setup SQL contains THIS account’s email and that the email is confirmed (the user should show "Confirmed" under Authentication → Users), then try again.',
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

  adminEmailTitle: 'Your admin email',
  adminEmailHint:
    'You’ll open the panel with this account; the SQL script is generated READY for this address — nothing inside it needs editing.',
  adminEmailFieldHelp:
    'The email of an Auth user in your project. No account yet? Sign up in your app with this address and confirm the email — access is granted automatically.',

  sqlTitle: 'Database setup',
  sqlWhy: [
    'Supabase never exposes user data (the auth schema) through the API — the anon key cannot read auth.users. The only clean way to get the data you picked is secure functions (RPCs) defined inside the database. The script below sets up exactly those.',
    'Authorization also lives in the first line of every one of those functions: anyone not on the admin list — including someone who grabs your anon key — gets "forbidden". This check would be meaningless on the phone; the key is public by design.',
    'The line at the end of the script binds admin access to the email you provided: the account signing in with that (confirmed) address can view the panel. That’s also why the password on the connect screen exists: the app proves "I am that admin" by performing a real Supabase Auth sign-in as you.',
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
    'In the ">>> EDIT ME" block at the bottom of the script, remove the leading "-- " from the two lines and put your own email in place of admin@ornek.com.',
    'Press the green "Run" button — Ctrl/Cmd+Enter also works. You should see something like "Success" below, not a red error.',
  ],
  sqlStepsEmbedded: [
    'In a browser, open supabase.com/dashboard and go into your project. Click the "</> SQL Editor" tab in the left sidebar.',
    'Press the green "+ New query" button, then paste the script into the empty box using the "Copy" button below.',
    'Press the green "Run" button (Ctrl/Cmd+Enter). You should see something like "Success" below — that’s it, nothing in the script needs editing.',
    'Admin access is bound to your email; on the next screen you’ll sign in with that email and your password to verify.',
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
  fieldUrlHelp: 'Usually fills itself when you paste the anon key; otherwise https://xxxx.supabase.co',
  fieldAnon: 'ANON KEY (PUBLIC)',
  fieldAnonHelp: 'The "anon public" key on the API Keys page — NOT service_role',
  fieldEmail: 'ADMIN EMAIL',
  fieldEmailHelp: 'The email that the setup SQL binds admin access to',
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
  profileTimelineTitle: 'TIMELINE',
  profileActivityTitle: 'SIGN-IN ACTIVITY · 30 DAYS',
  profileSessionsTitle: 'OPEN SESSIONS',
  profileMetaTitle: 'APP DATA',
  profileJoined: 'Joined',
  profileLastSeen: 'Last seen',
  profileDevice: 'Device',
  profileSignins: 'Sign-ins · 30d',
  profilePhone: 'Phone',
  profileProviders: 'Providers',
  badgeConfirmed: 'CONFIRMED',
  badgeUnconfirmed: 'UNCONFIRMED',
  badgeMfa: 'MFA',
  badgeBanned: 'BANNED',
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

  metricsSectionTitle: 'METRICS',
  editMetrics: 'Edit',
  editMetricsTitle: 'Edit metrics',
  editMetricsHint: 'Drag the handle to reorder, switch off any card you do not want.',
  metricsHiddenTitle: 'HIDDEN',
  metricsLastOne: 'At least one card must stay on.',
  dragToReorder: 'drag to reorder',
  done: 'Done',
  secProjects: 'PROJECTS',
  secAppearance: 'APPEARANCE',
  sqlModalTitle: 'Setup SQL',
  close: 'Close',
};

export const T: Strings = lang === 'tr' ? tr : en;
