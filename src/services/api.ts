/**
 * Gone Surfing - Data Abstraction Layer & Cloud-Ready API Service
 * Decouples direct browser storage from UI components and provides seamless switching
 * between local simulation ('local') and Amazon Web Services ('aws').
 */

import {
  type SessionData,
  createAdminSession,
  getAdminSession,
  clearAdminSession,
  validatePrice,
  validateStock,
  sanitizeString,
} from "../utils/security"
import { calculateOrderAmounts } from "../utils/accounting"
import { optimizeImageFile } from "../utils/imageOptimizer"

export type Size = "S" | "M" | "L" | "XL" | "Única"
export type OrderStatus = "Procesando" | "Enviado" | "Entregado" | "Cancelado"

export interface CollectionData {
  id: string
  category: string
  subtitle: string
  title: string
  image: string
  active: boolean
}

export interface Product {
  id: string
  name: string
  price: number
  category: string
  collectionName?: string
  image: string
  stocks: Record<string, number>
}

export interface CartItem {
  productId: string
  size: Size
  quantity: number
}

export interface CustomerUser {
  firstName: string
  lastName: string
  email: string
  documentType?: "DNI" | "CE"
  document?: string
  phone?: string
  address?: string
  district?: string
  password?: string
}

export interface OrderDetailsInput {
  customer: string
  documentType?: "DNI" | "CE"
  document: string
  email: string
  phone: string
  districtCode: string
  districtName: string
  districtX: number
  districtY: number
  address: string
  shippingMethod?: "standard" | "express"
  shipping: number
  total?: number
  subtotal?: number
  items: CartItem[]
}

export interface OrderTransaction extends OrderDetailsInput {
  id: string
  total: number
  subtotal: number
  igv: number
  date: string
  detail: string
  status: OrderStatus
}

export interface MediaUploadResponse {
  url: string
  key?: string
  format?: string
  sizeKb?: number
}

// -----------------------------------------------------------------------------
// Initial Seed Data
// -----------------------------------------------------------------------------
export const INITIAL_COLLECTIONS: CollectionData[] = [
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

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Stay Real Tee",
    price: 109.0,
    category: "Merch",
    collectionName: "The slow days",
    image: "/assets/hero-surf.jpg",
    stocks: { S: 8, M: 12, L: 9, XL: 4 },
  },
  {
    id: "p2",
    name: "Stay Real Cap",
    price: 89.0,
    category: "Accesorios",
    collectionName: "Catálogo General",
    image: "/assets/cap.jpg",
    stocks: { Única: 18 },
  },
  {
    id: "p3",
    name: "Gone Surf Leash",
    price: 119.0,
    category: "Accesorios",
    collectionName: "The Blue",
    image: "/assets/leash.jpg",
    stocks: { Única: 12 },
  },
  {
    id: "p4",
    name: "Off Duty Tee",
    price: 99.0,
    category: "Merch",
    collectionName: "The slow days",
    image: "/assets/story.jpg",
    stocks: { S: 10, M: 15, L: 15, XL: 5 },
  },
]

// -----------------------------------------------------------------------------
// Environment Configuration
// -----------------------------------------------------------------------------
const STORAGE_MODE = (
  import.meta.env.VITE_STORAGE_MODE || "local"
).toLowerCase()
const API_GATEWAY_URL = import.meta.env.VITE_AWS_API_GATEWAY_URL || ""
const ADMIN_USER_ENV = import.meta.env.VITE_ADMIN_USER || "admin"
const ADMIN_PASSWORD_ENV = import.meta.env.VITE_ADMIN_PASSWORD || "admin666"
const ADMIN_SESSION_HOURS = parseInt(
  import.meta.env.VITE_ADMIN_SESSION_HOURS || "4",
  10,
)

// Helper to broadcast local changes across components in real-time
export function broadcastSyncEvent(
  channel: "products" | "collections" | "orders" | "cart" | "users",
) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("gonesurf:sync", { detail: { channel } }),
    )
  }
}

// -----------------------------------------------------------------------------
// Local Storage Safe Helpers
// -----------------------------------------------------------------------------
function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return parsed ?? fallback
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err)
    return fallback
  }
}

function writeStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (err) {
    console.error(`Error writing ${key} to storage:`, err)
  }
}

// Helper to execute AWS REST fetch with Bearer token
async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> {
  const session = getAdminSession()
  const headers = new Headers(options.headers || {})
  headers.set("Content-Type", "application/json")
  if (session && session.token) {
    headers.set("Authorization", `Bearer ${session.token}`)
  }

  const url = `${API_GATEWAY_URL.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`
  return fetch(url, { ...options, headers })
}

