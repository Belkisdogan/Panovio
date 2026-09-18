# Panovio - Fake API Planı

## Amaç

Panovio'nun geliştirme sürecinin ilk aşamasında frontend arayüzünün gerçek backend tamamlanmadan geliştirilebilmesi için Fake API kullanımı planlanmıştır.

Fake API yaklaşımı özellikle aşağıdaki işlemlerin prototiplenmesi için düşünülmüştür:

- Kullanıcı verilerinin listelenmesi
- Projelerin görüntülenmesi
- Görevlerin oluşturulması
- Görevlerin güncellenmesi
- Görevlerin silinmesi
- Görev durumlarının değiştirilmesi
- Kanban arayüzünün test edilmesi

## Planlanan Teknolojiler

Fake API için aşağıdaki araçlardan biri kullanılabilecek şekilde planlama yapılmıştır:

- JSON Server
- MockAPI

Bu servisler sayesinde gerçek backend ve PostgreSQL bağlantısı kurulmadan önce frontend üzerinde örnek verilerle CRUD işlemleri test edilebilir.

## Örnek Veri Yapısı

```json
{
  "users": [
    {
      "id": 1,
      "name": "Demo User",
      "email": "demo@example.com"
    }
  ],
  "projects": [
    {
      "id": 1,
      "title": "Panovio Demo"
    }
  ],
  "tasks": [
    {
      "id": 1,
      "title": "Frontend geliştirme",
      "description": "Kanban arayüzünü tamamla",
      "status": "todo",
      "priority": "high",
      "projectId": 1,
      "userId": 1
    }
  ]
}
```

## Planlanan Fake Endpointler

| Method | Endpoint | Açıklama |
|---|---|---|
| GET | `/users` | Kullanıcıları getirir |
| GET | `/projects` | Projeleri getirir |
| POST | `/projects` | Yeni proje oluşturur |
| GET | `/tasks` | Görevleri getirir |
| POST | `/tasks` | Yeni görev oluşturur |
| PUT | `/tasks/:id` | Görevi günceller |
| DELETE | `/tasks/:id` | Görevi siler |

## Gerçek Backend'e Geçiş

Fake API yalnızca analiz, tasarım ve prototipleme aşaması için planlanmıştır.

Projenin sonraki aşamasında Fake API yerine gerçek backend geliştirilmiştir.

Final Panovio mimarisi:

```text
React / React Native / Electron
              |
              v
      Node.js + Express REST API
              |
              v
          Prisma ORM
              |
              v
       PostgreSQL / Neon
```

Böylece geliştirme sürecinde planlanan Fake API yaklaşımı, gerçek REST API ve ilişkisel veritabanı altyapısıyla değiştirilmiştir.

## Sonuç

Fake API planı frontend geliştirme sürecinin backend'den bağımsız başlatılabilmesi amacıyla hazırlanmıştır. Final uygulamada veriler gerçek Express API üzerinden PostgreSQL veritabanında saklanmaktadır.