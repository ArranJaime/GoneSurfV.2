import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react"
import {
  api,
  broadcastSyncEvent,
  INITIAL_COLLECTIONS,
  INITIAL_PRODUCTS,
  type Product,
  type CollectionData,
  type CartItem,
  type CustomerUser,
  type OrderDetailsInput,
  type OrderTransaction,
  type Order,
  type OrderPaymentMethod,
  type Size,
  type OrderStatus,
} from "./services/api"
import { calculateOrderAmounts } from "./utils/accounting"

export type {
  Product,
  CollectionData,
  CartItem,
  CustomerUser,
  OrderDetailsInput,
  OrderTransaction,
  Order,
  OrderPaymentMethod,
  Size,
  OrderStatus,
}

export interface RegisterResult {
  ok: boolean
  error?: string
}

export interface Store {
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
  updateProduct: (id: string, updates: Partial<Omit<Product, "id">>) => void
  updateProductPrice: (productId: string, newPrice: number) => void
  updateProductCollection: (productId: string, collectionName: string) => void
  addCollection: (col: Omit<CollectionData, "id" | "active">) => void
  toggleCollection: (id: string) => void
  deleteCollection: (id: string) => void
  deleteProduct: (id: string) => void
  updateOrderStatus: (id: string, status: OrderStatus) => void
  registerUser: (newUser: CustomerUser) => RegisterResult
  authenticateUser: (email: string, password: string) => CustomerUser | null
  deleteUser: (email: string) => void
  resetDemoData: () => void
}

const StoreContext = createContext<Store | null>(null)

