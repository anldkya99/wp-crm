export type SystemGuideSection = {
  id: string;
  title: string;
  category: string;
  sprint: string;
  lastUpdated: string;
  summary: string;
  users: string;
  permission: string;
  connections: string[];
  dataStore: string[];
  operationLogic: string;
  cautions: string[];
  keywords: string[];
};

export const systemGuideLastUpdate = {
  sprint: "Sprint 11",
  date: "27 Haz 2026",
  additions: [
    "WhatsApp Session Manager",
    "Session Logları",
    "Hat Sağlık Kontrolü",
    "Provider Güvenlik Freni",
    "Gerçek WhatsApp Bağlantı Altyapısı"
  ]
};

export const systemPrinciples = [
  "Müşteri şirkete aittir.",
  "Operatör müşterinin geçici sorumlusudur.",
  "WhatsApp hattı yalnızca değiştirilebilir iletişim kanalıdır.",
  "Hat değişebilir, operatör değişebilir, takım değişebilir.",
  "Müşteri geçmişi, görevler, talepler, notlar, mesajlar ve timeline kayıtları silinmeden korunur.",
  "Yeni sprintlerde eklenen modül, buton, ayar, yetki, iş akışı, API ve veri modeli değişiklikleri Sistem Kılavuzu'na işlenir."
];

