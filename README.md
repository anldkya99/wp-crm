# Tek Numarali WhatsApp Operasyon Paneli

WhatsApp entegrasyonu olmadan calisan V2 operasyon paneli. Tum ekranlar Prisma uzerinden PostgreSQL veritabanina baglanir; sahte veri kullanilmaz.

## Kurulum

```bash
npm install
copy .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run db:seed
npm run dev
```

Varsayilan admin:

- E-posta: `admin@panel.local`
- Sifre: `Admin123!`

Seed bilgilerini degistirmek icin:

```bash
set SEED_ADMIN_EMAIL=admin@example.com
set SEED_ADMIN_PASSWORD=GucluSifre123!
npm run db:seed
```
