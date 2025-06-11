// models/index.js
const { Sequelize, DataTypes, Op } = require('sequelize');

// Configurar variables de entorno
require('dotenv').config();

// Configuración de la base de datos PostgreSQL
const sequelize = new Sequelize(
  process.env.DB_NAME || 'branding_erp',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      underscored: false,
      freezeTableName: true, // Esto evita que Sequelize pluralice automáticamente
      timestamps: true
    }
  }
);

// Definir todos los modelos primero (sin asociaciones)
// 🔔 ACTUALIZAR EL MODELO USUARIO CON LOS NUEVOS CAMPOS
const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  contrasena: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  rol: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  // 🔔 NUEVOS CAMPOS PARA NOTIFICACIONES PUSH
  fcmToken: {
    type: DataTypes.TEXT, // Usar TEXT porque los tokens FCM son largos
    field: 'fcm_token',
  },
  notificacionesHabilitadas: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'notificaciones_habilitadas'
  },
  recordatoriosHabilitados: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'recordatorios_habilitados'
  },
  proyectosHabilitados: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'proyectos_habilitados'
  },
  ultimaActividad: {
    type: DataTypes.DATE,
    field: 'ultima_actividad'
  },
}, {
  tableName: 'usuario',
  indexes: [
    {
      unique: true,
      fields: ['email']
    },
    // 🔔 NUEVO ÍNDICE PARA FCM TOKEN
    {
      fields: ['fcm_token']
    }
  ]
});

// 🔔 AGREGAR NUEVO MODELO PARA NOTIFICACIONES PROGRAMADAS (después de todos los otros modelos)
const NotificacionProgramada = sequelize.define('NotificacionProgramada', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  titulo: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  mensaje: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  tipo: {
    type: DataTypes.ENUM('recordatorio', 'proyecto', 'urgente', 'general'),
    allowNull: false,
  },
  fechaProgramada: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'fecha_programada'
  },
  enviada: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  fechaEnvio: {
    type: DataTypes.DATE,
    field: 'fecha_envio'
  },
  data: {
    type: DataTypes.JSON, // Para datos adicionales como IDs, URLs, etc.
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'usuario_id',
  },
  recordatorioId: {
    type: DataTypes.INTEGER,
    field: 'recordatorio_id',
  },
  proyectoId: {
    type: DataTypes.INTEGER,
    field: 'proyecto_id',
  },
}, {
  tableName: 'notificacion_programada',
  indexes: [
    {
      fields: ['usuario_id']
    },
    {
      fields: ['fecha_programada']
    },
    {
      fields: ['enviada']
    },
    {
      fields: ['recordatorio_id']
    }
  ]
});

const Cliente = sequelize.define('Cliente', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombreEmpresa: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'nombre_empresa'
  },
  contacto: {
    type: DataTypes.INTEGER,
  },
  sector: {
    type: DataTypes.STRING(100),
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'usuario_id',
  },
}, {
  tableName: 'cliente', // ← SINGULAR
  indexes: [
    {
      fields: ['usuario_id']
    }
  ]
});

const Marca = sequelize.define('Marca', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  sector: {
    type: DataTypes.STRING(100),
  },
  estado: {
    type: DataTypes.STRING(50),
    defaultValue: 'ACTIVA'
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'usuario_id',
  },
}, {
  tableName: 'marca', // ← SINGULAR
  indexes: [
    {
      fields: ['usuario_id']
    }
  ]
});

const Proyecto = sequelize.define('Proyecto', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  tipo: {
    type: DataTypes.STRING(100),
  },
  formato: {
    type: DataTypes.STRING(100),
  },
  fechaInicio: {
    type: DataTypes.DATE,
    field: 'fecha_inicio'
  },
  estado: {
    type: DataTypes.STRING(50),
    defaultValue: 'ACTIVO',
  },
  clienteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'cliente_id',
  },
  marcaId: {
    type: DataTypes.INTEGER,
    field: 'marca_id',
  },
}, {
  tableName: 'proyecto', // ← SINGULAR
  indexes: [
    {
      fields: ['cliente_id']
    },
    {
      fields: ['marca_id']
    }
  ]
});

const EtapaProyecto = sequelize.define('EtapaProyecto', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  descripcion: {
    type: DataTypes.TEXT,
  },
  fechaLimite: {
    type: DataTypes.DATE,
    field: 'fecha_limite'
  },
  estado: {
    type: DataTypes.STRING(50),
    defaultValue: 'PENDIENTE',
  },
  responsable: {
    type: DataTypes.STRING(255),
  },
  proyectoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'proyecto_id',
  },
}, {
  tableName: 'etapa_proyecto', // ← SINGULAR (sin 's')
  indexes: [
    {
      fields: ['proyecto_id']
    }
  ]
});

