const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

// ==========================================
// 📎 GÖREV DOSYA EKLERİ
// ==========================================
const uploadsDir = path.join(__dirname, 'uploads', 'task-attachments');
fs.mkdirSync(uploadsDir, { recursive: true });

const allowedAttachmentMimeTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/webp'
]);

const attachmentStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safeExt = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '');
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  }
});

const uploadTaskAttachments = multer({
  storage: attachmentStorage,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => {
    if (allowedAttachmentMimeTypes.has(file.mimetype)) return cb(null, true);
    cb(new Error('Bu dosya türü desteklenmiyor.'));
  }
});

const PORT = process.env.PORT || 5000;

const JWT_SECRET =
  process.env.JWT_SECRET ||
  'cok_gizli_super_trello_anahtari_2026';

// ==========================================
// 📬 E-POSTA AYARLARI
// ==========================================

const EMAIL_USER = process.env.EMAIL_USER || '';
const EMAIL_PASS = process.env.EMAIL_PASS || '';

let transporter = null;

if (EMAIL_USER && EMAIL_PASS) {
  try {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
      }
    });

    console.log(
      '📬 Gmail E-posta taşıyıcısı başarıyla başlatıldı.'
    );
  } catch (error) {
    console.error(
      'Transporter başlatılamadı:',
      error.message
    );
  }
} else {
  console.warn(
    '⚠️ EMAIL_USER veya EMAIL_PASS eksik.'
  );
}

// ==========================================
// 🛡️ TEMEL GÜVENLİK
// ==========================================

app.use(helmet());
app.use(cors());
app.use(express.json());

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: {
    error:
      'Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin.'
  }
});

app.use('/api/', generalLimiter);

// Şifre sıfırlama deneme kontrolü
const resetAttempts = new Map();

// ==========================================
// 🔑 JWT AUTHENTICATION
// ==========================================

const authenticateToken = (
  req,
  res,
  next
) => {
  const authHeader =
    req.headers['authorization'];

  const token =
    authHeader &&
    authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error:
        'Yetkisiz erişim: Giriş yapmalısınız.'
    });
  }

  jwt.verify(
    token,
    JWT_SECRET,
    (err, user) => {
      if (err) {
        return res.status(403).json({
          error:
            'Geçersiz veya süresi dolmuş token.'
        });
      }

      req.userId = user.id;
      req.userEmail = user.email;

      next();
    }
  );
};

// ==========================================
// 🔐 PROJE YETKİLENDİRME
// ==========================================

const getProjectMembership = async (
  userId,
  projectId
) => {
  if (!Number.isInteger(projectId)) {
    return null;
  }

  return prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId,
        projectId
      }
    }
  });
};

const requireProjectAccess = async (
  req,
  res,
  projectId,
  managerOnly = false
) => {
  if (!Number.isInteger(projectId)) {
    res.status(400).json({
      error: 'Geçersiz pano ID.'
    });

    return null;
  }

  const membership =
    await getProjectMembership(
      req.userId,
      projectId
    );

  if (!membership) {
    res.status(403).json({
      error:
        'Bu panoya erişim yetkiniz yok.'
    });

    return null;
  }

  if (
    managerOnly &&
    membership.role !== 'MANAGER'
  ) {
    res.status(403).json({
      error:
        'Bu işlem için yönetici yetkisi gereklidir.'
    });

    return null;
  }

  return membership;
};

const getTaskProjectId = async (
  taskId
) => {
  const task =
    await prisma.task.findUnique({
      where: {
        id: taskId
      },
      select: {
        projectId: true
      }
    });

  return task?.projectId ?? null;
};

const getColumnProjectId = async (
  columnId
) => {
  const column =
    await prisma.column.findUnique({
      where: {
        id: columnId
      },
      select: {
        projectId: true
      }
    });

  return column?.projectId ?? null;
};

const getChecklistProjectId =
  async (itemId) => {
    const item =
      await prisma.checklistItem.findUnique({
        where: {
          id: itemId
        },
        select: {
          task: {
            select: {
              projectId: true
            }
          }
        }
      });

    return item?.task?.projectId ?? null;
  };

const getLabelProjectId =
  async (labelId) => {
    const label =
      await prisma.label.findUnique({
        where: {
          id: labelId
        },
        select: {
          task: {
            select: {
              projectId: true
            }
          }
        }
      });

    return label?.task?.projectId ?? null;
  };

// ==========================================
// 📌 1. AUTH & KULLANICI
// ==========================================

// KAYIT
app.post(
  '/api/auth/register',
  async (req, res) => {
    try {
      const {
        name,
        email,
        password
      } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error:
            'Email ve şifre zorunludur.'
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          error:
            'Şifre en az 8 karakter olmalıdır.'
        });
      }

      const normalizedEmail =
        email.trim().toLowerCase();

      const existingUser =
        await prisma.user.findUnique({
          where: {
            email: normalizedEmail
          }
        });

      if (existingUser) {
        return res.status(400).json({
          error:
            'Bu email zaten kullanımda.'
        });
      }

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );

      const user =
        await prisma.user.create({
          data: {
            name:
              name?.trim() || null,

            email:
              normalizedEmail,

            password:
              hashedPassword
          }
        });

      await prisma.project.create({
        data: {
          title:
            'Çalışma Alanım',

          background:
            'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',

          userId:
            user.id,

          members: {
            create: {
              userId:
                user.id,

              role:
                'MANAGER'
            }
          },

          columns: {
            create: [
              {
                title:
                  'Yapılacaklar',
                order: 0,
                color:
                  '#f59e0b'
              },
              {
                title:
                  'Devam Edenler',
                order: 1,
                color:
                  '#3b82f6'
              },
              {
                title:
                  'Tamamlandı',
                order: 2,
                color:
                  '#10b981'
              }
            ]
          }
        }
      });

      const token =
        jwt.sign(
          {
            id:
              user.id,

            email:
              user.email
          },

          JWT_SECRET,

          {
            expiresIn:
              '7d'
          }
        );

      res.status(201).json({
        token,

        user: {
          id:
            user.id,

          name:
            user.name,

          email:
            user.email
        }
      });

    } catch (error) {
      console.error(
        'Kayıt hatası:',
        error
      );

      res.status(500).json({
        error:
          'Kayıt olunurken hata meydana geldi.'
      });
    }
  }
);

// GİRİŞ
app.post(
  '/api/auth/login',
  async (req, res) => {
    try {
      const {
        email,
        password
      } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error:
            'E-posta ve şifre gereklidir.'
        });
      }

      const normalizedEmail =
        email.trim().toLowerCase();

      const user =
        await prisma.user.findUnique({
          where: {
            email:
              normalizedEmail
          }
        });

      if (!user) {
        return res.status(400).json({
          error:
            'Geçersiz e-posta veya şifre.'
        });
      }

      const isMatch =
        await bcrypt.compare(
          password,
          user.password
        );

      if (!isMatch) {
        return res.status(400).json({
          error:
            'Geçersiz e-posta veya şifre.'
        });
      }

      const token =
        jwt.sign(
          {
            id:
              user.id,

            email:
              user.email
          },

          JWT_SECRET,

          {
            expiresIn:
              '7d'
          }
        );

      res.json({
        token,

        user: {
          id:
            user.id,

          name:
            user.name,

          email:
            user.email
        }
      });

    } catch (error) {
      console.error(
        'Giriş hatası:',
        error
      );

      res.status(500).json({
        error:
          'Giriş yapılırken hata oluştu.'
      });
    }
  }
);

