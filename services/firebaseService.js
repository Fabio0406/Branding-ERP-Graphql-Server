// services/firebaseService.js
const admin = require('firebase-admin');

// Inicializar Firebase Admin SDK usando variables de entorno
try {
  // Configurar credenciales desde variables de entorno
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
    token_uri: process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL || "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
  };

  // Verificar que tenemos las credenciales mínimas
  if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
    throw new Error('Faltan credenciales de Firebase en las variables de entorno');
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
  
  console.log(`✅ Firebase Admin SDK inicializado para proyecto: ${process.env.FIREBASE_PROJECT_ID}`);
} catch (error) {
  console.error('❌ Error inicializando Firebase Admin SDK:', error.message);
  console.log('🔧 Asegúrate de tener todas las variables de entorno de Firebase configuradas');
}

class FirebaseService {
  
  /**
   * Verificar si Firebase está inicializado
   */
  static isInitialized() {
    try {
      admin.app();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Enviar notificación push a un token específico
   */
  static async sendToToken(token, notification, data = {}) {
    if (!this.isInitialized()) {
      console.error('❌ Firebase no está inicializado');
      return { success: false, error: 'Firebase no inicializado' };
    }

    try {
      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: {
          ...data,
          timestamp: Date.now().toString(),
        },
        token: token,
        android: {
          notification: {
            channelId: this._getChannelId(data.type),
            priority: this._getAndroidPriority(data.priority),
            color: this._getNotificationColor(data.type),
            icon: 'ic_launcher',
          },
          ttl: 24 * 60 * 60 * 1000, // 24 horas
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              alert: {
                title: notification.title,
                body: notification.body,
              },
            },
          },
          headers: {
            'apns-expiration': String(Math.floor(Date.now() / 1000) + 24 * 60 * 60), // 24 horas
            'apns-priority': data.priority === 'URGENT' ? '10' : '5',
          },
        },
      };

      const response = await admin.messaging().send(message);
      console.log(`✅ Notificación enviada exitosamente a token ${token.substring(0, 20)}...`);
      return { success: true, messageId: response };
    } catch (error) {
      console.error('❌ Error enviando notificación:', error.message);
      
      // Manejar errores específicos de FCM
      if (error.code === 'messaging/registration-token-not-registered') {
        return { success: false, error: 'Token no registrado', invalidToken: true };
      } else if (error.code === 'messaging/invalid-registration-token') {
        return { success: false, error: 'Token inválido', invalidToken: true };
      }
      
      return { success: false, error: error.message };
    }
  }

  /**
   * Enviar notificación a múltiples tokens
   */
  static async sendToMultipleTokens(tokens, notification, data = {}) {
    if (!this.isInitialized()) {
      console.error('❌ Firebase no está inicializado');
      return { success: false, error: 'Firebase no inicializado' };
    }

    try {
      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: {
          ...data,
          timestamp: Date.now().toString(),
        },
        tokens: tokens,
        android: {
          notification: {
            channelId: this._getChannelId(data.type),
            priority: this._getAndroidPriority(data.priority),
            color: this._getNotificationColor(data.type),
            icon: 'ic_launcher',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().sendMulticast(message);
      console.log(`✅ Notificaciones enviadas: ${response.successCount}/${tokens.length}`);
      
      // Log de tokens inválidos
      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            console.error(`❌ Error en token ${tokens[idx].substring(0, 20)}...:`, resp.error?.code);
          }
        });
      }

      return {
        success: response.successCount > 0,
        successCount: response.successCount,
        failureCount: response.failureCount,
        responses: response.responses,
      };
    } catch (error) {
      console.error('❌ Error enviando notificaciones múltiples:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Enviar notificación a un topic
   */
  static async sendToTopic(topic, notification, data = {}) {
    if (!this.isInitialized()) {
      console.error('❌ Firebase no está inicializado');
      return { success: false, error: 'Firebase no inicializado' };
    }

    try {
      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: {
          ...data,
          timestamp: Date.now().toString(),
        },
        topic: topic,
        android: {
          notification: {
            channelId: this._getChannelId(data.type),
            priority: this._getAndroidPriority(data.priority),
            color: this._getNotificationColor(data.type),
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      console.log(`✅ Notificación enviada al topic ${topic}:`, response);
      return { success: true, messageId: response };
    } catch (error) {
      console.error(`❌ Error enviando notificación al topic ${topic}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Validar si un token FCM es válido
   */
  static async validateToken(token) {
    if (!this.isInitialized()) {
      return false;
    }

    try {
      // Intentar enviar un mensaje de prueba (dry run)
      const message = {
        data: { test: 'validation' },
        token: token,
      };

      await admin.messaging().send(message, true); // dry run = true
      return true;
    } catch (error) {
      console.log(`❌ Token FCM inválido: ${error.code}`);
      return false;
    }
  }

  /**
   * Suscribir tokens a un topic
   */
  static async subscribeToTopic(tokens, topic) {
    if (!this.isInitialized()) {
      console.error('❌ Firebase no está inicializado');
      return { successCount: 0, failureCount: tokens.length };
    }

    try {
      const tokensArray = Array.isArray(tokens) ? tokens : [tokens];
      const response = await admin.messaging().subscribeToTopic(tokensArray, topic);
      console.log(`✅ ${response.successCount}/${tokensArray.length} tokens suscritos al topic ${topic}`);
      return response;
    } catch (error) {
      console.error(`❌ Error suscribiendo al topic ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Desuscribir tokens de un topic
   */
  static async unsubscribeFromTopic(tokens, topic) {
    if (!this.isInitialized()) {
      console.error('❌ Firebase no está inicializado');
      return { successCount: 0, failureCount: tokens.length };
    }

    try {
      const tokensArray = Array.isArray(tokens) ? tokens : [tokens];
      const response = await admin.messaging().unsubscribeFromTopic(tokensArray, topic);
      console.log(`✅ ${response.successCount}/${tokensArray.length} tokens desuscritos del topic ${topic}`);
      return response;
    } catch (error) {
      console.error(`❌ Error desuscribiendo del topic ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Obtener canal de notificación según el tipo
   */
  static _getChannelId(type) {
    switch (type) {
      case 'urgente':
      case 'urgent':
        return 'urgentes_channel';
      case 'proyecto':
      case 'project':
        return 'proyectos_channel';
      case 'recordatorio':
      case 'reminder':
      default:
        return 'recordatorios_channel';
    }
  }

  /**
   * Obtener prioridad Android según el tipo
   */
  static _getAndroidPriority(priority) {
    switch (priority) {
      case 'URGENT':
        return 'max';
      case 'HIGH':
        return 'high';
      case 'LOW':
        return 'low';
      case 'NORMAL':
      default:
        return 'default';
    }
  }

  /**
   * Obtener color de notificación según el tipo (colores de tu paleta)
   */
  static _getNotificationColor(type) {
    switch (type) {
      case 'urgente':
      case 'urgent':
        return '#F44336'; // Rojo para urgentes
      case 'proyecto':
      case 'project':
        return '#2196F3'; // Azul para proyectos
      case 'recordatorio':
      case 'reminder':
      default:
        return '#3E5C76'; // Azul grisáceo de tu paleta
    }
  }
}

module.exports = FirebaseService;