const ActivoMarca = sequelize.define('ActivoMarca', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombre: {
    type: DataTypes.STRING(255),
  },
  tipo: {
    type: DataTypes.STRING(100),
  },
  formato: {
    type: DataTypes.STRING(100),
  },
  fechaInicio: {
    type: DataTypes.DATE,
    field: 'fecha_inicio'
  },
  fechaFin: {
    type: DataTypes.DATE,
    field: 'fecha_fin'
  },
  estado: {
    type: DataTypes.STRING(50),
    defaultValue: 'BORRADOR',
  },
  proyectoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'proyecto_id',
  },
}, {
  tableName: 'activo_marca', // ← SINGULAR (sin 's')
  indexes: [
    {
      fields: ['proyecto_id']
    }
  ]
});

const KPI = sequelize.define('KPI', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  tipo: {
    type: DataTypes.STRING(100),
  },
  valor: {
    type: DataTypes.FLOAT,
  },
  periodo: {
    type: DataTypes.STRING(50),
  },
  fechaRegistro: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'fecha_registro'
  },
  proyectoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'proyecto_id',
  },
}, {
  tableName: 'kpi', // ← SINGULAR
  indexes: [
    {
      fields: ['proyecto_id']
    }
  ]
});

const Aprobacion = sequelize.define('Aprobacion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  tipo: {
    type: DataTypes.STRING(100),
  },
  valor: {
    type: DataTypes.FLOAT,
  },
  fechaAprobacion: {
    type: DataTypes.DATE,
    field: 'fecha_aprobacion'
  },
  estado: {
    type: DataTypes.STRING(50),
    defaultValue: 'PENDIENTE',
  },
  proyectoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'proyecto_id',
  },
}, {
  tableName: 'aprobacion', // ← SINGULAR
  indexes: [
    {
      fields: ['proyecto_id']
    }
  ]
});

const Recordatorio = sequelize.define('Recordatorio', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  titulo: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.TEXT,
  },
  fechaRecordatorio: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'fecha_recordatorio'
  },
  tipo: {
    type: DataTypes.ENUM('ENTREGA', 'REUNION', 'APROBACION', 'SEGUIMIENTO', 'DEADLINE', 'PRESENTACION'),
    allowNull: false,
  },
  prioridad: {
    type: DataTypes.ENUM('BAJA', 'MEDIA', 'ALTA', 'URGENTE'),
    allowNull: false,
  },
  visto: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'usuario_id',
  },
  proyectoId: {
    type: DataTypes.INTEGER,
    field: 'proyecto_id',
  },
}, {
  tableName: 'recordatorio', // ← SINGULAR
  indexes: [
    {
      fields: ['usuario_id']
    },
    {
      fields: ['proyecto_id']
    },
    {
      fields: ['fecha_recordatorio']
    }
  ]
});

const Notificacion = sequelize.define('Notificacion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  titulo: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  mensaje: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  tipo: {
    type: DataTypes.ENUM('NUEVO_PROYECTO', 'CAMBIO_ESTADO', 'APROBACION_PENDIENTE', 'ENTREGA_PROXIMA', 'REUNION_PROGRAMADA', 'TAREA_ASIGNADA'),
    allowNull: false,
  },
  leida: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  fecha: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  accionUrl: {
    type: DataTypes.STRING(500),
    field: 'accion_url'
  },
  interaccion: {
    type: DataTypes.STRING(100),
  },
  fechaInteraccion: {
    type: DataTypes.DATE,
    field: 'fecha_interaccion'
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'usuario_id',
  },
  proyectoId: {
    type: DataTypes.INTEGER,
    field: 'proyecto_id',
  },
}, {
  tableName: 'notificacion', // ← SINGULAR
  indexes: [
    {
      fields: ['usuario_id']
    },
    {
      fields: ['proyecto_id']
    },
    {
      fields: ['fecha']
    }
  ]
});

const Actividad = sequelize.define('Actividad', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  titulo: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.TEXT,
  },
  fechaInicio: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'fecha_inicio'
  },
  fechaFin: {
    type: DataTypes.DATE,
    field: 'fecha_fin'
  },
  tipo: {
    type: DataTypes.ENUM('REUNION', 'ENTREGA', 'REVISION', 'PRESENTACION', 'TRABAJO_INTERNO', 'APROBACION'),
    allowNull: false,
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'usuario_id',
  },
  proyectoId: {
    type: DataTypes.INTEGER,
    field: 'proyecto_id',
  },
}, {
  tableName: 'actividad', // ← SINGULAR
  indexes: [
    {
      fields: ['usuario_id']
    },
    {
      fields: ['proyecto_id']
    },
    {
      fields: ['fecha_inicio']
    }
  ]
});

