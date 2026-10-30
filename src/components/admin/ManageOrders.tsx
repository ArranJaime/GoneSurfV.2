import { useCallback, useEffect, useMemo, useState } from "react"
import { api } from "../../services/api"
import { useStore } from "../../store"
import type { OrderStatus, OrderTransaction } from "../../types"
import { formatPEN } from "../../utils/accounting"

const money = (val: number) => formatPEN(val)

export function renderPaymentBadge(method?: string) {
  if (method === "yape_plin") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 10px",
          borderRadius: "4px",
          backgroundColor: "#f3e5f5",
          border: "1px solid #ce93d8",
          color: "#6a1b9a",
          fontSize: "0.75rem",
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ fontSize: "0.9rem" }}>📱</span> Yape / Plin
      </span>
    )
  }
  if (method === "efectivo") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 10px",
          borderRadius: "4px",
          backgroundColor: "#fff3e0",
          border: "1px solid #ffb74d",
          color: "#e65100",
          fontSize: "0.75rem",
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ fontSize: "0.9rem" }}>💵</span> Pago Contra Entrega
      </span>
    )
  }
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px",
        borderRadius: "4px",
        backgroundColor: "#e8f5e9",
        border: "1px solid #81c784",
        color: "#1b5e20",
        fontSize: "0.75rem",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ fontSize: "0.9rem" }}>💳</span> Tarjeta
    </span>
  )
}

export interface ManageOrdersProps {
  orders?: OrderTransaction[]
  isLoading?: boolean
  error?: string | null
  onRefresh?: () => void
  onStatusChange?: (id: string, nextStatus: OrderStatus) => Promise<void>
}

