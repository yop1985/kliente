# GUIA DE RESTAURACION — SISTEMA KLIENTE

## 1. Restaurar proyecto en PC nueva

Clonar repositorio:

git clone https://github.com/yop1985/kliente.git

Entrar al proyecto:

cd kliente

Instalar backend:

cd backend
npm install

Instalar frontend:

cd ..\frontend
npm install

---

## 2. Configurar backend local

Crear archivo:

backend\.env

Ejemplo:

PORT=4000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=kliente_db

JWT_SECRET=cambiar_este_valor
JWT_EXPIRES_IN=8h

APP_NAME=KLIENTE
APP_ENV=development
NODE_ENV=development

ROOT_DOMAIN=kliente.cl
DEFAULT_PUBLIC_SLUG=demo
FRONTEND_URLS=http://localhost:5173,http://127.0.0.1:5173

MITNICK_MASTER_USERNAME=mitnick
MITNICK_MASTER_PASSWORD=CAMBIAR
MITNICK_MASTER_PIN=CAMBIAR

KLIENTE_RESET_PASSWORD=123456

---

## 3. Configurar frontend local

Crear archivo:

frontend\.env.local

Ejemplo:

VITE_API_BASE_URL=http://localhost:4000/api
VITE_STATIC_BASE_URL=http://localhost:4000
VITE_ROOT_DOMAIN=localhost
VITE_DEFAULT_PUBLIC_SLUG=demo

Para APK demo local:

VITE_APK_DEMO=true

---

## 4. Restaurar base de datos local

Crear base:

mysql -u root -e "CREATE DATABASE IF NOT EXISTS kliente_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

Importar backup:

mysql -u root kliente_db < kliente_backup.sql

---

## 5. Ejecutar local

Backend:

cd backend
node src/server.js

Frontend:

cd frontend
npm run dev

---

## 6. Restaurar en VPS

Entrar al VPS:

ssh root@2.25.179.15

Ir al repo:

cd /var/www/kliente/repo

Actualizar código:

git pull

Instalar backend:

cd backend
npm install

Reiniciar PM2:

pm2 restart kliente-backend --update-env
pm2 save

Probar:

curl https://api.kliente.cl/api/health

---

## 7. Restaurar base de datos en VPS

Subir backup desde Windows:

scp C:\Users\MICHEL\Desktop\kliente_backup.sql root@2.25.179.15:/var/www/kliente/backups/kliente_backup.sql

Importar en VPS:

mysql -u kliente_user -p kliente_db < /var/www/kliente/backups/kliente_backup.sql

Revisar tablas:

mysql -u kliente_user -p kliente_db -e "SHOW TABLES;"

---

## 8. Generar APK demo nuevamente

En Windows:

cd C:\Users\MICHEL\Desktop\proyectos\kliente\frontend

npm run build

npx cap sync android

cd C:\Users\MICHEL\Desktop\proyectos\kliente\frontend\android

$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
$env:Path="$env:JAVA_HOME\bin;$env:Path"

.\gradlew assembleDebug --no-daemon

Copiar APK:

Copy-Item "C:\Users\MICHEL\Desktop\proyectos\kliente\frontend\android\app\build\outputs\apk\debug\app-debug.apk" "C:\Users\MICHEL\Desktop\KLIENTE-DEMO-LOCAL.apk" -Force

---