// ==========================================
// DEMO LOGIN
// ==========================================

app.post(
  '/api/auth/demo-login',
  async (req, res) => {
    try {
      const {
        roleType
      } = req.body;

      const isManager =
        roleType === 'manager';

      const email =
        isManager
          ? 'yonetici@demo.com'
          : 'gelistirici@demo.com';

      const name =
        isManager
          ? 'Demo Yönetici'
          : 'Demo Geliştirici';

      let user =
        await prisma.user.findUnique({
          where: {
            email
          }
        });

      if (!user) {
        const hashedPassword =
          await bcrypt.hash(
            '123456',
            10
          );

        user =
          await prisma.user.create({
            data: {
              name,
              email,
              password:
                hashedPassword
            }
          });
      }

      const memberships =
        await prisma.projectMember.findMany({
          where: {
            userId:
              user.id
          }
        });

      if (
        memberships.length === 0
      ) {
        await prisma.project.create({
          data: {
            title:
              isManager
                ? 'Yönetici Çalışma Alanı'
                : 'Geliştirici Çalışma Alanı',

            background:
              'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',

            userId:
              user.id,

            members: {
              create: {
                userId:
                  user.id,

                role:
                  isManager
                    ? 'MANAGER'
                    : 'DEVELOPER'
              }
            },

            columns: {
              create: [
                {
                  title:
                    'Yapılacaklar',
                  order: 0,
                  color:
                    '#f59e0b'
                },
                {
                  title:
                    'Devam Edenler',
                  order: 1,
                  color:
                    '#3b82f6'
                },
                {
                  title:
                    'Tamamlandı',
                  order: 2,
                  color:
                    '#10b981'
                }
              ]
            }
          }
        });
      }

      const token =
        jwt.sign(
          {
            id:
              user.id,

            email:
              user.email
          },

          JWT_SECRET,

          {
            expiresIn:
              '7d'
          }
        );

      res.json({
        token,

        user: {
          id:
            user.id,

          name:
            user.name,

          email:
            user.email
        }
      });

    } catch (error) {
      console.error(
        'Demo giriş hatası:',
        error
      );

      res.status(500).json({
        error:
          'Demo giriş yapılamadı.'
      });
    }
  }
);

// ==========================================
// 🔐 ŞİFREMİ UNUTTUM
// ==========================================

app.post(
  '/api/auth/forgot-password',
  async (req, res) => {
    try {
      const {
        email
      } = req.body;

      if (!email) {
        return res.status(400).json({
          error:
            'E-posta adresi gereklidir.'
        });
      }

      const normalizedEmail =
        email.trim().toLowerCase();

      const user =
        await prisma.user.findUnique({
          where: {
            email:
              normalizedEmail
          }
        });

      if (!user) {
        return res.status(404).json({
          error:
            'Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı.'
        });
      }

      const now =
        Date.now();

      const attempt =
        resetAttempts.get(
          normalizedEmail
        ) || {
          count: 0,
          lastRequest: 0
        };

      if (
        now -
          attempt.lastRequest <
        60 * 1000
      ) {
        return res.status(429).json({
          error:
            'Yeni kod istemeden önce lütfen biraz bekleyin.'
        });
      }

      const resetCode =
        Math.floor(
          100000 +
            Math.random() *
              900000
        ).toString();

      const resetCodeExp =
        new Date(
          Date.now() +
            3 * 60 * 1000
        );

      await prisma.user.update({
        where: {
          id:
            user.id
        },

        data: {
          resetCode,
          resetCodeExp
        }
      });

      resetAttempts.set(
        normalizedEmail,
        {
          count: 0,
          lastRequest:
            now
        }
      );

      console.log(
        `🔑 Şifre sıfırlama kodu (${normalizedEmail}): ${resetCode}`
      );

      if (transporter) {
        await transporter.sendMail({
          from:
            `"Panovio" <${EMAIL_USER}>`,

          to:
            normalizedEmail,

          subject:
            'Panovio - Şifre Sıfırlama Doğrulama Kodu',

          html: `
            <div style="
              font-family: Arial, sans-serif;
              max-width: 500px;
              margin: auto;
              padding: 30px;
              background: #ffffff;
              border-radius: 12px;
              border: 1px solid #e5e7eb;
            ">
              <h2 style="
                color: #111827;
                margin-bottom: 15px;
              ">
                Panovio
              </h2>

              <p style="
                color: #4b5563;
                font-size: 15px;
              ">
                Şifrenizi sıfırlamak için aşağıdaki doğrulama kodunu kullanabilirsiniz.
              </p>

              <div style="
                margin: 25px 0;
                padding: 18px;
                text-align: center;
                font-size: 30px;
                font-weight: bold;
                letter-spacing: 8px;
                background: #f3f4f6;
                border-radius: 10px;
                color: #111827;
              ">
                ${resetCode}
              </div>

              <p style="
                color: #6b7280;
                font-size: 13px;
              ">
                Bu kod 3 dakika boyunca geçerlidir.
              </p>

              <p style="
                color: #6b7280;
                font-size: 13px;
              ">
                Bu işlemi siz başlatmadıysanız bu e-postayı dikkate almayabilirsiniz.
              </p>
            </div>
          `
        });
      }

      res.json({
        message:
          'Doğrulama kodu e-posta hesabınıza gönderildi.'
      });

    } catch (error) {
      console.error(
        'Şifre sıfırlama talebi hatası:',
        error
      );

      res.status(500).json({
        error:
          'İşlem gerçekleştirilemedi.'
      });
    }
  }
);

// KODU DOĞRULA
app.post(
  '/api/auth/verify-reset-code',
  async (req, res) => {
    try {
      const {
        email,
        code
      } = req.body;

      if (!email || !code) {
        return res.status(400).json({
          error:
            'E-posta ve doğrulama kodu gereklidir.'
        });
      }

      const normalizedEmail =
        email.trim().toLowerCase();

      const user =
        await prisma.user.findUnique({
          where: {
            email:
              normalizedEmail
          }
        });

      if (
        !user ||
        !user.resetCode ||
        !user.resetCodeExp
      ) {
        return res.status(400).json({
          error:
            'Geçersiz veya süresi dolmuş kod. Lütfen yeni bir kod isteyin.'
        });
      }

      if (
        new Date() >
        new Date(
          user.resetCodeExp
        )
      ) {
        await prisma.user.update({
          where: {
            id:
              user.id
          },

          data: {
            resetCode: null,
            resetCodeExp: null
          }
        });

        return res.status(400).json({
          error:
            'Doğrulama kodunun 3 dakikalık süresi doldu. Lütfen yeni kod isteyin.'
        });
      }

      const attempt =
        resetAttempts.get(
          normalizedEmail
        ) || {
          count: 0,
          lastRequest: 0
        };

      if (
        user.resetCode !==
        code.trim()
      ) {
        attempt.count += 1;

        resetAttempts.set(
          normalizedEmail,
          attempt
        );

        const remaining =
          3 -
          attempt.count;

        if (
          remaining <= 0
        ) {
          await prisma.user.update({
            where: {
              id:
                user.id
            },

            data: {
              resetCode: null,
              resetCodeExp: null
            }
          });

          resetAttempts.delete(
            normalizedEmail
          );

          return res.status(400).json({
            error:
              '3 kez hatalı kod girdiniz. Bu kod iptal edildi, lütfen yeni kod isteyin.'
          });
        }

        return res.status(400).json({
          error:
            `Girdiğiniz doğrulama kodu hatalı. (Kalan hakkınız: ${remaining})`
        });
      }

      res.json({
        message:
          'Kod doğrulandı, yeni şifrenizi belirleyebilirsiniz.'
      });

    } catch (error) {
      console.error(
        'Kod doğrulama hatası:',
        error
      );

      res.status(500).json({
        error:
          'Doğrulama yapılamadı.'
      });
    }
  }
);

