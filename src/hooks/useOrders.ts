import { useCallback, useEffect, useMemo, useState } from "react"
import { api } from "../services/api"
import { useStore } from "../store"
import type { OrderStatus, OrderTransaction } from "../types"

const RESIDUAL_TEST_ORDER_IDS = new Set([
  "ORD-3314",
  "ORD-6933",
  "ORD-6347",
])

export function useOrders(initialFilter: string = "Todos los Estados") {
  const { updateOrderStatus } = useStore()
  const [orders, setOrders] = useState<OrderTransaction[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter)

  const fetchOrders = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const apiUrl = (
      import.meta.env.VITE_API_URL ||
      import.meta.env.VITE_AWS_API_GATEWAY_URL ||
      ""
    ).replace(/\/$/, "")

    try {
      let data: OrderTransaction[] = []

      if (apiUrl) {
        const token =
          api.auth.getAdminToken?.() ||
          api.auth.getAdminSession()?.token ||
          (typeof localStorage !== "undefined"
            ? localStorage.getItem("token") ||
              localStorage.getItem("admin_token")
            : null) ||
          "dev-admin-token"
        const res = await fetch(`${apiUrl}/orders`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        if (!res.ok) {
          throw new Error(
            `Error HTTP ${res.status} al consultar pedidos del servidor.`,
          )
        }
        data = await res.json()
      } else {
        data = await api.orders.getAll()
      }

      const clean = (Array.isArray(data) ? data : []).filter(
        (o) => !RESIDUAL_TEST_ORDER_IDS.has(o?.id),
      )
      setOrders(clean)
      try {
        localStorage.setItem("gone_transactions", JSON.stringify(clean))
      } catch {}
    } catch (err: any) {
      console.error("[useOrders] Error al sincronizar órdenes:", err)
      setError(err?.message || "No se pudo sincronizar pedidos en vivo.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()

    const handleSync = (e: any) => {
      if (!e?.detail?.channel || e.detail.channel === "orders") {
        fetchOrders()
      }
    }
    window.addEventListener("gonesurf:sync", handleSync)
    return () => window.removeEventListener("gonesurf:sync", handleSync)
  }, [fetchOrders])

  const handleStatusChange = useCallback(
    async (id: string, nextStatus: OrderStatus) => {
      try {
        updateOrderStatus(id, nextStatus)
        setOrders((prev) =>
          prev.map((o) => (o.id === id ? { ...o, status: nextStatus } : o)),
        )
      } catch (err) {
        console.error("[useOrders] Error actualizando estado de pedido:", err)
      }
    },
    [updateOrderStatus],
  )

  const filteredOrders = useMemo(() => {
    if (statusFilter === "Todos los Estados") {
      return orders
    }
    return orders.filter((o) => (o.status || "Procesando") === statusFilter)
  }, [orders, statusFilter])

  return {
    orders,
    filteredOrders,
    isLoading,
    error,
    statusFilter,
    setStatusFilter,
    refreshOrders: fetchOrders,
    updateStatus: handleStatusChange,
  }
}

export default useOrders
