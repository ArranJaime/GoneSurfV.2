import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react"

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

export const DEFAULT_DEMO_USER: CustomerUser = {
  firstName: "Jaime",
  lastName: "Monroy",
  email: "jaime@gonesurfing.com",
  documentType: "DNI",
  document: "72345678",
  phone: "+51 999 999 999",
  address: "Av. Principal 123, Dpto 4",
  district: "Punta Negra",
}

interface Store {
  products: Product[]
  collections: CollectionData[]
  cart: CartItem[]
  transactions: OrderTransaction[]
  users: CustomerUser[]
  addToCart: (productId: string, size: Size) => void
  changeQuantity: (productId: string, size: Size, delta: number) => void
  changeStock: (productId: string, size: Size, delta: number) => void
  completeOrder: (details: OrderDetailsInput) => { id: string }
  addProduct: (product: Omit<Product, "id">) => void
  updateProductPrice: (productId: string, newPrice: number) => void
  updateProductCollection: (productId: string, collectionName: string) => void
  addCollection: (col: Omit<CollectionData, "id" | "active">) => void
  toggleCollection: (id: string) => void
  deleteCollection: (id: string) => void
  deleteProduct: (id: string) => void
  updateOrderStatus: (id: string, status: OrderStatus) => void
  registerUser: (newUser: CustomerUser) => { ok: boolean; error?: string }
  authenticateUser: (email: string, password: string) => CustomerUser | null
  deleteUser: (email: string) => void
  resetDemoData: () => void
}

const StoreContext = createContext<Store | null>(null)

const initialCollections: CollectionData[] = [
  { id: "c1", category: "ESENCIALES DE LA COSTA", subtitle: "No plans. Just tides.", title: "The slow days", image: "/assets/underwater.jpg", active: true },
  { id: "c2", category: "HIGH PERFORMANCE", subtitle: "Born to conquer.", title: "The Blue", image: "/assets/hero-surf.jpg", active: true }
]

const initialProducts: Product[] = [
  { id: "p1", name: "Stay Real Tee", price: 109.0, category: "Merch", collectionName: "The slow days", image: "/assets/hero-surf.jpg", stocks: { S: 8, M: 12, L: 9, XL: 4 } },
  { id: "p2", name: "Stay Real Cap", price: 89.0, category: "Accesorios", collectionName: "Catálogo General", image: "/assets/cap.jpg", stocks: { Única: 18 } },
  { id: "p3", name: "Gone Surf Leash", price: 119.0, category: "Accesorios", collectionName: "The Blue", image: "/assets/leash.jpg", stocks: { Única: 12 } },
  { id: "p4", name: "Off Duty Tee", price: 99.0, category: "Merch", collectionName: "The slow days", image: "/assets/story.jpg", stocks: { S: 10, M: 15, L: 15, XL: 5 } },
]

export function safeReadStorage<T>(key: string, fallback: T, validator?: (val: unknown) => T | null): T {
  try {
    const saved = localStorage.getItem(key)
    if (!saved) return fallback
    const parsed: unknown = JSON.parse(saved)
    if (validator) {
      const validated = validator(parsed)
      return validated !== null ? validated : fallback
    }
    return (parsed as T) ?? fallback
  } catch (error) {
    console.error(`Error leyendo ${key} desde localStorage:`, error)
    return fallback
  }
}

export function safeWriteStorage(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    console.error(`Error guardando ${key} en localStorage:`, error)
    return false
  }
}

