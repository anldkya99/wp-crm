# Operation Pact Test Ortamı

Bu doküman Operation Pact test veritabanı ile güvenli doğrulama yapma düzenini açıklar.

## Amaç

Test ortamı, migration ve doğrulama işlemlerinin production veritabanına gitmeden önce ayrı bir veritabanında denenmesini sağlar.

Hedef test veritabanı:

```text
operation_pact_test
```

Mevcut uygulama veritabanı olan `whatsapp_ops` bu süreçte yeniden adlandırılmaz ve production verisine dokunulmaz.

## Production'dan Farkı

Test ortamı yalnızca doğrulama içindir. Production müşteri verisi test veritabanına aktarılmamalıdır.

Test komutları çalışmadan önce bağlantı adresindeki veritabanı adını kontrol eder. Veritabanı adı `operation_pact_test` değilse işlem başlamadan durur.

## .env.test Hazırlama

Gerçek `.env.test` dosyası Git tarafından takip edilmez. Örnek dosyadan kopyalanarak hazırlanmalıdır:

```powershell
Copy-Item .env.test.example .env.test
```

`.env.test` içinde gerçek test bağlantısı tanımlanır:

```text
DATABASE_URL=postgresql://KULLANICI:PAROLA@127.0.0.1:5432/operation_pact_test?schema=public
NODE_ENV=test
OP_ENVIRONMENT=test
```

Uygulama `op-postgres` ile aynı Docker network içinde çalıştırılıyorsa host olarak `op-postgres` kullanılabilir:

```text
DATABASE_URL=postgresql://KULLANICI:PAROLA@op-postgres:5432/operation_pact_test?schema=public
NODE_ENV=test
OP_ENVIRONMENT=test
```

Gerçek kullanıcı adı ve parola kaynak koda veya dokümantasyona yazılmamalıdır.

## Bağlantıyı Doğrulama

Güvenlik kontrolü:

```powershell
npm run test:db:check
```

Bu komut gerçek migration çalıştırmaz. Yalnızca `DATABASE_URL`, veritabanı adı ve test ortamı işaretlerini doğrular.

## Prisma Client Üretimi

```powershell
npm run test:db:generate
```

Bu komut da önce test veritabanı güvenlik kontrolünden geçer.

## Test Build Doğrulaması

Test ortamı guard kontrolünden geçen build:

```powershell
npm run test:app:build
```

Bu komut production scriptlerini değiştirmez. Önce `operation_pact_test` bağlantısını ve `OP_ENVIRONMENT=test` işaretini doğrular, sonra uygulama build işlemini çalıştırır.

## Tek Komutluk Yerel Doğrulama

Veritabanına migration uygulamadan temel güvenli doğrulama:

```powershell
npm run test:env:verify
```

Bu komut sırasıyla guard check, Prisma schema validate, Prisma Client generate ve build çalıştırır. Migration, reset veya seed uygulamaz.

## Prisma Şema Doğrulama

```powershell
npm run test:db:validate
```

## Migration Durumu

```powershell
npm run test:db:status
```

Bu komut migration durumunu yalnızca `operation_pact_test` bağlantısı doğrulandıktan sonra kontrol eder.

## Migration Uygulama

```powershell
npm run test:db:migrate
```

Bu komut `prisma migrate deploy` çalıştırır. Production migration akışını değiştirmez; yalnızca test environment doğrulamasından sonra mevcut migration dosyalarını test veritabanına uygular.

## Test Veritabanını Sıfırlama

Tehlikeli komut:

```powershell
npm run test:db:reset
```

Bu komut sadece bağlantı adresindeki veritabanı adı açıkça `operation_pact_test` ise çalışabilir. Başka bir veritabanı adı tespit edilirse işlem başlamadan durur.

## Kontrollü Seed

Gerektiğinde:

```powershell
npm run test:db:seed
```

Seed için gereken gizli değerler terminal ortamında veya takip edilmeyen `.env.test` içinde tanımlanmalıdır.

## Yanlış Veritabanına Bağlanmayı Önleyen Mekanizma

Tüm `test:db:*` komutları `scripts/test-db-guard.cjs` üzerinden çalışır.

Kontrol edilen şartlar:

- `DATABASE_URL` tanımlı olmalıdır.
- `DATABASE_URL` içindeki veritabanı adı `operation_pact_test` olmalıdır.
- `OP_ENVIRONMENT=test` olmalıdır.
- `NODE_ENV=production` veya `OP_ENVIRONMENT=production` olmamalıdır.

Hatalı durumda komut şu mesajla durur:

```text
Islem durduruldu: Test komutu yalnizca operation_pact_test veritabaninda calisabilir.
```

## Production'a Geçiş Öncesi Kontrol Listesi

- Test veritabanı bağlantısı doğrulandı.
- Migration status kontrol edildi.
- Migration test veritabanına uygulandı.
- Uygulama build doğrulaması geçti.
- OP CEO login ve mevcut COMPANY_ADMIN login test edildi.
- Yanlış database adıyla guard testi başarısız oldu.
- Eksik `DATABASE_URL` guard testi başarısız oldu.
- Production backup planı hazırlandı.
- Production migration ilk kez production üzerinde denenmeyecek.

## OP Test Sunucusu Terminal Adımları

Bu adımlar yalnızca `op-test-01` üzerinde ve yalnızca test veritabanı için çalıştırılmalıdır.

1. Proje dizinine gir:

```bash
cd /path/to/operation-pact
```

2. Bağımlılıkları kur:

```bash
npm install
```

3. `.env.test` dosyasını hazırla:

```bash
cp .env.test.example .env.test
```

4. `.env.test` içine gerçek test kullanıcı adı ve parolayı yaz. Database adı mutlaka şu olmalıdır:

```text
operation_pact_test
```

5. Güvenlik guard kontrolünü çalıştır:

```bash
npm run test:db:check
```

Beklenen çıktı:

```text
Test veritabani guvenlik kontrolu gecti: operation_pact_test
```

6. Prisma şemasını doğrula:

```bash
npm run test:db:validate
```

7. Prisma Client üret:

```bash
npm run test:db:generate
```

8. Migration durumunu kontrol et:

```bash
npm run test:db:status
```

9. Migration'ları test veritabanına uygula:

```bash
npm run test:db:migrate
```

10. Gerekirse test seed çalıştır:

```bash
npm run test:db:seed
```

11. Test ortamı build doğrulaması yap:

```bash
npm run test:app:build
```

12. Uygulama test sunucusunda başlatılacaksa `.env.test` değerleriyle başlat:

```bash
OP_ENVIRONMENT=test NODE_ENV=test npm run start
```

`test:db:reset` yalnızca test veritabanını sıfırlamak için kullanılmalıdır. Production veya `whatsapp_ops` üzerinde çalışamaz; guard yanlış database adını işlem başlamadan reddeder.

## Gizli Bilgiler

Gerçek `.env.test`, parola, token, production bağlantısı veya müşteri verisi commit edilmemelidir.

`.env.test.example` yalnızca şablondur ve gerçek parola içermez.
