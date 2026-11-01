/**
 * Script de Vaciado de Pruebas (DynamoDB)
 *
 * Utiliza @aws-sdk/lib-dynamodb para hacer Scan a las tablas:
 * - OrdersTable (GoneSurfing-Orders-prod)
 * - UsersTable (GoneSurfing-Users-prod)
 * - ComplaintsTable (GoneSurfing-Complaints-prod)
 *
 * Extrae las claves y ejecuta DeleteCommand para vaciar todos los registros
 * de prueba de pedidos, clientes y reclamos, dejando el catálogo de
 * productos (ProductsTable) y colecciones (CollectionsTable) intacto.
 */

import { createRequire } from "module"
import { fileURLToPath } from "url"
import path from "path"

const require = createRequire(import.meta.url)

let DynamoDBClient
let DynamoDBDocumentClient, ScanCommand, DeleteCommand

try {
  ;({ DynamoDBClient } = require("@aws-sdk/client-dynamodb"))
  ;({
    DynamoDBDocumentClient,
    ScanCommand,
    DeleteCommand,
  } = require("@aws-sdk/lib-dynamodb"))
} catch {
  try {
    ;({
      DynamoDBClient,
    } = require("../backend/node_modules/@aws-sdk/client-dynamodb"))
    ;({
      DynamoDBDocumentClient,
      ScanCommand,
      DeleteCommand,
    } = require("../backend/node_modules/@aws-sdk/lib-dynamodb"))
  } catch (err) {
    ;({
      DynamoDBClient,
    } = require("./backend/node_modules/@aws-sdk/client-dynamodb"))
    ;({
      DynamoDBDocumentClient,
      ScanCommand,
      DeleteCommand,
    } = require("./backend/node_modules/@aws-sdk/lib-dynamodb"))
  }
}

const REGION = process.env.AWS_REGION || "us-east-1"
const client = new DynamoDBClient({ region: REGION })
const docClient = DynamoDBDocumentClient.from(client)

const ORDERS_TABLE =
  process.env.ORDERS_TABLE ||
  process.env.OrdersTable ||
  "GoneSurfing-Orders-prod"
const USERS_TABLE =
  process.env.USERS_TABLE || process.env.UsersTable || "GoneSurfing-Users-prod"
const COMPLAINTS_TABLE =
  process.env.COMPLAINTS_TABLE ||
  process.env.ComplaintsTable ||
  "GoneSurfing-Complaints-prod"

export async function clearTable(tableName, keyName, filterFn = null) {
  console.log(`\n🔍 Escaneando tabla: ${tableName}...`)
  try {
    const scanRes = await docClient.send(
      new ScanCommand({ TableName: tableName }),
    )
    const items = scanRes.Items || []
    console.log(`📋 Encontrados ${items.length} registro(s) en ${tableName}.`)

    let deletedCount = 0
    for (const item of items) {
      if (filterFn && !filterFn(item)) {
        console.log(
          `⏭️  Omitiendo registro protegido: ${item[keyName] || item.email || item.id}`,
        )
        continue
      }

      const keyValue = item[keyName]
      if (keyValue === undefined) {
        console.warn(`⚠️  Registro sin clave primaria '${keyName}':`, item)
        continue
      }

      await docClient.send(
        new DeleteCommand({
          TableName: tableName,
          Key: { [keyName]: keyValue },
        }),
      )
      deletedCount++
      console.log(`   🗑️  Eliminado [${keyName}=${keyValue}] de ${tableName}`)
    }

    console.log(
      `✅ ${tableName}: ${deletedCount} registro(s) eliminados con éxito.`,
    )
    return deletedCount
  } catch (err) {
    console.error(`❌ Error vaciando tabla ${tableName}:`, err.message)
    throw err
  }
}

export async function run() {
  console.log("============================================================")
  console.log("🧹 INICIANDO LIMPIEZA DE DATOS DE PRUEBA EN DYNAMODB")
  console.log(`   Región: ${REGION}`)
  console.log("   Tablas a vaciar: OrdersTable, UsersTable, ComplaintsTable")
  console.log("   Tablas protegidas (INTACTAS): ProductsTable, CollectionsTable")
  console.log("============================================================")

  // 1. Vaciar Pedidos (OrdersTable)
  const deletedOrders = await clearTable(ORDERS_TABLE, "id")

  // 2. Vaciar Reclamos (ComplaintsTable)
  const deletedComplaints = await clearTable(COMPLAINTS_TABLE, "id")

  // 3. Vaciar Clientes de prueba (UsersTable) - Protegiendo cuenta principal de admin
  const deletedUsers = await clearTable(USERS_TABLE, "email", (item) => {
    // Proteger cuenta admin para no perder acceso al panel administrativo
    const isMainAdmin =
      item.role === "admin" ||
      item.username === "admin" ||
      item.email === "admin@gonesurfing.pe" ||
      item.email === "admin"
    return !isMainAdmin
  })

  console.log("\n============================================================")
  console.log("🎉 VACIADO DE DATOS DE PRUEBA COMPLETADO SATISFACTORIAMENTE")
  console.log(`   • Pedidos eliminados: ${deletedOrders}`)
  console.log(`   • Reclamos eliminados: ${deletedComplaints}`)
  console.log(`   • Clientes eliminados: ${deletedUsers}`)
  console.log("   • Catálogo de Productos y Colecciones: 100% INTACTO")
  console.log("============================================================")
}

// Auto-ejecución si se llama directamente
const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
if (isMain) {
  run().catch((err) => {
    console.error("Fallo crítico en el script:", err)
    process.exit(1)
  })
}
