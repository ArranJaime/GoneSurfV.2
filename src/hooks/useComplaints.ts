import { useCallback, useEffect, useMemo, useState } from "react"
import {
  api,
  type ComplaintRecord,
  type ComplaintStatus,
} from "../services/api"

export function useComplaints() {
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("Todos los Estados")
  const [typeFilter, setTypeFilter] = useState<string>("Todos los Tipos")
  const [searchTerm, setSearchTerm] = useState<string>("")

  const fetchComplaints = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await api.complaints.getAll()
      const sorted = (Array.isArray(data) ? data : []).sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      )
      setComplaints(sorted)
    } catch (err: any) {
      console.error("[useComplaints] Error al obtener reclamaciones:", err)
      setError(
        err?.message ||
          "No se pudieron cargar las reclamaciones del Libro de Reclamaciones.",
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchComplaints()

    const handleSync = (e: any) => {
      if (!e?.detail?.channel || e.detail.channel === "complaints") {
        fetchComplaints()
      }
    }
    window.addEventListener("gonesurf:sync", handleSync)
    return () => window.removeEventListener("gonesurf:sync", handleSync)
  }, [fetchComplaints])

  const updateStatus = useCallback(
    async (
      id: string,
      nextStatus: ComplaintStatus,
      options?: { resolution?: string; adminNotes?: string },
    ) => {
      // Optimistic update
      setComplaints((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                status: nextStatus,
                resolution:
                  options?.resolution !== undefined
                    ? options.resolution
                    : c.resolution,
                adminNotes:
                  options?.adminNotes !== undefined
                    ? options.adminNotes
                    : c.adminNotes,
                updatedAt: new Date().toISOString(),
                ...(nextStatus === "Atendido" ||
                nextStatus === "Cerrado" ||
                nextStatus === "Resuelto"
                  ? { resolvedAt: new Date().toISOString() }
                  : {}),
              }
            : c,
        ),
      )

      const res = await api.complaints.updateStatus(id, nextStatus, options)
      if (!res.ok) {
        // Rollback if failed
        fetchComplaints()
        return { ok: false, error: res.error }
      }
      return { ok: true, complaint: res.complaint }
    },
    [fetchComplaints],
  )

  const filteredComplaints = useMemo(() => {
    return complaints.filter((item) => {
      // Status filter
      if (
        statusFilter !== "Todos los Estados" &&
        item.status !== statusFilter
      ) {
        return false
      }

      // Type filter
      if (typeFilter !== "Todos los Tipos") {
        if (item.claimType?.toLowerCase() !== typeFilter.toLowerCase()) {
          return false
        }
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim()
        const matchesId = (item.id || "").toLowerCase().includes(query)
        const matchesName = (item.consumerName || "")
          .toLowerCase()
          .includes(query)
        const matchesDoc = (item.documentNumber || "").includes(query)
        const matchesEmail = (item.email || "").toLowerCase().includes(query)
        const matchesGood = (item.goodDescription || "")
          .toLowerCase()
          .includes(query)
        if (
          !matchesId &&
          !matchesName &&
          !matchesDoc &&
          !matchesEmail &&
          !matchesGood
        ) {
          return false
        }
      }

      return true
    })
  }, [complaints, statusFilter, typeFilter, searchTerm])

  return {
    complaints: filteredComplaints,
    allComplaints: complaints,
    isLoading,
    error,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    searchTerm,
    setSearchTerm,
    refreshComplaints: fetchComplaints,
    updateStatus,
  }
}
