"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const NotifyNewUser_1 = require("../core/usecases/NotifyNewUser");
const TelegramService_1 = require("../infrastructure/services/TelegramService");
async function test() {
    console.log("🧪 Iniciando prueba de notificación de usuario...");
    // El servicio leerá los secretos de process.env si estamos en entorno local de prueba
    const service = new TelegramService_1.TelegramService();
    const useCase = new NotifyNewUser_1.NotifyNewUser(service);
    const testUser = {
        uid: "test-uid-12345",
        email: "usuario_con_guion@example.com",
        displayName: "Juan _Perez* Test"
    };
    console.log("Enviando usuario con caracteres especiales: ", testUser);
    try {
        await useCase.execute(testUser);
        console.log("✅ Prueba completada (Verificar en Telegram si llegó el mensaje)");
    }
    catch (error) {
        console.error("❌ Error en la prueba:", error);
    }
}
test();
//# sourceMappingURL=testUserNotify.js.map