// AHORA definir todas las asociaciones DESPUÉS de que todos los modelos existan
function initializeAssociations() {
  // Usuario -> Cliente, Marca, Recordatorio, Notificacion, Actividad
  Usuario.hasMany(Cliente, { foreignKey: 'usuarioId', as: 'clientes' });
  Usuario.hasMany(Marca, { foreignKey: 'usuarioId', as: 'marcas' });
  Usuario.hasMany(Recordatorio, { foreignKey: 'usuarioId', as: 'recordatorios' });
  Usuario.hasMany(Notificacion, { foreignKey: 'usuarioId', as: 'notificaciones' });
  Usuario.hasMany(Actividad, { foreignKey: 'usuarioId', as: 'actividades' });

  // Cliente -> Usuario, Proyecto
  Cliente.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });
  Cliente.hasMany(Proyecto, { foreignKey: 'clienteId', as: 'proyectos' });

  // Marca -> Usuario, Proyecto
  Marca.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });
  Marca.hasMany(Proyecto, { foreignKey: 'marcaId', as: 'proyectos' });

  // Proyecto -> Cliente, Marca, EtapaProyecto, ActivoMarca, KPI, Aprobacion, Recordatorio, Notificacion, Actividad
  Proyecto.belongsTo(Cliente, { foreignKey: 'clienteId', as: 'cliente' });
  Proyecto.belongsTo(Marca, { foreignKey: 'marcaId', as: 'marca' });
  Proyecto.hasMany(EtapaProyecto, { foreignKey: 'proyectoId', as: 'etapas' });
  Proyecto.hasMany(ActivoMarca, { foreignKey: 'proyectoId', as: 'activos' });
  Proyecto.hasMany(KPI, { foreignKey: 'proyectoId', as: 'kpis' });
  Proyecto.hasMany(Aprobacion, { foreignKey: 'proyectoId', as: 'aprobaciones' });
  Proyecto.hasMany(Recordatorio, { foreignKey: 'proyectoId', as: 'recordatorios' });
  Proyecto.hasMany(Notificacion, { foreignKey: 'proyectoId', as: 'notificaciones' });
  Proyecto.hasMany(Actividad, { foreignKey: 'proyectoId', as: 'actividades' });

  // Asociaciones belongsTo para las tablas que referencian a Proyecto
  EtapaProyecto.belongsTo(Proyecto, { foreignKey: 'proyectoId', as: 'proyecto' });
  ActivoMarca.belongsTo(Proyecto, { foreignKey: 'proyectoId', as: 'proyecto' });
  KPI.belongsTo(Proyecto, { foreignKey: 'proyectoId', as: 'proyecto' });
  Aprobacion.belongsTo(Proyecto, { foreignKey: 'proyectoId', as: 'proyecto' });
  Recordatorio.belongsTo(Proyecto, { foreignKey: 'proyectoId', as: 'proyecto' });
  Notificacion.belongsTo(Proyecto, { foreignKey: 'proyectoId', as: 'proyecto' });
  Actividad.belongsTo(Proyecto, { foreignKey: 'proyectoId', as: 'proyecto' });

  // Asociaciones belongsTo para las tablas que referencian a Usuario
  Recordatorio.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });
  Notificacion.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });
  Actividad.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });

  
  // 🔔 NUEVAS ASOCIACIONES PARA NOTIFICACIONES PROGRAMADAS
  Usuario.hasMany(NotificacionProgramada, { foreignKey: 'usuarioId', as: 'notificacionesProgramadas' });
  NotificacionProgramada.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });
  
  Recordatorio.hasMany(NotificacionProgramada, { foreignKey: 'recordatorioId', as: 'notificacionesProgramadas' });
  NotificacionProgramada.belongsTo(Recordatorio, { foreignKey: 'recordatorioId', as: 'recordatorio' });
  
  Proyecto.hasMany(NotificacionProgramada, { foreignKey: 'proyectoId', as: 'notificacionesProgramadas' });
  NotificacionProgramada.belongsTo(Proyecto, { foreignKey: 'proyectoId', as: 'proyecto' });

  console.log('✅ Asociaciones de modelos inicializadas correctamente');
}

// Inicializar asociaciones
initializeAssociations();

// Exportar todo
module.exports = {
  sequelize,
  Sequelize,
  Op,
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
  NotificacionProgramada, // 🔔 NUEVO
};