// YENİ ŞİFRE
app.post(
  '/api/auth/reset-password',
  async (req, res) => {
    try {
      const {
        email,
        code,
        newPassword
      } = req.body;

      if (
        !email ||
        !code ||
        !newPassword
      ) {
        return res.status(400).json({
          error:
            'Tüm alanları doldurun.'
        });
      }

      if (
        newPassword.length < 8
      ) {
        return res.status(400).json({
          error:
            'Şifreniz en az 8 karakter olmalıdır.'
        });
      }

      const normalizedEmail =
        email.trim().toLowerCase();

      const user =
        await prisma.user.findUnique({
          where: {
            email:
              normalizedEmail
          }
        });

      if (
        !user ||
        user.resetCode !==
          code.trim()
      ) {
        return res.status(400).json({
          error:
            'Güvenlik doğrulaması başarısız oldu. Lütfen işlemi baştan başlatın.'
        });
      }

      if (
        !user.resetCodeExp ||
        new Date() >
          new Date(
            user.resetCodeExp
          )
      ) {
        return res.status(400).json({
          error:
            'Kodun süresi doldu.'
        });
      }

      const hashedPassword =
        await bcrypt.hash(
          newPassword,
          10
        );

      await prisma.user.update({
        where: {
          id:
            user.id
        },

        data: {
          password:
            hashedPassword,

          resetCode: null,
          resetCodeExp: null
        }
      });

      resetAttempts.delete(
        normalizedEmail
      );

      res.json({
        message:
          'Şifreniz başarıyla güncellendi.'
      });

    } catch (error) {
      console.error(
        'Şifre değiştirme hatası:',
        error
      );

      res.status(500).json({
        error:
          'Şifre güncellenemedi.'
      });
    }
  }
);

// ==========================================
// 👤 PROFİL
// ==========================================

app.put(
  '/api/user/profile',
  authenticateToken,
  async (req, res) => {
    try {
      const {
        name,
        currentPassword,
        newPassword
      } = req.body;

      const user =
        await prisma.user.findUnique({
          where: {
            id:
              req.userId
          }
        });

      if (!user) {
        return res.status(404).json({
          error:
            'Kullanıcı bulunamadı.'
        });
      }

      const updateData = {};

      if (name) {
        updateData.name =
          name.trim();
      }

      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({
            error:
              'Mevcut şifrenizi girmelisiniz.'
          });
        }

        const isMatch =
          await bcrypt.compare(
            currentPassword,
            user.password
          );

        if (!isMatch) {
          return res.status(400).json({
            error:
              'Mevcut şifreniz yanlış.'
          });
        }

        if (
          newPassword.length < 8
        ) {
          return res.status(400).json({
            error:
              'Yeni şifreniz en az 8 karakter olmalıdır.'
          });
        }

        updateData.password =
          await bcrypt.hash(
            newPassword,
            10
          );
      }

      const updated =
        await prisma.user.update({
          where: {
            id:
              req.userId
          },

          data:
            updateData,

          select: {
            id: true,
            name: true,
            email: true
          }
        });

      res.json({
        message:
          'Profil başarıyla güncellendi.',

        user:
          updated
      });

    } catch (error) {
      console.error(
        'Profil güncelleme:',
        error
      );

      res.status(500).json({
        error:
          'Profil güncellenemedi.'
      });
    }
  }
);

// ==========================================
// ⚠️ HESAP SİLME
// ==========================================

app.delete(
  '/api/user/account',
  authenticateToken,
  async (req, res) => {
    try {
      const userId =
        req.userId;

      await prisma.activityLog.deleteMany({
        where: {
          userId
        }
      });

      await prisma.comment.deleteMany({
        where: {
          userId
        }
      });

      await prisma.checklistItem.deleteMany({
        where: {
          task: {
            project: {
              userId
            }
          }
        }
      });

      await prisma.label.deleteMany({
        where: {
          task: {
            project: {
              userId
            }
          }
        }
      });

      await prisma.task.deleteMany({
        where: {
          project: {
            userId
          }
        }
      });

      await prisma.column.deleteMany({
        where: {
          project: {
            userId
          }
        }
      });

      await prisma.projectMember.deleteMany({
        where: {
          userId
        }
      });

      await prisma.project.deleteMany({
        where: {
          userId
        }
      });

      await prisma.directMessage.deleteMany({
        where: {
          OR: [
            {
              senderId:
                userId
            },
            {
              receiverId:
                userId
            }
          ]
        }
      });

      await prisma.user.delete({
        where: {
          id:
            userId
        }
      });

      res.json({
        message:
          'Hesabınız ve tüm ilişkili verileriniz başarıyla silindi.'
      });

    } catch (error) {
      console.error(
        'Hesap silme hatası:',
        error
      );

      res.status(500).json({
        error:
          'Hesap silinirken hata oluştu.'
      });
    }
  }
);

// ==========================================
// 📋 BANA ATANAN GÖREVLER
// ==========================================

app.get(
  '/api/user/my-tasks',
  authenticateToken,
  async (req, res) => {
    try {
      const tasks =
        await prisma.task.findMany({
          where: {
            assignedToId:
              req.userId
          },

          include: {
            project: {
              select: {
                id: true,
                title: true
              }
            },

            column: {
              select: {
                id: true,
                title: true
              }
            }
          },

          orderBy: [
            {
              dueDate:
                'asc'
            },
            {
              id:
                'desc'
            }
          ]
        });

      res.json(tasks);

    } catch (error) {
      res.status(500).json({
        error:
          'Görevler alınamadı.'
      });
    }
  }
);

// ==========================================
// 👥 KULLANICILAR
// ==========================================

app.get(
  '/api/users',
  authenticateToken,
  async (req, res) => {
    try {
      const users =
        await prisma.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        });

      res.json(users);

    } catch (error) {
      res.status(500).json({
        error:
          'Kullanıcılar getirilemedi.'
      });
    }
  }
);

// ==========================================
// 📌 2. PANO İŞLEMLERİ
// ==========================================

app.get(
  '/api/projects',
  authenticateToken,
  async (req, res) => {
    try {
      let memberships =
        await prisma.projectMember.findMany({
          where: {
            userId:
              req.userId
          },

          include: {
            project: {
              include: {
                members: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        email: true
                      }
                    }
                  }
                }
              }
            }
          },

          orderBy: {
            id:
              'asc'
          }
        });

      if (
        memberships.length === 0
      ) {
        const defaultProject =
          await prisma.project.create({
            data: {
              title:
                'Çalışma Alanım',

              background:
                'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',

              userId:
                req.userId,

              members: {
                create: {
                  userId:
                    req.userId,

                  role:
                    'MANAGER'
                }
              },

              columns: {
                create: [
                  {
                    title:
                      'Yapılacaklar',
                    order: 0,
                    color:
                      '#f59e0b'
                  },
                  {
                    title:
                      'Devam Edenler',
                    order: 1,
                    color:
                      '#3b82f6'
                  },
                  {
                    title:
                      'Tamamlandı',
                    order: 2,
                    color:
                      '#10b981'
                  }
                ]
              }
            },

            include: {
              members: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true
                    }
                  }
                }
              }
            }
          });

        return res.json([
          {
            ...defaultProject,
            currentUserRole:
              'MANAGER'
          }
        ]);
      }

      const projectsWithRole =
        memberships.map(
          membership => ({
            ...membership.project,

            currentUserRole:
              membership.role
          })
        );

      res.json(
        projectsWithRole
      );

    } catch (error) {
      console.error(
        'Panolar:',
        error
      );

      res.status(500).json({
        error:
          'Panolar getirilemedi.'
      });
    }
  }
);

