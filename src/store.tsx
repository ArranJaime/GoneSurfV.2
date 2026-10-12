import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export type Size = "S" | "M" | "L" | "XL" | "Única"

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

interface Store {
  products: Product[]
  collections: CollectionData[]
  cart: any[]
  transactions: any[]
  addToCart: (productId: string, size: Size) => void
  changeQuantity: (productId: string, size: Size, delta: number) => void
  changeStock: (productId: string, size: Size, delta: number) => void
  completeOrder: (details: any) => { id: string }
  addProduct: (product: Omit<Product, "id">) => void
  updateProductCollection: (productId: string, collectionName: string) => void
  addCollection: (col: Omit<CollectionData, "id" | "active">) => void
  toggleCollection: (id: string) => void
  deleteCollection: (id: string) => void
  deleteProduct: (id: string) => void
  updateOrderStatus: (id: string, status: string) => void // NUEVO: Cambiar estado
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

export function StoreProvider({ children }: { children: ReactNode }) {
  const [collections, setCollections] = useState<CollectionData[]>(() => {
    try { const saved = localStorage.getItem('gone_collections'); if (saved) { const parsed = JSON.parse(saved) as any[]; const valid = Array.isArray(parsed) ? parsed.filter(c => c && c.title && c.title.trim() !== "") : []; if (valid.length === 0) return initialCollections; return valid } } catch (e) { console.error("Error", e) }
    return initialCollections
  })

  const [products, setProducts] = useState<Product[]>(() => {
    try { const saved = localStorage.getItem('gone_products'); if (saved) { const parsed = JSON.parse(saved) as any[]; const valid = Array.isArray(parsed) ? parsed.filter(p => p && p.name && p.name.trim() !== "") : []; if (valid.length === 0) return initialProducts; return valid } } catch (e) { console.error("Error", e) }
    return initialProducts
  })

  const [cart, setCart] = useState<any[]>(() => {
    try { const saved = localStorage.getItem('gone_cart'); if (saved) { const parsed = JSON.parse(saved); return Array.isArray(parsed) ? parsed : [] } } catch (e) { console.error("Error", e) }
    return []
  })
  
  const [transactions, setTransactions] = useState<any[]>(() => {
    try { const saved = localStorage.getItem('gone_transactions'); if (saved) { const parsed = JSON.parse(saved); return Array.isArray(parsed) ? parsed : [] } } catch (e) { console.error("Error", e) }
    return []
  })

  useEffect(() => { localStorage.setItem('gone_collections', JSON.stringify(collections)) }, [collections])
  useEffect(() => { localStorage.setItem('gone_products', JSON.stringify(products)) }, [products])
  useEffect(() => { localStorage.setItem('gone_transactions', JSON.stringify(transactions)) }, [transactions])
  useEffect(() => { localStorage.setItem('gone_cart', JSON.stringify(cart)) }, [cart])

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
    const total = cart.reduce((sum, item) => sum + (products.find((p) => p.id === item.productId)?.price || 0) * item.quantity, 0) + (details.shipping || 0)
    const igv = total - total / 1.18
    const id = `ORD-${Math.floor(Math.random() * 10000)}`
    const detailString = cart.map((i) => `${i.quantity}x ${products.find((p) => p.id === i.productId)?.name} (${i.size})`).join(", ")
    
    // NUEVO: La orden nace con el estado "Procesando"
    setTransactions((prev) => [...prev, { ...details, id, total, igv, date: new Date().toISOString(), detail: detailString, status: "Procesando" }])
    
    cart.forEach(item => changeStock(item.productId, item.size, -item.quantity))
    setCart([])
    return { id }
  }

  const addProduct = (product: Omit<Product, "id">) => { setProducts(prev => [{ ...product, id: `prod-${Date.now()}` }, ...prev]) }
  const updateProductCollection = (productId: string, collectionName: string) => { setProducts(prev => prev.map(p => p.id === productId ? { ...p, collectionName } : p)) }
  const addCollection = (col: Omit<CollectionData, "id" | "active">) => { setCollections(prev => [...prev, { ...col, id: `col-${Date.now()}`, active: true }]) }
  const toggleCollection = (id: string) => { setCollections(prev => prev.map(c => c.id === id ? { ...c, active: !c.active } : c)) }
  const deleteCollection = (id: string) => { setCollections(prev => prev.filter(c => c.id !== id)) }
  const deleteProduct = (id: string) => { setProducts(prev => prev.filter(p => p.id !== id)) }
  
  // NUEVO: Cambiar el estado del pedido
  const updateOrderStatus = (id: string, status: string) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, status } : t))
  }

  return (
    <StoreContext.Provider value={{ products, collections, cart, transactions, addToCart, changeQuantity, changeStock, completeOrder, addProduct, updateProductCollection, addCollection, toggleCollection, deleteCollection, deleteProduct, updateOrderStatus }}>
      {children}
    </StoreContext.Provider>
  )
}

export const useStore = () => {
  const context = useContext(StoreContext)
  if (!context) throw new Error("useStore must be used within StoreProvider")
  return context
}