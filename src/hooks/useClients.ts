import { useCallback, useEffect, useState } from "react"
import { api } from "../services/api"
import { useStore } from "../store"
import type { CustomerUser } from "../types"

export function useClients() {
  const { users: storeUsers } = useStore()
  const [clients, setClients] = useState<CustomerUser[]>(() => storeUsers || [])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchClients = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await api.users.getAll()
      if (Array.isArray(data)) {
        setClients(data)
        try {
          localStorage.setItem("gone_users", JSON.stringify(data))
        } catch {}
      }
    } catch (err: any) {
      console.warn("[useClients] Error al obtener clientes desde el backend:", err)
      setError(err?.message || "Error al cargar clientes.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClients()

    const handleSync = (e: any) => {
      if (!e?.detail?.channel || e.detail.channel === "users") {
        fetchClients()
      }
    }
    window.addEventListener("gonesurf:sync", handleSync)
    return () => window.removeEventListener("gonesurf:sync", handleSync)
  }, [fetchClients])

  return {
    clients,
    isLoading,
    error,
    refreshClients: fetchClients,
  }
}

export default useClients
