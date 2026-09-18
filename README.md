# Panovio

Panovio, ekiplerin projelerini ve görevlerini yönetebilmesi için geliştirilmiş Trello esintili akıllı görev ve proje yönetim sistemidir.

Proje; web, mobil ve masaüstü platformlarında çalışacak şekilde geliştirilmiştir.

## Özellikler

- Kullanıcı kayıt ve giriş sistemi
- JWT tabanlı kimlik doğrulama
- E-posta ile şifre sıfırlama
- Proje/pano oluşturma ve yönetme
- Kanban tabanlı görev yönetimi
- Sürükle-bırak görev taşıma
- Görev öncelikleri ve tarih yönetimi
- Kullanıcılara görev atama
- Checklist yönetimi
- Etiket sistemi
- Yorumlar
- Dosya ekleri
- Aktivite geçmişi
- Proje istatistikleri
- Kullanıcıya ait görevlerin görüntülenmesi
- Ekip içi mesajlaşma
- Okunmamış mesaj bildirimleri
- MANAGER ve DEVELOPER rol sistemi
- Projeye üye davet etme
- Tema desteği
- Web, mobil ve masaüstü uygulamaları

## Kullanılan Teknolojiler

### Web

- React
- Vite
- JavaScript
- @hello-pangea/dnd
- Lucide React

### Backend

- Node.js
- Express.js
- Prisma ORM
- JWT
- bcryptjs
- Helmet
- express-rate-limit
- Multer
- Nodemailer

### Veritabanı

- PostgreSQL
- Neon

### Mobil

- React Native
- Expo

### Masaüstü

- Electron
- electron-builder

### Deployment

- Vercel
- Render
- Neon PostgreSQL

## Sistem Mimarisi

Panovio istemci-sunucu mimarisi kullanmaktadır.

```text
React / React Native / Electron
              |
              v
      Node.js + Express API
              |
              v
          Prisma ORM
              |
              v
     PostgreSQL (Neon)
```

## Proje Yapısı

```text
trello-clone/
├── backend/
│   ├── frontend/
│   ├── prisma/
│   ├── uploads/
│   ├── server.js
│   └── package.json
├── mobile/
├── desktop/
├── docs/
├── .gitignore
└── README.md
```

## Kullanıcı Rolleri

### MANAGER (Yönetici)

Yönetici proje üyelerini davet edebilir ve proje yönetimiyle ilgili yetkili işlemleri gerçekleştirebilir.

### DEVELOPER (Geliştirici)

Geliştirici görevleri görüntüleyebilir, oluşturabilir ve yönetebilir ancak proje üyelerini yönetme gibi yönetici yetkilerine erişemez.

Yetkilendirme yalnızca kullanıcı arayüzünde değil, backend API seviyesinde de kontrol edilmektedir.

## Güvenlik

Projede aşağıdaki güvenlik mekanizmaları kullanılmaktadır:

- JWT authentication
- bcryptjs ile parola hashleme
- Role-Based Access Control (RBAC)
- Helmet güvenlik başlıkları
- API rate limiting
- Production CORS allowlist
- Environment variables
- Proje bazlı backend yetkilendirmesi

`.env` dosyaları GitHub repository'sine dahil edilmemektedir.

## Yerel Çalıştırma

### Backend

```bash
cd backend
npm install
npx prisma generate
npm start
```

### Web

```bash
cd backend/frontend
npm install
npm run dev
```

### Mobil

```bash
cd mobile
npm install
npx expo start
```

### Masaüstü

Önce web production build'i oluşturulur:

```bash
cd backend/frontend
npm run build
```

Ardından:

```bash
cd desktop
npm install
npm start
```

Windows kurulum dosyasını oluşturmak için:

```bash
npm run build
```

## Environment Variables

Backend:

```env
DATABASE_URL=
DATABASE_URL_POOLED=
JWT_SECRET=
EMAIL_USER=
EMAIL_PASS=
```

Frontend:

```env
VITE_API_URL=http://localhost:5000/api
```

Gerçek parola, API anahtarı ve diğer gizli bilgiler repository'ye eklenmemelidir.

## Canlı Uygulama

Web:

https://panovio-sigma.vercel.app

Backend API:

https://panovio-api.onrender.com/api

## Deployment Notu

Backend Render Free üzerinde çalışmaktadır. Ücretsiz servis kullanılmadığında uyku moduna geçebildiği için ilk API isteğinde gecikme yaşanabilir.

Dosya ekleri mevcut sürümde backend dosya sistemi üzerinde tutulmaktadır. Render Free kalıcı disk sağlamadığından production ortamında yüklenen fiziksel dosyalar yeniden deploy veya servis yeniden başlatılması sonrasında kalıcı olmayabilir.

Veritabanı verileri Neon PostgreSQL üzerinde kalıcı olarak saklanmaktadır.

## Proje Dokümantasyonu

Ek analiz ve tasarım dokümanları `docs` klasörü içerisinde bulunmaktadır.

## Proje Amacı

Panovio; web, mobil ve masaüstü geliştirme teknolojilerini REST API, ilişkisel veritabanı, authentication, authorization, güvenlik ve deployment süreçleriyle bir araya getiren kapsamlı bir görev ve proje yönetim uygulamasıdır.