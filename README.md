# 🏥 نظام إدارة العيادات الاحترافي
## Clinic Management System - Professional Edition

نظام متكامل لإدارة العيادات الطبية مبني وفق المعايير العالمية (HIPAA-compliant structure)

---

## 🚀 المميزات الاحترافية

| الميزة | الوصف |
|--------|-------|
| 🔐 **RBAC** | 4 أدوار: Admin, Doctor, Lab Tech, Receptionist |
| 📅 **مواعيد ذكية** | حجز موعد ← توليد فاتورة تلقائياً |
| 💰 **فواتير متكاملة** | ربط تلقائي مع المواعيد والفحوصات |
| 🧪 **مختبر متكامل** | طلب فحوصات ← نتائج ← تقارير |
| 📊 **تقارير** | إحصائيات مالية وطبية |
| 🔒 **أمان** | JWT + Session Management + Audit Logs |

---

## 🛠️ التقنيات

### Backend
- Node.js + Express.js
- Prisma ORM
- PostgreSQL (Neon)
- JWT Authentication
- bcryptjs

### Frontend
- React.js 18
- React Router DOM
- Tailwind CSS
- Lucide Icons
- Axios

---

## 🔗 الروابط الحية

| المكون | الرابط |
|--------|--------|
| Frontend | https://clinic-frontend-3lwi.onrender.com |
| Backend API | https://clinic-backend-1g7c.onrender.com |
| API Docs | `/api/health` |

---

## 🔐 بيانات الدخول التجريبية

| الدور | البريد | كلمة المرور |
|-------|--------|------------|
| Admin | admin@clinic.com | Admin@123 |
| Doctor | doctor@clinic.com | Doctor@123 |
| Lab Tech | lab@clinic.com | Lab@123 |
| Receptionist | reception@clinic.com | Reception@123 |

---

## 📁 هيكلية المشروع
Reception@123 |

---

clinic-management-system/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── patientRoutes.js
│   │   │   ├── doctorRoutes.js
│   │   │   ├── appointmentRoutes.js
│   │   │   ├── invoiceRoutes.js
│   │   │   └── labRoutes.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   └── app.js
│   ├── scripts/
│   │   └── createUsers.js
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
├── frontend/
│   └── src/
└── README.md
