import { useMemo, useState } from "react"
import { useStore, type OrderTransaction, type Size } from "../../store"
import { formatPEN } from "../../utils/accounting"

const SIZES: Size[] = ["S", "M", "L", "XL"]
const money = (value: number) => formatPEN(value)

export interface MetricsDashboardProps {
  orders?: OrderTransaction[]
  isLoading?: boolean
  error?: string | null
  onRefresh?: () => void
}

export function MetricsDashboard({
  orders: propOrders,
  isLoading = false,
  error = null,
  onRefresh,
}: MetricsDashboardProps = {}) {
  const { transactions: storeTransactions, products, users } = useStore()
  const orders = propOrders ?? storeTransactions

  const [dateFilter, setDateFilter] =
    useState<"all" | "today" | "yesterday" | "last7" | "last30" | "custom">(
      "all",
    )
  const [customStart, setCustomStart] = useState("")
  const [customEnd, setCustomEnd] = useState("")

  const filteredTransactions = useMemo(() => {
    const now = new Date()
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime()
    const yesterdayStart = todayStart - 86400000

    return orders.filter((t) => {
      const tTime = new Date(t.date).getTime()
      if (dateFilter === "all") return true
      if (dateFilter === "today") return tTime >= todayStart
      if (dateFilter === "yesterday")
        return tTime >= yesterdayStart && tTime < todayStart
      if (dateFilter === "last7") return tTime >= todayStart - 7 * 86400000
      if (dateFilter === "last30") return tTime >= todayStart - 30 * 86400000
      if (dateFilter === "custom") {
        const startValid = customStart ? new Date(customStart).getTime() : 0
        const endValid = customEnd
          ? new Date(customEnd).getTime() + 86400000
          : Number.MAX_SAFE_INTEGER
        return tTime >= startValid && tTime <= endValid
      }
      return true
    })
  }, [orders, dateFilter, customStart, customEnd])

  const activeFilteredTransactions = useMemo(
    () => filteredTransactions.filter((t) => t.status !== "Cancelado"),
    [filteredTransactions],
  )
  const totalRevenue = useMemo(
    () => activeFilteredTransactions.reduce((s, i) => s + (i.total || 0), 0),
    [activeFilteredTransactions],
  )
  const revenueByMethod = useMemo(() => {
    const summary = { tarjeta: 0, yape_plin: 0, efectivo: 0 }
    activeFilteredTransactions.forEach((t) => {
      const m = t.paymentMethod || "tarjeta"
      if (m in summary) {
        summary[m as keyof typeof summary] += t.total || 0
      } else {
        summary.tarjeta += t.total || 0
      }
    })
    return summary
  }, [activeFilteredTransactions])
  const pendingOrders = useMemo(
    () =>
      filteredTransactions.filter((t) => !t.status || t.status === "Procesando")
        .length,
    [filteredTransactions],
  )
  const completedOrders = useMemo(
    () =>
      filteredTransactions.filter(
        (t) => t.status === "Enviado" || t.status === "Entregado",
      ).length,
    [filteredTransactions],
  )

  const inventoryStats = useMemo(() => {
    let totalUnits = 0
    let outOfStockSizes = 0
    products.forEach((p) => {
      const relevantSizes =
        p.category === "Accesorios" ? (["Única"] as Size[]) : SIZES
      relevantSizes.forEach((sz) => {
        const units = p.stocks[sz] || 0
        totalUnits += units
        if (units === 0) outOfStockSizes += 1
      })
    })
    return { totalUnits, outOfStockSizes }
  }, [products])

  const uniqueCustomerEmails = useMemo(() => {
    const set = new Set<string>()
    users.forEach((u) => {
      if (u.email) set.add(u.email.toLowerCase())
    })
    filteredTransactions.forEach((t) => {
      if (t.email) set.add(t.email.toLowerCase())
    })
    return set.size
  }, [users, filteredTransactions])

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      {/* BARRA DE FILTROS DE FECHA */}
      <div
        style={{
          background: "#fff",
          padding: "1.2rem 1.5rem",
          borderRadius: "8px",
          border: "1px solid #eee",
          marginBottom: "2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.8rem",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: "bold",
              color: "#666",
              textTransform: "uppercase",
            }}
          >
            Filtrar Periodo:
          </span>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "4px",
              border: "1px solid #ccc",
              fontWeight: "bold",
              fontSize: "0.85rem",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            <option value="all">Histórico Completo</option>
            <option value="today">Hoy</option>
            <option value="yesterday">Ayer</option>
            <option value="last7">Últimos 7 días</option>
            <option value="last30">Último mes (30 días)</option>
            <option value="custom">Rango Personalizado...</option>
          </select>
        </div>

        {dateFilter === "custom" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.8rem",
              flexWrap: "wrap",
              animation: "fadeIn 0.3s ease",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
            >
              <label
                style={{
                  fontSize: "0.7rem",
                  color: "#666",
                  fontWeight: "bold",
                }}
              >
                DESDE:
              </label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                style={{
                  padding: "0.4rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "0.8rem",
                }}
              />
            </div>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
            >
              <label
                style={{
                  fontSize: "0.7rem",
                  color: "#666",
                  fontWeight: "bold",
                }}
              >
                HASTA:
              </label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                style={{
                  padding: "0.4rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "0.8rem",
                }}
              />
            </div>
          </div>
        )}

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            style={{
              background: "#0a0a0a",
              color: "#fff",
              border: "none",
              padding: "0.5rem 1rem",
              borderRadius: "4px",
              fontWeight: "bold",
              fontSize: "0.8rem",
              cursor: isLoading ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              opacity: isLoading ? 0.6 : 1,
            }}
          >
            {isLoading ? "Sincronizando..." : "🔄 Sincronizar DynamoDB"}
          </button>
        )}
      </div>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1rem",
          marginBottom: "3rem",
        }}
      >
        <article
          style={{
            background: "#fff",
            padding: "1.5rem",
            border: "1px solid #eee",
            borderRadius: "8px",
          }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: "bold",
              color: "#666",
              textTransform: "uppercase",
            }}
          >
            Recaudación Total
          </span>
          <strong
            style={{ display: "block", fontSize: "2.5rem", margin: "0.5rem 0" }}
          >
            {money(totalRevenue)}
          </strong>
          <small style={{ color: "#888", fontSize: "0.75rem" }}>
            {activeFilteredTransactions.length} VENTAS EN EL PERIODO
          </small>
          <div
            style={{
              display: "flex",
              gap: "6px",
              marginTop: "10px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: "0.7rem",
                padding: "3px 8px",
                borderRadius: "4px",
                backgroundColor: "#e8f5e9",
                border: "1px solid #81c784",
                color: "#1b5e20",
                fontWeight: 700,
              }}
            >
              💳 Tarjeta: {money(revenueByMethod.tarjeta)}
            </span>
            <span
              style={{
                fontSize: "0.7rem",
                padding: "3px 8px",
                borderRadius: "4px",
                backgroundColor: "#f3e5f5",
                border: "1px solid #ce93d8",
                color: "#6a1b9a",
                fontWeight: 700,
              }}
            >
              📱 Yape/Plin: {money(revenueByMethod.yape_plin)}
            </span>
            <span
              style={{
                fontSize: "0.7rem",
                padding: "3px 8px",
                borderRadius: "4px",
                backgroundColor: "#fff3e0",
                border: "1px solid #ffb74d",
                color: "#e65100",
                fontWeight: 700,
              }}
            >
              💵 Efectivo: {money(revenueByMethod.efectivo)}
            </span>
          </div>
        </article>

        <article
          style={{
            background: "#fff",
            padding: "1.5rem",
            border: "1px solid #eee",
            borderRadius: "8px",
          }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: "bold",
              color: "#666",
              textTransform: "uppercase",
            }}
          >
            Pedidos por Despachar
          </span>
          <strong
            style={{
              display: "block",
              fontSize: "2.5rem",
              margin: "0.5rem 0",
              color: pendingOrders > 0 ? "#e65100" : "#000",
            }}
          >
            {pendingOrders}
          </strong>
          <small style={{ color: "#888", fontSize: "0.75rem" }}>
            {completedOrders} ENVIADOS O ENTREGADOS
          </small>
        </article>

        <article
          style={{
            background: "#fff",
            padding: "1.5rem",
            border: "1px solid #eee",
            borderRadius: "8px",
          }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: "bold",
              color: "#666",
              textTransform: "uppercase",
            }}
          >
            Unidades en Stock
          </span>
          <strong
            style={{ display: "block", fontSize: "2.5rem", margin: "0.5rem 0" }}
          >
            {inventoryStats.totalUnits}
          </strong>
          <small
            style={{
              color: inventoryStats.outOfStockSizes > 0 ? "#ff4d4d" : "#888",
              fontSize: "0.75rem",
              fontWeight:
                inventoryStats.outOfStockSizes > 0 ? "bold" : "normal",
            }}
          >
            {products.length} PRODUCTOS ({inventoryStats.outOfStockSizes} TALLAS
            AGOTADAS)
          </small>
        </article>

        <article
          style={{
            background: "#fff",
            padding: "1.5rem",
            border: "1px solid #eee",
            borderRadius: "8px",
          }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: "bold",
              color: "#666",
              textTransform: "uppercase",
            }}
          >
            Clientes Activos
          </span>
          <strong
            style={{ display: "block", fontSize: "2.5rem", margin: "0.5rem 0" }}
          >
            {uniqueCustomerEmails}
          </strong>
          <small style={{ color: "#888", fontSize: "0.75rem" }}>
            EN EL PERIODO SELECCIONADO
          </small>
        </article>
      </section>
    </div>
  )
}

export default MetricsDashboard

