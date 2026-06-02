import type { SQLiteDatabase } from "expo-sqlite";

export async function syncUser(db: SQLiteDatabase, userId: number, cloudData: any, firebaseUser: any) {
  if (cloudData.user) {
    const cloudFirstName = cloudData.user.first_name || cloudData.user.firstName;
    const cloudLastName = cloudData.user.last_name || cloudData.user.lastName;

    console.log("ℹ️ Datos de usuario en la nube encontrados:", { cloudFirstName, cloudLastName });

    if (cloudFirstName) {
      await db.runAsync(
        "UPDATE users SET first_name = ?, last_name = ? WHERE id = ?;",
        [cloudFirstName, cloudLastName || "", userId]
      );
      console.log("✅ Base local actualizada con nombre de la nube:", cloudFirstName, cloudLastName);
    } else if (firebaseUser.displayName) {
      const fbFirstName = firebaseUser.displayName.split(" ")[0];
      const fbLastName = firebaseUser.displayName.split(" ").slice(1).join(" ");
      await db.runAsync(
        "UPDATE users SET first_name = ?, last_name = ? WHERE id = ?;",
        [fbFirstName, fbLastName, userId]
      );
      console.log("✅ Base local actualizada con nombre de Firebase (fallback):", fbFirstName, fbLastName);
    }
  } else if (firebaseUser.displayName) {
    const fbFirstName = firebaseUser.displayName.split(" ")[0];
    const fbLastName = firebaseUser.displayName.split(" ").slice(1).join(" ");
    await db.runAsync(
      "UPDATE users SET first_name = ?, last_name = ? WHERE id = ?;",
      [fbFirstName, fbLastName, userId]
    );
    console.log("✅ Base local actualizada con nombre de Firebase (no cloud user):", fbFirstName, fbLastName);
  }
}

export async function syncAccounts(db: SQLiteDatabase, userId: number, cloudAccounts: any[], localAccounts: any[]) {
  for (const cloudAcc of cloudAccounts) {
    const existing = localAccounts.find(a => a.name.toLowerCase() === cloudAcc.name.toLowerCase());
    if (!existing) {
      await db.runAsync(
        "INSERT INTO accounts (user_id, name, account_type, balance, created_at) VALUES (?, ?, ?, ?, ?);",
        [userId, cloudAcc.name, cloudAcc.account_type, cloudAcc.balance, cloudAcc.created_at || new Date().toISOString()]
      );
    } else {
      await db.runAsync(
        "UPDATE accounts SET balance = ? WHERE id = ? AND user_id = ?;",
        [cloudAcc.balance, existing.id, userId]
      );
    }
  }
}

export async function syncCategories(db: SQLiteDatabase, userId: number, cloudCategories: any[], localCategories: any[]) {
  for (const cloudCat of cloudCategories) {
    const existing = localCategories.find(c => 
      c.name.toLowerCase() === cloudCat.name.toLowerCase() && 
      c.category_type === cloudCat.category_type
    );
    if (!existing) {
      await db.runAsync(
        "INSERT INTO categories (user_id, name, category_type, created_at) VALUES (?, ?, ?, ?);",
        [userId, cloudCat.name, cloudCat.category_type, cloudCat.created_at || new Date().toISOString()]
      );
    }
  }
}

export async function syncTransactions(
  db: SQLiteDatabase, 
  userId: number, 
  cloudTransactions: any[], 
  localTransactions: any[],
  updatedAccounts: any[],
  updatedCategories: any[]
) {
  for (const cloudTx of cloudTransactions) {
    const targetAccount = updatedAccounts.find(a => a.name.toLowerCase() === cloudTx.account_name.toLowerCase());
    const targetCategory = updatedCategories.find(c => c.name.toLowerCase() === cloudTx.category_name.toLowerCase());

    if (!targetAccount || !targetCategory) continue;

    const isDuplicate = localTransactions.some(lt => 
      lt.date === cloudTx.date &&
      lt.amount === cloudTx.amount &&
      lt.transaction_type === cloudTx.transaction_type &&
      lt.account_name.toLowerCase() === cloudTx.account_name.toLowerCase() &&
      lt.category_name.toLowerCase() === cloudTx.category_name.toLowerCase()
    );

    if (!isDuplicate) {
      await db.runAsync(
        `INSERT INTO transactions (user_id, account_id, category_id, amount, transaction_type, description, date, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          userId, 
          targetAccount.id, 
          targetCategory.id, 
          cloudTx.amount, 
          cloudTx.transaction_type, 
          cloudTx.description, 
          cloudTx.date, 
          cloudTx.created_at || new Date().toISOString()
        ]
      );
    }
  }
}
