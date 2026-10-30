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
} from "./services/api"
import type {
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
} from "./types"
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

export interface UpdateProfileResult {
  ok: boolean
  user?: CustomerUser
  error?: string
}

export interface Store {
  products: Product[]
  collections: CollectionData[]
  cart: CartItem[]
  transactions: OrderTransaction[]
  users: CustomerUser[]
  isLoadingProducts: boolean
  addToCart: (productId: string, size: Size) => void
  changeQuantity: (productId: string, size: Size, delta: number) => void
  changeStock: (productId: string, size: Size, delta: number) => void
  removeFromCart: (productId: string, size?: Size) => void
  clearCart: () => void
  completeOrder: (
    details: OrderDetailsInput,
    createdTransaction?: OrderTransaction,
  ) => { id: string }
  addProduct: (product: Omit<Product, "id"> | Product) => Promise<Product>
  updateProduct: (id: string, updates: Partial<Omit<Product, "id">>) => void
  updateProductPrice: (productId: string, newPrice: number) => void
  updateProductCollection: (productId: string, collectionName: string) => void
  addCollection: (
    col: Omit<CollectionData, "id" | "active">,
  ) => Promise<void> | void
  toggleCollection: (id: string) => void
  deleteCollection: (id: string) => void
  deleteProduct: (id: string) => void
  updateOrderStatus: (id: string, status: OrderStatus) => void
  updateUserProfile: (
    profileData: Partial<CustomerUser>,
  ) => Promise<UpdateProfileResult>
  registerUser: (newUser: CustomerUser) => RegisterResult
  authenticateUser: (email: string, password: string) => CustomerUser | null
  deleteUser: (email: string) => void
  resetDemoData: () => void
}