// PANO OLUŞTUR
app.post(
  '/api/projects',
  authenticateToken,
  async (req, res) => {
    try {
      const {
        title,
        background
      } = req.body;

      if (!title?.trim()) {
        return res.status(400).json({
          error:
            'Pano adı gereklidir.'
        });
      }

      const newProject =
        await prisma.project.create({
          data: {
            title:
              title.trim(),

            background:
              background ||
              'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',

            userId:
              req.userId,

            members: {
              create: {
                userId:
                  req.userId,

                role:
                  'MANAGER'
              }
            },

            columns: {
              create: [
                {
                  title:
                    'Yapılacaklar',
                  order: 0,
                  color:
                    '#f59e0b'
                },
                {
                  title:
                    'Devam Edenler',
                  order: 1,
                  color:
                    '#3b82f6'
                },
                {
                  title:
                    'Tamamlandı',
                  order: 2,
                  color:
                    '#10b981'
                }
              ]
            }
          },

          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        });

      res.status(201).json({
        ...newProject,
        currentUserRole:
          'MANAGER'
      });

    } catch (error) {
      console.error(
        'Pano oluşturma:',
        error
      );

      res.status(500).json({
        error:
          'Pano oluşturulamadı.'
      });
    }
  }
);

// PANO GÜNCELLE
app.put(
  '/api/projects/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const projectId =
        parseInt(
          req.params.id
        );

      if (
        isNaN(projectId)
      ) {
        return res.status(400).json({
          error:
            'Geçersiz pano ID.'
        });
      }

      const membership =
        await requireProjectAccess(
          req,
          res,
          projectId,
          true
        );

      if (!membership) {
        return;
      }

      const {
        title,
        background
      } = req.body;

      if (
        title !== undefined &&
        !title.trim()
      ) {
        return res.status(400).json({
          error:
            'Pano adı boş olamaz.'
        });
      }

      const updated =
        await prisma.project.update({
          where: {
            id:
              projectId
          },

          data: {
            title:
              title !== undefined
                ? title.trim()
                : undefined,

            background:
              background !== undefined
                ? background
                : undefined
          }
        });

      res.json(updated);

    } catch (error) {
      console.error(
        'Pano güncelleme:',
        error
      );

      res.status(500).json({
        error:
          'Pano güncellenemedi.'
      });
    }
  }
);

// PANO SİL
app.delete(
  '/api/projects/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const projectId =
        parseInt(
          req.params.id
        );

      if (
        isNaN(projectId)
      ) {
        return res.status(400).json({
          error:
            'Geçersiz pano ID.'
        });
      }

      const membership =
        await requireProjectAccess(
          req,
          res,
          projectId,
          true
        );

      if (!membership) {
        return;
      }

      await prisma.$transaction(
        async tx => {
          await tx.activityLog.deleteMany({
            where: {
              task: {
                projectId
              }
            }
          });

          await tx.checklistItem.deleteMany({
            where: {
              task: {
                projectId
              }
            }
          });

          await tx.label.deleteMany({
            where: {
              task: {
                projectId
              }
            }
          });

          await tx.comment.deleteMany({
            where: {
              task: {
                projectId
              }
            }
          });

          await tx.task.deleteMany({
            where: {
              projectId
            }
          });

          await tx.column.deleteMany({
            where: {
              projectId
            }
          });

          await tx.projectMember.deleteMany({
            where: {
              projectId
            }
          });

          await tx.project.delete({
            where: {
              id:
                projectId
            }
          });
        }
      );

      res.json({
        message:
          'Pano silindi.'
      });

    } catch (error) {
      console.error(
        'Pano silme:',
        error
      );

      res.status(500).json({
        error:
          'Pano silinemedi.'
      });
    }
  }
);

// ==========================================
// 👥 PANO ÜYELERİ
// ==========================================

app.get(
  '/api/projects/:id/members',
  authenticateToken,
  async (req, res) => {
    try {
      const projectId =
        parseInt(
          req.params.id
        );

      const membership =
        await requireProjectAccess(
          req,
          res,
          projectId
        );

      if (!membership) {
        return;
      }

      const members =
        await prisma.projectMember.findMany({
          where: {
            projectId
          },

          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        });

      res.json(members);

    } catch (error) {
      res.status(500).json({
        error:
          'Üyeler alınamadı.'
      });
    }
  }
);

// ÜYE EKLE
app.post(
  '/api/projects/:id/members',
  authenticateToken,
  async (req, res) => {
    try {
      const projectId =
        parseInt(
          req.params.id
        );

      const membership =
        await requireProjectAccess(
          req,
          res,
          projectId,
          true
        );

      if (!membership) {
        return;
      }

      const {
        email,
        role
      } = req.body;

      if (!email?.trim()) {
        return res.status(400).json({
          error:
            'E-posta adresi gereklidir.'
        });
      }

      const allowedRoles = [
        'MANAGER',
        'DEVELOPER'
      ];

      const selectedRole =
        allowedRoles.includes(role)
          ? role
          : 'DEVELOPER';

      const targetUser =
        await prisma.user.findUnique({
          where: {
            email:
              email
                .trim()
                .toLowerCase()
          }
        });

      if (!targetUser) {
        return res.status(404).json({
          error:
            'Bu e-posta adresiyle kayıtlı bir kullanıcı bulunamadı.'
        });
      }

      const existing =
        await prisma.projectMember.findUnique({
          where: {
            userId_projectId: {
              userId:
                targetUser.id,

              projectId
            }
          }
        });

      if (existing) {
        return res.status(400).json({
          error:
            'Bu kullanıcı zaten bu panonun üyesi.'
        });
      }

      const newMember =
        await prisma.projectMember.create({
          data: {
            projectId,

            userId:
              targetUser.id,

            role:
              selectedRole
          },

          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        });

      res.status(201).json(
        newMember
      );

    } catch (error) {
      console.error(
        'Üye ekleme:',
        error
      );

      res.status(500).json({
        error:
          'Üye eklenirken hata oluştu.'
      });
    }
  }
);

// ÜYE ÇIKAR
app.delete(
  '/api/projects/:id/members/:userId',
  authenticateToken,
  async (req, res) => {
    try {
      const projectId =
        parseInt(
          req.params.id
        );

      const userId =
        parseInt(
          req.params.userId
        );

      const membership =
        await requireProjectAccess(
          req,
          res,
          projectId,
          true
        );

      if (!membership) {
        return;
      }

      const project =
        await prisma.project.findUnique({
          where: {
            id:
              projectId
          },

          select: {
            userId: true
          }
        });

      if (!project) {
        return res.status(404).json({
          error:
            'Pano bulunamadı.'
        });
      }

      if (
        project.userId ===
        userId
      ) {
        return res.status(400).json({
          error:
            'Pano sahibi panodan çıkarılamaz.'
        });
      }

      const targetMembership =
        await prisma.projectMember.findUnique({
          where: {
            userId_projectId: {
              userId,
              projectId
            }
          }
        });

      if (!targetMembership) {
        return res.status(404).json({
          error:
            'Kullanıcı bu panonun üyesi değil.'
        });
      }

      await prisma.projectMember.delete({
        where: {
          userId_projectId: {
            userId,
            projectId
          }
        }
      });

      res.json({
        message:
          'Üye panodan çıkarıldı.'
      });

    } catch (error) {
      console.error(
        'Üye çıkarma:',
        error
      );

      res.status(500).json({
        error:
          'Üye çıkarılamadı.'
      });
    }
  }
);