export const systemGuideSections: SystemGuideSection[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    category: "Operasyon",
    sprint: "V1",
    lastUpdated: "27 Haz 2026",
    summary: "Operasyonun günlük durumunu, temel sayaçları, aktif hattı, görev merkezi uyarılarını ve bugünkü talepleri gösterir.",
    users: "Admin, Takım Lideri ve Operatör okuyabilir.",
    permission: "Okuma için aktif kullanıcı yeterlidir. Yönetim aksiyonları ilgili modüllerin yetkisine bağlıdır.",
    connections: ["Görev Merkezi", "Talepler", "İletişim Hatları", "Otomatik Görev Motoru", "TTS Kullanımı"],
    dataStore: ["requests", "daily_tasks", "messages", "conversations", "communication_lines", "tts_usage_logs"],
    operationLogic: "Dashboard karar ekranı değil, hızlı durum ekranıdır. Operatör günlük iş yükünü ve sistem sağlığını buradan görür.",
    cautions: ["Dashboard eski kayıtları silmez.", "Bugünkü listeler yalnızca görüntüleme filtresidir.", "Detaylı yönetim ilgili modül ekranında yapılmalıdır."],
    keywords: ["dashboard", "özet", "son talepler", "görev merkezi", "aktif hat", "operasyon skoru"]
  },
  {
    id: "messages",
    title: "Mesajlar",
    category: "İletişim",
    sprint: "V1-V10",
    lastUpdated: "27 Haz 2026",
    summary: "Kayıtlı üyelerle konuşma yönetimi, hazır cevap, hashtag arama, sesli yanıt ve hat bazlı mesaj gönderimini sağlar.",
    users: "Admin tümünü, Takım Lideri ekibini, Operatör kendisine atanmış üyeleri ve hatları görür.",
    permission: "Mesaj göndermek için aktif/bağlı iletişim hattı gerekir. Operatör hat değiştiremez.",
    connections: ["Üyeler", "Hazır Cevaplar", "İletişim Hatları", "Görev Asistanı", "Oto Sesli Yanıt", "Timeline"],
    dataStore: ["contacts", "conversations", "messages", "message_templates", "communication_lines", "tts_usage_logs"],
    operationLogic: "Operatör üyeyi seçer, mesajı hazırlar ve sistem aktif oturum/hat bağlamındaki lineId ile mesajı kaydeder.",
    cautions: ["Sistem otomatik mesaj göndermez.", "Bloke veya pasif hatta gönderim engellenir.", "Arşive alınan sohbet silinmez, Sohbet Deposu'na düşer."],
    keywords: ["mesajlar", "sohbet", "conversation", "lineId", "hat", "hazır cevap", "hashtag", "sesli yanıt"]
  },
  {
    id: "members",
    title: "Üyeler",
    category: "CRM",
    sprint: "Sprint 8",
    lastUpdated: "27 Haz 2026",
    summary: "Müşteri/üye kaydı, durum, kaynak, etiket, not, talep, görev ve timeline bilgilerinin merkezi ekranıdır.",
    users: "Admin tüm üyeleri, Takım Lideri ekibini, Operatör kendisine atanmış üyeleri görür.",
    permission: "Üye oluşturma ve düzenleme kullanıcı rolüne ve sahiplik kontrolüne bağlıdır.",
    connections: ["Mesajlar", "Talepler", "Görev Merkezi", "Üye Etiketleri", "Timeline", "Ownership Sistemi"],
    dataStore: ["contacts", "member_tags", "member_tag_relations", "customer_notes", "timeline_events"],
    operationLogic: "Üye kalıcı CRM varlığıdır. Hat veya operatör değişse bile üye kaydı ve geçmişi korunur.",
    cautions: ["Telefon numarası unique olmalıdır.", "Numara silme sohbet geçmişini silmez.", "Sahiplik çakışmalarında admin onayı gerekir."],
    keywords: ["üye", "müşteri", "contact", "member", "etiket", "not", "timeline", "ownership"]
  },
  {
    id: "tasks",
    title: "Görev Merkezi ve Görev Asistanı",
    category: "Operasyon",
    sprint: "Sprint 5-9",
    lastUpdated: "27 Haz 2026",
    summary: "Günlük, geçmiş ve otomatik kaynaklı görevlerin yönetildiği operasyon takip alanıdır.",
    users: "Admin tüm görevleri, Takım Lideri ekibini, Operatör kendisine atanmış görevleri görür.",
    permission: "Görev oluşturma yetkisi role göre değişir. Otomatik kural ayarları yalnız Admin / COO tarafından değiştirilebilir.",
    connections: ["Üyeler", "Mesajlar", "Operasyon Kural Merkezi", "Timeline", "Talepler", "Sesli Yanıt"],
    dataStore: ["daily_tasks", "task_notes", "automation_task_logs", "automation_decision_logs"],
    operationLogic: "Görevler üyeye bağlıdır; hatta bağlı değildir. Görev Asistanı bekleyen görevleri aynı kaynaktan okuyarak operatöre yönlendirme yapar.",
    cautions: ["Yönlendir butonu mesajı otomatik göndermez.", "Tamamlandı/Yoksay durumları timeline'a düşer.", "Geçmiş görevler otomatik silinmez."],
    keywords: ["görev", "task", "görev asistanı", "otomatik görev", "karar motoru", "bekleyen", "tamamlandı"]
  },
  {
    id: "requests",
    title: "Talepler",
    category: "Operasyon",
    sprint: "V1-Sprint 8",
    lastUpdated: "27 Haz 2026",
    summary: "Bonus, nakit hediye, düzeltme ve bahis detayı gibi operasyon taleplerinin oluşturulduğu ve takip edildiği merkezdir.",
    users: "Admin, Takım Lideri ve Operatör kendi görünür üyeleri için kullanabilir.",
    permission: "Talep oluşturmak için ilgili üyeye erişim gerekir. Durum güncelleme rol/yetki kapsamına bağlıdır.",
    connections: ["Üyeler", "Dashboard", "Görev Merkezi", "Timeline", "Mesajlar"],
    dataStore: ["requests", "contacts", "timeline_events"],
    operationLogic: "Talep üyeye bağlanır ve komut metni oluşturulabilir. Talep geçmişi silinmez; eski tamamlanmamış talepler geçmiş mantığında kalır.",
    cautions: ["Liste satırlarında sadece Detay Gör bulunur.", "Komut kopyalama manuel aksiyondur.", "Talep oluşturmak otomatik mesaj göndermez."],
    keywords: ["talep", "bonus", "nakit", "düzeltme", "bahis", "komut", "request"]
  },
  {
    id: "templates",
    title: "Hazır Cevaplar",
    category: "İletişim",
    sprint: "V1-Sprint 4",
    lastUpdated: "27 Haz 2026",
    summary: "Operatörlerin hızlı mesaj şablonları oluşturmasını, sabitlemesini ve # arama ile kullanmasını sağlar.",
    users: "Admin ve yetkili kullanıcılar yönetebilir; operatörler aktif şablonları mesaj ekranında kullanır.",
    permission: "Şablon düzenleme/silme yetkisi yönetim kapsamındadır. Kullanım için konuşma erişimi gerekir.",
    connections: ["Mesajlar", "Üyeler", "Dinamik Hitap Sistemi"],
    dataStore: ["message_templates"],
    operationLogic: "Şablon seçildiğinde {ad}, {soyad}, {adSoyad}, {hitap}, {telefon}, {cinsiyet} seçili üyeye göre anlık render edilir.",
    cautions: ["Sabit olmayan şablonlar kısa yol satırında görünmez.", "Silinen şablon # aramada çıkmaz.", "Fallback olarak ilk üyeyi kullanmamalıdır."],
    keywords: ["hazır cevap", "template", "hashtag", "sabit", "pinned", "hitap", "dinamik alan"]
  },
  {
    id: "communication-lines",
    title: "İletişim Hatları ve Hat Havuzu",
    category: "İletişim Katmanı",
    sprint: "Sprint 9.5-10",
    lastUpdated: "27 Haz 2026",
    summary: "WhatsApp numaralarını değiştirilebilir iletişim kanalı ve gerçek session yönetimi hedefli hat havuzu olarak yönetir.",
    users: "Admin / COO yönetir. Takım Lideri ve Operatör kendi yetkisi dahilinde görüntüler.",
    permission: "Hat ekleme, düzenleme, aktif yapma, bloke etme, replacement ve operatöre atama yalnız Admin / COO yetkisindedir.",
    connections: ["Mesajlar", "Çoklu Oturum", "Görev Asistanı", "Timeline", "Üye Transfer Merkezi"],
    dataStore: ["communication_lines", "operator_line_sessions", "whatsapp_session_logs", "messages.lineId", "conversations.lineId"],
    operationLogic: "Hat yalnızca gönderim kanalıdır. Session Manager hat başlatma, kapatma, reconnect ve sağlık kontrolü aksiyonlarını yönetir. Müşteri geçmişi hattın içinde yaşamaz; hat değişirse CRM verisi korunur.",
    cautions: ["Aynı hat aynı anda tek oturuma atanmalıdır.", "Bloke/pasif hatta mesaj gönderilmez.", "Gerçek provider yapılandırılmadan non-manual hatlarda fake gönderim yapılmaz.", "Replacement eski hattı arşivler veya bloke bırakır, yeni hattı aktif yapar."],
    keywords: ["hat", "line", "communication line", "hat havuzu", "session manager", "replacement", "blocked", "archived", "qr", "aktif hat", "health check"]
  },
  {
    id: "whatsapp-session-manager",
    title: "WhatsApp Session Manager",
    category: "İletişim Katmanı",
    sprint: "Sprint 11",
    lastUpdated: "27 Haz 2026",
    summary: "Gerçek WhatsApp oturumlarının başlatılması, kapatılması, yeniden bağlanması, sağlık kontrolü ve teknik log altyapısını hazırlar.",
    users: "Admin / COO yönetir. Operatörler hat durumunu operasyon içinde dolaylı olarak görür.",
    permission: "Session başlatma, kapatma, reconnect ve sağlık kontrolü Admin / COO yetkisindedir.",
    connections: ["İletişim Hatları", "Mesajlar", "Timeline", "CommunicationLine", "Session Logları"],
    dataStore: ["whatsapp_session_logs", "communication_lines.status", "communication_lines.lastConnectedAt"],
    operationLogic: "Manual hatlar sistem içi kullanım için hazır kabul edilir. Gerçek WhatsApp provider adapter bağlanmadığı sürece whatsapp_web/cloud_api hatlarda sahte QR veya fake gönderim yapılmaz; sistem açık hata üretir.",
    cautions: ["Provider adapter bağlanmadan gerçek WhatsApp gönderimi yapılmaz.", "Session logları teknik olay kaydıdır, müşteri geçmişini silmez.", "Disconnected/blocked/archived hatlar gönderim dışıdır."],
    keywords: ["whatsapp session", "session manager", "qr", "reconnect", "disconnect", "health check", "session log", "provider"]
  },
  {
    id: "ownership",
    title: "Üye Transfer Merkezi ve Ownership",
    category: "Yetkilendirme",
    sprint: "Sprint 9-10",
    lastUpdated: "27 Haz 2026",
    summary: "Üyenin sorumlu operatörünü, sahiplik durumunu, izin taleplerini ve admin kontrollü transferleri yönetir.",
    users: "Admin / COO karar verir; Takım Lideri ve Operatör kendi kapsamındaki bilgileri görür.",
    permission: "Doğrudan devir, havuza alma, bloke etme ve izin taleplerini onaylama Admin / COO yetkisindedir.",
    connections: ["Üyeler", "Görev Merkezi", "Mesajlar", "Timeline", "Operatörler"],
    dataStore: ["contacts.ownerOperatorId", "contacts.ownershipStatus", "contact_ownership_requests", "timeline_events"],
    operationLogic: "Müşteri şirkete aittir; operatör geçici sorumludur. Transfer işleminde mesaj, talep, görev ve not geçmişi korunur.",
    cautions: ["Aynı telefon ikinci kez üye yapılmamalıdır.", "Sahiplik çakışmasında operatör admin izni ister.", "Transfer bilgilendirmesi taslak olarak kalır, otomatik gönderilmez."],
    keywords: ["transfer", "ownership", "sahiplik", "operatör değişikliği", "üye transfer", "havuza al", "bloke"]
  },
  {
    id: "performance",
    title: "Operasyon Performansı",
    category: "Raporlama",
    sprint: "Sprint 6-8",
    lastUpdated: "27 Haz 2026",
    summary: "Operasyon skoru, günlük operasyon özeti, görev/talep/TTS performansı ve operatör metriklerini gösterir.",
    users: "Admin ve Takım Lideri raporları görür. Operatör maliyet/limit ayarlarını görmez.",
    permission: "TTS maliyetleri ve limitleri Admin yetkisindedir.",
    connections: ["Dashboard", "Görev Merkezi", "Talepler", "TTS", "Operatörler"],
    dataStore: ["messages", "daily_tasks", "requests", "tts_usage_logs", "users"],
    operationLogic: "Performans ekranı karar destek alanıdır; günlük iş yükünü ve maliyetleri görünür yapar.",
    cautions: ["Tahmini maliyet kesin fatura değildir.", "Operasyon skoru basit ağırlıklandırılmış göstergedir.", "Yetkisiz kullanıcı maliyet ayarlarını değiştiremez."],
    keywords: ["performans", "operasyon skoru", "tts", "maliyet", "rapor", "operatör"]
  },
  {
    id: "api",
    title: "API Yapısı",
    category: "Geliştirici",
    sprint: "V2-Sprint 10",
    lastUpdated: "27 Haz 2026",
    summary: "Next.js API route'ları panelin PostgreSQL/Prisma veri katmanıyla konuşmasını sağlar.",
    users: "Developer ve Admin teknik referans olarak kullanır.",
    permission: "API erişimi uygulama içi oturum ve rol kontrolleriyle uyumlu çalışmalıdır.",
    connections: ["Prisma", "PostgreSQL", "Frontend State", "Timeline", "Auth"],
    dataStore: ["app/api/*", "lib/server/serializers.ts", "prisma/schema.prisma"],
    operationLogic: "API route'ları veri doğrulama, kayıt, güncelleme ve timeline/log üretiminden sorumludur.",
    cautions: ["Yeni endpoint eklenirse Sistem Kılavuzu güncellenmelidir.", "Mock veri bırakılmamalıdır.", "Migration mevcut veriyi bozmayacak şekilde yazılmalıdır."],
    keywords: ["api", "route", "prisma", "postgresql", "serializer", "migration", "endpoint"]
  },
  {
    id: "data-architecture",
    title: "Veri Mimarisi",
    category: "Geliştirici",
    sprint: "Sprint 9.5",
    lastUpdated: "27 Haz 2026",
    summary: "CRM katmanı ile iletişim katmanını ayıran mimari prensipleri açıklar.",
    users: "Developer, Admin ve COO karar referansı olarak kullanır.",
    permission: "Okuma herkese açıktır; mimari değişiklikler Developer/Admin kontrolünde yapılır.",
    connections: ["Contacts", "Conversations", "Messages", "CommunicationLine", "Timeline", "Tasks", "Requests"],
    dataStore: ["contacts", "conversations", "messages", "communication_lines", "timeline_events"],
    operationLogic: "Customer -> Conversation -> Channel ilişkisi kurulur. Customer kalıcıdır; Channel değiştirilebilir iletişim kanalıdır.",
    cautions: ["Müşteri verisi doğrudan WhatsApp hattına bağlanmamalıdır.", "Hat değişimi veri silme anlamına gelmez.", "Yeni sprintler bu prensibe göre tasarlanmalıdır."],
    keywords: ["veri mimarisi", "communication layer", "customer", "conversation", "channel", "lineId", "müşteri şirkete aittir"]
  },
  {
    id: "system-guide",
    title: "Sistem Kılavuzu",
    category: "Bilgi Merkezi",
    sprint: "Sprint 10",
    lastUpdated: "27 Haz 2026",
    summary: "Panelin yaşayan hafızasıdır; modül, yetki, iş akışı, API ve veri mimarisi bilgisini tek yerde toplar.",
    users: "Tüm kullanıcılar okuyabilir.",
    permission: "Düzenleme yalnız Developer/Admin sorumluluğundadır. Güncelleme şu an kod kaynağı üzerinden yapılır.",
    connections: ["Tüm modüller", "Sprint Günlüğü", "Geliştirici Prosedürü"],
    dataStore: ["lib/system-guide.ts"],
    operationLogic: "Her sprint sonunda yeni özellik tamamlandıktan sonra ilgili kılavuz maddesi güncellenir.",
    cautions: ["Dokümante edilmeyen sprint tamamlanmış kabul edilmez.", "Kılavuz operasyon ve teknik dili birlikte taşımalıdır.", "Arama anahtar kelimeleri yeni özelliklerle güncellenmelidir."],
    keywords: ["sistem kılavuzu", "wiki", "living documentation", "dokümantasyon", "sprint günlüğü", "bilgi merkezi"]
  }
];