export function getCurrentSessionUser(): CustomerUser | null {
  try {
    const parsed = JSON.parse(sessionStorage.getItem("gone_current_user") || "null")
    return parsed && typeof parsed === "object" ? (parsed as CustomerUser) : null
  } catch {
    return null
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [collections, setCollections] = useState<CollectionData[]>(() =>
    safeReadStorage("gone_collections", initialCollections, (parsed) => {
      if (!Array.isArray(parsed)) return null
      const valid = parsed.filter((c): c is CollectionData => Boolean(c && typeof c.title === "string" && c.title.trim() !== ""))
      return valid.length > 0 ? valid : initialCollections
    })
  )

  const [products, setProducts] = useState<Product[]>(() =>
    safeReadStorage("gone_products", initialProducts, (parsed) => {
      if (!Array.isArray(parsed)) return null
      const valid = parsed.filter((p): p is Product => Boolean(p && typeof p.name === "string" && p.name.trim() !== ""))
      return valid.length > 0 ? valid : initialProducts
    })
  )

  const [cart, setCart] = useState<CartItem[]>(() =>
    safeReadStorage("gone_cart", [], (parsed) => (Array.isArray(parsed) ? (parsed as CartItem[]) : []))
  )

  const [transactions, setTransactions] = useState<OrderTransaction[]>(() =>
    safeReadStorage("gone_transactions", [], (parsed) => (Array.isArray(parsed) ? (parsed as OrderTransaction[]) : []))
  )

  const [users, setUsers] = useState<CustomerUser[]>(() =>
    safeReadStorage("gone_users", [], (parsed) => (Array.isArray(parsed) ? (parsed as CustomerUser[]) : []))
  )

  useEffect(() => { safeWriteStorage("gone_collections", collections) }, [collections])
  useEffect(() => { safeWriteStorage("gone_products", products) }, [products])
  useEffect(() => { safeWriteStorage("gone_transactions", transactions) }, [transactions])
  useEffect(() => { safeWriteStorage("gone_cart", cart) }, [cart])
  useEffect(() => { safeWriteStorage("gone_users", users) }, [users])

  // Sincroniza el carrito si un producto fue eliminado o su stock se redujo en Admin
  useEffect(() => {
    setCart((prevCart) => {
      let changed = false
      const nextCart = prevCart
        .map((item) => {
          const prod = products.find((p) => p.id === item.productId)
          if (!prod) {
            changed = true
            return null
          }
          const available = prod.stocks[item.size] ?? 0
          if (item.quantity > available) {
            changed = true
            return available > 0 ? { ...item, quantity: available } : null
          }
          return item
        })
        .filter((item): item is CartItem => item !== null)
      return changed ? nextCart : prevCart
    })
  }, [products])

  const addToCart = useCallback((productId: string, size: Size) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return
    const availableStock = product.stocks[size] ?? 0
    if (availableStock <= 0) return

    setCart((prev) => {
      const existing = prev.find((i) => i.productId === productId && i.size === size)
      if (existing) {
        if (existing.quantity >= availableStock) return prev
        return prev.map((i) => (i.productId === productId && i.size === size ? { ...i, quantity: i.quantity + 1 } : i))
      }
      return [...prev, { productId, size, quantity: 1 }]
    })
  }, [products])

  const changeQuantity = useCallback((productId: string, size: Size, delta: number) => {
    const product = products.find((p) => p.id === productId)
    const availableStock = product ? (product.stocks[size] ?? 0) : 0

    setCart((prev) =>
      prev
        .map((i) => {
          if (i.productId !== productId || i.size !== size) return i
          const nextQuantity = Math.min(availableStock, Math.max(0, i.quantity + delta))
          return { ...i, quantity: nextQuantity }
        })
        .filter((i) => i.quantity > 0)
    )
  }, [products])

  const changeStock = useCallback((productId: string, size: Size, delta: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p
        return { ...p, stocks: { ...p.stocks, [size]: Math.max(0, (p.stocks[size] || 0) + delta) } }
      })
    )
  }, [])

  const completeOrder = useCallback((details: OrderDetailsInput) => {
    const validCartItems = cart.filter((item) => {
      const prod = products.find((p) => p.id === item.productId)
      return Boolean(prod && (prod.stocks[item.size] ?? 0) >= item.quantity && item.quantity > 0)
    })

    if (validCartItems.length === 0) {
      throw new Error("Stock insuficiente o carrito vacío.")
    }

    const itemsTotalCents = validCartItems.reduce((sum, item) => {
      const unitPrice = products.find((p) => p.id === item.productId)?.price || 0
      return sum + Math.round(unitPrice * 100) * item.quantity
    }, 0)

    const shippingCents = Math.round((details.shipping || 0) * 100)
    const totalCents = itemsTotalCents + shippingCents
    const subtotalCents = Math.round(itemsTotalCents / 1.18)
    const taxCents = itemsTotalCents - subtotalCents

    const total = Number((totalCents / 100).toFixed(2))
    const subtotal = Number((subtotalCents / 100).toFixed(2))
    const igv = Number((taxCents / 100).toFixed(2))
    const id = `ORD-${String(Math.floor(1000 + Math.random() * 9000))}`
    const detailString = validCartItems
      .map((i) => `${i.quantity}x ${products.find((p) => p.id === i.productId)?.name ?? "Producto"} (${i.size})`)
      .join(", ")

    const newTransaction: OrderTransaction = {
      ...details,
      items: validCartItems,
      id,
      total,
      subtotal,
      igv,
      date: new Date().toISOString(),
      detail: detailString,
      status: "Procesando",
    }

    setTransactions((prev) => [...prev, newTransaction])

    setProducts((prevProducts) =>
      prevProducts.map((product) => {
        const itemsForProduct = validCartItems.filter((item) => item.productId === product.id)
        if (itemsForProduct.length === 0) return product
        const updatedStocks = { ...product.stocks }
        itemsForProduct.forEach((item) => {
          updatedStocks[item.size] = Math.max(0, (updatedStocks[item.size] || 0) - item.quantity)
        })
        return { ...product, stocks: updatedStocks }
      })
    )

    setCart([])
    return { id }
  }, [cart, products])

  const addProduct = useCallback((product: Omit<Product, "id">) => {
    setProducts((prev) => [{ ...product, id: `prod-${Date.now()}` }, ...prev])
  }, [])

  const updateProductPrice = useCallback((productId: string, newPrice: number) => {
    if (Number.isNaN(newPrice) || newPrice <= 0) return
    setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, price: Number(newPrice.toFixed(2)) } : p)))
  }, [])

  const updateProductCollection = useCallback((productId: string, collectionName: string) => {
    setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, collectionName } : p)))
  }, [])

  const addCollection = useCallback((col: Omit<CollectionData, "id" | "active">) => {
    setCollections((prev) => [...prev, { ...col, id: `col-${Date.now()}`, active: true }])
  }, [])

  const toggleCollection = useCallback((id: string) => {
    setCollections((prev) => prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c)))
  }, [])

  const deleteCollection = useCallback((id: string) => {
    setCollections((prev) => {
      const target = prev.find((c) => c.id === id)
      if (target?.title) {
        setProducts((prevProducts) =>
          prevProducts.map((p) => (p.collectionName === target.title ? { ...p, collectionName: "Catálogo General" } : p))
        )
      }
      return prev.filter((c) => c.id !== id)
    })
  }, [])

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id))
    setCart((prev) => prev.filter((item) => item.productId !== id))
  }, [])

  const updateOrderStatus = useCallback((id: string, nextStatus: OrderStatus) => {
    setTransactions((prev) => {
      const target = prev.find((t) => t.id === id)
      if (!target || target.status === nextStatus) return prev

      const wasCancelled = target.status === "Cancelado"
      const isNowCancelled = nextStatus === "Cancelado"

      // Si pasa a Cancelado devuelve el stock; si sale de Cancelado lo vuelve a descontar
      if (!wasCancelled && isNowCancelled && Array.isArray(target.items)) {
        setProducts((prevProducts) =>
          prevProducts.map((product) => {
            const orderItems = target.items.filter((i) => i.productId === product.id)
            if (orderItems.length === 0) return product
            const updatedStocks = { ...product.stocks }
            orderItems.forEach((item) => {
              updatedStocks[item.size] = (updatedStocks[item.size] || 0) + item.quantity
            })
            return { ...product, stocks: updatedStocks }
          })
        )
      } else if (wasCancelled && !isNowCancelled && Array.isArray(target.items)) {
        setProducts((prevProducts) =>
          prevProducts.map((product) => {
            const orderItems = target.items.filter((i) => i.productId === product.id)
            if (orderItems.length === 0) return product
            const updatedStocks = { ...product.stocks }
            orderItems.forEach((item) => {
              updatedStocks[item.size] = Math.max(0, (updatedStocks[item.size] || 0) - item.quantity)
            })
            return { ...product, stocks: updatedStocks }
          })
        )
      }

      return prev.map((t) => (t.id === id ? { ...t, status: nextStatus } : t))
    })
  }, [])

  const registerUser = useCallback((newUser: CustomerUser): { ok: boolean; error?: string } => {
    const cleanEmail = newUser.email.trim().toLowerCase()
    if (!cleanEmail) return { ok: false, error: "El correo electrónico es obligatorio." }

    const exists =
      cleanEmail === DEFAULT_DEMO_USER.email.toLowerCase() ||
      users.some((u) => (u.email || "").toLowerCase() === cleanEmail)

    if (exists) {
      return { ok: false, error: "Este correo ya está registrado. Intenta iniciar sesión." }
    }

    const updatedUsers = [...users, { ...newUser, email: newUser.email.trim() }]
    setUsers(updatedUsers)
    sessionStorage.setItem("gone_customer", "true")
    sessionStorage.setItem("gone_current_user", JSON.stringify(newUser))
    return { ok: true }
  }, [users])

  const authenticateUser = useCallback((email: string, password: string): CustomerUser | null => {
    const cleanEmail = email.trim().toLowerCase()
    const foundUser = users.find((u) => (u.email || "").toLowerCase() === cleanEmail && u.password === password)
    if (foundUser) {
      sessionStorage.setItem("gone_customer", "true")
      sessionStorage.setItem("gone_current_user", JSON.stringify(foundUser))
      return foundUser
    }
    if (cleanEmail === DEFAULT_DEMO_USER.email.toLowerCase() && password === "demo123") {
      sessionStorage.setItem("gone_customer", "true")
      sessionStorage.setItem("gone_current_user", JSON.stringify(DEFAULT_DEMO_USER))
      return DEFAULT_DEMO_USER
    }
    return null
  }, [users])

  const deleteUser = useCallback((email: string) => {
    const cleanEmail = email.trim().toLowerCase()
    setUsers((prev) => prev.filter((u) => (u.email || "").toLowerCase() !== cleanEmail))
    const currentSession = getCurrentSessionUser()
    if (currentSession && (currentSession.email || "").toLowerCase() === cleanEmail) {
      sessionStorage.removeItem("gone_customer")
      sessionStorage.removeItem("gone_current_user")
    }
  }, [])

  const resetDemoData = useCallback(() => {
    localStorage.removeItem("gone_transactions")
    localStorage.removeItem("gone_users")
    localStorage.removeItem("gone_cart")
    sessionStorage.removeItem("gone_customer")
    sessionStorage.removeItem("gone_current_user")
    setTransactions([])
    setUsers([])
    setCart([])
  }, [])

  const storeValue = useMemo<Store>(
    () => ({
      products,
      collections,
      cart,
      transactions,
      users,
      addToCart,
      changeQuantity,
      changeStock,
      completeOrder,
      addProduct,
      updateProductPrice,
      updateProductCollection,
      addCollection,
      toggleCollection,
      deleteCollection,
      deleteProduct,
      updateOrderStatus,
      registerUser,
      authenticateUser,
      deleteUser,
      resetDemoData,
    }),
    [
      products,
      collections,
      cart,
      transactions,
      users,
      addToCart,
      changeQuantity,
      changeStock,
      completeOrder,
      addProduct,
      updateProductPrice,
      updateProductCollection,
      addCollection,
      toggleCollection,
      deleteCollection,
      deleteProduct,
      updateOrderStatus,
      registerUser,
      authenticateUser,
      deleteUser,
      resetDemoData,
    ]
  )

  return <StoreContext.Provider value={storeValue}>{children}</StoreContext.Provider>
}

export const useStore = () => {
  const context = useContext(StoreContext)
  if (!context) throw new Error("useStore must be used within StoreProvider")
  return context
}