// ==========================================
// 📌 3. SÜTUN İŞLEMLERİ
// ==========================================

app.get(
  '/api/projects/:projectId/columns',
  authenticateToken,
  async (req, res) => {
    try {
      const projectId =
        parseInt(
          req.params.projectId
        );

      const membership =
        await requireProjectAccess(
          req,
          res,
          projectId
        );

      if (!membership) {
        return;
      }

      let columns =
        await prisma.column.findMany({
          where: {
            projectId
          },

          orderBy: {
            order:
              'asc'
          }
        });

      if (
        columns.length === 0
      ) {
        // Yalnızca MANAGER eksik varsayılan sütunları
        // otomatik oluşturabilsin.
        if (
          membership.role ===
          'MANAGER'
        ) {
          await prisma.column.createMany({
            data: [
              {
                title:
                  'Yapılacaklar',
                order: 0,
                color:
                  '#f59e0b',
                projectId
              },
              {
                title:
                  'Devam Edenler',
                order: 1,
                color:
                  '#3b82f6',
                projectId
              },
              {
                title:
                  'Tamamlandı',
                order: 2,
                color:
                  '#10b981',
                projectId
              }
            ]
          });

          columns =
            await prisma.column.findMany({
              where: {
                projectId
              },

              orderBy: {
                order:
                  'asc'
              }
            });
        }
      }

      res.json(columns);

    } catch (error) {
      console.error(
        'Sütunlar:',
        error
      );

      res.status(500).json({
        error:
          'Sütunlar getirilemedi.'
      });
    }
  }
);

// SÜTUN EKLE
app.post(
  '/api/projects/:projectId/columns',
  authenticateToken,
  async (req, res) => {
    try {
      const projectId =
        parseInt(
          req.params.projectId
        );

      const membership =
        await requireProjectAccess(
          req,
          res,
          projectId,
          true
        );

      if (!membership) {
        return;
      }

      const {
        title,
        color
      } = req.body;

      if (!title?.trim()) {
        return res.status(400).json({
          error:
            'Liste adı gereklidir.'
        });
      }

      const count =
        await prisma.column.count({
          where: {
            projectId
          }
        });

      const newColumn =
        await prisma.column.create({
          data: {
            title:
              title.trim(),

            color:
              color ||
              '#3b82f6',

            order:
              count,

            projectId
          }
        });

      res.status(201).json(
        newColumn
      );

    } catch (error) {
      console.error(
        'Sütun oluşturma:',
        error
      );

      res.status(500).json({
        error:
          'Liste oluşturulamadı.'
      });
    }
  }
);

// SÜTUN GÜNCELLE
app.put(
  '/api/columns/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const columnId =
        parseInt(
          req.params.id
        );

      const projectId =
        await getColumnProjectId(
          columnId
        );

      if (!projectId) {
        return res.status(404).json({
          error:
            'Liste bulunamadı.'
        });
      }

      const membership =
        await requireProjectAccess(
          req,
          res,
          projectId,
          true
        );

      if (!membership) {
        return;
      }

      const {
        title,
        color
      } = req.body;

      if (
        title !== undefined &&
        !title.trim()
      ) {
        return res.status(400).json({
          error:
            'Liste adı boş olamaz.'
        });
      }

      const updated =
        await prisma.column.update({
          where: {
            id:
              columnId
          },

          data: {
            title:
              title !== undefined
                ? title.trim()
                : undefined,

            color:
              color !== undefined
                ? color
                : undefined
          }
        });

      res.json(updated);

    } catch (error) {
      console.error(
        'Sütun güncelleme:',
        error
      );

      res.status(500).json({
        error:
          'Liste güncellenemedi.'
      });
    }
  }
);

// SÜTUN SIRALA
app.put(
  '/api/projects/:projectId/columns/reorder',
  authenticateToken,
  async (req, res) => {
    try {
      const projectId =
        parseInt(
          req.params.projectId
        );

      const membership =
        await requireProjectAccess(
          req,
          res,
          projectId,
          true
        );

      if (!membership) {
        return;
      }

      const {
        orderedColumnIds
      } = req.body;

      if (
        !Array.isArray(
          orderedColumnIds
        )
      ) {
        return res.status(400).json({
          error:
            'Geçersiz liste sırası.'
        });
      }

      const existingColumns =
        await prisma.column.findMany({
          where: {
            projectId
          },

          select: {
            id: true
          }
        });

      const validIds =
        new Set(
          existingColumns.map(
            column =>
              column.id
          )
        );

      const requestedIds =
        orderedColumnIds.map(
          id =>
            parseInt(id)
        );

      if (
        requestedIds.some(
          id =>
            !validIds.has(id)
        )
      ) {
        return res.status(400).json({
          error:
            'Başka panoya ait liste kullanılamaz.'
        });
      }

      await prisma.$transaction(
        requestedIds.map(
          (id, index) =>
            prisma.column.update({
              where: {
                id
              },

              data: {
                order:
                  index
              }
            })
        )
      );

      res.json({
        message:
          'Liste sırası güncellendi.'
      });

    } catch (error) {
      console.error(
        'Liste sıralama:',
        error
      );

      res.status(500).json({
        error:
          'Liste sırası güncellenemedi.'
      });
    }
  }
);

// SÜTUN SİL
app.delete(
  '/api/columns/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const columnId =
        parseInt(
          req.params.id
        );

      const projectId =
        await getColumnProjectId(
          columnId
        );

      if (!projectId) {
        return res.status(404).json({
          error:
            'Liste bulunamadı.'
        });
      }

      const membership =
        await requireProjectAccess(
          req,
          res,
          projectId,
          true
        );

      if (!membership) {
        return;
      }

      await prisma.column.delete({
        where: {
          id:
            columnId
        }
      });

      res.json({
        message:
          'Liste silindi.'
      });

    } catch (error) {
      console.error(
        'Liste silme:',
        error
      );

      res.status(500).json({
        error:
          'Liste silinemedi.'
      });
    }
  }
);

// ==========================================
// 📌 4. GÖREV İŞLEMLERİ
// ==========================================

app.get(
  '/api/tasks',
  authenticateToken,
  async (req, res) => {
    try {
      const projectId =
        parseInt(
          req.query.projectId
        );

      if (
        isNaN(projectId)
      ) {
        return res.status(400).json({
          error:
            'Geçersiz pano ID.'
        });
      }

      const membership =
        await requireProjectAccess(
          req,
          res,
          projectId
        );

      if (!membership) {
        return;
      }

      const tasks =
        await prisma.task.findMany({
          where: {
            projectId
          },

          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },

            items: true,

            attachments: {
              select: {
                id: true,
                originalName: true,
                mimeType: true,
                size: true,
                createdAt: true
              },
              orderBy: { createdAt: 'desc' }
            },

            labels: true,

            comments: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              },

              orderBy: {
                createdAt:
                  'desc'
              }
            },

            activities: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              },

              orderBy: {
                createdAt:
                  'desc'
              }
            }
          },

          orderBy: {
            id:
              'desc'
          }
        });

      res.json(tasks);

    } catch (error) {
      console.error(
        'Görevler:',
        error
      );

      res.status(500).json({
        error:
          'Görevler alınamadı.'
      });
    }
  }
);

