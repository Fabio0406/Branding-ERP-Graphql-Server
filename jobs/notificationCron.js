// jobs/notificationCron.js
const cron = require('node-cron');

class NotificationCron {
  
  static init() {
    console.log('🕐 Inicializando cron jobs para notificaciones...');
    
    // Ejecutar cada minuto para procesar notificaciones programadas
    cron.schedule('* * * * *', async () => {
      try {
        await this.processScheduledNotifications();
      } catch (error) {
        console.error('❌ Error en cron de notificaciones:', error);
      }
    }, {
      timezone: "America/La_Paz" // Zona horaria de Bolivia
    });
    
    // Ejecutar cada hora para limpiar notificaciones viejas
    cron.schedule('0 * * * *', async () => {
      try {
        await this.cleanupOldNotifications();
      } catch (error) {
        console.error('❌ Error en limpieza de notificaciones:', error);
      }
    });
    
    console.log('✅ Cron jobs de notificaciones inicializados');
  }
  
  /**
   * Procesar notificaciones programadas
   */
  static async processScheduledNotifications() {
    try {
      const { NotificacionProgramada, Usuario, Op } = require('../models/index');
      const FirebaseService = require('../services/firebaseService');
      
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      
      const notificacionesPendientes = await NotificacionProgramada.findAll({
        where: {
          enviada: false,
          fechaProgramada: {
            [Op.lte]: now,
            [Op.gte]: fiveMinutesAgo, // No procesar notificaciones muy viejas
          },
        },
        include: [
          {
            model: Usuario,
            as: 'usuario',
            required: true,
          },
        ],
      });
      
      if (notificacionesPendientes.length > 0) {
        console.log(`📤 Procesando ${notificacionesPendientes.length} notificaciones...`);
      }
      
      for (const notificacion of notificacionesPendientes) {
        try {
          if (notificacion.usuario.fcmToken && notificacion.usuario.notificacionesHabilitadas) {
            const result = await FirebaseService.sendToToken(
              notificacion.usuario.fcmToken,
              {
                title: notificacion.titulo,
                body: notificacion.mensaje,
              },
              notificacion.data || {}
            );
            
            if (result.success) {
              await notificacion.update({
                enviada: true,
                fechaEnvio: new Date(),
              });
              console.log(`✅ Notificación enviada: ${notificacion.id}`);
            } else {
              console.error(`❌ Error enviando notificación ${notificacion.id}:`, result.error);
            }
          } else {
            // Marcar como enviada si el usuario no tiene token o notificaciones deshabilitadas
            await notificacion.update({ enviada: true });
            console.log(`⚠️ Notificación omitida (sin token o deshabilitada): ${notificacion.id}`);
          }
        } catch (error) {
          console.error(`❌ Error procesando notificación ${notificacion.id}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Error en procesamiento de notificaciones:', error);
    }
  }
  
  /**
   * Limpiar notificaciones viejas (más de 7 días)
   */
  static async cleanupOldNotifications() {
    try {
      const { NotificacionProgramada, Op } = require('../models/index');
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const deletedCount = await NotificacionProgramada.destroy({
        where: {
          fechaProgramada: {
            [Op.lt]: sevenDaysAgo,
          },
          enviada: true,
        },
      });
      
      if (deletedCount > 0) {
        console.log(`🗑️ Limpiadas ${deletedCount} notificaciones viejas`);
      }
    } catch (error) {
      console.error('❌ Error limpiando notificaciones:', error);
    }
  }
  
  /**
   * Enviar notificación de prueba (solo para desarrollo)
   */
  static async sendTestNotification(usuarioId) {
    try {
      const { Usuario } = require('../models/index');
      const FirebaseService = require('../services/firebaseService');
      
      const usuario = await Usuario.findByPk(usuarioId);
      if (!usuario || !usuario.fcmToken) {
        console.log('❌ Usuario no encontrado o sin token FCM');
        return;
      }
      
      const result = await FirebaseService.sendToToken(
        usuario.fcmToken,
        {
          title: '🧪 Notificación de Prueba',
          body: 'Esta es una notificación de prueba desde el servidor',
        },
        {
          type: 'general',
          priority: 'NORMAL',
          test: 'true',
        }
      );
      
      console.log('✅ Notificación de prueba enviada:', result);
    } catch (error) {
      console.error('❌ Error enviando notificación de prueba:', error);
    }
  }
}

module.exports = NotificationCron;