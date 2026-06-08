# DOCUMENTACION GENERAL — SISTEMA KLIENTE

## 1. Nombre del sistema

KLIENTE

Sistema SaaS de fidelización, ranking, promociones y sorteos para comercios.

Creado por: Mitnick Connect / Mitnick Soluciones.

---

## 2. Objetivo del sistema

KLIENTE permite que cada comercio tenga una pantalla pública donde sus clientes pueden ver:

- Ranking TOP 10.
- Promociones activas.
- Concurso del mes.
- Cuenta regresiva.
- Ganador automático del sorteo.
- Redes sociales / QR.

Además, cada comercio tiene un panel administrativo para:

- Registrar clientes.
- Registrar compras.
- Asignar puntaje.
- Gestionar promociones.
- Configurar datos del comercio.
- Ver ranking e historial.

Mitnick Connect tiene un Panel Maestro para:

- Crear comercios.
- Crear usuario administrador inicial.
- Registrar pagos.
- Renovar planes.
- Suspender comercios.
- Reactivar comercios.
- Desbloquear usuarios bloqueados por PIN.
- Controlar vencimientos de pago.

---

## 3. Arquitectura general

El sistema está compuesto por:

### Frontend

- React
- Vite
- Vercel
- Dominio: https://kliente.cl
- URL Vercel original: https://kliente-seven.vercel.app

### Backend

- Node.js
- Express
- MySQL
- PM2
- Nginx
- VPS Hostinger
- API: https://api.kliente.cl/api

### Base de datos

- MySQL
- Base de datos producción: kliente_db
- Usuario producción: kliente_user

### DNS / dominio

- Dominio: kliente.cl
- Registrador: NIC Chile
- DNS administrado por Cloudflare

---

## 4. URLs principales

### Producción

Frontend público:

https://kliente.cl

Panel Maestro:

https://kliente.cl/mitnick/login

Login comercio ejemplo demo:

https://kliente.cl/admin/login?slug=demo

Pantalla pública demo:

https://kliente.cl/?slug=demo

API health:

https://api.kliente.cl/api/health

---

## 5. URLs locales de desarrollo

Frontend local:

http://localhost:5173

Backend local:

http://localhost:4000

API local:

http://localhost:4000/api

Health local:

http://localhost:4000/api/health

Pantalla pública local:

http://localhost:5173/?slug=demo

Login comercio local:

http://localhost:5173/admin/login?slug=demo

Panel Maestro local:

http://localhost:5173/mitnick/login

Demo APK local navegador:

http://localhost:5173/demo-admin
http://localhost:5173/demo-public

---

## 6. Rutas del proyecto

Ruta principal en PC Windows:

C:\Users\MICHEL\Desktop\proyectos\kliente

Backend:

C:\Users\MICHEL\Desktop\proyectos\kliente\backend

Frontend:

C:\Users\MICHEL\Desktop\proyectos\kliente\frontend

APK Android:

C:\Users\MICHEL\Desktop\proyectos\kliente\frontend\android

---

## 7. Comandos desarrollo local

### Backend

cd C:\Users\MICHEL\Desktop\proyectos\kliente\backend
node src/server.js

### Frontend

cd C:\Users\MICHEL\Desktop\proyectos\kliente\frontend
npm run dev

### Build frontend

cd C:\Users\MICHEL\Desktop\proyectos\kliente\frontend
npm run build

---

## 8. Producción VPS

IP VPS:

2.25.179.15

Ruta backend producción:

/var/www/kliente/repo/backend

Ruta repo producción:

/var/www/kliente/repo

Ruta backups VPS:

/var/www/kliente/backups

PM2 app:

kliente-backend

Comandos útiles VPS:

cd /var/www/kliente/repo
git pull

cd /var/www/kliente/repo/backend
npm install
pm2 restart kliente-backend --update-env
pm2 save
pm2 status

Ver logs:

pm2 logs kliente-backend

Probar API:

curl https://api.kliente.cl/api/health

---

## 9. Cloudflare DNS

Registros principales:

A api 2.25.179.15 DNS only

A @ 76.76.21.21 DNS only

CNAME www cname.vercel-dns.com DNS only

Nameservers Cloudflare configurados en NIC Chile:

faye.ns.cloudflare.com
quincy.ns.cloudflare.com

---

## 10. Vercel

Proyecto:

kliente

Repositorio GitHub:

https://github.com/yop1985/kliente

Configuración Vercel:

Framework: Vite
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
Install Command: npm install

Variables Vercel:

VITE_API_BASE_URL=https://api.kliente.cl/api
VITE_STATIC_BASE_URL=https://api.kliente.cl
VITE_ROOT_DOMAIN=kliente.cl
VITE_DEFAULT_PUBLIC_SLUG=demo

---

## 11. APK demo local para vendedores

Nombre archivo:

KLIENTE-DEMO-LOCAL.apk

Función:

Demo local/offline para vendedores, sin conexión al VPS ni a la API real.

Características:

- Abre directo en configuración del comercio.
- Modo horizontal.
- Guarda datos en la tablet.
- Permite editar comercio demo.
- Permite editar concurso.
- Permite editar 5 promociones.
- Permite agregar clientes y puntos.
- Permite ejecutar sorteo.
- Permite abrir pantalla pública demo.
- No toca datos reales.

Rutas internas:

/demo-admin
/demo-public

Variable local usada para APK:

VITE_APK_DEMO=true

---

## 12. Seguridad pendiente recomendada

Después del respaldo se recomienda:

1. Cambiar contraseña root del VPS.
2. Cambiar credenciales maestras del Panel Maestro.
3. Guardar credenciales en documento privado fuera de GitHub.
4. Crear backups automáticos de MySQL.
5. Crear usuario SSH no-root.
6. Activar actualizaciones de seguridad.
7. Revisar que archivos .env no estén subidos a GitHub.

---

## 13. Estado actual validado

Validado:

- Backend VPS funcionando.
- API con SSL funcionando.
- Base de datos importada en VPS.
- Frontend Vercel conectado al backend.
- Dominio kliente.cl funcionando.
- www.kliente.cl funcionando.
- api.kliente.cl funcionando.
- Panel Maestro online funcionando.
- APK demo local funcionando en tablet.

---