// GÖREV OLUŞTUR
app.post(
  '/api/tasks',
  authenticateToken,
  async (req, res) => {
    try {
      const {
        title,
        description,
        status,
        priority,
        startDate,
        dueDate,
        projectId,
        columnId,
        assignedToId
      } = req.body;

      const parsedProjectId =
        parseInt(
          projectId
        );

      if (
        isNaN(
          parsedProjectId
        )
      ) {
        return res.status(400).json({
          error:
            'Geçersiz pano ID.'
        });
      }

      const membership =
        await requireProjectAccess(
          req,
          res,
          parsedProjectId
        );

      if (!membership) {
        return;
      }

      if (!title?.trim()) {
        return res.status(400).json({
          error:
            'Görev başlığı gereklidir.'
        });
      }

      let parsedColumnId =
        null;

      if (columnId) {
        parsedColumnId =
          parseInt(
            columnId
          );

        const column =
          await prisma.column.findFirst({
            where: {
              id:
                parsedColumnId,

              projectId:
                parsedProjectId
            }
          });

        if (!column) {
          return res.status(400).json({
            error:
              'Seçilen liste bu panoya ait değil.'
          });
        }
      }

      let parsedAssignedToId =
        null;

      if (assignedToId) {
        parsedAssignedToId =
          parseInt(
            assignedToId
          );

        const assignedMembership =
          await prisma.projectMember.findUnique({
            where: {
              userId_projectId: {
                userId:
                  parsedAssignedToId,

                projectId:
                  parsedProjectId
              }
            }
          });

        if (
          !assignedMembership
        ) {
          return res.status(400).json({
            error:
              'Görev yalnızca bu panonun üyelerinden birine atanabilir.'
          });
        }
      }

      const newTask =
        await prisma.task.create({
          data: {
            title:
              title.trim(),

            description:
              description ||
              null,

            status:
              status ||
              'todo',

            priority:
              priority ||
              'medium',

            startDate:
              startDate ||
              null,

            dueDate:
              dueDate ||
              null,

            projectId:
              parsedProjectId,

            columnId:
              parsedColumnId,

            assignedToId:
              parsedAssignedToId
          }
        });

      await prisma.activityLog.create({
        data: {
          action:
            'Kartı oluşturdu',

          taskId:
            newTask.id,

          userId:
            req.userId
        }
      });

      const taskWithRelations =
        await prisma.task.findUnique({
          where: {
            id:
              newTask.id
          },

          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },

            items: true,

            attachments: {
              select: {
                id: true,
                originalName: true,
                mimeType: true,
                size: true,
                createdAt: true
              },
              orderBy: { createdAt: 'desc' }
            },

            labels: true,

            comments: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            },

            activities: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        });

      res.status(201).json(
        taskWithRelations
      );

    } catch (error) {
      console.error(
        'Görev oluşturma:',
        error
      );

      res.status(500).json({
        error:
          'Görev oluşturulamadı.'
      });
    }
  }
);

// GÖREV GÜNCELLE
app.put(
  '/api/tasks/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const taskId =
        parseInt(
          req.params.id
        );

      const task =
        await prisma.task.findUnique({
          where: {
            id:
              taskId
          },

          select: {
            id: true,
            projectId: true
          }
        });

      if (!task) {
        return res.status(404).json({
          error:
            'Görev bulunamadı.'
        });
      }

      const membership =
        await requireProjectAccess(
          req,
          res,
          task.projectId
        );

      if (!membership) {
        return;
      }

      const {
        title,
        description,
        status,
        priority,
        startDate,
        dueDate,
        columnId,
        columnName,
        assignedToId
      } = req.body;

      let parsedColumnId;

      if (
        columnId !== undefined
      ) {
        if (
          columnId === null ||
          columnId === ''
        ) {
          parsedColumnId =
            null;
        } else {
          parsedColumnId =
            parseInt(
              columnId
            );

          const column =
            await prisma.column.findFirst({
              where: {
                id:
                  parsedColumnId,

                projectId:
                  task.projectId
              }
            });

          if (!column) {
            return res.status(400).json({
              error:
                'Seçilen liste bu panoya ait değil.'
            });
          }
        }
      }

      let parsedAssignedToId;

      if (
        assignedToId !== undefined
      ) {
        if (
          assignedToId === null ||
          assignedToId === ''
        ) {
          parsedAssignedToId =
            null;
        } else {
          parsedAssignedToId =
            parseInt(
              assignedToId
            );

          const assignedMembership =
            await prisma.projectMember.findUnique({
              where: {
                userId_projectId: {
                  userId:
                    parsedAssignedToId,

                  projectId:
                    task.projectId
                }
              }
            });

          if (
            !assignedMembership
          ) {
            return res.status(400).json({
              error:
                'Görev yalnızca bu panonun üyelerinden birine atanabilir.'
            });
          }
        }
      }

      if (columnName) {
        await prisma.activityLog.create({
          data: {
            action:
              `Kartı "${columnName}" listesine taşıdı`,

            taskId,

            userId:
              req.userId
          }
        });
      }

      const updatedTask =
        await prisma.task.update({
          where: {
            id:
              taskId
          },

          data: {
            title:
              title !== undefined
                ? title.trim()
                : undefined,

            description:
              description !== undefined
                ? description
                : undefined,

            status:
              status !== undefined
                ? status
                : undefined,

            priority:
              priority !== undefined
                ? priority
                : undefined,

            startDate:
              startDate !== undefined
                ? startDate || null
                : undefined,

            dueDate:
              dueDate !== undefined
                ? dueDate || null
                : undefined,

            columnId:
              columnId !== undefined
                ? parsedColumnId
                : undefined,

            assignedToId:
              assignedToId !== undefined
                ? parsedAssignedToId
                : undefined
          },

          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },

            items: true,

            attachments: {
              select: {
                id: true,
                originalName: true,
                mimeType: true,
                size: true,
                createdAt: true
              },
              orderBy: { createdAt: 'desc' }
            },

            labels: true,

            comments: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              },

              orderBy: {
                createdAt:
                  'desc'
              }
            },

            activities: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              },

              orderBy: {
                createdAt:
                  'desc'
              }
            }
          }
        });

      res.json(updatedTask);

    } catch (error) {
      console.error(
        'Görev güncelleme:',
        error
      );

      res.status(500).json({
        error:
          'Görev güncellenemedi.'
      });
    }
  }
);

