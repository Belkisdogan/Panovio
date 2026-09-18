# Panovio - API Endpoint Planı

Panovio backend servisi Node.js ve Express.js kullanılarak REST API mimarisiyle geliştirilmiştir.

API'nin temel adresi:

```text
/api
```

Production API:

```text
https://panovio-api.onrender.com/api
```

## Authentication

| Method | Endpoint | Açıklama |
|---|---|---|
| POST | `/register` | Yeni kullanıcı kaydı oluşturur |
| POST | `/login` | Kullanıcı girişi yapar ve JWT üretir |
| POST | `/forgot-password` | Şifre sıfırlama sürecini başlatır |
| POST | `/reset-password` | Kullanıcı şifresini yeniler |

## Kullanıcı İşlemleri

| Method | Endpoint | Açıklama |
|---|---|---|
| GET | `/users` | Kullanıcıları listeler |
| PUT | `/user/profile` | Kullanıcı profilini günceller |
| DELETE | `/user/account` | Kullanıcı hesabını siler |
| GET | `/user/my-tasks` | Kullanıcıya atanmış görevleri getirir |

## Proje İşlemleri

| Method | Endpoint | Açıklama |
|---|---|---|
| GET | `/projects` | Kullanıcının erişebildiği projeleri getirir |
| POST | `/projects` | Yeni proje oluşturur |
| PUT | `/projects/:id` | Proje bilgilerini günceller |
| DELETE | `/projects/:id` | Projeyi siler |

Proje güncelleme ve silme gibi yetkili işlemler proje rolü üzerinden kontrol edilmektedir.

## Proje Üyeleri

| Method | Endpoint | Açıklama |
|---|---|---|
| GET | `/projects/:id/members` | Proje üyelerini getirir |
| POST | `/projects/:id/members` | Projeye yeni üye ekler |

Üye ekleme işlemi MANAGER yetkisi gerektirir.

## Görev İşlemleri

| Method | Endpoint | Açıklama |
|---|---|---|
| GET | `/tasks` | Yetkili görevleri getirir |
| POST | `/tasks` | Yeni görev oluşturur |
| PUT | `/tasks/:id` | Görevi günceller |
| DELETE | `/tasks/:id` | Görevi siler |

Görevlerde aşağıdaki bilgiler yönetilebilir:

- Başlık
- Açıklama
- Durum
- Öncelik
- Başlangıç tarihi
- Bitiş tarihi
- Sütun
- Atanan kullanıcı
- Proje

Temel görev durumları:

```text
todo
doing
done
```

## Sütun İşlemleri

Kanban panosundaki sütunların oluşturulması ve yönetimi API üzerinden gerçekleştirilir.

Sütunlar projeye bağlıdır ve görevlerin Kanban görünümündeki konumunu belirler.

## Checklist İşlemleri

Checklist API işlemleri sayesinde görevlerin alt maddeleri oluşturulabilir, güncellenebilir ve silinebilir.

## Etiket İşlemleri

| Method | İşlem |
|---|---|
| POST | Yeni etiket oluşturma |
| PUT | Etiket güncelleme |
| DELETE | Etiket silme |

Etiketler görevlerle ilişkilendirilir.

## Yorum İşlemleri

| Method | İşlem |
|---|---|
| POST | Göreve yorum ekleme |
| DELETE | Yorum silme |

## Aktivite Geçmişi

Aktivite endpointleri proje ve görevlerde gerçekleşen işlemlerin geçmişini görüntülemek için kullanılır.

## Dosya Ekleri

| Method | Endpoint | Açıklama |
|---|---|---|
| POST | `/tasks/:id/attachments` | Göreve dosya yükler |
| GET | `/attachments/:id/download` | Dosyayı indirir |
| DELETE | `/attachments/:id` | Dosya ekini siler |

Dosya yükleme işlemlerinde Multer kullanılmaktadır.

Bir istekte en fazla 5 dosya ve dosya başına en fazla 10 MB sınırı uygulanmaktadır.

## Doğrudan Mesajlaşma

| Method | Endpoint | Açıklama |
|---|---|---|
| GET | `/messages/users` | Mesajlaşılabilecek kullanıcıları getirir |
| GET | `/direct-messages/:userId` | İki kullanıcı arasındaki mesajları getirir |
| POST | `/direct-messages` | Yeni doğrudan mesaj gönderir |

Mesaj gönderiminde alıcı kullanıcı ve mesaj içeriği backend'e gönderilir.

## Authentication ve Authorization

Korunan API endpointlerinde JWT kullanılmaktadır.

Kullanıcı erişimi proje üyeliğine göre kontrol edilir.

Proje içerisindeki temel roller:

- `MANAGER`
- `DEVELOPER`

MANAGER proje ve üye yönetimi gibi yönetici işlemlerini gerçekleştirebilir.

DEVELOPER görev yönetimi işlemlerini gerçekleştirebilir ancak yöneticiye özel proje üyesi işlemlerine erişemez.

## Güvenlik

API üzerinde aşağıdaki güvenlik mekanizmaları uygulanmaktadır:

- JWT authentication
- bcryptjs password hashing
- Helmet
- Express Rate Limit
- CORS allowlist
- Role-Based Access Control
- Proje bazlı erişim kontrolü
- Environment variables ile gizli bilgi yönetimi