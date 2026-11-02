import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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
  const [orders, setOrders] = useState<OrderTransaction[]>(
    () => propOrders || [],
  )
  const [internalLoading, setInternalLoading] = useState(false)
  const [internalError, setInternalError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("Todos los Estados")
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const [retryingOrderId, setRetryingOrderId] = useState<string | null>(null)
  const [notification, setNotification] = useState<{
    message: string
    type: "success" | "error"
  } | null>(null)

  // Bloquear refetch o sync con datos viejos de DynamoDB por consistencia eventual
  const suppressSyncUntilRef = useRef<number>(0)

  useEffect(() => {
    if (propOrders) {
      if (Date.now() < suppressSyncUntilRef.current) {
        // Preservar la mutación optimista local reciente frente a datos desactualizados
        setOrders((current) => {
          const currentMap = new Map(current.map((o) => [o.id, o]))
          return propOrders.map((incoming) => {
            const existing = currentMap.get(incoming.id)
            if (existing && existing.status !== incoming.status) {
              return { ...incoming, status: existing.status }
            }
            return incoming
          })
        })
      } else {
        setOrders(propOrders)
      }
    }
  }, [propOrders])

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3500)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const isControlled = propOrders !== undefined
  const isLoading = isControlled ? (propIsLoading ?? false) : internalLoading
  const fetchError = isControlled ? (propError ?? null) : internalError

  const filteredOrders = useMemo(() => {
    if (statusFilter === "Todos los Estados") {
      return orders
    }
    return orders.filter(
      (order) => (order.status || "Procesando") === statusFilter,
    )
  }, [orders, statusFilter])

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
          console.error(
            `[Admin] Error en GET /orders (${res.status}):`,
            errText,
          )
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
      setOrders(clean)
      try {
        localStorage.setItem("gone_transactions", JSON.stringify(clean))
      } catch {}
    } catch (err: any) {
      console.error("[Admin] Error al obtener órdenes con VITE_API_URL:", err)
      setInternalError(
        err?.message || "No se pudo sincronizar pedidos en vivo.",
      )
    } finally {
      setInternalLoading(false)
    }
  }, [propOnRefresh])

  useEffect(() => {
    if (!isControlled) {
      fetchOrdersFromApi()
    }
  }, [isControlled, fetchOrdersFromApi])

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    // Proteger contra sobreescritura de consistencia eventual por 3 segundos
    suppressSyncUntilRef.current = Date.now() + 3000
    setUpdatingOrderId(orderId)

    // Actualización optimista estricta en el estado local de la UI
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order,
      ),
    )

    try {
      let updatedOrder: OrderTransaction | null = null
      if (propOnStatusChange) {
        await propOnStatusChange(orderId, newStatus)
      } else {
        const res = await api.orders.updateStatus(orderId, newStatus)
        updateOrderStatus(orderId, newStatus)
        if (res) updatedOrder = res
      }

      if (updatedOrder) {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderId
              ? { ...order, ...updatedOrder, status: newStatus }
              : order,
          ),
        )
      }

      setNotification({
        type: "success",
        message: `✓ Pedido ${orderId} actualizado a "${newStatus}" en DynamoDB${updatedOrder?.invoicePdfUrl ? " (Boleta emitida)" : ""}`,
      })
    } catch (err: any) {
      console.error("[Admin] Error actualizando estado de pedido:", err)
      suppressSyncUntilRef.current = 0
      setNotification({
        type: "error",
        message: `⚠️ Error al actualizar el pedido ${orderId}. ${err?.message || "Revisa la conexión con AWS."}`,
      })
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const handleRetryInvoice = async (orderId: string) => {
    setRetryingOrderId(orderId)
    try {
      const updated = await api.orders.retryInvoice(orderId)
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, ...updated } : order,
        ),
      )
      if (updated.invoicePdfUrl) {
        setNotification({
          type: "success",
          message: `✓ Boleta electrónica generada exitosamente para el pedido ${orderId}`,
        })
      } else {
        setNotification({
          type: "error",
          message: `⚠️ No se pudo generar la boleta: ${updated.invoiceError || "Error desconocido"}`,
        })
      }
    } catch (err: any) {
      console.error("[ManageOrders] Error al reintentar emisión de boleta:", err)
      setNotification({
        type: "error",
        message: `⚠️ Error al emitir boleta: ${err?.message || "Revisa la conexión con Nubefact."}`,
      })
    } finally {
      setRetryingOrderId(null)
    }
  }

  const renderInvoiceCell = (t: OrderTransaction) => {
    const isRetrying = retryingOrderId === t.id
    const hasPdf = Boolean(
      t.invoicePdfUrl &&
        typeof t.invoicePdfUrl === "string" &&
        t.invoicePdfUrl.trim() !== "",
    )
    const isError =
      t.invoiceStatus === "error_facturacion" ||
      Boolean(t.invoiceError && !hasPdf)

    const method = String(t.paymentMethod || "").toLowerCase()
    const isYapePlin =
      method === "yape_plin" || method.includes("yape") || method.includes("plin")
    const isContraEntrega =
      method === "efectivo" ||
      method.includes("contra") ||
      method.includes("entrega")

    // 1. Si existe URL de la boleta: Ver Boleta
    if (hasPdf) {
      return (
        <a
          href={t.invoicePdfUrl!}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 active:scale-95 rounded transition-all shadow-xs"
          style={{
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 12px",
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "#fff",
            backgroundColor: "#0a0a0a",
            borderRadius: "4px",
          }}
          title="Abrir boleta / factura electrónica de Nubefact (PDF)"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: "14px", height: "14px" }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span>Ver Boleta</span>
        </a>
      )
    }

    // 2. Si falló la petición a Nubefact: Botón rojo "Reintentar Boleta"
    if (isError) {
      return (
        <button
          type="button"
          onClick={() => handleRetryInvoice(t.id)}
          disabled={isRetrying}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-300 active:scale-95 rounded transition-all shadow-xs cursor-pointer disabled:opacity-50"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 12px",
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "#b91c1c",
            backgroundColor: "#fef2f2",
            border: "1px solid #fca5a5",
            borderRadius: "4px",
            cursor: isRetrying ? "not-allowed" : "pointer",
          }}
          title={
            t.invoiceError ||
            "Error al generar comprobante con Nubefact. Clic para reintentar."
          }
        >
          {isRetrying ? (
            <>
              <svg
                className="animate-spin"
                style={{ width: "12px", height: "12px" }}
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              <span>Emitiendo...</span>
            </>
          ) : (
            <>
              <svg
                style={{ width: "13px", height: "13px" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Reintentar Boleta</span>
            </>
          )}
        </button>
      )
    }

    // 3. Pago Contra Entrega y estado no es Entregado: "Se emite al entregar"
    if (isContraEntrega && t.status !== "Entregado") {
      return (
        <span
          className="text-xs text-neutral-500 italic inline-flex items-center gap-1.5"
          style={{
            fontSize: "0.75rem",
            color: "#71717a",
            fontStyle: "italic",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
          }}
          title="El comprobante electrónico se emitirá automáticamente cuando el pedido sea marcado como Entregado"
        >
          <span style={{ fontSize: "0.85rem" }}>⏳</span>
          <span>Se emite al entregar</span>
        </span>
      )
    }

    // 4. Yape / Plin y estado es Pendiente de Pago: "Esperando pago"
    if (isYapePlin && t.status === "Pendiente de Pago") {
      return (
        <span
          className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded inline-flex items-center gap-1.5 font-medium"
          style={{
            fontSize: "0.75rem",
            color: "#b45309",
            backgroundColor: "#fffbeb",
            border: "1px solid #fde68a",
            padding: "3px 8px",
            borderRadius: "4px",
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            fontWeight: 500,
          }}
          title="El comprobante electrónico se emitirá cuando verifiques el pago y pases el pedido a Procesando"
        >
          <span style={{ fontSize: "0.85rem" }}>📱</span>
          <span>Esperando pago</span>
        </span>
      )
    }

    // 5. Fallback para otros casos no emitidos
    return (
      <span
        className="text-xs text-neutral-400 italic inline-flex items-center gap-1"
        style={{
          fontSize: "0.75rem",
          color: "#a1a1aa",
          fontStyle: "italic",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <span>No emitida</span>
      </span>
    )
  }

  if (isLoading && orders.length === 0) {
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

  if (orders.length === 0) {
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
          Los pedidos realizados por los clientes en la tienda oficial
          aparecerán aquí automáticamente en tiempo real.
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
      {notification && (
        <div
          style={{
            padding: "10px 16px",
            backgroundColor:
              notification.type === "success" ? "#ecfdf5" : "#fef2f2",
            borderBottom: `2px solid ${
              notification.type === "success" ? "#10b981" : "#ef4444"
            }`,
            color: notification.type === "success" ? "#065f46" : "#991b1b",
            fontWeight: 700,
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          <span>{notification.message}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold",
              color: "inherit",
              fontSize: "1rem",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
      )}
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
            Total registrados: {orders.length} pedido(s)
            {statusFilter !== "Todos los Estados" &&
              ` (Filtrados: ${filteredOrders.length})`}
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
              <th style={{ padding: "1rem" }}>COMPROBANTE</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
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
            ) : (
              filteredOrders.map((t: OrderTransaction) => {
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
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <select
                          value={t.status || "Procesando"}
                          disabled={updatingOrderId === t.id}
                          onChange={(e) =>
                            handleStatusChange(
                              t.id,
                              e.target.value as OrderStatus,
                            )
                          }
                          style={{
                            padding: "0.5rem",
                            borderRadius: "4px",
                            border: "1px solid #ccc",
                            fontWeight: "bold",
                            cursor:
                              updatingOrderId === t.id ? "wait" : "pointer",
                            background: badgeBg,
                            color: badgeColor,
                            opacity: updatingOrderId === t.id ? 0.6 : 1,
                            transition: "opacity 0.2s ease",
                          }}
                          title="Cambiar estado del pedido"
                        >
                          <option value="Pendiente de Pago">
                            Pendiente de Pago
                          </option>
                          <option value="Procesando">Procesando</option>
                          <option value="Enviado">Enviado</option>
                          <option value="Entregado">Entregado</option>
                          <option value="Cancelado">
                            Cancelado (Devuelve Stock)
                          </option>
                        </select>
                        {updatingOrderId === t.id && (
                          <span
                            style={{
                              fontSize: "0.75rem",
                              color: "#666",
                              fontWeight: "bold",
                            }}
                            title="Guardando en DynamoDB..."
                          >
                            ⏳ Guardando...
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "1rem", whiteSpace: "nowrap" }}>
                      {renderInvoiceCell(t)}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
