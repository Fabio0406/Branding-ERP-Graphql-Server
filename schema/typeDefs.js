// schema/typeDefs.js
const { gql } = require('apollo-server-express');

const typeDefs = gql`
  scalar DateTime

  type Query {
    getProyectosByUsuario(usuarioId: ID!): [Proyecto!]!
    getRecordatoriosPendientes(usuarioId: ID!): [Recordatorio!]!
    getActividadesHoy(usuarioId: ID!): [Actividad!]!
    getNotificaciones(usuarioId: ID!, limit: Int = 20): [Notificacion!]!
    getKPIsByUsuario(usuarioId: ID!): [KPI!]!
    # 🔔 NUEVAS QUERIES PARA NOTIFICACIONES
    getUserNotificationSettings(usuarioId: ID!): NotificationSettings!
    getNotificacionesProgramadas(usuarioId: ID!): [NotificacionProgramada!]!
  }

  type Mutation {
    marcarRecordatorioVisto(recordatorioId: ID!): Boolean!
    crearRecordatorio(input: RecordatorioInput!): Recordatorio!
    actualizarEstadoProyecto(proyectoId: ID!, estado: String!): Boolean!
    registrarInteraccionNotificacion(notificacionId: ID!, accion: String!): Boolean!
    # 🔔 NUEVAS MUTACIONES PARA NOTIFICACIONES PUSH
    updateUserFCMToken(usuarioId: ID!, token: String!): UpdateTokenResponse!
    sendPushNotification(input: PushNotificationInput!): SendNotificationResponse!
    sendTopicNotification(topic: String!, input: NotificationInput!): SendNotificationResponse!
    scheduleRecordatorioNotification(recordatorioId: ID!, scheduleTime: DateTime!): ScheduleNotificationResponse!
    updateNotificationSettings(usuarioId: ID!, settings: NotificationSettingsInput!): Boolean!
    cancelScheduledNotification(notificationId: ID!): Boolean!
  }

  type Subscription {
    nuevasNotificaciones(usuarioId: ID!): Notificacion!
    cambiosProyectos(usuarioId: ID!): Proyecto!
  }

  type Usuario {
    id: ID!
    nombre: String!
    email: String!
    rol: String!
    marcas: [Marca!]
    clientes: [Cliente!]
    # 🔔 NUEVOS CAMPOS PARA NOTIFICACIONES
    fcmToken: String
    notificacionesHabilitadas: Boolean!
    recordatoriosHabilitados: Boolean!
    proyectosHabilitados: Boolean!
    ultimaActividad: DateTime
  }

  type Cliente {
    id: ID!
    nombreEmpresa: String!
    contacto: Int
    sector: String
    usuario: Usuario!
    proyectos: [Proyecto!]
  }

  type Marca {
    id: ID!
    nombre: String!
    sector: String
    estado: String
    usuario: Usuario!
    proyectos: [Proyecto!]
  }

  type Proyecto {
    id: ID!
    nombre: String!
    tipo: String
    formato: String
    fechaInicio: DateTime
    cliente: Cliente!
    marca: Marca
    etapas: [EtapaProyecto!]
    activos: [ActivoMarca!]
    kpis: [KPI!]
    aprobaciones: [Aprobacion!]
  }

  type EtapaProyecto {
    id: ID!
    descripcion: String
    proyecto: Proyecto!
    fechaLimite: DateTime
    estado: String
    responsable: String
  }

  type ActivoMarca {
    id: ID!
    nombre: String
    tipo: String
    formato: String
    fechaInicio: DateTime
    fechaFin: DateTime
    proyecto: Proyecto!
    estado: String
  }

  type KPI {
    id: ID!
    tipo: String
    valor: Float
    periodo: String
    proyecto: Proyecto!
    fechaRegistro: DateTime
  }

  type Aprobacion {
    id: ID!
    tipo: String
    valor: Float
    proyecto: Proyecto!
    fechaAprobacion: DateTime
    estado: String
  }

  type Recordatorio {
    id: ID!
    titulo: String!
    descripcion: String
    fechaRecordatorio: DateTime!
    tipo: TipoRecordatorio!
    prioridad: PrioridadRecordatorio!
    visto: Boolean!
    proyecto: Proyecto
    usuario: Usuario!
    createdAt: DateTime!
  }

  type Notificacion {
    id: ID!
    titulo: String!
    mensaje: String!
    tipo: TipoNotificacion!
    leida: Boolean!
    fecha: DateTime!
    usuario: Usuario!
    proyecto: Proyecto
    accionUrl: String
  }

  type Actividad {
    id: ID!
    titulo: String!
    descripcion: String
    fechaInicio: DateTime!
    fechaFin: DateTime
    tipo: TipoActividad!
    proyecto: Proyecto
    usuario: Usuario!
  }

  # 🔔 NUEVOS TIPOS PARA NOTIFICACIONES PUSH
  type NotificacionProgramada {
    id: ID!
    titulo: String!
    mensaje: String!
    tipo: TipoNotificacionPush!
    fechaProgramada: DateTime!
    enviada: Boolean!
    fechaEnvio: DateTime
    data: JSON
    usuario: Usuario!
    recordatorio: Recordatorio
    proyecto: Proyecto
  }

  type NotificationSettings {
    notificacionesHabilitadas: Boolean!
    recordatoriosHabilitados: Boolean!
    proyectosHabilitados: Boolean!
    fcmToken: String
  }

  type UpdateTokenResponse {
    success: Boolean!
    message: String!
  }

  type SendNotificationResponse {
    success: Boolean!
    messageId: String
    error: String
  }

  type ScheduleNotificationResponse {
    success: Boolean!
    notificationId: ID
    message: String!
  }

  type NotificationSettings {
  notificacionesHabilitadas: Boolean!
  recordatoriosHabilitados: Boolean!
  proyectosHabilitados: Boolean!
  fcmToken: String
}

type UpdateTokenResponse {
  success: Boolean!
  message: String!
}

type SendNotificationResponse {
  success: Boolean!
  messageId: String
  error: String
}

input PushNotificationInput {
  title: String!
  body: String!
  usuarioId: ID!
  data: JSON
  priority: NotificationPriority = NORMAL
}

enum NotificationPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}

  # 🔔 NUEVOS ENUMS
  enum TipoNotificacionPush {
    recordatorio
    proyecto
    urgente
    general
  }

  enum NotificationPriority {
    LOW
    NORMAL
    HIGH
    URGENT
  }

  enum TipoRecordatorio {
    ENTREGA
    REUNION
    APROBACION
    SEGUIMIENTO
    DEADLINE
    PRESENTACION
  }

  enum PrioridadRecordatorio {
    BAJA
    MEDIA
    ALTA
    URGENTE
  }

  enum TipoNotificacion {
    NUEVO_PROYECTO
    CAMBIO_ESTADO
    APROBACION_PENDIENTE
    ENTREGA_PROXIMA
    REUNION_PROGRAMADA
    TAREA_ASIGNADA
  }

  enum TipoActividad {
    REUNION
    ENTREGA
    REVISION
    PRESENTACION
    TRABAJO_INTERNO
    APROBACION
  }

  # 🔔 NUEVOS INPUTS
  input RecordatorioInput {
    titulo: String!
    descripcion: String
    fechaRecordatorio: DateTime!
    tipo: TipoRecordatorio!
    prioridad: PrioridadRecordatorio!
    proyectoId: ID
    usuarioId: ID!
  }

  input PushNotificationInput {
    title: String!
    body: String!
    usuarioId: ID!
    data: JSON
    priority: NotificationPriority = NORMAL
  }

  input NotificationInput {
    title: String!
    body: String!
    data: JSON
    priority: NotificationPriority = NORMAL
  }

  input NotificationSettingsInput {
    notificacionesHabilitadas: Boolean
    recordatoriosHabilitados: Boolean
    proyectosHabilitados: Boolean
  }

  # Tipo JSON personalizado
  scalar JSON
`;

module.exports = typeDefs;