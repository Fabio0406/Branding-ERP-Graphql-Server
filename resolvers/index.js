// resolvers/index.js
const { PubSub } = require('graphql-subscriptions');
const { GraphQLDateTime } = require('graphql-iso-date');
const { GraphQLJSON } = require('graphql-type-json');

// Importar modelos y servicios
const models = require('../models/index');
const FirebaseService = require('../services/firebaseService');
const {
  Usuario,
  Cliente,
  Marca,
  Proyecto,
  EtapaProyecto,
  ActivoMarca,
  KPI,
  Aprobacion,
  Recordatorio,
  Notificacion,
  Actividad,
  NotificacionProgramada,
  Op
} = models;

const pubsub = new PubSub();

const resolvers = {
  DateTime: GraphQLDateTime,
  JSON: GraphQLJSON,

  Query: {
    getProyectosByUsuario: async (_, { usuarioId }) => {
      try {
        console.log(`🔍 Buscando proyectos para usuario: ${usuarioId}`);
        
        const proyectos = await Proyecto.findAll({
          include: [
            {
              model: Cliente,
              as: 'cliente',
              where: { usuarioId },
              required: true,
            },
            {
              model: Marca,
              as: 'marca',
              required: false,
            },
            {
              model: EtapaProyecto,
              as: 'etapas',
              required: false,
            },
            {
              model: KPI,
              as: 'kpis',
              required: false,
            },
          ],
          order: [['fechaInicio', 'DESC']],
        });
        
        console.log(`✅ Encontrados ${proyectos.length} proyectos`);
        return proyectos;
      } catch (error) {
        console.error('❌ Error al obtener proyectos:', error);
        throw new Error('Error al obtener proyectos del usuario');
      }
    },

    getRecordatoriosPendientes: async (_, { usuarioId }) => {
      try {
        console.log(`🔍 Buscando recordatorios para usuario: ${usuarioId}`);
        
        const recordatorios = await Recordatorio.findAll({
          where: {
            usuarioId,
            fechaRecordatorio: {
              [Op.gte]: new Date(),
            },
          },
          include: [
            {
              model: Proyecto,
              as: 'proyecto',
              required: false,
              include: [
                {
                  model: Cliente,
                  as: 'cliente',
                  required: false,
                },
              ],
            },
          ],
          order: [['fechaRecordatorio', 'ASC']],
        });
        
        console.log(`✅ Encontrados ${recordatorios.length} recordatorios`);
        return recordatorios;
      } catch (error) {
        console.error('❌ Error al obtener recordatorios:', error);
        console.error('Stack completo:', error.stack);
        throw new Error('Error al obtener recordatorios pendientes');
      }
    },

    getActividadesHoy: async (_, { usuarioId }) => {
      try {
        console.log(`🔍 Buscando actividades de hoy para usuario: ${usuarioId}`);
        
        const hoy = new Date();
        const inicioDelDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        const finDelDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);

        const actividades = await Actividad.findAll({
          where: {
            usuarioId,
            fechaInicio: {
              [Op.gte]: inicioDelDia,
              [Op.lt]: finDelDia,
            },
          },
          include: [
            {
              model: Proyecto,
              as: 'proyecto',
              required: false,
              include: [
                {
                  model: Cliente,
                  as: 'cliente',
                  required: false,
                },
              ],
            },
          ],
          order: [['fechaInicio', 'ASC']],
        });
        
        console.log(`✅ Encontradas ${actividades.length} actividades`);
        return actividades;
      } catch (error) {
        console.error('❌ Error al obtener actividades:', error);
        throw new Error('Error al obtener actividades del día');
      }
    },

    getNotificaciones: async (_, { usuarioId, limit }) => {
      try {
        console.log(`🔍 Buscando notificaciones para usuario: ${usuarioId}`);
        
        const notificaciones = await Notificacion.findAll({
          where: { usuarioId },
          include: [
            {
              model: Proyecto,
              as: 'proyecto',
              required: false,
              include: [
                {
                  model: Cliente,
                  as: 'cliente',
                  required: false,
                },
              ],
            },
          ],
          order: [['fecha', 'DESC']],
          limit,
        });
        
        console.log(`✅ Encontradas ${notificaciones.length} notificaciones`);
        return notificaciones;
      } catch (error) {
        console.error('❌ Error al obtener notificaciones:', error);
        throw new Error('Error al obtener notificaciones');
      }
    },

    getKPIsByUsuario: async (_, { usuarioId }) => {
      try {
        console.log(`🔍 Buscando KPIs para usuario: ${usuarioId}`);
        
        const kpis = await KPI.findAll({
          include: [
            {
              model: Proyecto,
              as: 'proyecto',
              required: true,
              include: [
                {
                  model: Cliente,
                  as: 'cliente',
                  where: { usuarioId },
                  required: true,
                },
              ],
            },
          ],
          order: [['fechaRegistro', 'DESC']],
        });
        
        console.log(`✅ Encontrados ${kpis.length} KPIs`);
        return kpis;
      } catch (error) {
        console.error('❌ Error al obtener KPIs:', error);
        throw new Error('Error al obtener KPIs del usuario');
      }
    },

    // 🔔 NUEVAS QUERIES PARA NOTIFICACIONES
    getUserNotificationSettings: async (_, { usuarioId }) => {
      try {
        console.log(`🔍 Obteniendo configuración de notificaciones para usuario: ${usuarioId}`);
        
        const usuario = await Usuario.findByPk(usuarioId);
        if (!usuario) {
          throw new Error('Usuario no encontrado');
        }
        
        return {
          notificacionesHabilitadas: usuario.notificacionesHabilitadas,
          recordatoriosHabilitados: usuario.recordatoriosHabilitados,
          proyectosHabilitados: usuario.proyectosHabilitados,
          fcmToken: usuario.fcmToken,
        };
      } catch (error) {
        console.error('❌ Error obteniendo configuración:', error);
        throw new Error('Error al obtener configuración de notificaciones');
      }
    },

    getNotificacionesProgramadas: async (_, { usuarioId }) => {
      try {
        console.log(`🔍 Buscando notificaciones programadas para usuario: ${usuarioId}`);
        
        const notificaciones = await NotificacionProgramada.findAll({
          where: {
            usuarioId,
            enviada: false,
            fechaProgramada: {
              [Op.gte]: new Date(),
            },
          },
          include: [
            {
              model: Recordatorio,
              as: 'recordatorio',
              required: false,
            },
            {
              model: Proyecto,
              as: 'proyecto',
              required: false,
            },
          ],
          order: [['fechaProgramada', 'ASC']],
        });
        
        console.log(`✅ Encontradas ${notificaciones.length} notificaciones programadas`);
        return notificaciones;
      } catch (error) {
        console.error('❌ Error obteniendo notificaciones programadas:', error);
        throw new Error('Error al obtener notificaciones programadas');
      }
    },
  },

  Mutation: {
    marcarRecordatorioVisto: async (_, { recordatorioId }) => {
      try {
        console.log(`🔄 Marcando recordatorio ${recordatorioId} como visto`);
        
        const [updatedRows] = await Recordatorio.update(
          { visto: true },
          { where: { id: recordatorioId } }
        );
        
        console.log(`✅ Recordatorio actualizado: ${updatedRows > 0}`);
        return updatedRows > 0;
      } catch (error) {
        console.error('❌ Error al marcar recordatorio como visto:', error);
        throw new Error('Error al actualizar recordatorio');
      }
    },

    crearRecordatorio: async (_, { input }) => {
      try {
        console.log(`🆕 Creando nuevo recordatorio:`, input);
        
        const recordatorio = await Recordatorio.create(input);
        
        // 🔔 NUEVO: Programar notificación automáticamente
        if (recordatorio.fechaRecordatorio > new Date()) {
          // Programar notificación 5 minutos antes
          const notificationTime = new Date(recordatorio.fechaRecordatorio.getTime() - 5 * 60 * 1000);
          
          if (notificationTime > new Date()) {
            await NotificacionProgramada.create({
              titulo: `📅 ${recordatorio.titulo}`,
              mensaje: `Recordatorio próximo: ${recordatorio.titulo}`,
              tipo: 'recordatorio',
              fechaProgramada: notificationTime,
              data: {
                recordatorioId: recordatorio.id,
                type: 'recordatorio',
                priority: recordatorio.prioridad === 'URGENTE' ? 'URGENT' : 'NORMAL',
              },
              usuarioId: recordatorio.usuarioId,
              recordatorioId: recordatorio.id,
              proyectoId: recordatorio.proyectoId,
            });
            
            console.log(`✅ Notificación automática programada para: ${notificationTime}`);
          }
        }
        
        // Publicar para subscriptions
        pubsub.publish('RECORDATORIO_CREADO', {
          recordatorioCreado: recordatorio,
          usuarioId: input.usuarioId,
        });

        console.log(`✅ Recordatorio creado con ID: ${recordatorio.id}`);
        return recordatorio;
      } catch (error) {
        console.error('❌ Error al crear recordatorio:', error);
        throw new Error('Error al crear recordatorio');
      }
    },

    actualizarEstadoProyecto: async (_, { proyectoId, estado }) => {
      try {
        console.log(`🔄 Actualizando proyecto ${proyectoId} a estado: ${estado}`);
        
        const [updatedRows] = await Proyecto.update(
          { estado },
          { where: { id: proyectoId } }
        );

        if (updatedRows > 0) {
          const proyecto = await Proyecto.findByPk(proyectoId, {
            include: [
              { model: Cliente, as: 'cliente' },
              { model: Marca, as: 'marca' },
              { model: EtapaProyecto, as: 'etapas' },
              { model: KPI, as: 'kpis' }
            ],
          });

          // Publicar cambio para subscriptions
          pubsub.publish('PROYECTO_ACTUALIZADO', {
            cambiosProyectos: proyecto,
          });

          console.log(`✅ Proyecto actualizado correctamente`);
          return true;
        }
        
        console.log(`⚠️ No se encontró el proyecto para actualizar`);
        return false;
      } catch (error) {
        console.error('❌ Error al actualizar estado del proyecto:', error);
        throw new Error('Error al actualizar estado del proyecto');
      }
    },

    registrarInteraccionNotificacion: async (_, { notificacionId, accion }) => {
      try {
        console.log(`🔄 Registrando interacción en notificación ${notificacionId}: ${accion}`);
        
        const [updatedRows] = await Notificacion.update(
          { 
            leida: true,
            interaccion: accion,
            fechaInteraccion: new Date(),
          },
          { where: { id: notificacionId } }
        );
        
        console.log(`✅ Interacción registrada: ${updatedRows > 0}`);
        return updatedRows > 0;
      } catch (error) {
        console.error('❌ Error al registrar interacción:', error);
        throw new Error('Error al registrar interacción con notificación');
      }
    },

    // 🔔 NUEVAS MUTACIONES PARA NOTIFICACIONES PUSH
    updateUserFCMToken: async (_, { usuarioId, token }) => {
      try {
        console.log(`🔄 Actualizando token FCM para usuario: ${usuarioId}`);
        
        // Validar que el token sea válido
        const isValidToken = await FirebaseService.validateToken(token);
        if (!isValidToken) {
          return {
            success: false,
            message: 'Token FCM inválido',
          };
        }
        
        const [updatedRows] = await Usuario.update(
          { 
            fcmToken: token,
            ultimaActividad: new Date(),
          },
          { where: { id: usuarioId } }
        );
        
        if (updatedRows > 0) {
          // Suscribir al usuario a topics básicos
          await FirebaseService.subscribeToTopic([token], `user_${usuarioId}`);
          await FirebaseService.subscribeToTopic([token], 'recordatorios');
          await FirebaseService.subscribeToTopic([token], 'proyectos');
          
          console.log(`✅ Token FCM actualizado correctamente`);
          return {
            success: true,
            message: 'Token actualizado correctamente',
          };
        }
        
        return {
          success: false,
          message: 'No se pudo actualizar el token',
        };
      } catch (error) {
        console.error('❌ Error actualizando token FCM:', error);
        return {
          success: false,
          message: `Error: ${error.message}`,
        };
      }
    },

    sendPushNotification: async (_, { input }) => {
      try {
        console.log(`📤 Enviando notificación push a usuario: ${input.usuarioId}`);
        
        const usuario = await Usuario.findByPk(input.usuarioId);
        if (!usuario || !usuario.fcmToken) {
          return {
            success: false,
            error: 'Usuario no encontrado o sin token FCM',
          };
        }
        
        if (!usuario.notificacionesHabilitadas) {
          return {
            success: false,
            error: 'Usuario tiene notificaciones deshabilitadas',
          };
        }
        
        const result = await FirebaseService.sendToToken(
          usuario.fcmToken,
          {
            title: input.title,
            body: input.body,
          },
          {
            ...input.data,
            type: input.data?.type || 'general',
            priority: input.priority,
            usuarioId: input.usuarioId,
          }
        );
        
        console.log(`✅ Resultado envío: ${result.success}`);
        return result;
      } catch (error) {
        console.error('❌ Error enviando notificación push:', error);
        return {
          success: false,
          error: error.message,
        };
      }
    },
  },

  Subscription: {
    nuevasNotificaciones: {
      subscribe: (_, { usuarioId }) => {
        return pubsub.asyncIterator([`NUEVA_NOTIFICACION_${usuarioId}`]);
      },
    },

    cambiosProyectos: {
      subscribe: (_, { usuarioId }) => {
        return pubsub.asyncIterator([`PROYECTO_ACTUALIZADO_${usuarioId}`]);
      },
    },
  },

  // Resolvers de relaciones
  Proyecto: {
    cliente: async (proyecto) => {
      if (proyecto.cliente) return proyecto.cliente;
      return await Cliente.findByPk(proyecto.clienteId);
    },
    marca: async (proyecto) => {
      if (proyecto.marca) return proyecto.marca;
      return proyecto.marcaId ? await Marca.findByPk(proyecto.marcaId) : null;
    },
    etapas: async (proyecto) => {
      if (proyecto.etapas) return proyecto.etapas;
      return await EtapaProyecto.findAll({
        where: { proyectoId: proyecto.id },
        order: [['id', 'ASC']],
      });
    },
    kpis: async (proyecto) => {
      if (proyecto.kpis) return proyecto.kpis;
      return await KPI.findAll({
        where: { proyectoId: proyecto.id },
        order: [['fechaRegistro', 'DESC']],
      });
    },
    activos: async (proyecto) => {
      if (proyecto.activos) return proyecto.activos;
      return await ActivoMarca.findAll({
        where: { proyectoId: proyecto.id },
      });
    },
    aprobaciones: async (proyecto) => {
      if (proyecto.aprobaciones) return proyecto.aprobaciones;
      return await Aprobacion.findAll({
        where: { proyectoId: proyecto.id },
      });
    },
  },

  Recordatorio: {
    proyecto: async (recordatorio) => {
      if (recordatorio.proyecto) return recordatorio.proyecto;
      return recordatorio.proyectoId 
        ? await Proyecto.findByPk(recordatorio.proyectoId, {
            include: [{ model: Cliente, as: 'cliente' }],
          })
        : null;
    },
    usuario: async (recordatorio) => {
      if (recordatorio.usuario) return recordatorio.usuario;
      return await Usuario.findByPk(recordatorio.usuarioId);
    },
  },

  Notificacion: {
    proyecto: async (notificacion) => {
      if (notificacion.proyecto) return notificacion.proyecto;
      return notificacion.proyectoId 
        ? await Proyecto.findByPk(notificacion.proyectoId, {
            include: [{ model: Cliente, as: 'cliente' }],
          })
        : null;
    },
    usuario: async (notificacion) => {
      if (notificacion.usuario) return notificacion.usuario;
      return await Usuario.findByPk(notificacion.usuarioId);
    },
  },

  Actividad: {
    proyecto: async (actividad) => {
      if (actividad.proyecto) return actividad.proyecto;
      return actividad.proyectoId 
        ? await Proyecto.findByPk(actividad.proyectoId, {
            include: [{ model: Cliente, as: 'cliente' }],
          })
        : null;
    },
    usuario: async (actividad) => {
      if (actividad.usuario) return actividad.usuario;
      return await Usuario.findByPk(actividad.usuarioId);
    },
  },

  KPI: {
    proyecto: async (kpi) => {
      if (kpi.proyecto) return kpi.proyecto;
      return await Proyecto.findByPk(kpi.proyectoId, {
        include: [{ model: Cliente, as: 'cliente' }],
      });
    },
  },
};

module.exports = { resolvers };