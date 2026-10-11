import { createContext, useContext, useState, type ReactNode } from "react"

export type Size = "S" | "M" | "L" | "XL" | "Única"

export interface Product {
  id: string
  name: string
  price: number
  category: string
  collectionName?: string
  image: string
  stocks: Record<string, number>
}

interface Store {
  products: Product[]
  cart: any[]
  transactions: any[]
  addToCart: (productId: string, size: Size) => void
  changeQuantity: (productId: string, size: Size, delta: number) => void
  changeStock: (productId: string, size: Size, delta: number) => void
  completeOrder: (details: any) => { id: string }
  addProduct: (product: Omit<Product, "id">) => void
}

const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([
    { id: "p1", name: "Stay Real Tee", price: 109.0, category: "Merch", collectionName: "The slow days", image: "/assets/hero-surf.jpg", stocks: { S: 8, M: 12, L: 9, XL: 4 } },
    { id: "p2", name: "Stay Real Cap", price: 89.0, category: "Accesorios", collectionName: "Catálogo General", image: "/assets/cap.jpg", stocks: { Única: 18 } },
    { id: "p3", name: "Gone Surf Leash", price: 119.0, category: "Accesorios", collectionName: "The Blue", image: "/assets/leash.jpg", stocks: { Única: 12 } },
    { id: "p4", name: "Off Duty Tee", price: 99.0, category: "Merch", collectionName: "The slow days", image: "/assets/story.jpg", stocks: { S: 10, M: 15, L: 15, XL: 5 } },
  ])
  const [cart, setCart] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])

  const addToCart = (productId: string, size: Size) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === productId && i.size === size)
      if (existing) return prev.map((i) => (i === existing ? { ...i, quantity: i.quantity + 1 } : i))
      return [...prev, { productId, size, quantity: 1 }]
    })
  }

  const changeQuantity = (productId: string, size: Size, delta: number) => {
    setCart((prev) => prev.map((i) => (i.productId === productId && i.size === size ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i)).filter((i) => i.quantity > 0))
  }

  const changeStock = (productId: string, size: Size, delta: number) => {
    setProducts((prev) => prev.map((p) => {
      if (p.id !== productId) return p
      return { ...p, stocks: { ...p.stocks, [size]: Math.max(0, (p.stocks[size] || 0) + delta) } }
    }))
  }

  const completeOrder = (details: any) => {
    const total = cart.reduce((sum, item) => sum + (products.find((p) => p.id === item.productId)?.price || 0) * item.quantity, 0) + details.shipping
    const igv = total - total / 1.18
    const id = `ORD-${Math.floor(Math.random() * 10000)}`
    setTransactions((prev) => [...prev, { ...details, id, total, igv, date: new Date().toISOString(), detail: cart.map((i) => `${i.quantity}x ${products.find((p) => p.id === i.productId)?.name} (${i.size})`).join(", ") }])
    
    cart.forEach(item => changeStock(item.productId, item.size, -item.quantity))
    setCart([])
    return { id }
  }

  const addProduct = (product: Omit<Product, "id">) => {
    const id = `prod-${Date.now()}`
    setProducts(prev => [{ ...product, id }, ...prev])
  }

  return (
    <StoreContext.Provider value={{ products, cart, transactions, addToCart, changeQuantity, changeStock, completeOrder, addProduct }}>
      {children}
    </StoreContext.Provider>
  )
}

export const useStore = () => {
  const context = useContext(StoreContext)
  if (!context) throw new Error("useStore must be used within StoreProvider")
  return context
}