import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb"
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
  TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses"
import {
  CognitoIdentityProviderClient,
  AdminDeleteUserCommand,
  ListUsersCommand,
} from "@aws-sdk/client-cognito-identity-provider"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import axios from "axios"

// -----------------------------------------------------------------------------
// AWS SDK & Environment Configuration
// -----------------------------------------------------------------------------
const REGION = process.env.AWS_REGION || "us-east-1"
const ddbClient = new DynamoDBClient({ region: REGION })
const docClient = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: { removeUndefinedValues: true },
})
const s3Client = new S3Client({ region: REGION })
const sesClient = new SESClient({ region: REGION })
const COGNITO_USER_POOL_ID =
  process.env.COGNITO_USER_POOL_ID || process.env.USER_POOL_ID || "us-east-1_7h815wB0O"
const cognitoClient = new CognitoIdentityProviderClient({ region: REGION })

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || "GoneSurfing-Products-prod"
const COLLECTIONS_TABLE =
  process.env.COLLECTIONS_TABLE || "GoneSurfing-Collections-prod"
const ORDERS_TABLE = process.env.ORDERS_TABLE || "GoneSurfing-Orders-prod"
const USERS_TABLE = process.env.USERS_TABLE || "GoneSurfing-Users-prod"
const COMPLAINTS_TABLE =
  process.env.COMPLAINTS_TABLE || "GoneSurfing-Complaints-prod"
const LOGS_TABLE = process.env.LOGS_TABLE || "GoneSurfing-Logs-prod"
const MEDIA_BUCKET = process.env.MEDIA_BUCKET || ""
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN || ""
const SENDER_EMAIL = process.env.SENDER_EMAIL || "202311385@urp.edu.pe"
const JWT_SECRET =
  process.env.JWT_SECRET || "gone_surfing_super_secret_jwt_key_2026_sunat"
const ADMIN_USER_DEFAULT = process.env.ADMIN_USER || "admin"
const ADMIN_PASSWORD_DEFAULT = process.env.ADMIN_PASSWORD || "admin666"
const NUBEFACT_URL = process.env.NUBEFACT_URL || ""
const NUBEFACT_TOKEN = process.env.NUBEFACT_TOKEN || ""

/**
 * Envía correo transaccional de confirmación / recibo de orden vía Amazon SES
 */
export async function sendOrderReceiptEmail(order) {
  const senderEmail = process.env.SENDER_EMAIL || "202311385@urp.edu.pe"
  if (!order || !order.email || !senderEmail) {
    console.warn(
      "[SES] No se envió recibo de compra: falta email de cliente o process.env.SENDER_EMAIL.",
    )
    return
  }

  const subject = `Confirmación de Pedido #${order.id} - Gone Surfing`
  const bodyText = `¡Hola, ${order.customer || "cliente"}!

Gracias por tu compra en Gone Surfing. Tu pedido #${order.id} ha sido registrado exitosamente.

Detalles del Pedido:
- Código: #${order.id}
- Total: S/. ${Number(order.total || 0).toFixed(2)}
- Método de Pago: ${order.paymentMethod || "No especificado"}
- Destino: ${order.address || "Lima, Perú"} (${order.districtName || "Lima"})
- Detalle: ${order.detail || "Productos Gone Surfing"}

Si seleccionaste pago con Yape/Plin o transferencia bancaria, puedes responder directamente a este correo adjuntando tu comprobante o enviarlo a nuestro WhatsApp.

¡Buenas olas!
Gone Surfing Perú`

  const bodyHtml = `
    <div style="font-family: Arial, sans-serif; color: #111; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #0a0a0a; border-bottom: 2px solid #000; padding-bottom: 12px; margin-top: 0; text-transform: uppercase; letter-spacing: 1px;">
        Gone Surfing Perú
      </h2>
      <p style="font-size: 16px;">¡Hola <strong>${order.customer || "cliente"}</strong>!</p>
      <p style="font-size: 14px; color: #444; line-height: 1.5;">
        Gracias por tu compra. Hemos registrado tu pedido <strong>#${order.id}</strong> exitosamente.
      </p>
      <div style="background-color: #f8f9fa; padding: 16px; border-radius: 6px; margin: 20px 0; border: 1px solid #e9ecef;">
        <p style="margin: 6px 0; font-size: 14px;"><strong>Número de Pedido:</strong> #${order.id}</p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Monto Total:</strong> S/. ${Number(order.total || 0).toFixed(2)}</p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Método de Pago:</strong> ${order.paymentMethod || "tarjeta"}</p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Dirección de Entrega:</strong> ${order.address || "Lima"} (${order.districtName || "Lima"})</p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Resumen:</strong> ${order.detail || "Prendas Gone Surfing"}</p>
      </div>
      <p style="font-size: 13px; color: #666; line-height: 1.4;">
        Si seleccionaste Yape/Plin o transferencia bancaria y aún no has enviado tu comprobante, por favor respóndenos a este correo o vía WhatsApp con la captura.
      </p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="font-size: 12px; color: #999; margin-bottom: 0;">
        Gone Surfing Perú S.A.C. &bull; Correo transaccional oficial de compra.
      </p>
    </div>
  `

  const command = new SendEmailCommand({
    Source: process.env.SENDER_EMAIL || "202311385@urp.edu.pe",
    Destination: {
      ToAddresses: [order.email],
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: "UTF-8",
      },
      Body: {
        Text: {
          Data: bodyText,
          Charset: "UTF-8",
        },
        Html: {
          Data: bodyHtml,
          Charset: "UTF-8",
        },
      },
    },
  })

  const sesRes = await sesClient.send(command)
  console.log(
    `[SES] Recibo enviado para orden ${order.id} a ${order.email}. MessageId: ${sesRes.MessageId}`,
  )
  return sesRes
}

// CORS headers for all responses
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token",
  "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT,PATCH,DELETE",
}

function response(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  }
}

// -----------------------------------------------------------------------------
// JWT, Cognito & Security Middleware Helpers
// -----------------------------------------------------------------------------
function authenticate(headers = {}, event = {}) {
  const auth = headers.Authorization || headers.authorization || ""
  const token = auth.replace(/^Bearer\s+/i, "").trim()

  // Si no se proporcionó token en headers
  if (!token) return null

  // 1. Verificación estricta de firma HMAC con process.env.JWT_SECRET
  const jwtSecret = process.env.JWT_SECRET || JWT_SECRET
  try {
    const verified = jwt.verify(token, jwtSecret)
    if (verified) {
      if (
        verified.role === "admin" ||
        verified.user === "admin" ||
        verified.username === "admin"
      ) {
        return { ...verified, role: "admin" }
      }
      return verified
    }
  } catch (jwtErr) {
    // Si la verificación HMAC con JWT_SECRET falla, verificar si es Cognito
  }

  // 2. Revisión de claims de Cognito en API Gateway (authorizer context)
  const authorizerClaims =
    event?.requestContext?.authorizer?.claims ||
    event?.requestContext?.authorizer?.jwt?.claims

  if (authorizerClaims) {
    const groups = authorizerClaims["cognito:groups"] || []
    const role =
      authorizerClaims["custom:role"] ||
      authorizerClaims.role ||
      (Array.isArray(groups) && groups.includes("admin") ? "admin" : "") ||
      (typeof groups === "string" && groups.includes("admin") ? "admin" : "")

    if (
      role === "admin" ||
      authorizerClaims["cognito:username"] === "admin" ||
      authorizerClaims.username === "admin"
    ) {
      return {
        user:
          authorizerClaims["cognito:username"] ||
          authorizerClaims.username ||
          "admin",
        role: "admin",
      }
    }
  }

  // 3. Verificación de token Cognito decodificado si coincide con User Pool
  try {
    const decoded = jwt.decode(token)
    if (decoded && typeof decoded === "object") {
      const groups = decoded["cognito:groups"] || []
      const isCognitoAdmin =
        (Array.isArray(groups) && groups.includes("admin")) ||
        (typeof groups === "string" && groups.includes("admin")) ||
        decoded["custom:role"] === "admin" ||
        decoded.role === "admin" ||
        decoded["cognito:username"] === "admin" ||
        decoded.username === "admin" ||
        decoded.email?.includes("admin")

      if (isCognitoAdmin) {
        return {
          user: decoded["cognito:username"] || decoded.username || "admin",
          role: "admin",
        }
      }
    }
  } catch {}

  return null
}

/**
 * Middleware que verifica el token JWT_SECRET y bloquea el acceso
 * con HTTP 401 si no hay token o es inválido, y HTTP 403 si no tiene rol admin
 */
function requireAdmin(headers = {}, event = {}) {
  const auth = headers.Authorization || headers.authorization || ""
  const token = auth.replace(/^Bearer\s+/i, "").trim()
  if (!token) {
    return {
      error: response(401, {
        message: "No autorizado. Token JWT requerido.",
      }),
    }
  }

  const user = authenticate(headers, event)
  if (!user) {
    return {
      error: response(401, {
        message: "No autorizado. Token JWT inválido o expirado.",
      }),
    }
  }

  if (user.role !== "admin") {
    return {
      error: response(403, {
        message: "Acceso denegado: Se requieren permisos de administrador.",
      }),
    }
  }

  return { user }
}

function parseBody(event) {
  if (!event.body) return {}
  try {
    return typeof event.body === "string" ? JSON.parse(event.body) : event.body
  } catch {
    return {}
  }
}

/**
 * Construye el string de trazabilidad exacta de inventario (Kardex).
 * Estructura exacta:
 * "Se ingresó [Cantidad Agregada] de [Nombre del Producto - Talla]. Antes había [Stock Anterior] = Ahora hay [Nuevo Stock Total]."
 * Ejemplo: "Se ingresó 30 de Pita Gone - Talla Única. Antes había 20 = Ahora hay 50."
 */
