# 🚀 دليل النشر النهائي - نظام إدارة العيادات

## 📋 المتطلبات المسبقة

- ✅ حساب GitHub
- ✅ حساب Render (Frontend + Backend)
- ✅ حساب Neon (قاعدة بيانات PostgreSQL)
- ✅ Node.js 18+ (للتطوير المحلي)

---

## 🔹 المرحلة 1: إعداد قاعدة البيانات (Neon)

1.  سجل الدخول إلى [Neon Dashboard](https://neon.tech)
2.  أنشئ مشروع جديد: `clinic-db`
3.  انسخ `DATABASE_URL` من **Connection Details**
4.  احفظه في مكان آمن

---

## 🔹 المرحلة 2: إعداد الباكند (Render)

1.  سجل الدخول إلى [Render Dashboard](https://dashboard.render.com)
2.  اضغط **New +** ← **Web Service**
3.  اختر مستودع GitHub: `clinic-management-system`
4.  اضبط الإعدادات:
    - **Name:** `clinic-backend`
    - **Root Directory:** `backend`
    - **Build Command:** `npm install && npx prisma generate && npx prisma db push --accept-data-loss`
    - **Start Command:** `node server.js`
    - **Environment Variables:**
      ```
      DATABASE_URL=<من Neon>
      JWT_SECRET=your-secret-key-change-in-production
      NODE_ENV=production
      PORT=5000
      ```
5.  اضغط **Create Web Service**
6.  انتظر حتى يصبح **أخضر 🟢**

---

## 🔹 المرحلة 3: إعداد الفرونت إند (Render)

1.  في Render Dashboard، اضغط **New +** ← **Web Service**
2.  اختر نفس المستودع: `clinic-management-system`
3.  اضبط الإعدادات:
    - **Name:** `clinic-frontend`
    - **Root Directory:** `frontend`
    - **Build Command:** `npm install && npm run build`
    - **Start Command:** `npx serve -s dist -l $PORT`
    - **Environment Variables:**
      ```
      VITE_API_URL=https://clinic-backend-1g7c.onrender.com/api
      ```
4.  اضغط **Create Web Service**
5.  انتظر حتى يصبح **أخضر 🟢**

---

## 🔹 المرحلة 4: إنشاء البيانات التجريبية

### الطريقة أ: محلياً (موصى بها)
```bash
cd backend
npm install
node scripts/createUsers.js