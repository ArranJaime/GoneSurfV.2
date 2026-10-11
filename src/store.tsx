import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

export type Size = "S" | "M" | "L" | "XL" | "Única"
export type Category = "Merch" | "Accesorios"

export interface Product {
  id: string
  name: string
  category: Category
  price: number
  image: string
  stocks: Record<Size, number>
}

export interface CartItem {
  productId: string
  size: Size
  quantity: number
}

export interface Transaction {
  id: string
  date: string
  customer: string
  email: string
  district: string
  address: string
  detail: string
  subtotal: number
  igv: number
  total: number
}

interface CheckoutData {
  customer: string
  email: string
  district: string
  address: string
  shipping: number
}

interface StoreContextValue {
  products: Product[]
  cart: CartItem[]
  transactions: Transaction[]
  collections: string[]
  addToCart: (productId: string, size: Size) => void
  changeQuantity: (productId: string, size: Size, delta: number) => void
  changeStock: (productId: string, size: Size, delta: number) => void
  completeOrder: (data: CheckoutData) => Transaction
}

const PRODUCTS: Product[] = [
  {
    id: "off-duty-tee",
    name: "Off Duty Tee",
    category: "Merch",
    price: 99,
    image: "/assets/tee.jpg",
    stocks: { S: 10, M: 15, L: 15, XL: 5, Única: 0 },
  },
  {
    id: "stay-real-cap",
    name: "Stay Real Cap",
    category: "Accesorios",
    price: 89,
    image: "/assets/cap.jpg",
    stocks: { S: 0, M: 0, L: 0, XL: 0, Única: 18 },
  },
  {
    id: "gone-leash",
    name: "Gone Surf Leash",
    category: "Accesorios",
    price: 119,
    image: "/assets/leash.jpg",
    stocks: { S: 0, M: 0, L: 0, XL: 0, Única: 12 },
  },
  {
    id: "real-tee",
    name: "Stay Real Tee",
    category: "Merch",
    price: 109,
    image: "/assets/story.jpg",
    stocks: { S: 8, M: 12, L: 9, XL: 4, Única: 0 },
  },
]

const NOW = Date.now()
const TRANSACTIONS: Transaction[] = [
  {
    id: "GON-1042",
    date: new Date(NOW - 2 * 60 * 60 * 1000).toISOString(),
    customer: "María Salazar",
    email: "maria@example.com",
    district: "Miraflores",
    address: "Av. Grau 482",
    detail: "1x Off Duty Tee (M), 1x Stay Real Cap (Única)",
    subtotal: 188,
    igv: 28.68,
    total: 203,
  },
  {
    id: "GON-1038",
    date: new Date(NOW - 4 * 24 * 60 * 60 * 1000).toISOString(),
    customer: "Diego Ríos",
    email: "diego@example.com",
    district: "Barranco",
    address: "Jr. Centenario 151",
    detail: "2x Stay Real Tee (L)",
    subtotal: 218,
    igv: 33.25,
    total: 233,
  },
  {
    id: "GON-1027",
    date: new Date(NOW - 18 * 24 * 60 * 60 * 1000).toISOString(),
    customer: "Ana Torres",
    email: "ana@example.com",
    district: "San Isidro",
    address: "Calle Los Pinos 230",
    detail: "1x Gone Surf Leash (Única)",
    subtotal: 119,
    igv: 18.15,
    total: 134,
  },
]

function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) as T : fallback
  } catch {
    return fallback
  }
}