// GÖREV DOSYASI YÜKLE
app.post(
  '/api/tasks/:id/attachments',
  authenticateToken,
  (req, res, next) => {
    uploadTaskAttachments.array('files', 5)(req, res, (err) => {
      if (!err) return next();
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Her dosya en fazla 10 MB olabilir.' });
      }
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ error: 'Bir seferde en fazla 5 dosya yükleyebilirsiniz.' });
      }
      return res.status(400).json({ error: err.message || 'Dosya yüklenemedi.' });
    });
  },
  async (req, res) => {
    const uploadedPaths = (req.files || []).map(file => file.path);
    try {
      const taskId = parseInt(req.params.id);
      const projectId = await getTaskProjectId(taskId);
      if (!projectId) {
        uploadedPaths.forEach(p => fs.existsSync(p) && fs.unlinkSync(p));
        return res.status(404).json({ error: 'Görev bulunamadı.' });
      }

      const membership = await requireProjectAccess(req, res, projectId);
      if (!membership) {
        uploadedPaths.forEach(p => fs.existsSync(p) && fs.unlinkSync(p));
        return;
      }

      if (!req.files?.length) {
        return res.status(400).json({ error: 'Lütfen en az bir dosya seçin.' });
      }

      const existingCount = await prisma.taskAttachment.count({ where: { taskId } });
      if (existingCount + req.files.length > 10) {
        uploadedPaths.forEach(p => fs.existsSync(p) && fs.unlinkSync(p));
        return res.status(400).json({ error: 'Bir görevde en fazla 10 ek dosya bulunabilir.' });
      }

      const created = await prisma.$transaction(
        req.files.map(file => prisma.taskAttachment.create({
          data: {
            originalName: file.originalname,
            storedName: file.filename,
            mimeType: file.mimetype,
            size: file.size,
            filePath: file.path,
            taskId
          },
          select: { id: true, originalName: true, mimeType: true, size: true, createdAt: true }
        }))
      );

      await prisma.activityLog.create({
        data: { action: `${created.length} dosya ekledi`, taskId, userId: req.userId }
      });

      res.status(201).json(created);
    } catch (error) {
      uploadedPaths.forEach(p => {
        try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch (_) {}
      });
      console.error('Dosya yükleme:', error);
      res.status(500).json({ error: 'Dosya yüklenemedi.' });
    }
  }
);

