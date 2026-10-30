import { useCallback, useEffect, useState } from "react"
import { api } from "../services/api"
import { useStore } from "../store"
import type { Product, Size } from "../types"

const MOCK_IDS = new Set(["p1", "p2", "p3", "p4"])
const MOCK_NAMES = new Set([
  "Stay Real Tee",
  "Stay Real Cap",
  "Gone Surf Leash",
  "Off Duty Tee",
])

export function useProducts() {
  const store = useStore()
  const [products, setProducts] = useState<Product[]>(store.products)
  const [isLoading, setIsLoading] = useState<boolean>(store.isLoadingProducts)

  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    try {
      const live = await api.products.getAll()
      const clean = (Array.isArray(live) ? live : []).filter(
        (p) => !MOCK_IDS.has(p.id) && !MOCK_NAMES.has(p.name),
      )
      setProducts(clean)
      return clean
    } catch (err) {
      console.warn("[useProducts] Error al sincronizar catálogo:", err)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    setProducts(store.products)
    setIsLoading(store.isLoadingProducts)
  }, [store.products, store.isLoadingProducts])

  useEffect(() => {
    const handleSync = (e: any) => {
      if (!e?.detail?.channel || e.detail.channel === "products") {
        fetchProducts()
      }
    }
    window.addEventListener("gonesurf:sync", handleSync)
    return () => window.removeEventListener("gonesurf:sync", handleSync)
  }, [fetchProducts])

  const addProduct = useCallback(
    async (product: Omit<Product, "id"> | Product) => {
      return store.addProduct(product)
    },
    [store],
  )

  const updateProduct = useCallback(
    (id: string, updates: Partial<Omit<Product, "id">>) => {
      store.updateProduct(id, updates)
    },
    [store],
  )

  const deleteProduct = useCallback(
    (id: string) => {
      store.deleteProduct(id)
    },
    [store],
  )

  const changeStock = useCallback(
    (productId: string, size: Size, delta: number) => {
      store.changeStock(productId, size, delta)
    },
    [store],
  )

  return {
    products,
    isLoading,
    refreshProducts: fetchProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    changeStock,
  }
}

export default useProducts