export function safeReadStorage<T>(
  key: string,
  fallback: T,
  validator?: (val: unknown) => T | null,
): T {
  try {
    const saved = localStorage.getItem(key)
    if (!saved) return fallback
    const parsed: unknown = JSON.parse(saved)
    if (validator) {
      const validated = validator(parsed)
      return validated !== null ? validated : fallback
    }
    return parsed as T ?? fallback
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
  return api.auth.getCurrentCustomer()
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [collections, setCollections] = useState<CollectionData[]>(() =>
    safeReadStorage("gone_collections", INITIAL_COLLECTIONS, (parsed) => {
      if (!Array.isArray(parsed)) return null
      const valid = parsed.filter((c): c is CollectionData =>
        Boolean(c && typeof c.title === "string" && c.title.trim() !== ""),
      )
      return valid.length > 0 ? valid : INITIAL_COLLECTIONS
    }),
  )

  const [products, setProducts] = useState<Product[]>(() =>
    safeReadStorage("gone_products", INITIAL_PRODUCTS, (parsed) => {
      if (!Array.isArray(parsed)) return null
      const valid = parsed.filter((p): p is Product =>
        Boolean(p && typeof p.name === "string" && p.name.trim() !== ""),
      )
      return valid.length > 0 ? valid : INITIAL_PRODUCTS
    }),
  )

  const [cart, setCart] = useState<CartItem[]>(() =>
    safeReadStorage("gone_cart", [], (parsed) =>
      Array.isArray(parsed) ? parsed as CartItem[] : [],
    ),
  )

  const [transactions, setTransactions] = useState<OrderTransaction[]>(() =>
    safeReadStorage("gone_transactions", [], (parsed) =>
      Array.isArray(parsed) ? parsed as OrderTransaction[] : [],
    ),
  )

  const [users, setUsers] = useState<CustomerUser[]>(() =>
    safeReadStorage("gone_users", [], (parsed) =>
      Array.isArray(parsed) ? parsed as CustomerUser[] : [],
    ),
  )

  // Real-time synchronization across storage and internal event bus
  const reloadFromStorage = useCallback(() => {
    setCollections(safeReadStorage("gone_collections", INITIAL_COLLECTIONS))
    setProducts(safeReadStorage("gone_products", INITIAL_PRODUCTS))
    setTransactions(safeReadStorage("gone_transactions", []))
    setCart(safeReadStorage("gone_cart", []))
    setUsers(safeReadStorage("gone_users", []))
  }, [])

  useEffect(() => {
    const handleStorageSync = (e: StorageEvent) => {
      if (e.key?.startsWith("gone_")) {
        reloadFromStorage()
      }
    }

    const handleCustomSync = () => {
      reloadFromStorage()
    }

    window.addEventListener("storage", handleStorageSync)
    window.addEventListener("gonesurf:sync", handleCustomSync)
    return () => {
      window.removeEventListener("storage", handleStorageSync)
      window.removeEventListener("gonesurf:sync", handleCustomSync)
    }
  }, [reloadFromStorage])

  // Persist local changes and broadcast
  useEffect(() => {
    safeWriteStorage("gone_collections", collections)
  }, [collections])
  useEffect(() => {
    safeWriteStorage("gone_products", products)
  }, [products])
  useEffect(() => {
    safeWriteStorage("gone_transactions", transactions)
  }, [transactions])
  useEffect(() => {
    safeWriteStorage("gone_cart", cart)
  }, [cart])
  useEffect(() => {
    safeWriteStorage("gone_users", users)
  }, [users])

  // Ensure cart quantities never exceed live inventory
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

  const addToCart = useCallback(
    (productId: string, size: Size) => {
      const product = products.find((p) => p.id === productId)
      if (!product) return
      const availableStock = product.stocks[size] ?? 0
      if (availableStock <= 0) return

      setCart((prev) => {
        const existing = prev.find(
          (i) => i.productId === productId && i.size === size,
        )
        if (existing) {
          if (existing.quantity >= availableStock) return prev
          const updated = prev.map((i) =>
            i.productId === productId && i.size === size
              ? { ...i, quantity: i.quantity + 1 }
              : i,
          )
          safeWriteStorage("gone_cart", updated)
          return updated
        }
        const updated = [...prev, { productId, size, quantity: 1 }]
        safeWriteStorage("gone_cart", updated)
        return updated
      })
    },
    [products],
  )

  const changeQuantity = useCallback(
    (productId: string, size: Size, delta: number) => {
      const product = products.find((p) => p.id === productId)
      const availableStock = product ? (product.stocks[size] ?? 0) : 0

      setCart((prev) => {
        const updated = prev
          .map((i) => {
            if (i.productId !== productId || i.size !== size) return i
            const nextQuantity = Math.min(
              availableStock,
              Math.max(0, i.quantity + delta),
            )
            return { ...i, quantity: nextQuantity }
          })
          .filter((i) => i.quantity > 0)
        safeWriteStorage("gone_cart", updated)
        return updated
      })
    },
    [products],
  )

  const changeStock = useCallback(
    (productId: string, size: Size, delta: number) => {
      api.products.updateStock(productId, size, delta).then(() => {
        setProducts((prev) =>
          prev.map((p) => {
            if (p.id !== productId) return p
            return {
              ...p,
              stocks: {
                ...p.stocks,
                [size]: Math.max(0, (p.stocks[size] || 0) + delta),
              },
            }
          }),
        )
      })
    },
    [],
  )

  const completeOrder = useCallback(
    (details: OrderDetailsInput): { id: string } => {
      // 1. Verify stock against catalog products
      const validCartItems = cart.filter((item) => {
        const prod = products.find((p) => p.id === item.productId)
        return Boolean(
          prod &&
            (prod.stocks[item.size] ?? 0) >= item.quantity &&
            item.quantity > 0,
        )
      })

      if (validCartItems.length === 0) {
        throw new Error("Stock insuficiente o carrito vacío.")
      }

      // 2. SUNAT Accounting recalculation strictly in integer cents
      const accounting = calculateOrderAmounts(
        validCartItems,
        products,
        details.shippingMethod || "standard",
      )

      const id = `ORD-${String(Math.floor(1000 + Math.random() * 9000))}`
      const detailString = accounting.items
        .map((i) => `${i.quantity}x ${i.name} (${i.size})`)
        .join(", ")

      const initialStatus: OrderStatus =
        details.paymentMethod === "yape_plin"
          ? "Pendiente de Pago"
          : "Procesando"

      const newTransaction: OrderTransaction = {
        ...details,
        paymentMethod: details.paymentMethod || "tarjeta",
        items: validCartItems,
        id,
        total: accounting.total,
        subtotal: accounting.subtotal,
        igv: accounting.igv,
        shipping: accounting.shipping,
        date: new Date().toISOString(),
        detail: detailString,
        status: initialStatus,
      }

      // 3. Atomically decrement stock
      setProducts((prevProducts) => {
        const updated = prevProducts.map((product) => {
          const itemsForProduct = validCartItems.filter(
            (item) => item.productId === product.id,
          )
          if (itemsForProduct.length === 0) return product
          const updatedStocks = { ...product.stocks }
          itemsForProduct.forEach((item) => {
            updatedStocks[item.size] = Math.max(
              0,
              (updatedStocks[item.size] || 0) - item.quantity,
            )
          })
          return { ...product, stocks: updatedStocks }
        })
        safeWriteStorage("gone_products", updated)
        return updated
      })

      setTransactions((prev) => {
        const updated = [newTransaction, ...prev]
        safeWriteStorage("gone_transactions", updated)
        return updated
      })

      setCart([])
      safeWriteStorage("gone_cart", [])

      // Broadcast across tabs
      broadcastSyncEvent("products")
      broadcastSyncEvent("orders")
      broadcastSyncEvent("cart")

      return { id }
    },
    [cart, products],
  )

  const addProduct = useCallback((product: Omit<Product, "id">) => {
    api.products.create(product).then((saved) => {
      setProducts((prev) => [saved, ...prev.filter((p) => p.id !== saved.id)])
    })
  }, [])

  const updateProduct = useCallback(
    (id: string, updates: Partial<Omit<Product, "id">>) => {
      api.products.update(id, updates).then((updated) => {
        setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)))
      })
    },
    [],
  )

  const updateProductPrice = useCallback(
    (productId: string, newPrice: number) => {
      if (Number.isNaN(newPrice) || newPrice <= 0) return
      updateProduct(productId, { price: Number(newPrice.toFixed(2)) })
    },
    [updateProduct],
  )

  const updateProductCollection = useCallback(
    (productId: string, collectionName: string) => {
      updateProduct(productId, { collectionName })
    },
    [updateProduct],
  )

  const addCollection = useCallback(
    (col: Omit<CollectionData, "id" | "active">) => {
      api.collections.create(col).then((saved) => {
        setCollections((prev) => [...prev, saved])
      })
    },
    [],
  )

  const toggleCollection = useCallback((id: string) => {
    api.collections.toggle(id).then((toggled) => {
      setCollections((prev) => prev.map((c) => (c.id === id ? toggled : c)))
    })
  }, [])

  const deleteCollection = useCallback(
    (id: string) => {
      api.collections.delete(id).then(() => {
        setCollections((prev) => prev.filter((c) => c.id !== id))
        reloadFromStorage()
      })
    },
    [reloadFromStorage],
  )

  const deleteProduct = useCallback((id: string) => {
    api.products.delete(id).then(() => {
      setProducts((prev) => prev.filter((p) => p.id !== id))
      setCart((prev) => prev.filter((item) => item.productId !== id))
    })
  }, [])

  const updateOrderStatus = useCallback(
    (id: string, nextStatus: OrderStatus) => {
      api.orders.updateStatus(id, nextStatus).then(() => {
        reloadFromStorage()
      })
    },
    [reloadFromStorage],
  )

  const registerUser = useCallback(
    (newUser: CustomerUser): RegisterResult => {
      const cleanEmail = newUser.email.trim().toLowerCase()
      if (!cleanEmail)
        return { ok: false, error: "El correo electrónico es obligatorio." }

      const exists = users.some(
        (u) => (u.email || "").toLowerCase() === cleanEmail,
      )
      if (exists) {
        return {
          ok: false,
          error: "Este correo ya está registrado. Intenta iniciar sesión.",
        }
      }

      const normalizedUser: CustomerUser = { ...newUser, email: cleanEmail }
      const updatedUsers = [...users, normalizedUser]
      setUsers(updatedUsers)
      safeWriteStorage("gone_users", updatedUsers)
      sessionStorage.setItem("gone_customer", "true")
      sessionStorage.setItem(
        "gone_current_user",
        JSON.stringify(normalizedUser),
      )
      broadcastSyncEvent("users")
      return { ok: true }
    },
    [users],
  )

  const authenticateUser = useCallback(
    (email: string, password: string): CustomerUser | null => {
      const cleanEmail = email.trim().toLowerCase()
      const foundUser = users.find(
        (u) =>
          (u.email || "").toLowerCase() === cleanEmail &&
          u.password === password,
      )
      if (foundUser) {
        sessionStorage.setItem("gone_customer", "true")
        sessionStorage.setItem("gone_current_user", JSON.stringify(foundUser))
        broadcastSyncEvent("users")
        return foundUser
      }
      return null
    },
    [users],
  )

  const deleteUser = useCallback(
    (email: string) => {
      const cleanEmail = email.trim().toLowerCase()
      const updatedUsers = users.filter(
        (u) => (u.email || "").toLowerCase() !== cleanEmail,
      )
      setUsers(updatedUsers)
      safeWriteStorage("gone_users", updatedUsers)

      const currentSession = getCurrentSessionUser()
      if (
        currentSession &&
        (currentSession.email || "").toLowerCase() === cleanEmail
      ) {
        sessionStorage.removeItem("gone_customer")
        sessionStorage.removeItem("gone_current_user")
      }
      broadcastSyncEvent("users")
    },
    [users],
  )

  const resetDemoData = useCallback(() => {
    localStorage.removeItem("gone_transactions")
    localStorage.removeItem("gone_users")
    localStorage.removeItem("gone_cart")
    sessionStorage.removeItem("gone_customer")
    sessionStorage.removeItem("gone_current_user")
    setTransactions([])
    setUsers([])
    setCart([])
    broadcastSyncEvent("orders")
    broadcastSyncEvent("users")
    broadcastSyncEvent("cart")
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
      updateProduct,
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
      updateProduct,
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
    ],
  )

  return (
    <StoreContext.Provider value={storeValue}>{children}</StoreContext.Provider>
  )
}

export const useStore = () => {
  const context = useContext(StoreContext)
  if (!context) throw new Error("useStore must be used within StoreProvider")
  return context
}

export default StoreProvider
