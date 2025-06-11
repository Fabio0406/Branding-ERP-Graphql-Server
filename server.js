// server.js
const { ApolloServer } = require('apollo-server-express');
const { createServer } = require('http');
const { SubscriptionServer } = require('subscriptions-transport-ws');
const { execute, subscribe } = require('graphql');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

// Importar definiciones de esquema y resolvers
const typeDefs = require('./schema/typeDefs');
const { resolvers } = require('./resolvers/index'); // 🔔 Destructuring actualizado
const { sequelize } = require('./models/index');
const NotificationCron = require('./jobs/notificationCron'); // 🔔 NUEVO

// Configurar variables de entorno
require('dotenv').config();

async function startServer() {
  const app = express();
  
  // Configurar CORS más permisivo
  app.use(cors({
    origin: '*', // Permitir todos los orígenes para desarrollo
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Middleware adicional
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Función para extraer usuario del token
  const getUser = async (req) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        return decoded;
      } catch (error) {
        console.error('Token inválido:', error);
      }
    }
    return null;
  };

  // Crear esquema ejecutable
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  // Crear servidor Apollo con configuración mejorada
  const server = new ApolloServer({
    schema,
    context: async ({ req, connection }) => {
      if (connection) {
        // Para subscriptions WebSocket
        return connection.context;
      } else {
        // Para queries y mutations HTTP
        const user = await getUser(req);
        return {
          user,
          sequelize,
        };
      }
    },
    // Habilitar introspección y playground en desarrollo
    introspection: true,
    playground: true,
    // Configuración adicional para debugging
    debug: process.env.NODE_ENV === 'development',
    plugins: [
      {
        serverWillStart() {
          return {
            drainServer() {
              if (subscriptionServer) {
                subscriptionServer.close();
              }
            },
          };
        },
      },
    ],
  });

  await server.start();
  
  // Aplicar middleware de Apollo
  server.applyMiddleware({ 
    app, 
    path: '/graphql',
    cors: false // Usamos nuestro propio CORS
  });

  const httpServer = createServer(app);
  
  let subscriptionServer;

  // Configurar servidor de subscriptions
  subscriptionServer = SubscriptionServer.create(
    {
      schema,
      execute,
      subscribe,
      onConnect: (connectionParams, webSocket, context) => {
        console.log('Cliente conectado para subscriptions');
        return {
          // contexto para subscriptions
        };
      },
      onDisconnect: (webSocket, context) => {
        console.log('Cliente desconectado de subscriptions');
      },
    },
    {
      server: httpServer,
      path: server.graphqlPath,
    }
  );

  // 🔔 NUEVOS ENDPOINTS PARA NOTIFICACIONES
  
  // Webhook para Firebase (opcional)
  app.post('/webhook/firebase', express.json(), (req, res) => {
    try {
      console.log('🔔 Webhook Firebase recibido:', req.body);
      // Aquí puedes procesar eventos de Firebase si es necesario
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('❌ Error en webhook Firebase:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Endpoint para probar notificaciones (solo desarrollo)
  if (process.env.NODE_ENV === 'development') {
    app.post('/test/notification/:usuarioId', async (req, res) => {
      try {
        await NotificationCron.sendTestNotification(req.params.usuarioId);
        res.json({ success: true, message: 'Notificación de prueba enviada' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Endpoint para ver notificaciones programadas
    app.get('/admin/notifications', async (req, res) => {
      try {
        const { NotificacionProgramada } = require('./models/index');
        const notifications = await NotificacionProgramada.findAll({
          limit: 50,
          order: [['fechaProgramada', 'DESC']],
        });
        res.json(notifications);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  const PORT = process.env.PORT || 4000;

  // Ruta de salud para verificar que el servidor funciona
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      graphql: `http://localhost:${PORT}${server.graphqlPath}`,
      notifications: process.env.FIREBASE_PROJECT_ID ? 'enabled' : 'disabled',
    });
  });

  // Sincronizar base de datos
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente.');
    
    // Sincronizar modelos (solo en desarrollo)
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: true });
      console.log('✅ Modelos sincronizados con la base de datos.');
    }
    
    // 🔔 NUEVO: Inicializar cron jobs para notificaciones
    if (process.env.CRON_ENABLED !== 'false') {
      NotificationCron.init();
    }
    
  } catch (error) {
    console.error('❌ No se pudo conectar a la base de datos:', error);
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}${server.graphqlPath}`);
    console.log(`🚀 Subscriptions en ws://localhost:${PORT}${server.graphqlPath}`);
    console.log(`🏥 Health check en http://localhost:${PORT}/health`);
    console.log(`🎮 GraphQL Playground disponible en http://localhost:${PORT}${server.graphqlPath}`);
    console.log(`🔔 Notificaciones Firebase: ${process.env.FIREBASE_PROJECT_ID ? '✅ Habilitadas' : '❌ Deshabilitadas'}`);
  });
}

startServer().catch(error => {
  console.error('Error al iniciar el servidor:', error);
});