const StoreContext = createContext<StoreContextValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(() =>
    readStorage("gone_products", PRODUCTS),
  )
  const [cart, setCart] = useState<CartItem[]>(() =>
    readStorage("gone_cart", []),
  )
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    readStorage("gone_transactions", TRANSACTIONS),
  )
  const [collections] = useState<string[]>(() =>
    readStorage("gone_collections", [
      "New Arrivals",
      "Accesorios",
      "Merch",
      "Best Sellers",
    ]),
  )

  useEffect(
    () => localStorage.setItem("gone_products", JSON.stringify(products)),
    [products],
  )
  useEffect(
    () => localStorage.setItem("gone_cart", JSON.stringify(cart)),
    [cart],
  )
  useEffect(
    () =>
      localStorage.setItem("gone_transactions", JSON.stringify(transactions)),
    [transactions],
  )
  useEffect(
    () => localStorage.setItem("gone_collections", JSON.stringify(collections)),
    [collections],
  )

  function addToCart(productId: string, size: Size) {
    const available =
      products.find((product) => product.id === productId)?.stocks[size] ?? 0
    setCart((current) => {
      const existing = current.find(
        (item) => item.productId === productId && item.size === size,
      )
      if (existing && existing.quantity >= available) return current
      if (existing) {
        return current.map((item) =>
          item === existing ? { ...item, quantity: item.quantity + 1 } : item,
        )
      }
      return available > 0
        ? [...current, { productId, size, quantity: 1 }]
        : current
    })
  }

  function changeQuantity(productId: string, size: Size, delta: number) {
    const available =
      products.find((product) => product.id === productId)?.stocks[size] ?? 0
    setCart((current) =>
      current.flatMap((item) => {
        if (item.productId !== productId || item.size !== size) return [item]
        const quantity = Math.min(item.quantity + delta, available)
        return quantity > 0 ? [{ ...item, quantity }] : []
      }),
    )
  }

  function changeStock(productId: string, size: Size, delta: number) {
    setProducts((current) =>
      current.map((product) =>
        product.id === productId
          ? {
              ...product,
              stocks: {
                ...product.stocks,
                [size]: Math.max(0, product.stocks[size] + delta),
              },
            }
          : product,
      ),
    )
  }

  function completeOrder(data: CheckoutData) {
    if (!cart.length) throw new Error("El carrito está vacío.")
    if (
      cart.some((item) => {
        const product = products.find(
          (candidate) => candidate.id === item.productId,
        )
        return (
          !product ||
          !Number.isInteger(item.quantity) ||
          item.quantity <= 0 ||
          item.quantity > product.stocks[item.size] ||
          (product.category === "Accesorios" && item.size !== "Única")
        )
      })
    )
      throw new Error("El stock cambió. Revisa las cantidades del carrito.")
    if (
      [data.customer, data.email, data.district, data.address].some(
        (value) => !value.trim(),
      )
    ) {
      throw new Error("Completa los datos de entrega.")
    }
    const subtotal = cart.reduce((sum, item) => {
      const product = products.find(
        (candidate) => candidate.id === item.productId,
      )
      return sum + (product?.price ?? 0) * item.quantity
    }, 0)
    const detail = cart
      .map((item) => {
        const product = products.find(
          (candidate) => candidate.id === item.productId,
        )
        return `${item.quantity}x ${product?.name ?? "Producto"} (${item.size})`
      })
      .join(", ")
    const transaction: Transaction = {
      id: `GON-${crypto.randomUUID()}`,
      date: new Date().toISOString(),
      customer: data.customer,
      email: data.email.trim().toLowerCase(),
      district: data.district,
      address: data.address,
      detail,
      subtotal,
      igv: subtotal - subtotal / 1.18,
      total: subtotal + (data.shipping === 30 ? 30 : subtotal >= 300 ? 0 : 15),
    }
    setTransactions((current) => [transaction, ...current])
    setProducts((current) =>
      current.map((product) => {
        const nextStocks = { ...product.stocks }
        cart
          .filter((item) => item.productId === product.id)
          .forEach((item) => {
            nextStocks[item.size] = Math.max(
              0,
              nextStocks[item.size] - item.quantity,
            )
          })
        return { ...product, stocks: nextStocks }
      }),
    )
    const emails = readStorage<string[]>("gone_customer_emails", [])
    const normalizedEmail = data.email.trim().toLowerCase()
    if (!emails.includes(normalizedEmail)) {
      localStorage.setItem(
        "gone_customer_emails",
        JSON.stringify([...emails, normalizedEmail]),
      )
    }
    const notifications = readStorage<{ orderId: string; kind: string }[]>(
      "gone_simulated_emails",
      [],
    )
    localStorage.setItem(
      "gone_simulated_emails",
      JSON.stringify([
        ...notifications,
        ...(!emails.includes(normalizedEmail)
          ? [{ orderId: transaction.id, kind: "bienvenida" }]
          : []),
        { orderId: transaction.id, kind: "boleta" },
      ]),
    )
    setCart([])
    localStorage.setItem("gone_cart", "[]")
    return transaction
  }

  const value = useMemo(
    () => ({
      products,
      cart,
      transactions,
      collections,
      addToCart,
      changeQuantity,
      changeStock,
      completeOrder,
    }),
    [products, cart, transactions, collections],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) throw new Error("useStore must be used within StoreProvider")
  return context
}