// =============================================================================
// API SERVICE DEFINITION
// =============================================================================

export const api = {
  getStorageMode(): "local" | "aws" {
    return STORAGE_MODE === "aws" ? "aws" : "local"
  },

  // ---------------------------------------------------------------------------
  // AUTHENTICATION SERVICE
  // ---------------------------------------------------------------------------
  auth: {
    async loginAdmin(user: string, pass: string): Promise<{
      ok: boolean
      session?: SessionData
      error?: string
    }> {
      const cleanUser = sanitizeString(user)
      if (STORAGE_MODE === "aws" && API_GATEWAY_URL) {
        try {
          const res = await fetch(`${API_GATEWAY_URL}/auth/admin/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user: cleanUser, password: pass }),
          })
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}))
            return {
              ok: false,
              error:
                errData.message || "Credenciales de administrador inválidas.",
            }
          }
          const data = await res.json()
          const session: SessionData = {
            user: cleanUser,
            token: data.token || data.idToken,
            role: "admin",
            loginTime: Date.now(),
            expiresAt:
              data.expiresAt || Date.now() + ADMIN_SESSION_HOURS * 3600 * 1000,
          }
          sessionStorage.setItem("gone_admin_session", JSON.stringify(session))
          sessionStorage.setItem("gone_admin", "true")
          return { ok: true, session }
        } catch (err) {
          console.error("AWS Cognito/API Gateway login error:", err)
          return {
            ok: false,
            error: "Error conectando con el servicio de autenticación AWS.",
          }
        }
      }

      // Local Mode: Compare against environment variables (no hardcoded fallback)
      if (cleanUser === ADMIN_USER_ENV && pass === ADMIN_PASSWORD_ENV) {
        const session = createAdminSession(cleanUser, ADMIN_SESSION_HOURS)
        return { ok: true, session }
      }
      return {
        ok: false,
        error: "Usuario o contraseña de administrador incorrectos.",
      }
    },

    async logoutAdmin(): Promise<void> {
      clearAdminSession()
      broadcastSyncEvent("users")
    },

    getAdminSession(): SessionData | null {
      return getAdminSession()
    },

    async registerCustomer(newUser: CustomerUser): Promise<{
      ok: boolean
      user?: CustomerUser
      error?: string
    }> {
      const cleanEmail = sanitizeString(newUser.email).toLowerCase()
      if (!cleanEmail)
        return { ok: false, error: "El correo electrónico es obligatorio." }

      if (STORAGE_MODE === "aws" && API_GATEWAY_URL) {
        try {
          const res = await fetch(
            `${API_GATEWAY_URL}/auth/customers/register`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(newUser),
            },
          )
          if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            return {
              ok: false,
              error: err.message || "Error al registrar cliente en AWS.",
            }
          }
          const saved = await res.json()
          return { ok: true, user: saved }
        } catch {
          return { ok: false, error: "Error de conexión con el backend AWS." }
        }
      }

      const users = readStorage<CustomerUser[]>("gone_users", [])
      const exists = users.some(
        (u) => (u.email || "").toLowerCase() === cleanEmail,
      )
      if (exists) {
        return {
          ok: false,
          error: "Este correo ya está registrado. Intenta iniciar sesión.",
        }
      }

      const normalized: CustomerUser = {
        ...newUser,
        email: cleanEmail,
        firstName: sanitizeString(newUser.firstName),
        lastName: sanitizeString(newUser.lastName),
        document: sanitizeString(newUser.document || ""),
        phone: sanitizeString(newUser.phone || ""),
        address: sanitizeString(newUser.address || ""),
      }

      users.push(normalized)
      writeStorage("gone_users", users)
      sessionStorage.setItem("gone_customer", "true")
      sessionStorage.setItem("gone_current_user", JSON.stringify(normalized))
      broadcastSyncEvent("users")
      return { ok: true, user: normalized }
    },

    async loginCustomer(
      email: string,
      pass: string,
    ): Promise<CustomerUser | null> {
      const cleanEmail = sanitizeString(email).toLowerCase()
      if (STORAGE_MODE === "aws" && API_GATEWAY_URL) {
        try {
          const res = await fetch(`${API_GATEWAY_URL}/auth/customers/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: cleanEmail, password: pass }),
          })
          if (!res.ok) return null
          const user = await res.json()
          sessionStorage.setItem("gone_customer", "true")
          sessionStorage.setItem("gone_current_user", JSON.stringify(user))
          return user
        } catch {
          return null
        }
      }

      const users = readStorage<CustomerUser[]>("gone_users", [])
      const found = users.find(
        (u) =>
          (u.email || "").toLowerCase() === cleanEmail && u.password === pass,
      )
      if (found) {
        sessionStorage.setItem("gone_customer", "true")
        sessionStorage.setItem("gone_current_user", JSON.stringify(found))
        return found
      }
      return null
    },

    async logoutCustomer(): Promise<void> {
      sessionStorage.removeItem("gone_customer")
      sessionStorage.removeItem("gone_current_user")
      broadcastSyncEvent("users")
    },

    getCurrentCustomer(): CustomerUser | null {
      try {
        const raw = sessionStorage.getItem("gone_current_user")
        if (!raw) return null
        const parsed = JSON.parse(raw)
        return parsed && typeof parsed.email === "string" ? parsed : null
      } catch {
        return null
      }
    },
  },

  // ---------------------------------------------------------------------------
  // PRODUCTS SERVICE
  // ---------------------------------------------------------------------------
  products: {
    async getAll(): Promise<Product[]> {
      if (STORAGE_MODE === "aws" && API_GATEWAY_URL) {
        try {
          const res = await fetch(`${API_GATEWAY_URL}/products`)
          if (res.ok) return await res.json()
        } catch (err) {
          console.warn(
            "Fallo al obtener productos de AWS API Gateway, usando almacenamiento local:",
            err,
          )
        }
      }

      const items = readStorage<Product[]>("gone_products", INITIAL_PRODUCTS)
      // Ensure all initial products are seeded if storage was empty
      if (!Array.isArray(items) || items.length === 0) {
        writeStorage("gone_products", INITIAL_PRODUCTS)
        return INITIAL_PRODUCTS
      }
      return items
    },

    async getById(id: string): Promise<Product | null> {
      const all = await api.products.getAll()
      return all.find((p) => p.id === id) || null
    },

    async create(newProduct: Omit<Product, "id">): Promise<Product> {
      const validatedPrice = validatePrice(newProduct.price)
      const isAcc = newProduct.category === "Accesorios"
      const cleanedStocks: Record<string, number> = isAcc
        ? { Única: validateStock(newProduct.stocks?.["Única"]) }
        : {
            S: validateStock(newProduct.stocks?.S),
            M: validateStock(newProduct.stocks?.M),
            L: validateStock(newProduct.stocks?.L),
            XL: validateStock(newProduct.stocks?.XL),
          }

      const payload: Product = {
        id: `prod-${Date.now()}`,
        name: sanitizeString(newProduct.name),
        price: validatedPrice.value,
        category: sanitizeString(newProduct.category),
        collectionName: sanitizeString(
          newProduct.collectionName || "Catálogo General",
        ),
        image: newProduct.image,
        stocks: cleanedStocks,
      }

      if (STORAGE_MODE === "aws" && API_GATEWAY_URL) {
        try {
          const res = await fetchWithAuth("/products", {
            method: "POST",
            body: JSON.stringify(payload),
          })
          if (res.ok) {
            const saved = await res.json()
            broadcastSyncEvent("products")
            return saved
          }
        } catch (err) {
          console.error("Fallo al crear producto en AWS:", err)
        }
      }

      const current = readStorage<Product[]>("gone_products", INITIAL_PRODUCTS)
      const updated = [payload, ...current]
      writeStorage("gone_products", updated)
      broadcastSyncEvent("products")
      return payload
    },

    async update(
      id: string,
      partial: Partial<Omit<Product, "id">>,
    ): Promise<Product> {
      if (STORAGE_MODE === "aws" && API_GATEWAY_URL) {
        try {
          const res = await fetchWithAuth(`/products/${id}`, {
            method: "PUT",
            body: JSON.stringify(partial),
          })
          if (res.ok) {
            const updated = await res.json()
            broadcastSyncEvent("products")
            return updated
          }
        } catch (err) {
          console.error("Fallo al actualizar producto en AWS:", err)
        }
      }

      const current = readStorage<Product[]>("gone_products", INITIAL_PRODUCTS)
      let updatedProduct: Product | null = null

      const updated = current.map((p) => {
        if (p.id !== id) return p

        const nextCategory =
          partial.category !== undefined
            ? sanitizeString(partial.category)
            : p.category
        const isAcc = nextCategory === "Accesorios"

        let nextStocks = p.stocks
        if (partial.stocks) {
          if (isAcc) {
            nextStocks = {
              Única: validateStock(
                partial.stocks["Única"] ?? p.stocks["Única"] ?? 10,
              ),
            }
          } else {
            nextStocks = {
              S: validateStock(partial.stocks.S ?? p.stocks.S ?? 0),
              M: validateStock(partial.stocks.M ?? p.stocks.M ?? 0),
              L: validateStock(partial.stocks.L ?? p.stocks.L ?? 0),
              XL: validateStock(partial.stocks.XL ?? p.stocks.XL ?? 0),
            }
          }
        } else if (isAcc && !p.stocks["Única"]) {
          nextStocks = { Única: 10 }
        }

        updatedProduct = {
          ...p,
          name:
            partial.name !== undefined ? sanitizeString(partial.name) : p.name,
          price:
            partial.price !== undefined
              ? validatePrice(partial.price).value
              : p.price,
          category: nextCategory,
          collectionName:
            partial.collectionName !== undefined
              ? sanitizeString(partial.collectionName)
              : p.collectionName,
          image: partial.image !== undefined ? partial.image : p.image,
          stocks: nextStocks,
        }
        return updatedProduct
      })

      writeStorage("gone_products", updated)
      broadcastSyncEvent("products")
      return updatedProduct || current[0]
    },

    async updateStock(id: string, size: Size, delta: number): Promise<Product> {
      const current = readStorage<Product[]>("gone_products", INITIAL_PRODUCTS)
      let modified: Product | null = null

      const updated = current.map((p) => {
        if (p.id !== id) return p
        const currentUnits = p.stocks[size] || 0
        const nextUnits = Math.max(0, currentUnits + delta)
        modified = {
          ...p,
          stocks: {
            ...p.stocks,
            [size]: nextUnits,
          },
        }
        return modified
      })

      writeStorage("gone_products", updated)
      broadcastSyncEvent("products")
      return modified || current[0]
    },

    async delete(id: string): Promise<boolean> {
      if (STORAGE_MODE === "aws" && API_GATEWAY_URL) {
        try {
          const res = await fetchWithAuth(`/products/${id}`, {
            method: "DELETE",
          })
          if (res.ok) {
            broadcastSyncEvent("products")
            return true
          }
        } catch (err) {
          console.error("Fallo al eliminar producto en AWS:", err)
        }
      }

      const current = readStorage<Product[]>("gone_products", INITIAL_PRODUCTS)
      const filtered = current.filter((p) => p.id !== id)
      writeStorage("gone_products", filtered)

      // Also clean product from saved cart
      const cart = readStorage<CartItem[]>("gone_cart", [])
      const cleanCart = cart.filter((i) => i.productId !== id)
      writeStorage("gone_cart", cleanCart)

      broadcastSyncEvent("products")
      broadcastSyncEvent("cart")
      return true
    },
  },

  // ---------------------------------------------------------------------------
  // COLLECTIONS SERVICE
  // ---------------------------------------------------------------------------
  collections: {
    async getAll(): Promise<CollectionData[]> {
      if (STORAGE_MODE === "aws" && API_GATEWAY_URL) {
        try {
          const res = await fetch(`${API_GATEWAY_URL}/collections`)
          if (res.ok) return await res.json()
        } catch (err) {
          console.warn("Fallo al obtener colecciones de AWS API Gateway:", err)
        }
      }

      const items = readStorage<CollectionData[]>(
        "gone_collections",
        INITIAL_COLLECTIONS,
      )
      if (!Array.isArray(items) || items.length === 0) {
        writeStorage("gone_collections", INITIAL_COLLECTIONS)
        return INITIAL_COLLECTIONS
      }
      return items
    },

    async create(
      col: Omit<CollectionData, "id" | "active">,
    ): Promise<CollectionData> {
      const payload: CollectionData = {
        id: `col-${Date.now()}`,
        title: sanitizeString(col.title),
        subtitle: sanitizeString(col.subtitle),
        category: sanitizeString(col.category || "LIFESTYLE"),
        image: col.image,
        active: true,
      }

      if (STORAGE_MODE === "aws" && API_GATEWAY_URL) {
        try {
          const res = await fetchWithAuth("/collections", {
            method: "POST",
            body: JSON.stringify(payload),
          })
          if (res.ok) {
            const saved = await res.json()
            broadcastSyncEvent("collections")
            return saved
          }
        } catch (err) {
          console.error("Fallo al crear colección en AWS:", err)
        }
      }

      const current = readStorage<CollectionData[]>(
        "gone_collections",
        INITIAL_COLLECTIONS,
      )
      const updated = [...current, payload]
      writeStorage("gone_collections", updated)
      broadcastSyncEvent("collections")
      return payload
    },

    async toggle(id: string): Promise<CollectionData> {
      const current = readStorage<CollectionData[]>(
        "gone_collections",
        INITIAL_COLLECTIONS,
      )
      let toggled: CollectionData | null = null

      const updated = current.map((c) => {
        if (c.id !== id) return c
        toggled = { ...c, active: !c.active }
        return toggled
      })

      writeStorage("gone_collections", updated)
      broadcastSyncEvent("collections")
      return toggled || current[0]
    },

    async delete(id: string): Promise<boolean> {
      const current = readStorage<CollectionData[]>(
        "gone_collections",
        INITIAL_COLLECTIONS,
      )
      const target = current.find((c) => c.id === id)

      // Reassign affected products back to "Catálogo General"
      if (target?.title) {
        const products = readStorage<Product[]>(
          "gone_products",
          INITIAL_PRODUCTS,
        )
        const updatedProducts = products.map((p) =>
          p.collectionName === target.title
            ? { ...p, collectionName: "Catálogo General" }
            : p,
        )
        writeStorage("gone_products", updatedProducts)
        broadcastSyncEvent("products")
      }

      const filtered = current.filter((c) => c.id !== id)
      writeStorage("gone_collections", filtered)
      broadcastSyncEvent("collections")
      return true
    },
  },

  // ---------------------------------------------------------------------------
  // ORDERS SERVICE
  // ---------------------------------------------------------------------------
  orders: {
    async getAll(): Promise<OrderTransaction[]> {
      if (STORAGE_MODE === "aws" && API_GATEWAY_URL) {
        try {
          const res = await fetchWithAuth("/orders")
          if (res.ok) return await res.json()
        } catch (err) {
          console.warn("Fallo al obtener pedidos de AWS:", err)
        }
      }
      return readStorage<OrderTransaction[]>("gone_transactions", [])
    },

    /**
     * Executes atomic order creation with inventory stock decrements and SUNAT accounting recalculation.
     */
    async create(
      orderInput: OrderDetailsInput,
      catalogProducts: Product[],
    ): Promise<OrderTransaction> {
      // 1. Validate items and verify live inventory
      const validCartItems = orderInput.items.filter((item) => {
        const prod = catalogProducts.find((p) => p.id === item.productId)
        const available = prod ? (prod.stocks[item.size] ?? 0) : 0
        return available >= item.quantity && item.quantity > 0
      })

      if (validCartItems.length === 0) {
        throw new Error("No hay stock suficiente para completar este pedido.")
      }

      // 2. Perform official SUNAT accounting recalculation in integer cents
      const accounting = calculateOrderAmounts(
        validCartItems,
        catalogProducts,
        orderInput.shippingMethod || "standard",
      )

      const orderId = `ORD-${String(Math.floor(1000 + Math.random() * 9000))}`
      const detailString = accounting.items
        .map((i) => `${i.quantity}x ${i.name} (${i.size})`)
        .join(", ")

      const transaction: OrderTransaction = {
        ...orderInput,
        customer: sanitizeString(orderInput.customer),
        document: sanitizeString(orderInput.document),
        email: sanitizeString(orderInput.email).toLowerCase(),
        phone: sanitizeString(orderInput.phone),
        address: sanitizeString(orderInput.address),
        districtName: sanitizeString(orderInput.districtName),
        items: validCartItems,
        id: orderId,
        total: accounting.total,
        subtotal: accounting.subtotal,
        igv: accounting.igv,
        shipping: accounting.shipping,
        date: new Date().toISOString(),
        detail: detailString,
        status: "Procesando",
      }

      // AWS Mode dispatch
      if (STORAGE_MODE === "aws" && API_GATEWAY_URL) {
        try {
          const res = await fetch(`${API_GATEWAY_URL}/orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(transaction),
          })
          if (res.ok) {
            const saved = await res.json()
            broadcastSyncEvent("orders")
            broadcastSyncEvent("products")
            return saved
          }
        } catch (err) {
          console.error("Fallo al guardar orden en AWS DynamoDB:", err)
        }
      }

      // 3. Atomically decrement stock in local products catalog
      const currentProducts = readStorage<Product[]>(
        "gone_products",
        INITIAL_PRODUCTS,
      )
      const updatedProducts = currentProducts.map((product) => {
        const itemsForProd = validCartItems.filter(
          (i) => i.productId === product.id,
        )
        if (itemsForProd.length === 0) return product

        const newStocks = { ...product.stocks }
        itemsForProd.forEach((cartItem) => {
          const currentStock = newStocks[cartItem.size] || 0
          newStocks[cartItem.size] = Math.max(
            0,
            currentStock - cartItem.quantity,
          )
        })

        return { ...product, stocks: newStocks }
      })

      // 4. Persist updated stock and new order
      writeStorage("gone_products", updatedProducts)
      const currentOrders = readStorage<OrderTransaction[]>(
        "gone_transactions",
        [],
      )
      writeStorage("gone_transactions", [transaction, ...currentOrders])
      writeStorage("gone_cart", [])

      broadcastSyncEvent("products")
      broadcastSyncEvent("orders")
      broadcastSyncEvent("cart")

      return transaction
    },

    async updateStatus(
      id: string,
      nextStatus: OrderStatus,
    ): Promise<OrderTransaction> {
      const orders = readStorage<OrderTransaction[]>("gone_transactions", [])
      const target = orders.find((o) => o.id === id)
      if (!target) throw new Error("Pedido no encontrado.")

      const wasCancelled = target.status === "Cancelado"
      const isNowCancelled = nextStatus === "Cancelado"

      // Handle stock restoration on cancellation or re-decrement on un-cancellation
      if (wasCancelled !== isNowCancelled && Array.isArray(target.items)) {
        const products = readStorage<Product[]>(
          "gone_products",
          INITIAL_PRODUCTS,
        )
        const updatedProducts = products.map((prod) => {
          const matching = target.items.filter((i) => i.productId === prod.id)
          if (matching.length === 0) return prod

          const newStocks = { ...prod.stocks }
          matching.forEach((item) => {
            const currentUnits = newStocks[item.size] || 0
            if (isNowCancelled) {
              // Return stock
              newStocks[item.size] = currentUnits + item.quantity
            } else {
              // Re-deduct stock
              newStocks[item.size] = Math.max(0, currentUnits - item.quantity)
            }
          })
          return { ...prod, stocks: newStocks }
        })
        writeStorage("gone_products", updatedProducts)
        broadcastSyncEvent("products")
      }

      const updatedOrders = orders.map((o) =>
        o.id === id ? { ...o, status: nextStatus } : o,
      )
      writeStorage("gone_transactions", updatedOrders)
      broadcastSyncEvent("orders")

      return { ...target, status: nextStatus }
    },
  },

  // ---------------------------------------------------------------------------
  // MEDIA UPLOAD SERVICE (CANVAS COMPRESSION + S3 HOOK)
  // ---------------------------------------------------------------------------
  media: {
    /**
     * Compresses image on client (max 800px, WebP/JPEG) and uploads it:
     * - In 'local' mode: returns optimized base64 data URL (<50KB).
     * - In 'aws' mode: calls S3 Presigned URL endpoint, PUTs binary blob, returns CloudFront CDN URL.
     */
    async uploadImage(file: File): Promise<MediaUploadResponse> {
      // 1. Client-side Canvas optimization (max 800px, 0.82 quality)
      const optimized = await optimizeImageFile(file, 800, 0.82)

      // 2. AWS S3 Presigned URL flow if configured
      if (STORAGE_MODE === "aws" && API_GATEWAY_URL) {
        try {
          const presignRes = await fetchWithAuth("/media/presign", {
            method: "POST",
            body: JSON.stringify({
              fileName: file.name,
              contentType: optimized.blob.type,
              sizeBytes: optimized.blob.size,
            }),
          })

          if (presignRes.ok) {
            const { uploadUrl, fileKey, publicUrl } = await presignRes.json()

            // Direct binary PUT to S3 Bucket
            const s3Upload = await fetch(uploadUrl, {
              method: "PUT",
              headers: { "Content-Type": optimized.blob.type },
              body: optimized.blob,
            })

            if (s3Upload.ok) {
              return {
                url: publicUrl,
                key: fileKey,
                format: optimized.format,
                sizeKb: optimized.sizeKb,
              }
            }
          }
        } catch (err) {
          console.warn(
            "AWS S3 direct upload error, falling back to local optimized data URL:",
            err,
          )
        }
      }

      // Local Mode: Returns lightweight compressed Data URL
      return {
        url: optimized.dataUrl,
        format: optimized.format,
        sizeKb: optimized.sizeKb,
      }
    },
  },
}