export default function ManageOrders({
  orders: propOrders,
  isLoading: propIsLoading,
  error: propError,
  onRefresh: propOnRefresh,
  onStatusChange: propOnStatusChange,
}: ManageOrdersProps = {}) {
  const { updateOrderStatus } = useStore()
  const [internalLiveOrders, setInternalLiveOrders] = useState<OrderTransaction[]>([])
  const [internalLoading, setInternalLoading] = useState(false)
  const [internalError, setInternalError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("Todos los Estados")

  const isControlled = propOrders !== undefined
  const displayOrders = isControlled ? propOrders : internalLiveOrders
  const isLoading = isControlled ? (propIsLoading ?? false) : internalLoading
  const fetchError = isControlled ? (propError ?? null) : internalError

  const filteredOrders = useMemo(() => {
    if (statusFilter === "Todos los Estados") {
      return displayOrders
    }
    return displayOrders.filter((order) => order.status === statusFilter)
  }, [displayOrders, statusFilter])

  const fetchOrdersFromApi = useCallback(async () => {
    if (propOnRefresh) {
      propOnRefresh()
      return
    }
    setInternalLoading(true)
    setInternalError(null)

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

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        }

        const res = await fetch(`${apiUrl}/orders`, { headers })
        if (!res.ok) {
          const errText = await res.text().catch(() => "")
          console.error(`[Admin] Error en GET /orders (${res.status}):`, errText)
          throw new Error(
            `Error HTTP ${res.status} al consultar pedidos del servidor.`,
          )
        }
        data = await res.json()
      } else {
        data = await api.orders.getAll()
      }
      const RESIDUAL_TEST_ORDER_IDS = new Set([
        "ORD-3314",
        "ORD-6933",
        "ORD-6347",
      ])
      const clean = (Array.isArray(data) ? data : []).filter(
        (o) => !RESIDUAL_TEST_ORDER_IDS.has(o?.id),
      )
      setInternalLiveOrders(clean)
      try {
        localStorage.setItem("gone_transactions", JSON.stringify(clean))
      } catch {}
    } catch (err: any) {
      console.error("[Admin] Error al obtener órdenes con VITE_API_URL:", err)
      setInternalError(err?.message || "No se pudo sincronizar pedidos en vivo.")
    } finally {
      setInternalLoading(false)
    }
  }, [propOnRefresh])

  useEffect(() => {
    if (!isControlled) {
      fetchOrdersFromApi()
    }
  }, [isControlled, fetchOrdersFromApi])

  const handleStatusChange = async (id: string, nextStatus: OrderStatus) => {
    try {
      if (propOnStatusChange) {
        await propOnStatusChange(id, nextStatus)
      } else {
        updateOrderStatus(id, nextStatus)
        setInternalLiveOrders((prev) =>
          prev.map((o) => (o.id === id ? { ...o, status: nextStatus } : o)),
        )
      }
    } catch (err) {
      console.error("[Admin] Error actualizando estado de pedido:", err)
    }
  }

  if (isLoading && displayOrders.length === 0) {
    return (
      <div
        style={{
          padding: "3rem",
          textAlign: "center",
          background: "#fff",
          borderRadius: "8px",
          border: "1px solid #eee",
        }}
      >
        <h3>Cargando pedidos desde DynamoDB...</h3>
      </div>
    )
  }

  if (displayOrders.length === 0) {
    return (
      <div
        style={{
          padding: "3rem",
          textAlign: "center",
          background: "#fff",
          borderRadius: "8px",
          border: "1px solid #eee",
        }}
      >
        <h3>Aún no hay pedidos registrados.</h3>
        <p style={{ color: "#666", fontSize: "0.85rem", marginTop: "0.5rem" }}>
          Los pedidos realizados por los clientes en la tienda oficial aparecerán aquí automáticamente en tiempo real.
        </p>
        {fetchError && (
          <p
            style={{
              color: "#d32f2f",
              fontSize: "0.85rem",
              marginTop: "0.5rem",
            }}
          >
            {fetchError}
          </p>
        )}
        <button
          type="button"
          onClick={fetchOrdersFromApi}
          style={{
            marginTop: "1rem",
            padding: "8px 16px",
            background: "#0a0a0a",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          🔄 Reintentar conexión
        </button>
      </div>
    )
  }

  return (
    <section
      style={{
        background: "#fff",
        border: "1px solid #eee",
        borderRadius: "8px",
        overflow: "hidden",
        animation: "fadeIn 0.3s ease",
      }}
    >
      <div
        style={{
          padding: "1.25rem 1.5rem",
          borderBottom: "2px solid #000",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h2
            style={{ margin: 0, fontSize: "1rem", textTransform: "uppercase" }}
          >
            Gestión y Despacho de Pedidos
          </h2>
          <span style={{ fontSize: "0.75rem", color: "#666" }}>
            Total registrados: {displayOrders.length} pedido(s)
            {statusFilter !== "Todos los Estados" && ` (Filtrados: ${filteredOrders.length})`}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <label
              htmlFor="order-status-filter"
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "#555",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Filtrar por estado:
            </label>
            <select
              id="order-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                fontSize: "0.8rem",
                fontWeight: 600,
                background: "#fff",
                color: "#111",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="Todos los Estados">Todos los Estados</option>
              <option value="Pendiente de Pago">Pendiente de Pago</option>
              <option value="Procesando">Procesando</option>
              <option value="Enviado">Enviado</option>
              <option value="Entregado">Entregado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>

          <button
            type="button"
            onClick={fetchOrdersFromApi}
            disabled={isLoading}
            style={{
              background: "#0a0a0a",
              color: "#fff",
              border: "none",
              padding: "8px 16px",
              borderRadius: "4px",
              fontSize: "0.8rem",
              fontWeight: 700,
              cursor: isLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {isLoading ? "Cargando..." : "🔄 Actualizar desde Servidor"}
          </button>
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
            fontSize: "0.85rem",
          }}
        >
          <thead style={{ background: "#0a0a0a", color: "#fff" }}>
            <tr>
              <th style={{ padding: "1rem" }}>ID & FECHA</th>
              <th style={{ padding: "1rem" }}>CLIENTE</th>
              <th style={{ padding: "1rem" }}>CONTACTO / ENVÍO</th>
              <th style={{ padding: "1rem" }}>DETALLE DE COMPRA</th>
              <th style={{ padding: "1rem" }}>TOTAL</th>
              <th style={{ padding: "1rem" }}>MÉTODO DE PAGO</th>
              <th style={{ padding: "1rem" }}>ESTADO ACTUAL</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    padding: "3rem",
                    textAlign: "center",
                    color: "#888",
                    fontStyle: "italic",
                  }}
                >
                  No se encontraron pedidos con el estado "{statusFilter}".
                </td>
              </tr>
            ) : filteredOrders.map((t: OrderTransaction) => {
              const status = t.status || "Procesando"
              const badgeBg =
                status === "Entregado"
                  ? "#e8f5e9"
                  : status === "Enviado"
                    ? "#e3f2fd"
                    : status === "Cancelado"
                      ? "#ffebee"
                      : status === "Pendiente de Pago"
                        ? "#fff8e1"
                        : "#fff3e0"
              const badgeColor =
                status === "Entregado"
                  ? "#2e7d32"
                  : status === "Enviado"
                    ? "#0277bd"
                    : status === "Cancelado"
                      ? "#c62828"
                      : status === "Pendiente de Pago"
                        ? "#b78103"
                        : "#e65100"

              return (
                <tr
                  key={t.id}
                  style={{
                    borderBottom: "1px solid #eee",
                    opacity: status === "Cancelado" ? 0.65 : 1,
                  }}
                >
                  <td style={{ padding: "1rem" }}>
                    <strong style={{ display: "block" }}>{t.id}</strong>
                    <span style={{ color: "#888", fontSize: "0.75rem" }}>
                      {new Date(t.date).toLocaleDateString("es-PE")}
                    </span>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <strong style={{ display: "block" }}>
                      {t.customer || "Anónimo"}
                    </strong>
                    <span style={{ color: "#888", fontSize: "0.75rem" }}>
                      {t.documentType || "DNI"}: {t.document || "N/A"}
                    </span>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <span
                      style={{
                        display: "block",
                        fontWeight: "bold",
                        fontSize: "0.75rem",
                        color: "#0277bd",
                      }}
                    >
                      {t.email || "Sin correo"}
                    </span>
                    {t.phone && (
                      <span
                        style={{
                          display: "block",
                          fontSize: "0.72rem",
                          color: "#333",
                          marginTop: "2px",
                        }}
                      >
                        Tel: {t.phone}
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: "0.7rem",
                        color: "#666",
                        display: "block",
                        marginTop: "4px",
                      }}
                    >
                      {t.address || "Dirección no registrada"} -{" "}
                      {t.districtName || ""}
                    </span>
                    {t.reference && (
                      <span
                        style={{
                          fontSize: "0.68rem",
                          color: "#555",
                          display: "block",
                          marginTop: "2px",
                          fontStyle: "italic",
                        }}
                      >
                        Ref: {t.reference}
                      </span>
                    )}
                    <span
                      style={{
                        display: "inline-block",
                        fontSize: "0.65rem",
                        background: "#f5f5f5",
                        padding: "2px 6px",
                        borderRadius: "3px",
                        color: "#555",
                        marginTop: "4px",
                        fontWeight: "bold",
                      }}
                    >
                      {t.shippingMethod === "express"
                        ? "ENVÍO EXPRESS"
                        : "ENVÍO ESTÁNDAR"}{" "}
                      ({t.shipping ? money(t.shipping) : "Gratis"})
                    </span>
                  </td>
                  <td style={{ padding: "1rem", maxWidth: "250px" }}>
                    <span
                      style={{
                        fontSize: "0.8rem",
                        lineHeight: "1.4",
                        display: "block",
                      }}
                    >
                      {t.detail}
                    </span>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <strong style={{ fontSize: "1.1rem" }}>
                      {money(t.total)}
                    </strong>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    {renderPaymentBadge(t.paymentMethod)}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <select
                      value={status}
                      onChange={(e) =>
                        handleStatusChange(t.id, e.target.value as OrderStatus)
                      }
                      style={{
                        padding: "0.5rem",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                        fontWeight: "bold",
                        cursor: "pointer",
                        background: badgeBg,
                        color: badgeColor,
                      }}
                    >
                      <option value="Pendiente de Pago">Pendiente de Pago</option>
                      <option value="Procesando">Procesando</option>
                      <option value="Enviado">Enviado</option>
                      <option value="Entregado">Entregado</option>
                      <option value="Cancelado">
                        Cancelado (Devuelve Stock)
                      </option>
                    </select>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