export const StoreContext = createContext<Store | null>(null)

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
    safeReadStorage("gone_collections", [], (parsed) => {
      if (!Array.isArray(parsed)) return null
      return parsed.filter((c): c is CollectionData =>
        Boolean(
          c &&
            typeof c.title === "string" &&
            c.title.trim() !== "" &&
            !["c1", "c2"].includes(c.id),
        ),
      )
    }),
  )

  const [products, setProducts] = useState<Product[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)

  const [cart, setCart] = useState<CartItem[]>(() =>
    safeReadStorage("gone_cart", [], (parsed) =>
      Array.isArray(parsed) ? parsed as CartItem[] : [],
    ),
  )

  const [transactions, setTransactions] = useState<OrderTransaction[]>(() =>
    safeReadStorage("gone_transactions", [], (parsed) => {
      const RESIDUAL_TEST_ORDER_IDS = new Set([
        "ORD-3314",
        "ORD-6933",
        "ORD-6347",
      ])
      return Array.isArray(parsed)
        ? (parsed as OrderTransaction[]).filter(
            (o) => !RESIDUAL_TEST_ORDER_IDS.has(o?.id),
          )
        : []
    }),
  )

  const [users, setUsers] = useState<CustomerUser[]>(() =>
    safeReadStorage("gone_users", [], (parsed) =>
      Array.isArray(parsed) ? parsed as CustomerUser[] : [],
    ),
  )

  // Real-time synchronization across storage and internal event bus
  const reloadFromStorage = useCallback(() => {
    const rawCols = safeReadStorage<CollectionData[]>("gone_collections", [])
    const seen = new Set<string>()
    const uniqueCols = Array.isArray(rawCols)
      ? rawCols.filter((c) => {
          if (!c?.id || seen.has(c.id)) return false
          seen.add(c.id)
          return true
        })
      : []
    setCollections(uniqueCols)

    const rawProds = safeReadStorage<Product[]>("gone_products", [])
    const MOCK_IDS = new Set(["p1", "p2", "p3", "p4"])
    const MOCK_NAMES = new Set([
      "Stay Real Tee",
      "Stay Real Cap",
      "Gone Surf Leash",
      "Off Duty Tee",
    ])
    const cleanProds = Array.isArray(rawProds)
      ? rawProds.filter((p) => !MOCK_IDS.has(p?.id) && !MOCK_NAMES.has(p?.name))
      : []
    setProducts(cleanProds)
    const rawTx = safeReadStorage<OrderTransaction[]>("gone_transactions", [])
    const RESIDUAL_TEST_ORDER_IDS = new Set([
      "ORD-3314",
      "ORD-6933",
      "ORD-6347",
    ])
    setTransactions(
      Array.isArray(rawTx)
        ? rawTx.filter((o) => !RESIDUAL_TEST_ORDER_IDS.has(o?.id))
        : [],
    )
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

  // Sincronizar catálogo real y órdenes vivas desde API en el arranque
  useEffect(() => {
    // Purga cualquier producto mockup residual de localStorage
    try {
      const stored = localStorage.getItem("gone_products")
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          const MOCK_IDS = new Set(["p1", "p2", "p3", "p4"])
          const MOCK_NAMES = new Set([
            "Stay Real Tee",
            "Stay Real Cap",
            "Gone Surf Leash",
            "Off Duty Tee",
          ])
          const clean = parsed.filter(
            (p: any) => !MOCK_IDS.has(p?.id) && !MOCK_NAMES.has(p?.name),
          )
          if (clean.length !== parsed.length) {
            localStorage.setItem("gone_products", JSON.stringify(clean))
          }
        }
      }
    } catch {
      // ignore
    }

    // Purga cualquier orden de prueba residual de localStorage
    try {
      const storedOrders = localStorage.getItem("gone_transactions")
      if (storedOrders) {
        const parsedOrders = JSON.parse(storedOrders)
        if (Array.isArray(parsedOrders)) {
          const RESIDUAL_TEST_ORDER_IDS = new Set([
            "ORD-3314",
            "ORD-6933",
            "ORD-6347",
          ])
          const cleanOrders = parsedOrders.filter(
            (o: any) => !RESIDUAL_TEST_ORDER_IDS.has(o?.id),
          )
          if (cleanOrders.length !== parsedOrders.length) {
            localStorage.setItem(
              "gone_transactions",
              JSON.stringify(cleanOrders),
            )
            setTransactions(cleanOrders)
          }
        }
      }
    } catch {
      // ignore
    }

    api.products
      .getAll()
      .then((liveProducts) => {
        if (Array.isArray(liveProducts)) {
          const MOCK_IDS = new Set(["p1", "p2", "p3", "p4"])
          const MOCK_NAMES = new Set([
            "Stay Real Tee",
            "Stay Real Cap",
            "Gone Surf Leash",
            "Off Duty Tee",
          ])
          const clean = liveProducts.filter(
            (p) => !MOCK_IDS.has(p.id) && !MOCK_NAMES.has(p.name),
          )
          setProducts(clean)
          safeWriteStorage("gone_products", clean)
        }
      })
      .catch((err) => {
        console.warn("[Store] Error al sincronizar productos de API:", err)
      })
      .finally(() => {
        setIsLoadingProducts(false)
      })

    api.collections
      .getAll()
      .then((liveCollections) => {
        if (Array.isArray(liveCollections)) {
          setCollections(liveCollections)
          safeWriteStorage("gone_collections", liveCollections)
        }
      })
      .catch((err) => {
        console.warn("[Store] Error al sincronizar colecciones de API:", err)
      })

    api.orders
      .getAll()
      .then((liveOrders) => {
        if (Array.isArray(liveOrders)) {
          const RESIDUAL_TEST_ORDER_IDS = new Set([
            "ORD-3314",
            "ORD-6933",
            "ORD-6347",
          ])
          const cleanOrders = liveOrders.filter(
            (o) => !RESIDUAL_TEST_ORDER_IDS.has(o?.id),
          )
          setTransactions(cleanOrders)
          safeWriteStorage("gone_transactions", cleanOrders)
        }
      })
      .catch((err) => {
        console.warn("[Store] Error al sincronizar pedidos de API:", err)
      })
  }, [])

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

  // Ensure cart quantities never exceed live inventory (only after initial load finishes)
  useEffect(() => {
    if (isLoadingProducts) return
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
  }, [products, isLoadingProducts])

  const removeFromCart = useCallback((productId: string, size?: Size) => {
    setCart((prev) => {
      const updated = size
        ? prev.filter((i) => !(i.productId === productId && i.size === size))
        : prev.filter((i) => i.productId !== productId)
      safeWriteStorage("gone_cart", updated)
      return updated
    })
    broadcastSyncEvent("cart")
  }, [])

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

  const clearCart = useCallback(() => {
    setCart([])
    safeWriteStorage("gone_cart", [])
    broadcastSyncEvent("cart")
  }, [])

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
    (details: OrderDetailsInput, createdTransaction?: OrderTransaction): {
      id: string
    } => {
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

      const id =
        createdTransaction?.id ||
        `ORD-${String(Math.floor(1000 + Math.random() * 9000))}`
      const detailString =
        createdTransaction?.detail ||
        accounting.items
          .map((i) => `${i.quantity}x ${i.name} (${i.size})`)
          .join(", ")

      const initialStatus: OrderStatus =
        details.paymentMethod === "yape_plin"
          ? "Pendiente de Pago"
          : "Procesando"

      const newTransaction: OrderTransaction = createdTransaction || {
        ...details,
        reference: details.reference || "",
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
        const filtered = prev.filter((t) => t.id !== newTransaction.id)
        const updated = [newTransaction, ...filtered]
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

  const addProduct = useCallback(
    async (product: Omit<Product, "id"> | Product): Promise<Product> => {
      if ("id" in product && product.id) {
        const fullProd = product as Product
        setProducts((prev) => {
          const updated = [
            fullProd,
            ...prev.filter((p) => p.id !== fullProd.id),
          ]
          safeWriteStorage("gone_products", updated)
          return updated
        })
        broadcastSyncEvent("products")
        return fullProd
      }

      const saved = await api.products.create(product)
      setProducts((prev) => {
        const updated = [saved, ...prev.filter((p) => p.id !== saved.id)]
        safeWriteStorage("gone_products", updated)
        return updated
      })
      broadcastSyncEvent("products")
      return saved
    },
    [],
  )

  const updateProduct = useCallback(
    (id: string, updates: Partial<Omit<Product, "id">>) => {
      api.products
        .update(id, updates)
        .then((updated) => {
          setProducts((prev) => {
            const next = prev.map((p) => (p.id === id ? updated : p))
            safeWriteStorage("gone_products", next)
            return next
          })
        })
        .catch((err) => {
          console.error("[Store] Error al actualizar producto:", err)
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
    async (col: Omit<CollectionData, "id" | "active">) => {
      await api.collections.create(col)
      const fresh = await api.collections.getAll()
      const seen = new Set<string>()
      const unique = fresh.filter((c) => {
        if (!c?.id || seen.has(c.id)) return false
        seen.add(c.id)
        return true
      })
      setCollections(unique)
      safeWriteStorage("gone_collections", unique)
    },
    [],
  )

  const toggleCollection = useCallback((id: string) => {
    api.collections
      .toggle(id)
      .then((toggled) => {
        setCollections((prev) => {
          const next = prev.map((c) => (c.id === id ? toggled : c))
          safeWriteStorage("gone_collections", next)
          return next
        })
      })
      .catch((err) => {
        console.error("[Store] Error al alternar colección:", err)
      })
  }, [])

  const deleteCollection = useCallback(
    (id: string) => {
      api.collections
        .delete(id)
        .then(() => {
          setCollections((prev) => {
            const next = prev.filter((c) => c.id !== id)
            safeWriteStorage("gone_collections", next)
            return next
          })
          reloadFromStorage()
        })
        .catch((err) => {
          console.error("[Store] Error al eliminar colección:", err)
        })
    },
    [reloadFromStorage],
  )

  const deleteProduct = useCallback((id: string) => {
    api.products
      .delete(id)
      .then(() => {
        setProducts((prev) => {
          const updated = prev.filter((p) => p.id !== id)
          safeWriteStorage("gone_products", updated)
          return updated
        })
        setCart((prev) => {
          const updated = prev.filter((item) => item.productId !== id)
          safeWriteStorage("gone_cart", updated)
          return updated
        })
      })
      .catch((err) => {
        console.error("[Store] Error al eliminar producto:", err)
      })
  }, [])

  const updateOrderStatus = useCallback(
    async (id: string, nextStatus: OrderStatus) => {
      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: nextStatus } : t)),
      )
      try {
        await api.orders.updateStatus(id, nextStatus)
        reloadFromStorage()
      } catch (err) {
        console.error("[Store] Error al actualizar estado de orden:", err)
      }
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

      const normalizedUser: CustomerUser = {
        ...newUser,
        email: cleanEmail,
        isGuest: false,
      }
      const updatedUsers = [...users, normalizedUser]
      setUsers(updatedUsers)
      safeWriteStorage("gone_users", updatedUsers)
      sessionStorage.setItem("gone_customer", "true")
      sessionStorage.setItem(
        "gone_current_user",
        JSON.stringify(normalizedUser),
      )

      // Sincronización automática de órdenes previas de invitado con este correo
      const fullName =
        `${normalizedUser.firstName} ${normalizedUser.lastName}`.trim()
      setTransactions((prevTx) => {
        let changed = false
        const nextTx = prevTx.map((t) => {
          if ((t.email || "").toLowerCase() === cleanEmail) {
            changed = true
            return {
              ...t,
              isGuest: false,
              customer: fullName || t.customer,
              phone: normalizedUser.phone || t.phone,
              document: normalizedUser.document || t.document,
              reference: t.reference || normalizedUser.reference || "",
            }
          }
          return t
        })
        if (changed) {
          safeWriteStorage("gone_transactions", nextTx)
          broadcastSyncEvent("orders")
        }
        return nextTx
      })

      broadcastSyncEvent("users")
      return { ok: true }
    },
    [users],
  )

  const updateUserProfile = useCallback(
    async (
      profileData: Partial<CustomerUser>,
    ): Promise<UpdateProfileResult> => {
      const res = await api.users.updateProfile(profileData)
      if (res.ok && res.user) {
        const updated = res.user
        const email = (updated.email || "").toLowerCase()
        setUsers((prev) => {
          const exists = prev.some(
            (u) => (u.email || "").toLowerCase() === email,
          )
          const next = exists
            ? prev.map((u) =>
                (u.email || "").toLowerCase() === email
                  ? { ...u, ...updated }
                  : u,
              )
            : [...prev, updated]
          safeWriteStorage("gone_users", next)
          return next
        })
      }
      return res
    },
    [],
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
      isLoadingProducts,
      addToCart,
      changeQuantity,
      changeStock,
      removeFromCart,
      clearCart,
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
      updateUserProfile,
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
      isLoadingProducts,
      addToCart,
      changeQuantity,
      changeStock,
      removeFromCart,
      clearCart,
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
      updateUserProfile,
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
