# Branding ERP Server — API GraphQL de recordatorios y notificaciones

Servidor **Apollo GraphQL** que alimenta la app móvil del ERP de branding. Expone proyectos, recordatorios, actividades, KPIs y notificaciones de cada usuario, y envía **notificaciones push** con Firebase Cloud Messaging mediante tareas programadas (cron).

Forma parte de un sistema de tres repositorios:

| Repositorio | Rol |
|---|---|
| [Branding-ERP-WEB](https://github.com/Fabio0406/Branding-ERP-WEB) | ERP web (Spring Boot + Angular) |
| **Branding-ERP-Graphql-Server** (este) | Servidor GraphQL de recordatorios |
| [Branding-ERP-Mobile](https://github.com/Fabio0406/Branding-ERP-Mobile) | App móvil Flutter que consume este servidor |

> Proyecto académico — Ingeniería de Software II, UAGRM (2025).

## Funcionalidades

- **Queries**: proyectos, recordatorios pendientes, actividades del día, notificaciones, KPIs y preferencias de notificación del usuario.
- **Mutations**: crear recordatorios, marcarlos como vistos, cambiar el estado de un proyecto, registrar el token FCM, enviar notificaciones (a un usuario o por tópico) y programar o cancelar notificaciones.
- **Subscriptions** (WebSocket): nuevas notificaciones y cambios en proyectos en tiempo real.
- **Cron jobs** (`node-cron`): revisa cada minuto los recordatorios próximos y envía los avisos.
- Autenticación con JWT.

## Tecnologías

- Node.js + Express + Apollo Server 3
- GraphQL (`graphql-subscriptions`, `subscriptions-transport-ws`)
- PostgreSQL + Sequelize
- Firebase Admin SDK (FCM)
- node-cron, jsonwebtoken, bcryptjs, moment

## Estructura

```
server.js                    # Arranque de Express, Apollo y WebSocket
schema/typeDefs.js           # Esquema GraphQL
resolvers/index.js           # Resolvers
models/index.js              # Modelos Sequelize
services/
├── firebaseService.js       # Envío de push
├── notificationService.js   # Lógica de notificaciones
└── emailService.js
jobs/notificationCron.js     # Tareas programadas
scripts/
├── seed.js                  # Datos de prueba
└── testNotifications.js     # Prueba de notificaciones
```

## Requisitos

- Node.js 16 o superior
- PostgreSQL 12 o superior
- Un proyecto de Firebase (para las notificaciones push)

## Instalación

```bash
npm install
```

### Configuración

Copia el archivo de ejemplo y completa los valores:

```bash
cp .env.example .env
```

| Grupo | Variables |
|---|---|
| Base de datos | `DB_NAME`, `DB_USER`, `DB_PASS`, `DB_HOST`, `DB_PORT` |
| Servidor | `PORT`, `NODE_ENV`, `JWT_SECRET`, `CORS_ORIGINS`, `TZ` |
| Firebase | `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_CLIENT_ID`, `FIREBASE_CLIENT_CERT_URL` |
| Notificaciones | `NOTIFICATION_ENABLED`, `CRON_ENABLED`, `NOTIFICATION_ADVANCE_MINUTES` |

Los datos de Firebase salen del JSON de la cuenta de servicio (Firebase Console → Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada). Copia `private_key` en una sola línea, entre comillas y con los `\n` tal cual.

El archivo `.env` está en `.gitignore`. **No lo subas al repositorio.**

### Ejecutar

```bash
npm run seed      # crea las tablas y carga datos de prueba (borra lo que haya)
npm run dev
```

- GraphQL: `http://localhost:4000/graphql`
- Subscriptions: `ws://localhost:4000/graphql`

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor con nodemon |
| `npm start` | Servidor en producción |
| `npm run seed` | Cargar datos de prueba |
| `npm run test:notifications` | Probar el envío de notificaciones |
| `npm run lint` | Revisar el código con ESLint |