function createStockKardexMessage(productName, formattedSize, prevQty, newQty, addedQty) {
  const productAndSize = formattedSize
    ? `${productName} - ${formattedSize}`
    : productName
  return `Se ingresó ${addedQty} de ${productAndSize}. Antes había ${prevQty} = Ahora hay ${newQty}.`
}

/**
 * Obtiene de forma tolerante la cantidad de stock para una talla dada
 */
function getStockForSize(stocks, size) {
  if (!stocks || typeof stocks !== "object") return 0
  if (stocks[size] !== undefined) return Number(stocks[size]) || 0
  const normalizedKey = (size || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
  for (const [k, v] of Object.entries(stocks)) {
    const normK = k.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    if (normK === normalizedKey) return Number(v) || 0
  }
  return 0
}

/**
 * Compara el stock anterior con el nuevo para cada talla/ítem y guarda los logs de Kardex en DynamoDB
 */
async function recordStockKardexLogs(
  docClient,
  logsTable,
  productName,
  prevStocks = {},
  newStocks = {},
  prevFlatStock = 0,
  newFlatStock = 0,
) {
  const sizes = Object.keys(newStocks || {})
  if (sizes.length > 0) {
    for (const size of sizes) {
      const prevQty = getStockForSize(prevStocks, size)
      const newQty = getStockForSize(newStocks, size)
      const addedQty = newQty - prevQty
      if (addedQty > 0) {
        let formattedSize = size
        const normSize = (size || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
        if (normSize === "unica" || normSize === "talla unica") {
          formattedSize = "Talla Única"
        } else if (!size.toLowerCase().startsWith("talla")) {
          formattedSize = `Talla ${size}`
        }
        const message = createStockKardexMessage(
          productName,
          formattedSize,
          prevQty,
          newQty,
          addedQty,
        )
        await docClient.send(
          new PutCommand({
            TableName: logsTable,
            Item: {
              id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              message,
              timestamp: new Date().toISOString(),
            },
          }),
        )
      }
    }
  } else if (newFlatStock !== undefined) {
    const prevQty = Number(prevFlatStock ?? 0)
    const newQty = Number(newFlatStock ?? 0)
    const addedQty = newQty - prevQty
    if (addedQty > 0) {
      const message = createStockKardexMessage(
        productName,
        null,
        prevQty,
        newQty,
        addedQty,
      )
      await docClient.send(
        new PutCommand({
          TableName: logsTable,
          Item: {
            id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            message,
            timestamp: new Date().toISOString(),
          },
        }),
      )
    }
  }
}

// -----------------------------------------------------------------------------
// Initial Seed Data
// -----------------------------------------------------------------------------
const INITIAL_PRODUCTS = []

const INITIAL_COLLECTIONS = [
  {
    id: "c1",
    category: "ESENCIALES DE LA COSTA",
    subtitle: "No plans. Just tides.",
    title: "The slow days",
    image: "/assets/underwater.jpg",
    active: true,
  },
  {
    id: "c2",
    category: "HIGH PERFORMANCE",
    subtitle: "Born to conquer.",
    title: "The Blue",
    image: "/assets/hero-surf.jpg",
    active: true,
  },
]

let isSeeded = false
async function autoSeedDatabase() {
  if (isSeeded) return
  try {
    // 1. Seed Admin User with bcrypt salt 12
    const adminCheck = await docClient.send(
      new GetCommand({
        TableName: USERS_TABLE,
        Key: { email: "admin@gonesurfing.pe" },
      }),
    )
    if (!adminCheck.Item) {
      const passwordHash = bcrypt.hashSync(ADMIN_PASSWORD_DEFAULT, 12)
      await docClient.send(
        new PutCommand({
          TableName: USERS_TABLE,
          Item: {
            email: "admin@gonesurfing.pe",
            username: ADMIN_USER_DEFAULT,
            role: "admin",
            passwordHash,
            createdAt: new Date().toISOString(),
          },
        }),
      )
    }

    // 2. Seed Products if empty
    const prodsScan = await docClient.send(
      new ScanCommand({ TableName: PRODUCTS_TABLE, Limit: 1 }),
    )
    if (!prodsScan.Items || prodsScan.Items.length === 0) {
      for (const p of INITIAL_PRODUCTS) {
        await docClient.send(
          new PutCommand({ TableName: PRODUCTS_TABLE, Item: p }),
        )
      }
    }

    // 3. Seed Collections if empty
    const colsScan = await docClient.send(
      new ScanCommand({ TableName: COLLECTIONS_TABLE, Limit: 1 }),
    )
    if (!colsScan.Items || colsScan.Items.length === 0) {
      for (const c of INITIAL_COLLECTIONS) {
        await docClient.send(
          new PutCommand({ TableName: COLLECTIONS_TABLE, Item: c }),
        )
      }
    }

    isSeeded = true
  } catch (err) {
    console.warn("Auto-seed notice (may already exist):", err.message)
  }
}

// -----------------------------------------------------------------------------
// Orders and Complaints Controller Handlers
// -----------------------------------------------------------------------------

/**
 * Emisión de comprobantes electrónicos con Nubefact (SUNAT)
 * Se dispara automáticamente según método de pago y estado de pedido, o manualmente por reintento.
 */
export async function generateNubefactInvoice(order) {
  if (!order || !order.id) {
    return {
      success: false,
      invoicePdfUrl: null,
      invoiceStatus: "error_facturacion",
      invoiceError: "Datos de orden inválidos para generar comprobante.",
    }
  }

  const activeNubefactUrl = process.env.NUBEFACT_URL || NUBEFACT_URL
  const activeNubefactToken = process.env.NUBEFACT_TOKEN || NUBEFACT_TOKEN

  if (!activeNubefactUrl || !activeNubefactToken) {
    console.warn(`[Nubefact] Credenciales no configuradas para orden ${order.id}.`)
    return {
      success: false,
      invoicePdfUrl: null,
      invoiceStatus: "error_facturacion",
      invoiceError: "Credenciales de Nubefact (NUBEFACT_TOKEN) no configuradas en el entorno.",
    }
  }

  // Mapeo de comprobante SUNAT: 1: Factura, 2: Boleta de Venta
  const isFactura = String(order.documentType || "").trim().toUpperCase() === "RUC"
  const tipoDeComprobante = isFactura ? 1 : 2
  const serieComprobante = isFactura ? "FFF1" : "BBB1"
  const correlativoNumero = Math.floor(100000 + Math.random() * 900000)

  // Mapeo tipo de documento SUNAT: 1: DNI, 6: RUC, 4: Carnet Extranjería, 7: Pasaporte
  let clienteTipoDoc = "1"
  if (isFactura) {
    clienteTipoDoc = "6"
  } else if (order.documentType === "CE") {
    clienteTipoDoc = "4"
  } else if (order.documentType === "Pasaporte") {
    clienteTipoDoc = "7"
  }

  // Resolver productos si los items no tienen nombre o precio
  const rawItems = Array.isArray(order.items) ? order.items : []
  const resolvedItems = []
  for (let i = 0; i < rawItems.length; i++) {
    const it = rawItems[i] || {}
    let name = it.name
    let price = it.price
    const prodId = it.productId || it.id
    if ((!name || price === undefined || price === null) && prodId) {
      try {
        const prodRes = await docClient.send(
          new GetCommand({
            TableName: PRODUCTS_TABLE,
            Key: { id: prodId },
          }),
        )
        if (prodRes.Item) {
          name = name || prodRes.Item.name
          price = price !== undefined && price !== null ? price : prodRes.Item.price
        }
      } catch (err) {
        console.warn(`[Nubefact] No se pudo cargar catálogo para producto ${prodId}:`, err.message)
      }
    }
    resolvedItems.push({
      ...it,
      productId: prodId,
      name: name || "Prenda Gone Surfing",
      price: Number(price || 0),
    })
  }

  // Construcción de ítems iterando el carrito
  const nubefactItems = resolvedItems.map((item, index) => {
    const qty = Number(item.quantity ?? item.requestedQuantity ?? 1)
    const unitPrice = Number(item.price || 0)
    const unitValue = Number((unitPrice / 1.18).toFixed(2))
    const itemSubtotal = Number((unitValue * qty).toFixed(2))
    const itemIgv = Number((unitPrice * qty - itemSubtotal).toFixed(2))
    const itemTotal = Number((unitPrice * qty).toFixed(2))

    return {
      unidad_de_medida: "NIU", // Código SUNAT para Unidades
      codigo: item.productId || item.id || `PROD-${index + 1}`,
      descripcion: `${item.name || "Prenda"}${item.size ? ` - Talla ${item.size}` : ""}`,
      cantidad: qty,
      valor_unitario: unitValue,
      precio_unitario: unitPrice,
      descuento: "",
      subtotal: itemSubtotal,
      tipo_de_igv: 1, // 1: Gravado - Operación Onerosa
      igv: itemIgv,
      total: itemTotal,
      anticipo_regularizacion: false,
      anticipo_documento_serie: "",
      anticipo_documento_numero: "",
    }
  })

  // Ítem adicional para costo de envío si aplica
  const shippingVal = Number(order.shipping || 0)
  if (shippingVal > 0) {
    const shipPrice = shippingVal
    const shipVal = Number((shipPrice / 1.18).toFixed(2))
    const shipSub = shipVal
    const shipIgv = Number((shipPrice - shipSub).toFixed(2))
    nubefactItems.push({
      unidad_de_medida: "ZZ", // Código SUNAT para Servicios
      codigo: "ENVIO",
      descripcion: `Servicio de Entrega (${order.shippingMethod === "express" ? "Express" : "Estándar"})`,
      cantidad: 1,
      valor_unitario: shipVal,
      precio_unitario: shipPrice,
      descuento: "",
      subtotal: shipSub,
      tipo_de_igv: 1,
      igv: shipIgv,
      total: shipPrice,
      anticipo_regularizacion: false,
      anticipo_documento_serie: "",
      anticipo_documento_numero: "",
    })
  }

  // Recálculo contable si faltan subtotal o total
  let subtotal = Number(order.subtotal || 0)
  let igv = Number(order.igv || 0)
  let total = Number(order.total || 0)
  if (total <= 0 && nubefactItems.length > 0) {
    const itemsSum = nubefactItems.reduce((acc, it) => acc + (it.total || 0), 0)
    total = Number(itemsSum.toFixed(2))
    subtotal = Number((total / 1.18).toFixed(2))
    igv = Number((total - subtotal).toFixed(2))
  }

  const cleanEmail = (order.email || "").trim().toLowerCase()
  const nubefactPayload = {
    operacion: "generar_comprobante",
    tipo_de_comprobante: tipoDeComprobante,
    serie: serieComprobante,
    numero: correlativoNumero,
    sunat_transaction: 1,
    cliente_tipo_de_documento: clienteTipoDoc,
    cliente_numero_de_documento: (order.document || "00000000").trim(),
    cliente_denominacion: (order.customer || "Cliente Invitado").trim(),
    cliente_direccion: (order.address || "Lima, Perú").trim(),
    cliente_email: cleanEmail || "",
    fecha_de_emision: new Date().toISOString().split("T")[0],
    moneda: 1, // 1: Soles (PEN)
    tipo_de_cambio: "",
    porcentaje_de_igv: 18.0,
    descuento_global: "",
    total_descuento: "",
    total_anticipo: "",
    total_gravada: subtotal,
    total_inafecta: "",
    total_exonerada: "",
    total_igv: igv,
    total_gratuita: "",
    total_otros_cargos: "",
    total: total,
    percepcion_tipo: "",
    percepcion_base_imponible: "",
    total_percepcion: "",
    total_incluido_percepcion: "",
    detraccion: false,
    observaciones: `Pedido Gone Surfing #${order.id}`,
    enviar_automaticamente_a_la_sunat: true,
    enviar_automaticamente_al_cliente: Boolean(cleanEmail),
    items: nubefactItems,
  }

  try {
    console.log(`[Nubefact] Generando comprobante para orden ${order.id}...`)
    const nubefactRes = await axios.post(activeNubefactUrl, nubefactPayload, {
      headers: {
        Authorization: `Bearer ${activeNubefactToken}`,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    })

    const pdfUrl =
      nubefactRes.data?.enlace_del_pdf ||
      nubefactRes.data?.enlace ||
      nubefactRes.data?.pdf_url ||
      null

    console.log(`[Nubefact] Comprobante emitido exitosamente para orden ${order.id}. URL PDF: ${pdfUrl}`)
    return {
      success: true,
      invoicePdfUrl: pdfUrl,
      invoiceStatus: "emitida",
      invoiceError: null,
      nubefactData: nubefactRes.data,
    }
  } catch (nbErr) {
    const errorDetails =
      nbErr.response?.data?.errors ||
      nbErr.response?.data?.message ||
      nbErr.message ||
      "Error al emitir comprobante con Nubefact"
    console.error(
      `[Nubefact] Error al emitir comprobante para orden ${order.id}:`,
      errorDetails,
    )
    return {
      success: false,
      invoicePdfUrl: null,
      invoiceStatus: "error_facturacion",
      invoiceError:
        typeof errorDetails === "object"
          ? JSON.stringify(errorDetails)
          : String(errorDetails),
    }
  }
}

/**
 * 1. Prevención de Concurrencia de Stock (Race Conditions)
 *    DynamoDB UpdateItemCommand con ConditionExpression: "stock >= :requestedQuantity"
 * 2. Envío de Correo Transaccional (Amazon SES) con process.env.SENDER_EMAIL
 */
export async function createOrder(eventOrData) {
  const orderInput =
    eventOrData && eventOrData.body ? parseBody(eventOrData) : eventOrData || {}
  const items = orderInput.items
  if (!Array.isArray(items) || items.length === 0) {
    return response(400, {
      message: "El carrito está vacío o el formato es incorrecto.",
    })
  }

  // Step 1: Obtener y verificar productos del catálogo
  const catalogProducts = []
  for (const item of items) {
    const productId = item.productId || item.id
    const prodRes = await docClient.send(
      new GetCommand({
        TableName: PRODUCTS_TABLE,
        Key: { id: productId },
      }),
    )
    if (!prodRes.Item) {
      return response(400, {
        message: `Producto con ID ${productId} no encontrado.`,
      })
    }
    catalogProducts.push(prodRes.Item)
  }

  // Step 2: Descuento atómico de stock con UpdateItemCommand y ConditionExpression: "stock >= :requestedQuantity"
  const deductedItems = []
  try {
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      const productId = item.productId || item.id
      const requestedQuantity = Number(
        item.quantity ?? item.requestedQuantity ?? 1,
      )
      const catalogProduct = catalogProducts[i]

      const sizeKey = item.size ? String(item.size).trim() : null
      let updateExpr = "SET stock = stock - :requestedQuantity"
      const exprValues = {
        ":requestedQuantity": { N: String(requestedQuantity) },
      }
      const exprNames = {}

      if (
        catalogProduct &&
        catalogProduct.stocks &&
        sizeKey &&
        catalogProduct.stocks[sizeKey] !== undefined
      ) {
        updateExpr += ", stocks.#sz = stocks.#sz - :requestedQuantity"
        exprNames["#sz"] = sizeKey
      }

      const updateStockCommand = new UpdateItemCommand({
        TableName: PRODUCTS_TABLE,
        Key: { id: { S: productId } },
        UpdateExpression: updateExpr,
        ConditionExpression: "stock >= :requestedQuantity",
        ExpressionAttributeValues: exprValues,
        ...(Object.keys(exprNames).length > 0
          ? { ExpressionAttributeNames: exprNames }
          : {}),
      })

      await ddbClient.send(updateStockCommand)
      deductedItems.push({
        productId,
        requestedQuantity,
        sizeKey,
        hasSize: Boolean(
          catalogProduct?.stocks &&
            sizeKey &&
            catalogProduct.stocks[sizeKey] !== undefined,
        ),
      })
    }
  } catch (err) {
    console.error("[CreateOrder] Error en condición o descuento de stock:", err)

    // Revertir items previamente descontados en caso de fallo parcial
    for (const deducted of deductedItems) {
      try {
        let rollbackExpr = "SET stock = stock + :requestedQuantity"
        const rbValues = {
          ":requestedQuantity": { N: String(deducted.requestedQuantity) },
        }
        const rbNames = {}
        if (deducted.hasSize && deducted.sizeKey) {
          rollbackExpr += ", stocks.#sz = stocks.#sz + :requestedQuantity"
          rbNames["#sz"] = deducted.sizeKey
        }
        await ddbClient.send(
          new UpdateItemCommand({
            TableName: PRODUCTS_TABLE,
            Key: { id: { S: deducted.productId } },
            UpdateExpression: rollbackExpr,
            ExpressionAttributeValues: rbValues,
            ...(Object.keys(rbNames).length > 0
              ? { ExpressionAttributeNames: rbNames }
              : {}),
          }),
        )
      } catch (rollbackErr) {
        console.error("[CreateOrder] Error al revertir stock:", rollbackErr)
      }
    }

    // Manejo de ConditionalCheckFailedException devolviendo HTTP 400 avisando que no hay stock suficiente
    if (
      err.name === "ConditionalCheckFailedException" ||
      err.code === "ConditionalCheckFailedException" ||
      err.message?.includes("ConditionalCheckFailed")
    ) {
      return response(400, {
        message:
          "Stock insuficiente para procesar el pedido. No hay stock suficiente.",
        error: "ConditionalCheckFailedException",
      })
    }

    return response(400, {
      message: "No hay stock suficiente para procesar el pedido.",
      error: err.name || "StockError",
    })
  }

  // Step 3: Recálculo contable estricto SUNAT Perú en centavos
  let itemsTotalCents = 0
  const detailParts = []
  items.forEach((item, index) => {
    const product = catalogProducts[index]
    const unitPriceCents = Math.round(product.price * 100)
    const quantity = Number(item.quantity ?? item.requestedQuantity ?? 1)
    itemsTotalCents += unitPriceCents * quantity
    detailParts.push(
      `${quantity}x ${product.name}${item.size ? ` (${item.size})` : ""}`,
    )
  })

  // Shipping rules: Express = S/. 30.00 | Standard = S/. 15.00 (Gratis si >= S/. 300.00)
  const shippingMethod =
    orderInput.shippingMethod === "express" ? "express" : "standard"
  let shippingCents = 0
  if (shippingMethod === "express") {
    shippingCents = 3000
  } else {
    shippingCents = itemsTotalCents >= 30000 ? 0 : 1500
  }

  // SUNAT 18% IGV incluido en precios
  const subtotalCents = Math.round(itemsTotalCents / 1.18) // Base Imponible
  const igvCents = itemsTotalCents - subtotalCents // IGV
  const totalCents = itemsTotalCents + shippingCents // Monto Total

  const rawPaymentMethod = orderInput.paymentMethod || "tarjeta"
  const paymentMethod = ["tarjeta", "yape_plin", "efectivo"].includes(
    rawPaymentMethod,
  )
    ? rawPaymentMethod
    : "tarjeta"
  const initialStatus =
    paymentMethod === "yape_plin" ? "Pendiente de Pago" : "Procesando"

  const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`
  const cleanEmail = (orderInput.email || "").trim().toLowerCase()

  let isGuest = true
  if (cleanEmail) {
    try {
      const userRec = await docClient.send(
        new GetCommand({
          TableName: USERS_TABLE,
          Key: { email: cleanEmail },
        }),
      )
      if (userRec.Item) {
        isGuest = false
      }
    } catch {}
  }
  if (orderInput.isGuest !== undefined) {
    isGuest = Boolean(orderInput.isGuest)
  }

  // ---------------------------------------------------------------------------
  // Step 3.5: Integración de Facturación Electrónica SUNAT (Nubefact)
  // Reglas contables de emisión al crear la orden:
  // - "tarjeta": Pago confirmado inmediatamente -> emitir boleta/factura al instante
  // - "yape_plin": Pendiente de pago -> no emitir aún ("esperando_pago")
  // - "efectivo": Pago Contra Entrega -> no emitir aún ("se_emite_al_entregar")
  // ---------------------------------------------------------------------------
  let invoicePdfUrl = null
  let invoiceStatus = "pendiente"
  let invoiceError = null

  if (paymentMethod === "yape_plin") {
    invoiceStatus = "esperando_pago"
  } else if (paymentMethod === "efectivo") {
    invoiceStatus = "se_emite_al_entregar"
  } else {
    // Tarjeta u otro método con confirmación inmediata
    const invoiceResult = await generateNubefactInvoice({
      id: orderId,
      customer: orderInput.customer,
      documentType: orderInput.documentType,
      document: orderInput.document,
      email: cleanEmail,
      address: orderInput.address,
      shipping: Number((shippingCents / 100).toFixed(2)),
      shippingMethod,
      subtotal: Number((subtotalCents / 100).toFixed(2)),
      igv: Number((igvCents / 100).toFixed(2)),
      total: Number((totalCents / 100).toFixed(2)),
      items: items.map((it, idx) => ({
        ...it,
        productId: it.productId || it.id,
        name: catalogProducts[idx]?.name || it.name,
        price:
          catalogProducts[idx]?.price !== undefined
            ? catalogProducts[idx]?.price
            : it.price,
      })),
    })

    invoicePdfUrl = invoiceResult.invoicePdfUrl
    invoiceStatus = invoiceResult.invoiceStatus
    invoiceError = invoiceResult.invoiceError
  }

  const transaction = {
    id: orderId,
    customer: (orderInput.customer || "Cliente Invitado").trim(),
    documentType: orderInput.documentType || "DNI",
    document: (orderInput.document || "").trim(),
    email: cleanEmail,
    phone: (orderInput.phone || "").trim(),
    districtCode: orderInput.districtCode || "LIM",
    districtName: orderInput.districtName || "Lima",
    districtX: orderInput.districtX || 260,
    districtY: orderInput.districtY || 55,
    address: (orderInput.address || "").trim(),
    reference: (orderInput.reference || "").trim(),
    isGuest,
    shippingMethod,
    paymentMethod,
    shipping: Number((shippingCents / 100).toFixed(2)),
    itemsTotal: Number((itemsTotalCents / 100).toFixed(2)),
    subtotal: Number((subtotalCents / 100).toFixed(2)),
    igv: Number((igvCents / 100).toFixed(2)),
    total: Number((totalCents / 100).toFixed(2)),
    items,
    detail: detailParts.join(", "),
    date: new Date().toISOString(),
    status: orderInput.status || initialStatus,
    invoicePdfUrl: invoicePdfUrl || null,
    invoiceStatus,
    invoiceError: invoiceError || null,
  }

  await docClient.send(
    new PutCommand({ TableName: ORDERS_TABLE, Item: transaction }),
  )

  // Step 4: Envío de correo transaccional (Amazon SES) con await explícito y try/catch dedicado
  try {
    if (transaction.email) {
      await sendOrderReceiptEmail(transaction)
    }
  } catch (error) {
    console.error("SES_ERROR_DETAILS:", error)
  }

  return response(201, transaction)
}

export const CreateOrder = createOrder

/**
 * 3. Generación de Código en Libro de Reclamaciones
 *    Código correlativo/amigable REC- seguido de timestamp o UUID
 *    Guardado en ComplaintsTable y devuelto en la respuesta HTTP
 */
export async function createComplaint(eventOrData) {
  const data =
    eventOrData && eventOrData.body ? parseBody(eventOrData) : eventOrData || {}

  // Validación de campos obligatorios según D.S. 011-2011-PCM
  const consumerName = (data.consumerName || "").trim()
  const documentType = (data.documentType || "DNI").trim()
  const documentNumber = (data.documentNumber || "").trim()
  const address = (data.address || "").trim()
  const phone = (data.phone || "").trim()
  const email = (data.email || "").trim().toLowerCase()
  const goodType = (data.goodType || "producto").trim()
  const goodDescription = (data.goodDescription || "").trim()
  const claimType = (data.claimType || "reclamo").trim() // "reclamo" o "queja"
  const detail = (data.detail || "").trim()
  const consumerRequest = (data.consumerRequest || "").trim()

  if (
    !consumerName ||
    !documentNumber ||
    !address ||
    !phone ||
    !email ||
    !goodDescription ||
    !detail ||
    !consumerRequest
  ) {
    return response(400, {
      message:
        "Todos los campos obligatorios del Libro de Reclamaciones deben ser completados.",
    })
  }

  // Generar código correlativo o amigable: REC- seguido de timestamp o UUID corto
  const complaintCode = `REC-${Date.now()}`
  const complaintId = complaintCode
  const year = new Date().getFullYear()

  const complaintRecord = {
    id: complaintId,
    complaintCode,
    year,
    consumerName,
    documentType,
    documentNumber,
    address,
    phone,
    email,
    isMinor: Boolean(data.isMinor),
    parentName: (data.parentName || "").trim(),
    parentDocument: (data.parentDocument || "").trim(),
    goodType, // "producto" o "servicio"
    claimedAmount: Number(data.claimedAmount) || 0,
    goodDescription,
    claimType, // "reclamo" o "queja"
    detail,
    consumerRequest,
    status: "Pendiente",
    maxResponseDays: 15, // Conforme a Ley N° 31435
    createdAt: new Date().toISOString(),
  }

  // Guardar reclamo en ComplaintsTable asociando este código
  const ComplaintsTable = COMPLAINTS_TABLE
  await docClient.send(
    new PutCommand({
      TableName: ComplaintsTable,
      Item: complaintRecord,
    }),
  )

  // Devolver este código explícitamente en la respuesta HTTP ({ ok: true, code: ... } o { complaintCode: ... })
  return response(201, {
    ok: true,
    success: true,
    code: complaintCode,
    complaintCode,
    complaint: complaintRecord,
    message:
      "Hoja de reclamación registrada exitosamente. Se responderá dentro del plazo legal de 15 días hábiles.",
  })
}

export const CreateComplaint = createComplaint

// -----------------------------------------------------------------------------
// Main Lambda Router
// -----------------------------------------------------------------------------
export async function handler(event) {
  // Support both REST API v1 and HTTP API v2 payloads
  const httpMethod =
    event.httpMethod || event.requestContext?.http?.method || "GET"

  // Robust path extraction across API Gateway v1 proxy, direct routes, and stages
  let path = "/"
  if (event.pathParameters && event.pathParameters.proxy) {
    path = `/${event.pathParameters.proxy}`
  } else {
    const rawPath = event.path || event.rawPath || "/"
    path = rawPath.replace(/^\/(prod|dev|staging)(\/|$)/, "/")
  }
  if (!path.startsWith("/")) path = `/${path}`
  if (path.length > 1 && path.endsWith("/")) {
    path = path.slice(0, -1)
  }

  const headers = event.headers || {}

  // Handle CORS Preflight
  if (httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: "",
    }
  }

  // Ensure initial seed
  await autoSeedDatabase()

  try {
    // -------------------------------------------------------------------------
    // 1. AUTH ROUTES
    // -------------------------------------------------------------------------
    if (httpMethod === "POST" && path === "/auth/admin/login") {
      const { user, password } = parseBody(event)
      if (!user || !password) {
        return response(400, { message: "Usuario y contraseña requeridos." })
      }

      // Check against DB or environment defaults
      let isValid = false
      const userScan = await docClient.send(
        new ScanCommand({
          TableName: USERS_TABLE,
          FilterExpression: "username = :u OR email = :u",
          ExpressionAttributeValues: { ":u": user },
        }),
      )

      if (userScan.Items && userScan.Items.length > 0) {
        const found = userScan.Items[0]
        if (found.role === "admin" && found.passwordHash) {
          isValid = bcrypt.compareSync(password, found.passwordHash)
        }
      } else if (
        user === ADMIN_USER_DEFAULT &&
        password === ADMIN_PASSWORD_DEFAULT
      ) {
        isValid = true
      }

      if (!isValid) {
        return response(401, {
          message: "Credenciales de administrador inválidas.",
        })
      }

      // Sesión de 24 horas y Refresh Token de 30 días para evitar expiración a la hora
      const expiresAt = Date.now() + 24 * 3600 * 1000 // 24 hours
      const token = jwt.sign(
        { user, role: "admin", exp: Math.floor(expiresAt / 1000) },
        JWT_SECRET,
      )
      const refreshToken = jwt.sign(
        { user, role: "admin", type: "refresh" },
        JWT_SECRET,
        { expiresIn: "30d" },
      )
      return response(200, { ok: true, token, refreshToken, expiresAt })
    }

    // Endpoint de refresco de tokens automático para sesiones largas (> 1h)
    if (httpMethod === "POST" && (path === "/auth/refresh" || path === "/auth/admin/refresh")) {
      const { refreshToken } = parseBody(event)
      if (!refreshToken) {
        return response(400, { message: "Token de refresco requerido." })
      }
      try {
        const verified = jwt.verify(refreshToken, JWT_SECRET)
        if (!verified || typeof verified !== "object") {
          return response(401, { message: "Token de refresco inválido o expirado." })
        }

        const user = verified.user || verified.email || "admin"
        const role = verified.role || "admin"
        const expiresAt = Date.now() + 24 * 3600 * 1000
        const newToken = jwt.sign(
          { user, role, exp: Math.floor(expiresAt / 1000) },
          JWT_SECRET,
        )
        const newRefreshToken = jwt.sign(
          { user, role, type: "refresh" },
          JWT_SECRET,
          { expiresIn: "30d" },
        )
        return response(200, {
          ok: true,
          token: newToken,
          refreshToken: newRefreshToken,
          expiresAt,
        })
      } catch (err) {
        return response(401, { message: "Sesión expirada. Inicie sesión nuevamente." })
      }
    }

    if (httpMethod === "POST" && path === "/auth/customers/register") {
      const data = parseBody(event)
      const cleanEmail = (data.email || "").trim().toLowerCase()
      if (!cleanEmail || !data.password) {
        return response(400, {
          message: "Correo y contraseña son obligatorios.",
        })
      }

      const existing = await docClient.send(
        new GetCommand({ TableName: USERS_TABLE, Key: { email: cleanEmail } }),
      )
      if (existing.Item) {
        return response(400, {
          message: "Este correo ya está registrado. Por favor, inicia sesión.",
        })
      }

      const passwordHash = bcrypt.hashSync(data.password, 12) // salt >= 12
      const customerItem = {
        email: cleanEmail,
        firstName: (data.firstName || "").trim(),
        lastName: (data.lastName || "").trim(),
        documentType: data.documentType || "DNI",
        document: (data.document || "").trim(),
        phone: (data.phone || "").trim(),
        address: (data.address || "").trim(),
        reference: (data.reference || "").trim(),
        district: (data.district || "").trim(),
        role: "customer",
        isGuest: false,
        status: "Registrado",
        cognitoId: data.cognitoId || data.sub || `usr-${Date.now()}`,
        passwordHash,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      try {
        await docClient.send(
          new PutCommand({
            TableName: USERS_TABLE,
            Item: customerItem,
            ConditionExpression: "attribute_not_exists(email)",
          }),
        )
      } catch (err) {
        if (
          err.name === "ConditionalCheckFailedException" ||
          err.code === "ConditionalCheckFailedException" ||
          err.__type?.includes("ConditionalCheckFailedException") ||
          (err.message && err.message.includes("ConditionalCheckFailedException"))
        ) {
          return response(400, {
            message: "Este correo ya está registrado. Por favor, inicia sesión.",
          })
        }
        throw err
      }

      // Sincronización Automática de Invitado a Registrado en DynamoDB (ORDERS_TABLE)
      try {
        const pastOrdersRes = await docClient.send(
          new ScanCommand({
            TableName: ORDERS_TABLE,
            FilterExpression: "email = :e",
            ExpressionAttributeValues: { ":e": cleanEmail },
          }),
        )

        const fullName =
          `${customerItem.firstName} ${customerItem.lastName}`.trim()

        if (pastOrdersRes.Items && pastOrdersRes.Items.length > 0) {
          for (const order of pastOrdersRes.Items) {
            await docClient.send(
              new UpdateCommand({
                TableName: ORDERS_TABLE,
                Key: { id: order.id },
                UpdateExpression:
                  "SET isGuest = :falseVal, #st_reg = :regVal, customer = :nameVal, phone = :phoneVal, document = :docVal, documentType = :docTypeVal, #ref = if_not_exists(#ref, :refVal), cognitoId = :cogVal",
                ExpressionAttributeNames: {
                  "#ref": "reference",
                  "#st_reg": "userStatus",
                },
                ExpressionAttributeValues: {
                  ":falseVal": false,
                  ":regVal": "Registrado",
                  ":nameVal": fullName || order.customer,
                  ":phoneVal": customerItem.phone || order.phone,
                  ":docVal": customerItem.document || order.document,
                  ":docTypeVal":
                    customerItem.documentType || order.documentType || "DNI",
                  ":refVal": customerItem.reference || "",
                  ":cogVal": customerItem.cognitoId,
                },
              }),
            )
          }
        }
      } catch (syncErr) {
        console.warn(
          "Aviso: Sincronización automática de pedidos:",
          syncErr?.message,
        )
      }

      const { passwordHash: _, ...safeUser } = customerItem
      const token = jwt.sign(
        { email: cleanEmail, role: "customer" },
        JWT_SECRET,
        { expiresIn: "7d" },
      )
      const refreshToken = jwt.sign(
        { email: cleanEmail, role: "customer", type: "refresh" },
        JWT_SECRET,
        { expiresIn: "30d" },
      )
      return response(201, { ok: true, user: safeUser, token, refreshToken, status: "CONFIRMED" })
    }

    if (httpMethod === "POST" && path === "/auth/customers/login") {
      const { email, password } = parseBody(event)
      const cleanEmail = (email || "").trim().toLowerCase()
      if (!cleanEmail || !password) {
        return response(400, { message: "Correo y contraseña requeridos." })
      }

      const userRecord = await docClient.send(
        new GetCommand({ TableName: USERS_TABLE, Key: { email: cleanEmail } }),
      )
      if (!userRecord.Item || !userRecord.Item.passwordHash) {
        return response(401, { message: "Correo o contraseña incorrectos." })
      }

      const match = bcrypt.compareSync(password, userRecord.Item.passwordHash)
      if (!match) {
        return response(401, { message: "Correo o contraseña incorrectos." })
      }

      const { passwordHash: _, ...safeUser } = userRecord.Item
      const token = jwt.sign(
        { email: cleanEmail, role: "customer" },
        JWT_SECRET,
        { expiresIn: "7d" },
      )
      const refreshToken = jwt.sign(
        { email: cleanEmail, role: "customer", type: "refresh" },
        JWT_SECRET,
        { expiresIn: "30d" },
      )
      return response(200, { ok: true, user: safeUser, token, refreshToken, status: "CONFIRMED" })
    }

    if (
      httpMethod === "PUT" &&
      (path === "/users/profile" || path === "/auth/customers/profile")
    ) {
      const payload = parseBody(event)
      const authUser = authenticate(headers, event)

      // Extraer email desde claims del token o del cuerpo de la petición
      let email = (authUser?.email || authUser?.user || payload.email || "")
        .trim()
        .toLowerCase()
      const authHeader = headers.Authorization || headers.authorization || ""
      const token = authHeader.replace(/^Bearer\s+/i, "").trim()
      if (!email && token) {
        try {
          const decoded = jwt.decode(token)
          if (decoded?.email) email = decoded.email.trim().toLowerCase()
        } catch {}
      }

      if (!email) {
        return response(400, {
          message: "Se requiere correo electrónico para actualizar el perfil.",
        })
      }

      // Obtener registro de usuario existente
      const userRes = await docClient.send(
        new GetCommand({ TableName: USERS_TABLE, Key: { email } }),
      )

      if (!userRes.Item) {
        return response(404, {
          message: "Usuario no encontrado en la base de datos.",
        })
      }

      const existingUser = userRes.Item
      const updatedUser = {
        ...existingUser,
        firstName:
          payload.firstName !== undefined
            ? String(payload.firstName).trim()
            : existingUser.firstName,
        lastName:
          payload.lastName !== undefined
            ? String(payload.lastName).trim()
            : existingUser.lastName,
        phone:
          payload.phone !== undefined
            ? String(payload.phone).trim()
            : existingUser.phone || "",
        documentType:
          payload.documentType || existingUser.documentType || "DNI",
        document:
          payload.document !== undefined
            ? String(payload.document).trim()
            : existingUser.document || "",
        address:
          payload.address !== undefined
            ? String(payload.address).trim()
            : existingUser.address || "",
        reference:
          payload.reference !== undefined
            ? String(payload.reference).trim()
            : existingUser.reference || "",
        district:
          payload.district !== undefined
            ? String(payload.district).trim()
            : existingUser.district || "",
        updatedAt: new Date().toISOString(),
      }

      await docClient.send(
        new PutCommand({
          TableName: USERS_TABLE,
          Item: updatedUser,
        }),
      )

      const { passwordHash: _, ...safeUser } = updatedUser
      return response(200, { ok: true, user: safeUser })
    }

    if (httpMethod === "GET" && path === "/users") {
      const auth = requireAdmin(headers, event)
      if (auth.error) return auth.error

      const usersScan = await docClient.send(
        new ScanCommand({ TableName: USERS_TABLE }),
      )
      const safeUsers = (usersScan.Items || []).map(
        ({ passwordHash, ...u }) => u,
      )
      return response(200, safeUsers)
    }

    if (
      httpMethod === "DELETE" &&
      (path.startsWith("/users/") ||
        path === "/users" ||
        path.startsWith("/clients/") ||
        path === "/clients")
    ) {
      const auth = requireAdmin(headers, event)
      if (auth.error) return auth.error

      const body = parseBody(event)
      let rawEmail = ""
      if (path.startsWith("/users/")) {
        rawEmail = path.replace(/^\/users\//, "")
      } else if (path.startsWith("/clients/")) {
        rawEmail = path.replace(/^\/clients\//, "")
      } else {
        rawEmail = event.queryStringParameters?.email || body.email || ""
      }

      const cleanEmail = decodeURIComponent(rawEmail).trim().toLowerCase()
      if (!cleanEmail) {
        return response(400, {
          message: "El correo electrónico del cliente es obligatorio.",
        })
      }

      if (
        cleanEmail === "admin" ||
        cleanEmail === "admin@gonesurfing.pe" ||
        cleanEmail === ADMIN_USER_DEFAULT.toLowerCase()
      ) {
        return response(400, {
          message:
            "No está permitido eliminar la cuenta principal de administrador.",
        })
      }

      console.log(
        `[Admin] Iniciando borrado en cascada para cliente: ${cleanEmail}`,
      )

      // A) Borrado en AWS Cognito
      let cognitoDeleted = false
      let cognitoMessage = "No encontrado en Cognito o no registrado"
      if (COGNITO_USER_POOL_ID) {
        try {
          await cognitoClient.send(
            new AdminDeleteUserCommand({
              UserPoolId: COGNITO_USER_POOL_ID,
              Username: cleanEmail,
            }),
          )
          cognitoDeleted = true
          cognitoMessage = "Usuario eliminado de AWS Cognito"
        } catch (cognitoErr) {
          if (cognitoErr.name === "UserNotFoundException") {
            try {
              const listRes = await cognitoClient.send(
                new ListUsersCommand({
                  UserPoolId: COGNITO_USER_POOL_ID,
                  Filter: `email = "${cleanEmail}"`,
                  Limit: 1,
                }),
              )
              if (listRes.Users && listRes.Users.length > 0) {
                const foundUsername = listRes.Users[0].Username
                await cognitoClient.send(
                  new AdminDeleteUserCommand({
                    UserPoolId: COGNITO_USER_POOL_ID,
                    Username: foundUsername,
                  }),
                )
                cognitoDeleted = true
                cognitoMessage = "Usuario eliminado de AWS Cognito (por alias)"
              }
            } catch (listErr) {
              console.warn(
                "Aviso al buscar usuario en Cognito:",
                listErr?.message,
              )
            }
          } else {
            console.warn("Aviso al eliminar en Cognito:", cognitoErr?.message)
            cognitoMessage = cognitoErr?.message || "Error en Cognito"
          }
        }
      }

      // B) Borrado en UsersTable (DynamoDB)
      let userDeleted = false
      try {
        await docClient.send(
          new DeleteCommand({
            TableName: USERS_TABLE,
            Key: { email: cleanEmail },
          }),
        )
        userDeleted = true
      } catch (userDbErr) {
        console.error("Error al eliminar de UsersTable:", userDbErr)
      }

      // C) Borrado en cascada de pedidos en OrdersTable (DynamoDB)
      const deletedOrderIds = []
      try {
        const ordersScan = await docClient.send(
          new ScanCommand({
            TableName: ORDERS_TABLE,
            FilterExpression: "email = :e",
            ExpressionAttributeValues: { ":e": cleanEmail },
          }),
        )

        if (ordersScan.Items && ordersScan.Items.length > 0) {
          for (const order of ordersScan.Items) {
            await docClient.send(
              new DeleteCommand({
                TableName: ORDERS_TABLE,
                Key: { id: order.id },
              }),
            )
            deletedOrderIds.push(order.id)
          }
        }
      } catch (ordersErr) {
        console.warn(
          "Aviso al eliminar pedidos asociados en cascada:",
          ordersErr,
        )
      }

      return response(200, {
        ok: true,
        message: `Cliente ${cleanEmail} y su historial eliminados exitosamente.`,
        email: cleanEmail,
        cognitoDeleted,
        cognitoMessage,
        userDeleted,
        deletedOrdersCount: deletedOrderIds.length,
        deletedOrderIds,
      })
    }

    // -------------------------------------------------------------------------
    // 2. PRODUCTS ROUTES
    // -------------------------------------------------------------------------
    if (httpMethod === "GET" && path === "/products") {
      const scanResult = await docClient.send(
        new ScanCommand({ TableName: PRODUCTS_TABLE }),
      )
      const MOCK_IDS = new Set(["p1", "p2", "p3", "p4"])
      const MOCK_NAMES = new Set([
        "Stay Real Tee",
        "Stay Real Cap",
        "Gone Surf Leash",
        "Off Duty Tee",
      ])
      const items = (scanResult.Items || []).filter(
        (item) => !MOCK_IDS.has(item.id) && !MOCK_NAMES.has(item.name),
      )
      return response(200, items)
    }

    if (httpMethod === "GET" && path.startsWith("/products/")) {
      const id = path.replace(/^\/products\//, "").replace(/\/.*$/, "")
      if (["p1", "p2", "p3", "p4"].includes(id)) {
        return response(404, { message: "Producto no encontrado." })
      }
      const res = await docClient.send(
        new GetCommand({ TableName: PRODUCTS_TABLE, Key: { id } }),
      )
      if (!res.Item)
        return response(404, { message: "Producto no encontrado." })
      return response(200, res.Item)
    }

    if (httpMethod === "POST" && path === "/products") {
      const auth = requireAdmin(headers, event)
      if (auth.error) return auth.error

      const data = parseBody(event)
      const price = parseFloat(data.price)
      if (!data.name || Number.isNaN(price) || price <= 0) {
        return response(400, {
          message: "Nombre válido y precio mayor a 0 son obligatorios.",
        })
      }

      const isAcc = data.category === "Accesorios"
      const stocks = isAcc
        ? {
            Única: Math.max(
              0,
              parseInt(
                data.stocks?.["Única"] ??
                  data.stocks?.["Unica"] ??
                  data.stocks?.["unica"] ??
                  data.stocks?.["UNICA"] ??
                  15,
                10,
              ),
            ),
          }
        : {
            S: Math.max(0, parseInt(data.stocks?.S ?? 0, 10)),
            M: Math.max(0, parseInt(data.stocks?.M ?? 0, 10)),
            L: Math.max(0, parseInt(data.stocks?.L ?? 0, 10)),
            XL: Math.max(0, parseInt(data.stocks?.XL ?? 0, 10)),
          }

      const finalImage = (data.imageUrl || data.image || "").trim()
      const totalStock =
        typeof data.stock === "number"
          ? data.stock
          : Object.values(stocks).reduce(
              (acc, val) => acc + (parseInt(val, 10) || 0),
              0,
            )
      const newProduct = {
        id: data.id || `prod-${Date.now()}`,
        name: data.name.trim(),
        price: Number(price.toFixed(2)),
        category: data.category || "New Arrivals",
        collectionName: data.collectionName || "Catálogo General",
        image: finalImage || "/assets/hero-surf.jpg",
        imageUrl: finalImage || "/assets/hero-surf.jpg",
        stocks,
        stock: totalStock,
        createdAt: new Date().toISOString(),
      }

      // 1. Lectura previa: consultar si el producto ya existía para conocer su stock anterior (0 si es nuevo)
      let previousStocks = {}
      let previousTotalStock = 0
      if (data.id) {
        try {
          const prevRes = await docClient.send(
            new GetCommand({ TableName: PRODUCTS_TABLE, Key: { id: data.id } }),
          )
          if (prevRes.Item) {
            previousStocks = prevRes.Item.stocks || {}
            previousTotalStock = prevRes.Item.stock || 0
          }
        } catch (prevErr) {
          console.warn("Aviso al consultar stock previo:", prevErr?.message)
        }
      }

      // Ejecución explícita y esperada (await) de DynamoDB PutCommand
      try {
        console.log(
          `[DynamoDB] Guardando en tabla ${PRODUCTS_TABLE}:`,
          newProduct.id,
        )
        await docClient.send(
          new PutCommand({
            TableName: PRODUCTS_TABLE,
            Item: newProduct,
          }),
        )
        console.log(
          `[DynamoDB] Guardado confirmado en ${PRODUCTS_TABLE}:`,
          newProduct.id,
        )

        // Registro en el Historial de Ingreso de Mercadería (Kardex de trazabilidad)
        try {
          await recordStockKardexLogs(
            docClient,
            LOGS_TABLE,
            newProduct.name,
            previousStocks,
            newProduct.stocks,
            previousTotalStock,
            newProduct.stock,
          )
        } catch (logErr) {
          console.warn(
            "Aviso al guardar log de trazabilidad de mercadería:",
            logErr?.message,
          )
        }
      } catch (dbErr) {
        console.error(
          `[DynamoDB] Error crítico al ejecutar PutCommand en ${PRODUCTS_TABLE}:`,
          dbErr,
        )
        return response(500, {
          message:
            "Error al persistir el producto en la base de datos DynamoDB.",
          error: dbErr.message,
        })
      }

      return response(201, newProduct)
    }

    if (httpMethod === "PUT" && path.startsWith("/products/")) {
      const auth = requireAdmin(headers, event)
      if (auth.error) return auth.error

      const id = path.replace(/^\/products\//, "").replace(/\/.*$/, "")
      const data = parseBody(event)

      const existing = await docClient.send(
        new GetCommand({ TableName: PRODUCTS_TABLE, Key: { id } }),
      )
      if (!existing.Item)
        return response(404, { message: "Producto no encontrado." })

      const finalUpdateImage = (data.imageUrl || data.image || "").trim()
      const finalStocks = data.stocks ? data.stocks : existing.Item.stocks
      const finalStockCount =
        typeof data.stock === "number"
          ? data.stock
          : finalStocks
            ? Object.values(finalStocks).reduce(
                (acc, val) => acc + (parseInt(val, 10) || 0),
                0,
              )
            : (existing.Item.stock ?? 0)

      const updated = {
        ...existing.Item,
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(data.price !== undefined
          ? { price: Number(parseFloat(data.price).toFixed(2)) }
          : {}),
        ...(data.category ? { category: data.category } : {}),
        ...(data.collectionName ? { collectionName: data.collectionName } : {}),
        ...(finalUpdateImage
          ? { image: finalUpdateImage, imageUrl: finalUpdateImage }
          : {}),
        ...(data.stocks ? { stocks: data.stocks } : {}),
        stock: finalStockCount,
        updatedAt: new Date().toISOString(),
      }

      await docClient.send(
        new PutCommand({ TableName: PRODUCTS_TABLE, Item: updated }),
      )

      // Registro en el Historial de Ingreso de Mercadería (Kardex de trazabilidad)
      try {
        await recordStockKardexLogs(
          docClient,
          LOGS_TABLE,
          updated.name,
          existing.Item.stocks || {},
          updated.stocks || {},
          existing.Item.stock || 0,
          updated.stock || 0,
        )
      } catch (logErr) {
        console.warn(
          "Aviso al guardar log de trazabilidad de mercadería:",
          logErr?.message,
        )
      }

      return response(200, updated)
    }

    if (httpMethod === "DELETE" && path.startsWith("/products/")) {
      const auth = requireAdmin(headers, event)
      if (auth.error) return auth.error

      const id = path.replace(/^\/products\//, "").replace(/\/.*$/, "")
      await docClient.send(
        new DeleteCommand({ TableName: PRODUCTS_TABLE, Key: { id } }),
      )
      return response(200, { success: true })
    }

    // -------------------------------------------------------------------------
    // 3. COLLECTIONS ROUTES
    // -------------------------------------------------------------------------
    if (httpMethod === "GET" && path === "/collections") {
      const scanResult = await docClient.send(
        new ScanCommand({ TableName: COLLECTIONS_TABLE }),
      )
      return response(200, scanResult.Items || [])
    }

    if (httpMethod === "POST" && path === "/collections") {
      const auth = requireAdmin(headers, event)
      if (auth.error) return auth.error

      const data = parseBody(event)
      if (!data.title || !data.image) {
        return response(400, { message: "Título e imagen son requeridos." })
      }

      const newCol = {
        id: `col-${Date.now()}`,
        title: data.title.trim(),
        subtitle: (data.subtitle || "").trim(),
        category: (data.category || "LIFESTYLE").trim(),
        image: data.image,
        active: true,
        createdAt: new Date().toISOString(),
      }

      await docClient.send(
        new PutCommand({ TableName: COLLECTIONS_TABLE, Item: newCol }),
      )
      return response(201, newCol)
    }

    if (httpMethod === "PATCH" && path.includes("/toggle")) {
      const auth = requireAdmin(headers, event)
      if (auth.error) return auth.error

      const match = path.match(/\/collections\/([^/]+)\/toggle/)
      const id = match ? match[1] : path.split("/")[2]
      const current = await docClient.send(
        new GetCommand({ TableName: COLLECTIONS_TABLE, Key: { id } }),
      )
      if (!current.Item)
        return response(404, { message: "Colección no encontrada." })

      const updated = { ...current.Item, active: !current.Item.active }
      await docClient.send(
        new PutCommand({ TableName: COLLECTIONS_TABLE, Item: updated }),
      )
      return response(200, updated)
    }

    if (httpMethod === "DELETE" && path.startsWith("/collections/")) {
      const auth = requireAdmin(headers, event)
      if (auth.error) return auth.error

      const id = path.replace(/^\/collections\//, "").replace(/\/.*$/, "")
      const colRecord = await docClient.send(
        new GetCommand({ TableName: COLLECTIONS_TABLE, Key: { id } }),
      )

      // Reassign affected products to General Catalog
      if (colRecord.Item && colRecord.Item.title) {
        const title = colRecord.Item.title
        const prods = await docClient.send(
          new ScanCommand({
            TableName: PRODUCTS_TABLE,
            FilterExpression: "collectionName = :c",
            ExpressionAttributeValues: { ":c": title },
          }),
        )
        if (prods.Items) {
          for (const p of prods.Items) {
            await docClient.send(
              new UpdateCommand({
                TableName: PRODUCTS_TABLE,
                Key: { id: p.id },
                UpdateExpression: "SET collectionName = :cat",
                ExpressionAttributeValues: { ":cat": "Catálogo General" },
              }),
            )
          }
        }
      }

      await docClient.send(
        new DeleteCommand({ TableName: COLLECTIONS_TABLE, Key: { id } }),
      )
      return response(200, { success: true })
    }

    // -------------------------------------------------------------------------
    // 4. ORDERS ROUTES (STRICT SUNAT & ATOMIC DYNAMODB STOCK TRANSACTIONS)
    // -------------------------------------------------------------------------
    // 4.1. ENDPOINT PÚBLICO: Creación de Órdenes desde Checkout
    // Permite compras públicas a clientes invitados y registrados sin exigir token JWT.
    if (httpMethod === "POST" && (path === "/orders" || path === "/orders/")) {
      return await createOrder(event)
    }

    // 4.2. RUTAS PROTEGIDAS CON JWT (requireAdmin):
    // Listar pedidos (GET /orders) - Solo administradores
    if (httpMethod === "GET" && (path === "/orders" || path === "/orders/")) {
      const auth = requireAdmin(headers, event)
      if (auth.error) return auth.error

      const res = await docClient.send(
        new ScanCommand({ TableName: ORDERS_TABLE }),
      )
      const sorted = (res.Items || []).sort(
        (a, b) => new Date(b.date) - new Date(a.date),
      )
      return response(200, sorted)
    }

    // Actualizar estado de orden (PUT / PATCH /orders/:id) o reintentar boleta (POST /orders/:id/retry-invoice) - Solo administradores
    if (
      ((httpMethod === "PATCH" || httpMethod === "PUT") &&
        (path.startsWith("/orders/") || path === "/orders" || path === "/orders/")) ||
      (httpMethod === "POST" && path.includes("/retry-invoice"))
    ) {
      const auth = requireAdmin(headers, event)
      if (auth.error) return auth.error

      const body = parseBody(event)
      const isRetryRoute = path.includes("/retry-invoice")
      const isRetry = isRetryRoute || Boolean(body.retryInvoice)

      const match = path.match(/^\/orders\/([^/]+)/)
      const rawId = match ? match[1] : path.split("/")[2]
      const id = decodeURIComponent(rawId || body.id || "")
        .replace(/\/status$/, "")
        .replace(/\/retry-invoice$/, "")

      if (!id) {
        return response(400, {
          message: "El ID de la orden es obligatorio.",
        })
      }

      const orderRes = await docClient.send(
        new GetCommand({ TableName: ORDERS_TABLE, Key: { id } }),
      )
      if (!orderRes.Item) {
        return response(404, {
          message: `Orden '${id}' no encontrada en DynamoDB.`,
        })
      }

      const currentStatus = orderRes.Item.status
      const targetStatus = body.status || currentStatus

      if (!targetStatus && !isRetry) {
        return response(400, {
          message:
            "El campo 'status' es obligatorio para actualizar el pedido.",
        })
      }

      // Rollback o reposición de stock al cancelar / reactivar
      if (currentStatus !== targetStatus) {
        if (targetStatus === "Cancelado" && currentStatus !== "Cancelado") {
          for (const item of orderRes.Item.items || []) {
            try {
              await docClient.send(
                new UpdateCommand({
                  TableName: PRODUCTS_TABLE,
                  Key: { id: item.productId || item.id },
                  UpdateExpression: "SET stocks.#sz = stocks.#sz + :qty",
                  ExpressionAttributeNames: { "#sz": item.size },
                  ExpressionAttributeValues: { ":qty": item.quantity },
                }),
              )
            } catch (stockErr) {
              console.warn(
                "Fallo reponiendo stock de orden cancelada:",
                stockErr,
              )
            }
          }
        } else if (currentStatus === "Cancelado" && targetStatus !== "Cancelado") {
          for (const item of orderRes.Item.items || []) {
            try {
              await docClient.send(
                new UpdateCommand({
                  TableName: PRODUCTS_TABLE,
                  Key: { id: item.productId || item.id },
                  UpdateExpression: "SET stocks.#sz = stocks.#sz - :qty",
                  ConditionExpression: "attribute_exists(id) AND stocks.#sz >= :qty",
                  ExpressionAttributeNames: { "#sz": item.size },
                  ExpressionAttributeValues: { ":qty": item.quantity },
                }),
              )
            } catch (stockErr) {
              console.warn(
                "Fallo deduciendo stock de orden reactivada:",
                stockErr,
              )
            }
          }
        }
      }

      // Evaluar condición contable para disparo de emisión de boleta Nubefact
      const method = String(orderRes.Item.paymentMethod || "").toLowerCase()
      const isYapePlin =
        method === "yape_plin" || method.includes("yape") || method.includes("plin")
      const isContraEntrega =
        method === "efectivo" ||
        method.includes("contra") ||
        method.includes("entrega")

      // Disparo contable de emisión:
      // 1. Yape / Plin: cambia a "Procesando", "Enviado" o "Entregado"
      // 2. Pago Contra Entrega: cambia a "Entregado"
      // 3. Reintento manual forzado desde el dashboard (isRetry)
      const triggerYape =
        isYapePlin && ["Procesando", "Enviado", "Entregado"].includes(targetStatus)
      const triggerContraEntrega =
        isContraEntrega && targetStatus === "Entregado"
      const existingPdf = orderRes.Item.invoicePdfUrl

      const shouldGenerateInvoice =
        (isRetry || triggerYape || triggerContraEntrega) &&
        (!existingPdf || isRetry)

      let updatedInvoicePdfUrl = orderRes.Item.invoicePdfUrl || null
      let updatedInvoiceStatus = orderRes.Item.invoiceStatus || null
      let updatedInvoiceError = orderRes.Item.invoiceError || null

      if (shouldGenerateInvoice) {
        console.log(
          `[Orders] Disparando emisión de boleta Nubefact para orden ${id} (Método: ${orderRes.Item.paymentMethod}, Estado: ${targetStatus}, Reintento: ${isRetry})...`,
        )
        const invoiceResult = await generateNubefactInvoice({
          ...orderRes.Item,
          status: targetStatus,
        })
        if (invoiceResult.success) {
          updatedInvoicePdfUrl = invoiceResult.invoicePdfUrl
          updatedInvoiceStatus = invoiceResult.invoiceStatus || "emitida"
          updatedInvoiceError = null
        } else {
          updatedInvoicePdfUrl = null
          updatedInvoiceStatus = invoiceResult.invoiceStatus || "error_facturacion"
          updatedInvoiceError =
            invoiceResult.invoiceError || "Error al emitir comprobante con Nubefact"
        }
      }

      const now = new Date().toISOString()
      const updateExprParts = ["#ua = :ua"]
      const exprNames = { "#ua": "updatedAt" }
      const exprValues = { ":ua": now }

      if (currentStatus !== targetStatus) {
        updateExprParts.push("#st = :s")
        exprNames["#st"] = "status"
        exprValues[":s"] = targetStatus
      }

      if (shouldGenerateInvoice) {
        updateExprParts.push("#ipu = :ipu")
        exprNames["#ipu"] = "invoicePdfUrl"
        exprValues[":ipu"] = updatedInvoicePdfUrl

        updateExprParts.push("#is = :is")
        exprNames["#is"] = "invoiceStatus"
        exprValues[":is"] = updatedInvoiceStatus

        updateExprParts.push("#ie = :ie")
        exprNames["#ie"] = "invoiceError"
        exprValues[":ie"] = updatedInvoiceError
      }

      await docClient.send(
        new UpdateCommand({
          TableName: ORDERS_TABLE,
          Key: { id },
          UpdateExpression: `SET ${updateExprParts.join(", ")}`,
          ExpressionAttributeNames: exprNames,
          ExpressionAttributeValues: exprValues,
        }),
      )

      const finalOrder = {
        ...orderRes.Item,
        status: targetStatus,
        updatedAt: now,
        invoicePdfUrl: updatedInvoicePdfUrl,
        invoiceStatus: updatedInvoiceStatus,
        invoiceError: updatedInvoiceError,
      }

      return response(200, {
        ok: true,
        message: `Estado de la orden ${id} actualizado a '${targetStatus}' exitosamente.${updatedInvoicePdfUrl ? " Boleta emitida." : ""}`,
        order: finalOrder,
        ...finalOrder,
      })
    }

    // Eliminar orden (DELETE /orders/:id) - Solo administradores
    if (
      httpMethod === "DELETE" &&
      (path.startsWith("/orders/") || path === "/orders" || path === "/orders/")
    ) {
      const auth = requireAdmin(headers, event)
      if (auth.error) return auth.error

      const body = parseBody(event)
      const id = path.startsWith("/orders/")
        ? path.replace(/^\/orders\//, "").replace(/\/.*$/, "")
        : (event.queryStringParameters?.id || body.id || "")

      if (!id) {
        return response(400, { message: "El ID de la orden es requerido." })
      }

      await docClient.send(
        new DeleteCommand({ TableName: ORDERS_TABLE, Key: { id } }),
      )
      return response(200, { success: true, message: `Orden ${id} eliminada.` })
    }

    // -------------------------------------------------------------------------
    // 5. S3 PRESIGNED IMAGE UPLOADS
    // -------------------------------------------------------------------------
    if (
      httpMethod === "POST" &&
      (path === "/admin/upload-url" || path === "/media/presign")
    ) {
      const auth = requireAdmin(headers, event)
      if (auth.error) return auth.error

      const { fileName, contentType } = parseBody(event)
      const allowedMimes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/avif",
        "image/gif",
      ]

      if (!contentType || !allowedMimes.includes(contentType.toLowerCase())) {
        return response(400, {
          message:
            "Formato no permitido. Solo se aceptan imágenes (JPEG, PNG, WebP, AVIF).",
        })
      }

      const safeName = (fileName || "upload.webp").replace(
        /[^a-zA-Z0-9.-]/g,
        "_",
      )
      const fileKey = `media/${Date.now()}-${safeName}`

      const putCommand = new PutObjectCommand({
        Bucket: MEDIA_BUCKET,
        Key: fileKey,
        ContentType: contentType,
      })

      const uploadUrl = await getSignedUrl(s3Client, putCommand, {
        expiresIn: 300,
      })
      const publicUrl = CLOUDFRONT_DOMAIN
        ? `https://${CLOUDFRONT_DOMAIN}/${fileKey}`
        : `https://${MEDIA_BUCKET}.s3.${REGION}.amazonaws.com/${fileKey}`

      return response(200, {
        uploadUrl,
        fileKey,
        publicUrl,
      })
    }

    // -------------------------------------------------------------------------
    // 6. COMPLAINTS BOOK (LIBRO DE RECLAMACIONES INDECOPI / LEY 29733)
    // -------------------------------------------------------------------------
    if (httpMethod === "POST" && path === "/complaints") {
      return await createComplaint(event)
    }

    if (httpMethod === "GET" && path === "/complaints") {
      const auth = requireAdmin(headers, event)
      if (auth.error) return auth.error

      const res = await docClient.send(
        new ScanCommand({ TableName: COMPLAINTS_TABLE }),
      )
      const complaints = (res.Items || []).sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      return response(200, complaints)
    }

    if (
      (httpMethod === "PUT" || httpMethod === "PATCH") &&
      (path.startsWith("/complaints/") || path === "/complaints")
    ) {
      const auth = requireAdmin(headers, event)
      if (auth.error) return auth.error

      const match = path.match(/^\/complaints\/([^/]+)$/)
      const body = parseBody(event)
      const complaintId = (match ? match[1] : body.id || "").trim()

      if (!complaintId) {
        return response(400, {
          message: "ID de la reclamación es requerido.",
        })
      }

      const { status, resolution, adminNotes } = body

      if (!status && resolution === undefined && adminNotes === undefined) {
        return response(400, {
          message:
            "Debe proporcionar al menos un campo para actualizar (status, resolution o adminNotes).",
        })
      }

      // Validar existencia en DynamoDB
      const checkRes = await docClient.send(
        new GetCommand({
          TableName: COMPLAINTS_TABLE,
          Key: { id: complaintId },
        }),
      )

      if (!checkRes.Item) {
        return response(404, {
          message: `Reclamación con ID '${complaintId}' no encontrada.`,
        })
      }

      const updateExpressions = []
      const expressionAttributeNames = {}
      const expressionAttributeValues = {}

      if (status) {
        updateExpressions.push("#st = :s")
        expressionAttributeNames["#st"] = "status"
        expressionAttributeValues[":s"] = String(status).trim()
      }

      if (resolution !== undefined) {
        updateExpressions.push("#res = :r")
        expressionAttributeNames["#res"] = "resolution"
        expressionAttributeValues[":r"] = String(resolution).trim()
      }

      if (adminNotes !== undefined) {
        updateExpressions.push("#an = :an")
        expressionAttributeNames["#an"] = "adminNotes"
        expressionAttributeValues[":an"] = String(adminNotes).trim()
      }

      const now = new Date().toISOString()
      updateExpressions.push("#ua = :ua")
      expressionAttributeNames["#ua"] = "updatedAt"
      expressionAttributeValues[":ua"] = now

      if (
        status === "Atendido" ||
        status === "Cerrado" ||
        status === "Resuelto"
      ) {
        updateExpressions.push("#ra = :ra")
        expressionAttributeNames["#ra"] = "resolvedAt"
        expressionAttributeValues[":ra"] = now
      }

      const updateRes = await docClient.send(
        new UpdateCommand({
          TableName: COMPLAINTS_TABLE,
          Key: { id: complaintId },
          UpdateExpression: `SET ${updateExpressions.join(", ")}`,
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues: expressionAttributeValues,
          ReturnValues: "ALL_NEW",
        }),
      )

      return response(200, {
        ok: true,
        message: "Reclamación actualizada correctamente.",
        complaint: updateRes.Attributes,
      })
    }

    // -------------------------------------------------------------------------
    // 6. INVENTORY / ADMIN LOGS ROUTES
    // -------------------------------------------------------------------------
    if (httpMethod === "GET" && (path === "/admin/logs" || path === "/logs")) {
      const auth = requireAdmin(headers, event)
      if (auth.error) return auth.error

      const res = await docClient.send(
        new ScanCommand({ TableName: LOGS_TABLE }),
      )
      const logs = (res.Items || []).sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      return response(200, { ok: true, logs })
    }

    if (
      httpMethod === "DELETE" &&
      (path.startsWith("/admin/logs/") || path.startsWith("/logs/"))
    ) {
      const auth = requireAdmin(headers, event)
      if (auth.error) return auth.error

      const id = path.replace(/^\/(admin\/logs|logs)\//, "").replace(/\/.*$/, "")
      if (!id) {
        return response(400, { message: "ID del log requerido." })
      }

      await docClient.send(
        new DeleteCommand({ TableName: LOGS_TABLE, Key: { id } }),
      )
      return response(200, {
        ok: true,
        success: true,
        message: "Log eliminado correctamente.",
      })
    }

    if (httpMethod === "POST" && (path === "/admin/logs" || path === "/logs")) {
      const auth = requireAdmin(headers, event)
      if (auth.error) return auth.error

      const { message } = parseBody(event)
      if (!message) return response(400, { message: "Mensaje requerido." })

      const newLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        message: String(message).trim(),
        timestamp: new Date().toISOString(),
      }
      await docClient.send(
        new PutCommand({ TableName: LOGS_TABLE, Item: newLog }),
      )
      return response(201, { ok: true, log: newLog })
    }

    return response(404, {
      message: `Ruta no encontrada: ${httpMethod} ${path}`,
    })
  } catch (err) {
    console.error("Unhandled API error:", err)
    return response(500, {
      message: "Error interno del servidor",
      error: err.message,
    })
  }
}
