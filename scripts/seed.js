// scripts/seed.js
require('dotenv').config();

async function seed() {
  let sequelize;
  
  try {
    console.log('🗄️ Conectando a PostgreSQL...');
    
    // Importar modelos después de configurar dotenv
    const models = require('../models/index');
    sequelize = models.sequelize;
    
    const {
      Usuario,
      Cliente,
      Marca,
      Proyecto,
      EtapaProyecto,
      Recordatorio,
      Notificacion,
      Actividad,
      KPI,
      NotificacionProgramada  // 🔔 NUEVO MODELO
    } = models;

    await sequelize.authenticate();
    console.log('✅ Conexión establecida correctamente.');

    console.log('🔄 Sincronizando modelos...');
    await sequelize.sync({ force: true }); // CUIDADO: force: true elimina todas las tablas
    console.log('✅ Modelos sincronizados.');

    console.log('👤 Creando usuarios de prueba...');
    const usuarios = await Usuario.bulkCreate([
      {
        nombre: 'Juan Pérez',
        email: 'juan@brandingagency.com',
        contrasena: 'password123',
        rol: 'GERENTE',
        // 🔔 NUEVOS CAMPOS PARA NOTIFICACIONES
        fcmToken: null, // Se actualizará cuando el usuario se loguee desde la app
        notificacionesHabilitadas: true,
        recordatoriosHabilitados: true,
        proyectosHabilitados: true,
        ultimaActividad: new Date(),
      },
      {
        nombre: 'María García',
        email: 'maria@brandingagency.com',
        contrasena: 'password123',
        rol: 'DISEÑADOR',
        // 🔔 NUEVOS CAMPOS PARA NOTIFICACIONES
        fcmToken: null,
        notificacionesHabilitadas: true,
        recordatoriosHabilitados: true,
        proyectosHabilitados: true,
        ultimaActividad: new Date(),
      },
      {
        nombre: 'Carlos Rodríguez',
        email: 'carlos@brandingagency.com',
        contrasena: 'password123',
        rol: 'DIRECTOR_CREATIVO',
        // 🔔 NUEVOS CAMPOS PARA NOTIFICACIONES
        fcmToken: null,
        notificacionesHabilitadas: true,
        recordatoriosHabilitados: false, // Este usuario tiene recordatorios deshabilitados
        proyectosHabilitados: true,
        ultimaActividad: new Date(),
      }
    ]);

    console.log('🏢 Creando clientes de prueba...');
    const clientes = await Cliente.bulkCreate([
      {
        nombreEmpresa: 'TechCorp S.A.',
        contacto: 12345678,
        sector: 'Tecnología',
        usuarioId: usuarios[0].id,
      },
      {
        nombreEmpresa: 'FoodBrand Ltda.',
        contacto: 87654321,
        sector: 'Alimentación',
        usuarioId: usuarios[0].id,
      },
      {
        nombreEmpresa: 'EcoGreen Solutions',
        contacto: 11223344,
        sector: 'Medio Ambiente',
        usuarioId: usuarios[1].id,
      }
    ]);

    console.log('🎨 Creando marcas de prueba...');
    const marcas = await Marca.bulkCreate([
      {
        nombre: 'TechBrand',
        sector: 'Tecnología',
        estado: 'ACTIVA',
        usuarioId: usuarios[0].id,
      },
      {
        nombre: 'FreshFood',
        sector: 'Alimentación',
        estado: 'ACTIVA',
        usuarioId: usuarios[0].id,
      },
      {
        nombre: 'GreenLife',
        sector: 'Medio Ambiente',
        estado: 'EN_DESARROLLO',
        usuarioId: usuarios[1].id,
      }
    ]);

    console.log('💼 Creando proyectos de prueba...');
    const proyectos = await Proyecto.bulkCreate([
      {
        nombre: 'Rebranding TechCorp 2024',
        tipo: 'rebranding',
        formato: 'completo',
        fechaInicio: new Date('2024-01-15'),
        estado: 'EN_PROGRESO',
        clienteId: clientes[0].id,
        marcaId: marcas[0].id,
      },
      {
        nombre: 'Identidad Visual FoodBrand',
        tipo: 'creacion',
        formato: 'identidad_visual',
        fechaInicio: new Date('2024-02-01'),
        estado: 'PLANIFICACION',
        clienteId: clientes[1].id,
        marcaId: marcas[1].id,
      },
      {
        nombre: 'Extensión de Línea EcoGreen',
        tipo: 'extension',
        formato: 'packaging',
        fechaInicio: new Date('2024-03-01'),
        estado: 'ACTIVO',
        clienteId: clientes[2].id,
        marcaId: marcas[2].id,
      }
    ]);

    console.log('📋 Creando etapas de proyecto...');
    await EtapaProyecto.bulkCreate([
      // Proyecto 1: Rebranding TechCorp
      {
        descripcion: 'Briefing inicial y análisis de mercado',
        fechaLimite: new Date('2024-01-25'),
        estado: 'COMPLETADA',
        responsable: 'Juan Pérez',
        proyectoId: proyectos[0].id,
      },
      {
        descripcion: 'Conceptualización y propuestas iniciales',
        fechaLimite: new Date('2024-02-10'),
        estado: 'EN_PROGRESO',
        responsable: 'María García',
        proyectoId: proyectos[0].id,
      },
      {
        descripcion: 'Desarrollo de identidad visual',
        fechaLimite: new Date('2024-02-25'),
        estado: 'PENDIENTE',
        responsable: 'Carlos Rodríguez',
        proyectoId: proyectos[0].id,
      },
      
      // Proyecto 2: FoodBrand
      {
        descripcion: 'Investigación de mercado alimentario',
        fechaLimite: new Date('2024-02-15'),
        estado: 'EN_PROGRESO',
        responsable: 'Juan Pérez',
        proyectoId: proyectos[1].id,
      },
      {
        descripcion: 'Naming y concepto de marca',
        fechaLimite: new Date('2024-03-01'),
        estado: 'PENDIENTE',
        responsable: 'María García',
        proyectoId: proyectos[1].id,
      }
    ]);

    console.log('📝 Creando recordatorios de prueba...');
    const now = new Date();
    const recordatorios = await Recordatorio.bulkCreate([
      {
        titulo: 'Reunión de seguimiento TechCorp',
        descripcion: 'Presentar avances de la segunda etapa del rebranding',
        fechaRecordatorio: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 horas
        tipo: 'REUNION',
        prioridad: 'ALTA',
        visto: false,
        usuarioId: usuarios[0].id,
        proyectoId: proyectos[0].id,
      },
      {
        titulo: 'Entrega de logotipos FoodBrand',
        descripcion: 'Entregar 5 opciones de logo para revisión del cliente',
        fechaRecordatorio: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 1 día
        tipo: 'ENTREGA',
        prioridad: 'URGENTE',
        visto: false,
        usuarioId: usuarios[1].id,
        proyectoId: proyectos[1].id,
      },
      {
        titulo: 'Deadline paleta de colores',
        descripcion: 'Fecha límite para definir paleta cromática EcoGreen',
        fechaRecordatorio: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 días
        tipo: 'DEADLINE',
        prioridad: 'MEDIA',
        visto: false,
        usuarioId: usuarios[2].id,
        proyectoId: proyectos[2].id,
      },
      {
        titulo: 'Aprobación manual de marca TechCorp',
        descripcion: 'Revisar y aprobar el manual de marca antes de la presentación',
        fechaRecordatorio: new Date(now.getTime() + 4 * 60 * 60 * 1000), // 4 horas
        tipo: 'APROBACION',
        prioridad: 'ALTA',
        visto: false,
        usuarioId: usuarios[0].id,
        proyectoId: proyectos[0].id,
      },
      {
        titulo: 'Presentación final EcoGreen',
        descripcion: 'Presentación de propuesta completa al cliente',
        fechaRecordatorio: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 1 semana
        tipo: 'PRESENTACION',
        prioridad: 'ALTA',
        visto: false,
        usuarioId: usuarios[1].id,
        proyectoId: proyectos[2].id,
      }
    ]);

    console.log('🔔 Creando notificaciones de prueba...');
    await Notificacion.bulkCreate([
      {
        titulo: 'Nuevo proyecto asignado',
        mensaje: 'Te ha sido asignado el proyecto "Rebranding TechCorp 2024"',
        tipo: 'NUEVO_PROYECTO',
        leida: false,
        fecha: new Date(now.getTime() - 60 * 60 * 1000), // 1 hora atrás
        usuarioId: usuarios[0].id,
        proyectoId: proyectos[0].id,
      },
      {
        titulo: 'Cambio de estado en proyecto',
        mensaje: 'El proyecto "Identidad Visual FoodBrand" cambió a estado: EN_PROGRESO',
        tipo: 'CAMBIO_ESTADO',
        leida: false,
        fecha: new Date(now.getTime() - 30 * 60 * 1000), // 30 min atrás
        usuarioId: usuarios[1].id,
        proyectoId: proyectos[1].id,
      },
      {
        titulo: 'Aprobación pendiente',
        mensaje: 'Tienes una aprobación pendiente para el manual de marca TechCorp',
        tipo: 'APROBACION_PENDIENTE',
        leida: false,
        fecha: new Date(now.getTime() - 15 * 60 * 1000), // 15 min atrás
        usuarioId: usuarios[0].id,
        proyectoId: proyectos[0].id,
      },
      {
        titulo: 'Entrega próxima',
        mensaje: 'La entrega de logotipos FoodBrand está programada para mañana',
        tipo: 'ENTREGA_PROXIMA',
        leida: true,
        fecha: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 horas atrás
        usuarioId: usuarios[1].id,
        proyectoId: proyectos[1].id,
      }
    ]);

    console.log('📅 Creando actividades del día...');
    const hoy = new Date();
    await Actividad.bulkCreate([
      {
        titulo: 'Reunión de equipo creativo',
        descripcion: 'Revisión semanal de proyectos en curso',
        fechaInicio: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 9, 0), // 9:00 AM hoy
        fechaFin: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 10, 30), // 10:30 AM hoy
        tipo: 'REUNION',
        usuarioId: usuarios[0].id,
      },
      {
        titulo: 'Diseño de logotipos FoodBrand',
        descripcion: 'Trabajo en las propuestas de logo para cliente',
        fechaInicio: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 11, 0), // 11:00 AM hoy
        fechaFin: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 17, 0), // 5:00 PM hoy
        tipo: 'TRABAJO_INTERNO',
        usuarioId: usuarios[1].id,
        proyectoId: proyectos[1].id,
      },
      {
        titulo: 'Revisión de propuestas TechCorp',
        descripcion: 'Revisar y aprobar conceptos de rebranding',
        fechaInicio: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 14, 0), // 2:00 PM hoy
        fechaFin: new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 16, 0), // 4:00 PM hoy
        tipo: 'REVISION',
        usuarioId: usuarios[2].id,
        proyectoId: proyectos[0].id,
      }
    ]);

    console.log('📊 Creando KPIs de prueba...');
    await KPI.bulkCreate([
      {
        tipo: 'EFICIENCIA_TIEMPO',
        valor: 95.5,
        periodo: 'ENERO_2024',
        fechaRegistro: new Date('2024-01-31'),
        proyectoId: proyectos[0].id,
      },
      {
        tipo: 'SATISFACCION_CLIENTE',
        valor: 4.8,
        periodo: 'ENERO_2024',
        fechaRegistro: new Date('2024-01-31'),
        proyectoId: proyectos[0].id,
      },
      {
        tipo: 'CUMPLIMIENTO_DEADLINE',
        valor: 88.0,
        periodo: 'FEBRERO_2024',
        fechaRegistro: new Date('2024-02-15'),
        proyectoId: proyectos[1].id,
      }
    ]);

    // 🔔 NUEVO: Crear notificaciones programadas de prueba
    console.log('⏰ Creando notificaciones programadas de prueba...');
    await NotificacionProgramada.bulkCreate([
      {
        titulo: '📅 Recordatorio: Reunión TechCorp',
        mensaje: 'Tu reunión de seguimiento TechCorp está programada en 5 minutos',
        tipo: 'recordatorio',
        fechaProgramada: new Date(now.getTime() + 2 * 60 * 60 * 1000 - 5 * 60 * 1000), // 5 min antes del recordatorio
        enviada: false,
        data: {
          recordatorioId: recordatorios[0].id,
          type: 'recordatorio',
          priority: 'HIGH'
        },
        usuarioId: usuarios[0].id,
        recordatorioId: recordatorios[0].id,
        proyectoId: proyectos[0].id,
      },
      {
        titulo: '🚨 Recordatorio URGENTE: Entrega FoodBrand',
        mensaje: 'Recordatorio urgente: Entrega de logotipos FoodBrand mañana',
        tipo: 'recordatorio',
        fechaProgramada: new Date(now.getTime() + 24 * 60 * 60 * 1000 - 5 * 60 * 1000), // 5 min antes del recordatorio
        enviada: false,
        data: {
          recordatorioId: recordatorios[1].id,
          type: 'urgente',
          priority: 'URGENT'
        },
        usuarioId: usuarios[1].id,
        recordatorioId: recordatorios[1].id,
        proyectoId: proyectos[1].id,
      },
      {
        titulo: '📋 Nuevo proyecto disponible',
        mensaje: 'Se ha creado un nuevo proyecto que requiere tu atención',
        tipo: 'proyecto',
        fechaProgramada: new Date(now.getTime() + 30 * 60 * 1000), // 30 minutos
        enviada: false,
        data: {
          type: 'proyecto',
          priority: 'NORMAL',
          proyectoId: proyectos[2].id
        },
        usuarioId: usuarios[2].id,
        proyectoId: proyectos[2].id,
      }
    ]);

    console.log('✅ ¡Datos de prueba creados exitosamente!');
    console.log('\n📊 Resumen de datos creados:');
    console.log(`👤 Usuarios: ${usuarios.length}`);
    console.log(`🏢 Clientes: ${clientes.length}`);
    console.log(`🎨 Marcas: ${marcas.length}`);
    console.log(`💼 Proyectos: ${proyectos.length}`);
    console.log(`📝 Recordatorios: ${recordatorios.length}`);
    console.log(`🔔 Notificaciones: 4`);
    console.log(`📅 Actividades: 3`);
    console.log(`📊 KPIs: 3`);
    console.log(`⏰ Notificaciones programadas: 3`); // 🔔 NUEVO
    
    console.log('\n🔑 Usuarios de prueba:');
    usuarios.forEach(usuario => {
      console.log(`📧 ${usuario.email} | 🔐 password123 | 👔 ${usuario.rol} | 🔔 Notif: ${usuario.notificacionesHabilitadas ? '✅' : '❌'}`);
    });

    console.log('\n🔔 Configuración de notificaciones:');
    console.log('📧 juan@brandingagency.com - Todas las notificaciones habilitadas');
    console.log('📧 maria@brandingagency.com - Todas las notificaciones habilitadas');
    console.log('📧 carlos@brandingagency.com - Recordatorios deshabilitados (para pruebas)');

    console.log('\n⏰ Notificaciones programadas:');
    console.log('🔸 Recordatorio TechCorp - se enviará en ~2 horas');
    console.log('🔸 Recordatorio URGENTE FoodBrand - se enviará en ~24 horas');
    console.log('🔸 Notificación de proyecto - se enviará en 30 minutos');

    console.log('\n🚀 Próximos pasos:');
    console.log('1. Ejecutar: npm run dev');
    console.log('2. Abrir GraphQL Playground: http://localhost:4000/graphql');
    console.log('3. Configurar la app Flutter con estos datos');
    console.log('4. Probar notificaciones con: npm run test:notifications');
    console.log('5. Ver health check: http://localhost:4000/health');

  } catch (error) {
    console.error('❌ Error al crear datos de prueba:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    if (sequelize) {
      console.log('🔌 Cerrando conexión a la base de datos...');
      await sequelize.close();
    }
  }
}

// Verificar si se está ejecutando directamente
if (require.main === module) {
  seed();
}

module.exports = seed;