// GÖREV DOSYASI İNDİR / AÇ
app.get(
  '/api/attachments/:id/download',
  authenticateToken,
  async (req, res) => {
    try {
      const attachmentId = parseInt(req.params.id);
      const attachment = await prisma.taskAttachment.findUnique({
        where: { id: attachmentId },
        include: { task: { select: { projectId: true } } }
      });

      if (!attachment) return res.status(404).json({ error: 'Dosya bulunamadı.' });
      const membership = await requireProjectAccess(req, res, attachment.task.projectId);
      if (!membership) return;
      if (!fs.existsSync(attachment.filePath)) {
        return res.status(404).json({ error: 'Dosya sunucuda bulunamadı.' });
      }

      res.setHeader('Content-Type', attachment.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(attachment.originalName)}`);
      res.sendFile(path.resolve(attachment.filePath));
    } catch (error) {
      console.error('Dosya açma:', error);
      res.status(500).json({ error: 'Dosya açılamadı.' });
    }
  }
);

// GÖREV DOSYASI SİL
app.delete(
  '/api/attachments/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const attachmentId = parseInt(req.params.id);
      const attachment = await prisma.taskAttachment.findUnique({
        where: { id: attachmentId },
        include: { task: { select: { id: true, projectId: true } } }
      });

      if (!attachment) return res.status(404).json({ error: 'Dosya bulunamadı.' });
      const membership = await requireProjectAccess(req, res, attachment.task.projectId);
      if (!membership) return;

      await prisma.taskAttachment.delete({ where: { id: attachmentId } });
      try { if (fs.existsSync(attachment.filePath)) fs.unlinkSync(attachment.filePath); } catch (_) {}

      await prisma.activityLog.create({
        data: { action: `"${attachment.originalName}" dosyasını sildi`, taskId: attachment.task.id, userId: req.userId }
      });

      res.json({ message: 'Dosya silindi.' });
    } catch (error) {
      console.error('Dosya silme:', error);
      res.status(500).json({ error: 'Dosya silinemedi.' });
    }
  }
);

// GÖREV SİL
app.delete(
  '/api/tasks/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const taskId =
        parseInt(
          req.params.id
        );

      const projectId =
        await getTaskProjectId(
          taskId
        );

      if (!projectId) {
        return res.status(404).json({
          error:
            'Görev bulunamadı.'
        });
      }

      const membership =
        await requireProjectAccess(
          req,
          res,
          projectId
        );

      if (!membership) {
        return;
      }

      const taskAttachments = await prisma.taskAttachment.findMany({
        where: { taskId },
        select: { filePath: true }
      });

      await prisma.task.delete({
        where: {
          id:
            taskId
        }
      });

      taskAttachments.forEach(({ filePath }) => {
        try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (_) {}
      });

      res.json({
        message:
          'Görev silindi.'
      });

    } catch (error) {
      console.error(
        'Görev silme:',
        error
      );

      res.status(500).json({
        error:
          'Görev silinemedi.'
      });
    }
  }
);

// ==========================================
// 📌 5. CHECKLIST
// ==========================================

app.post(
  '/api/tasks/:taskId/items',
  authenticateToken,
  async (req, res) => {
    try {
      const taskId =
        parseInt(
          req.params.taskId
        );

      const projectId =
        await getTaskProjectId(
          taskId
        );

      if (!projectId) {
        return res.status(404).json({
          error:
            'Görev bulunamadı.'
        });
      }

      const membership =
        await requireProjectAccess(
          req,
          res,
          projectId
        );

      if (!membership) {
        return;
      }

      if (
        !req.body.title?.trim()
      ) {
        return res.status(400).json({
          error:
            'Checklist başlığı gereklidir.'
        });
      }

      const newItem =
        await prisma.checklistItem.create({
          data: {
            title:
              req.body.title.trim(),

            taskId
          }
        });

      res.status(201).json(
        newItem
      );

    } catch (error) {
      res.status(500).json({
        error:
          'Checklist eklenemedi.'
      });
    }
  }
);

app.put(
  '/api/items/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const itemId =
        parseInt(
          req.params.id
        );

      const projectId =
        await getChecklistProjectId(
          itemId
        );

      if (!projectId) {
        return res.status(404).json({
          error:
            'Checklist maddesi bulunamadı.'
        });
      }

      const membership =
        await requireProjectAccess(
          req,
          res,
          projectId
        );

      if (!membership) {
        return;
      }

      const updated =
        await prisma.checklistItem.update({
          where: {
            id:
              itemId
          },

          data: {
            isCompleted:
              Boolean(
                req.body.isCompleted
              )
          }
        });

      res.json(updated);

    } catch (error) {
      res.status(500).json({
        error:
          'Checklist güncellenemedi.'
      });
    }
  }
);

app.delete(
  '/api/items/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const itemId =
        parseInt(
          req.params.id
        );

      const projectId =
        await getChecklistProjectId(
          itemId
        );

      if (!projectId) {
        return res.status(404).json({
          error:
            'Checklist maddesi bulunamadı.'
        });
      }

      const membership =
        await requireProjectAccess(
          req,
          res,
          projectId
        );

      if (!membership) {
        return;
      }

      await prisma.checklistItem.delete({
        where: {
          id:
            itemId
        }
      });

      res.json({
        message:
          'Silindi.'
      });

    } catch (error) {
      res.status(500).json({
        error:
          'Checklist silinemedi.'
      });
    }
  }
);

// ==========================================
// 🏷️ ETİKETLER
// ==========================================

app.post(
  '/api/tasks/:taskId/labels',
  authenticateToken,
  async (req, res) => {
    try {
      const taskId =
        parseInt(
          req.params.taskId
        );

      const projectId =
        await getTaskProjectId(
          taskId
        );

      if (!projectId) {
        return res.status(404).json({
          error:
            'Görev bulunamadı.'
        });
      }

      const membership =
        await requireProjectAccess(
          req,
          res,
          projectId
        );

      if (!membership) {
        return;
      }

      if (
        !req.body.text?.trim()
      ) {
        return res.status(400).json({
          error:
            'Etiket adı gereklidir.'
        });
      }

      const newLabel =
        await prisma.label.create({
          data: {
            text:
              req.body.text.trim(),

            color:
              req.body.color ||
              '#3b82f6',

            taskId
          }
        });

      res.status(201).json(
        newLabel
      );

    } catch (error) {
      res.status(500).json({
        error:
          'Etiket eklenemedi.'
      });
    }
  }
);

app.delete(
  '/api/labels/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const labelId =
        parseInt(
          req.params.id
        );

      const projectId =
        await getLabelProjectId(
          labelId
        );

      if (!projectId) {
        return res.status(404).json({
          error:
            'Etiket bulunamadı.'
        });
      }

      const membership =
        await requireProjectAccess(
          req,
          res,
          projectId
        );

      if (!membership) {
        return;
      }

      await prisma.label.delete({
        where: {
          id:
            labelId
        }
      });

      res.json({
        message:
          'Silindi.'
      });

    } catch (error) {
      res.status(500).json({
        error:
          'Etiket silinemedi.'
      });
    }
  }
);

// ==========================================
// 💬 YORUMLAR
// ==========================================

app.post(
  '/api/tasks/:taskId/comments',
  authenticateToken,
  async (req, res) => {
    try {
      const taskId =
        parseInt(
          req.params.taskId
        );

      const projectId =
        await getTaskProjectId(
          taskId
        );

      if (!projectId) {
        return res.status(404).json({
          error:
            'Görev bulunamadı.'
        });
      }

      const membership =
        await requireProjectAccess(
          req,
          res,
          projectId
        );

      if (!membership) {
        return;
      }

      if (
        !req.body.text?.trim()
      ) {
        return res.status(400).json({
          error:
            'Yorum boş olamaz.'
        });
      }

      const newComment =
        await prisma.comment.create({
          data: {
            text:
              req.body.text.trim(),

            taskId,

            userId:
              req.userId
          },

          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        });

      res.status(201).json(
        newComment
      );

    } catch (error) {
      console.error(
        'Yorum oluşturma:',
        error
      );

      res.status(500).json({
        error:
          'Yorum eklenemedi.'
      });
    }
  }
);

// YORUM SİL
app.delete(
  '/api/comments/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const commentId =
        parseInt(
          req.params.id
        );

      const comment =
        await prisma.comment.findUnique({
          where: {
            id:
              commentId
          },

          include: {
            task: {
              select: {
                projectId: true
              }
            }
          }
        });

      if (!comment) {
        return res.status(404).json({
          error:
            'Yorum bulunamadı.'
        });
      }

      const membership =
        await requireProjectAccess(
          req,
          res,
          comment.task.projectId
        );

      if (!membership) {
        return;
      }

      const isOwner =
        comment.userId ===
        req.userId;

      const isManager =
        membership.role ===
        'MANAGER';

      if (
        !isOwner &&
        !isManager
      ) {
        return res.status(403).json({
          error:
            'Bu yorumu silme yetkiniz yok.'
        });
      }

      await prisma.comment.delete({
        where: {
          id:
            commentId
        }
      });

      res.json({
        message:
          'Silindi.'
      });

    } catch (error) {
      console.error(
        'Yorum silme:',
        error
      );

      res.status(500).json({
        error:
          'Yorum silinemedi.'
      });
    }
  }
);

// ==========================================
// 💬 DİREKT MESAJLAR
// ==========================================

app.get(
  '/api/direct-messages/:userId',
  authenticateToken,
  async (req, res) => {
    try {
      const targetUserId =
        parseInt(
          req.params.userId
        );

      if (
        isNaN(targetUserId)
      ) {
        return res.status(400).json({
          error:
            'Geçersiz kullanıcı ID.'
        });
      }

      const messages =
        await prisma.directMessage.findMany({
          where: {
            OR: [
              {
                senderId:
                  req.userId,

                receiverId:
                  targetUserId
              },
              {
                senderId:
                  targetUserId,

                receiverId:
                  req.userId
              }
            ]
          },

          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },

            receiver: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },

          orderBy: {
            createdAt:
              'asc'
          }
        });

      res.json(messages);

    } catch (error) {
      console.error(
        'Mesajlar:',
        error
      );

      res.status(500).json({
        error:
          'Mesajlar alınamadı.'
      });
    }
  }
);

app.post(
  '/api/direct-messages',
  authenticateToken,
  async (req, res) => {
    try {
      const {
        receiverId,
        text
      } = req.body;

      const parsedReceiverId =
        parseInt(
          receiverId
        );

      if (
        isNaN(
          parsedReceiverId
        )
      ) {
        return res.status(400).json({
          error:
            'Geçersiz alıcı.'
        });
      }

      if (!text?.trim()) {
        return res.status(400).json({
          error:
            'Mesaj boş olamaz.'
        });
      }

      if (
        parsedReceiverId ===
        req.userId
      ) {
        return res.status(400).json({
          error:
            'Kendinize mesaj gönderemezsiniz.'
        });
      }

      const receiver =
        await prisma.user.findUnique({
          where: {
            id:
              parsedReceiverId
          },

          select: {
            id: true
          }
        });

      if (!receiver) {
        return res.status(404).json({
          error:
            'Kullanıcı bulunamadı.'
        });
      }

      const newMessage =
        await prisma.directMessage.create({
          data: {
            text:
              text.trim(),

            senderId:
              req.userId,

            receiverId:
              parsedReceiverId
          },

          include: {
            sender: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },

            receiver: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        });

      res.status(201).json(
        newMessage
      );

    } catch (error) {
      console.error(
        'Mesaj gönderme:',
        error
      );

      res.status(500).json({
        error:
          'Mesaj gönderilemedi.'
      });
    }
  }
);

// Geriye dönük uyumluluk: Web/Mobil eski sürümleri alıcı ID'sini URL'de gönderebilir.
// Yeni sürüm POST /api/direct-messages kullanmaya devam eder; bu route mevcut istemcileri bozmaz.
app.post(
  '/api/direct-messages/:userId',
  authenticateToken,
  async (req, res) => {
    try {
      const parsedReceiverId = parseInt(req.params.userId);
      const text = req.body?.text;

      if (isNaN(parsedReceiverId)) {
        return res.status(400).json({ error: 'Geçersiz alıcı.' });
      }

      if (!text?.trim()) {
        return res.status(400).json({ error: 'Mesaj boş olamaz.' });
      }

      if (parsedReceiverId === req.userId) {
        return res.status(400).json({ error: 'Kendinize mesaj gönderemezsiniz.' });
      }

      const receiver = await prisma.user.findUnique({
        where: { id: parsedReceiverId },
        select: { id: true }
      });

      if (!receiver) {
        return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
      }

      const newMessage = await prisma.directMessage.create({
        data: {
          text: text.trim(),
          senderId: req.userId,
          receiverId: parsedReceiverId
        },
        include: {
          sender: { select: { id: true, name: true, email: true } },
          receiver: { select: { id: true, name: true, email: true } }
        }
      });

      res.status(201).json(newMessage);
    } catch (error) {
      console.error('Mesaj gönderme (uyumluluk route):', error);
      res.status(500).json({ error: 'Mesaj gönderilemedi.' });
    }
  }
);

// ==========================================
// ❤️ HEALTH CHECK
// ==========================================

app.get(
  '/api/health',
  (req, res) => {
    res.json({
      status: 'ok',
      application:
        'Panovio API'
    });
  }
);

// ==========================================
// 🚀 SERVER
// ==========================================

app.listen(
  PORT,
  () => {
    console.log(
      `🚀 Panovio Backend http://localhost:${PORT} adresinde çalışıyor.`
    );
  }
);