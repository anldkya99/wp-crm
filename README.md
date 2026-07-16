# Tek Numarali WhatsApp Operasyon Paneli

WhatsApp entegrasyonu olmadan calisan V2 operasyon paneli. Tum ekranlar Prisma uzerinden PostgreSQL veritabanina baglanir; sahte veri kullanilmaz.

## Operation Pact Constitution

Permanent Operation Pact architecture rules are tracked in [OPERATION_PACT_CONSTITUTION.md](./OPERATION_PACT_CONSTITUTION.md).

## Kurulum

```bash
npm install
copy .env.example .env
npm run prisma:generate
npm run prisma:migrate
set SEED_ADMIN_EMAIL=<admin-email>
set SEED_ADMIN_PASSWORD=<strong-password>
npm run db:seed
npm run dev
```

Seed bilgileri ortam degiskenlerinden okunur. Kaynak koda parola yazmayin.

```bash
set SEED_ADMIN_EMAIL=<admin-email>
set SEED_ADMIN_PASSWORD=<strong-password>
npm run db:seed
```
