import { loginUser, registerUser } from "../services/auth";
import { createAccount, createTransaction } from "../services/finance";

/**
 * Script de validación manual para flujos híbridos (Firebase + SQLite).
 * Ejecutar con precaución ya que realiza operaciones reales en Firebase.
 */
async function runManualValidation() {
  console.log("🚀 Iniciando validación de flujo híbrido...");

  const testEmail = `test_${Date.now()}@example.com`;
  const testPass = "password123";

  try {
    // 1. Probar Registro
    console.log(`📝 Probando registro con: ${testEmail}`);
    const regRes = await registerUser({
      email: testEmail,
      password: testPass,
      first_name: "Test",
      last_name: "User"
    });
    console.log("✅ Registro exitoso. UID Local:", regRes.user.id);

    // 2. Probar Creación de Cuenta (y Sincronización)
    console.log("💳 Creando cuenta de ahorros...");
    const account = await createAccount({
      name: "Ahorros Validacion",
      account_type: "BANK"
    });
    console.log("✅ Cuenta creada y sincronizada. ID:", account.id);

    // 3. Probar Transacción (y Sincronización de Balance)
    console.log("💰 Registrando ingreso de $1000...");
    // Nota: Usamos ID de categoría 1 (Salario) que se crea en el seed
    const tx = await createTransaction({
      account: account.id,
      category: 1, 
      amount: "1000.00",
      transaction_type: "INCOME",
      description: "Ingreso de prueba",
      date: new Date().toISOString().split('T')[0]
    });
    console.log("✅ Transacción registrada. Nuevo balance local esperado: $1000");

    // 4. Probar Login (Sincronización inversa)
    console.log("🔑 Probando login con las mismas credenciales...");
    const loginRes = await loginUser({
      email: testEmail,
      password: testPass
    });
    console.log("✅ Login exitoso. Usuario:", loginRes.user.email);

  } catch (error) {
    console.error("❌ Error en la validación:", error);
  }
}

// Para ejecutar: Importar y llamar en un componente de desarrollo o mediante un script de node si el entorno lo permite.
// export default runManualValidation;
