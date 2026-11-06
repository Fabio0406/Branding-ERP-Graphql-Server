// scripts/testNotifications.js
require('dotenv').config();
const FirebaseService = require('../services/firebaseService');

async function testNotifications() {
  console.log('🧪 Iniciando pruebas de notificaciones Firebase...');
  
  // Token de prueba (reemplaza con un token real de tu app)
  const testToken = process.env.TEST_FCM_TOKEN || process.argv[2]; // token FCM de un dispositivo de prueba
  
  if (!testToken) {
    console.log('❌ Pasa un token FCM: npm run test:notifications -- <token>  (o define TEST_FCM_TOKEN en .env)');
    console.log('💡 Puedes obtener un token desde tu app Flutter ejecutando: print(FirebaseMessaging.instance.getToken())');
    return;
  }
  
  try {
    // Test 1: Validar token
    console.log('\n1️⃣ Validando token FCM...');
    const isValid = await FirebaseService.validateToken(testToken);
    console.log(`Token válido: ${isValid ? '✅' : '❌'}`);
    
    if (!isValid) {
      console.log('❌ Token inválido, no se pueden realizar más pruebas');
      return;
    }
    
    // Test 2: Notificación simple
    console.log('\n2️⃣ Enviando notificación simple...');
    const result1 = await FirebaseService.sendToToken(
      testToken,
      {
        title: '🧪 Prueba Simple',
        body: 'Esta es una notificación de prueba desde el servidor'
      },
      {
        type: 'recordatorio',
        priority: 'NORMAL'
      }
    );
    console.log('Resultado:', result1);
    
    // Esperar 2 segundos
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 3: Notificación urgente
    console.log('\n3️⃣ Enviando notificación urgente...');
    const result2 = await FirebaseService.sendToToken(
      testToken,
      {
        title: '🚨 Prueba Urgente',
        body: 'Esta es una notificación urgente de prueba'
      },
      {
        type: 'urgente',
        priority: 'URGENT',
        recordatorioId: '123'
      }
    );
    console.log('Resultado:', result2);
    
    // Esperar 2 segundos
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 4: Notificación de proyecto
    console.log('\n4️⃣ Enviando notificación de proyecto...');
    const result3 = await FirebaseService.sendToToken(
      testToken,
      {
        title: '📋 Nuevo Proyecto',
        body: 'Se te ha asignado un nuevo proyecto: Rebranding TechCorp'
      },
      {
        type: 'proyecto',
        priority: 'HIGH',
        proyectoId: '456'
      }
    );
    console.log('Resultado:', result3);
    
    // Test 5: Suscribir a topic
    console.log('\n5️⃣ Suscribiendo a topic de prueba...');
    const result4 = await FirebaseService.subscribeToTopic([testToken], 'test_topic');
    console.log('Resultado suscripción:', result4);
    
    // Test 6: Notificación a topic
    console.log('\n6️⃣ Enviando notificación al topic...');
    const result5 = await FirebaseService.sendToTopic(
      'test_topic',
      {
        title: '📢 Notificación General',
        body: 'Esta es una notificación enviada a todos los suscritos al topic'
      },
      {
        type: 'general',
        priority: 'NORMAL'
      }
    );
    console.log('Resultado topic:', result5);
    
    console.log('\n✅ Todas las pruebas completadas');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  testNotifications();
}

module.exports = testNotifications;