import { useMemo } from "react"
import { useStore } from "../../store"
import type { OrderTransaction } from "../../types"
import { formatPEN } from "../../utils/accounting"

const money = (val: number) => formatPEN(val)

export interface DirectoryCustomerRow {
  firstName: string
  lastName: string
  email: string
  document: string
  phone: string
  address: string
  reference?: string
  district: string
  isRegistered: boolean
  ordersCount: number
  totalSpent: number
}

export interface ManageCustomersProps {
  orders?: OrderTransaction[]
}

export default function ManageCustomers({ orders }: ManageCustomersProps = {}) {
  const { users, transactions: storeTransactions, deleteUser } = useStore()
  const transactions = orders ?? storeTransactions

  const directory = useMemo<DirectoryCustomerRow[]>(() => {
    const map = new Map<string, DirectoryCustomerRow>()

    users.forEach((u) => {
      const key = (u.email || "").toLowerCase()
      if (!key) return
      map.set(key, {
        firstName: u.firstName || "",
        lastName: u.lastName || "",
        email: u.email,
        document: u.document || "N/A",
        phone: u.phone || "N/A",
        address: u.address || "N/A",
        reference: u.reference || "",
        district: u.district || "N/A",
        isRegistered: true,
        ordersCount: 0,
        totalSpent: 0,
      })
    })

    transactions.forEach((t) => {
      const key = (t.email || "").toLowerCase()
      if (!key) return
      const existing = map.get(key)
      const isCancelled = t.status === "Cancelado"

      if (existing) {
        existing.ordersCount += 1
        if (!isCancelled) existing.totalSpent += t.total || 0
        if (!existing.reference && t.reference) {
          existing.reference = t.reference
        }
        if ((existing.address === "N/A" || !existing.address) && t.address) {
          existing.address = t.address
        }
        if ((existing.phone === "N/A" || !existing.phone) && t.phone) {
          existing.phone = t.phone
        }
      } else {
        const parts = (t.customer || "Cliente Invitado").trim().split(" ")
        map.set(key, {
          firstName: parts[0] || "Cliente",
          lastName: parts.slice(1).join(" "),
          email: t.email,
          document: t.document || "N/A",
          phone: t.phone || "N/A",
          address: t.address || "N/A",
          reference: t.reference || "",
          district: t.districtName || "N/A",
          isRegistered: false,
          ordersCount: 1,
          totalSpent: isCancelled ? 0 : t.total || 0,
        })
      }
    })

    return Array.from(map.values())
  }, [users, transactions])

  const handleDeleteCustomer = (email: string) => {
    if (
      window.confirm(
        `¿Estás seguro de que deseas eliminar permanentemente al cliente con correo ${email}?`,
      )
    ) {
      deleteUser(email)
    }
  }

  if (directory.length === 0) {
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
        <h3>Aún no hay clientes registrados en el sistema.</h3>
        <p style={{ color: "#666" }}>
          Cuando un cliente cree su cuenta o realice un pedido, aparecerá en
          este directorio.
        </p>
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
      <div style={{ padding: "1.5rem", borderBottom: "2px solid #000" }}>
        <h2 style={{ margin: 0, fontSize: "1rem", textTransform: "uppercase" }}>
          Directorio de Clientes
        </h2>
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
              <th style={{ padding: "1rem" }}>NOMBRE COMPLETO</th>
              <th style={{ padding: "1rem" }}>DOCUMENTO</th>
              <th style={{ padding: "1rem" }}>CONTACTO</th>
              <th style={{ padding: "1rem" }}>DIRECCIÓN DE ENVÍO</th>
              <th style={{ padding: "1rem" }}>COMPRAS</th>
              <th style={{ padding: "1rem" }}></th>
            </tr>
          </thead>
          <tbody>
            {directory.map((u, i) => (
              <tr key={u.email || i} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "1rem" }}>
                  <strong style={{ display: "block" }}>
                    {u.firstName} {u.lastName}
                  </strong>
                  <span
                    style={{
                      fontSize: "0.68rem",
                      color: u.isRegistered ? "#2e7d32" : "#888",
                      fontWeight: "bold",
                    }}
                  >
                    {u.isRegistered ? "CUENTA REGISTRADA" : "INVITADO CHECKOUT"}
                  </span>
                </td>
                <td style={{ padding: "1rem" }}>DNI: {u.document || "N/A"}</td>
                <td style={{ padding: "1rem" }}>
                  <span
                    style={{
                      display: "block",
                      fontWeight: "bold",
                      color: "#0277bd",
                    }}
                  >
                    {u.email}
                  </span>
                  <span style={{ color: "#666", fontSize: "0.75rem" }}>
                    Tel: {u.phone || "N/A"}
                  </span>
                </td>
                <td style={{ padding: "1rem", maxWidth: "250px" }}>
                  <span style={{ display: "block" }}>{u.address || "N/A"}</span>
                  {u.reference && (
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.72rem",
                        color: "#555",
                        fontStyle: "italic",
                        marginTop: "2px",
                      }}
                    >
                      Ref: {u.reference}
                    </span>
                  )}
                  <span style={{ color: "#888", fontSize: "0.75rem" }}>
                    {u.district || "N/A"}
                  </span>
                </td>
                <td style={{ padding: "1rem" }}>
                  <strong style={{ display: "block" }}>
                    {money(u.totalSpent)}
                  </strong>
                  <span style={{ color: "#888", fontSize: "0.75rem" }}>
                    {u.ordersCount} {u.ordersCount === 1 ? "pedido" : "pedidos"}
                  </span>
                </td>
                <td style={{ padding: "1rem", textAlign: "right" }}>
                  {u.isRegistered && (
                    <button
                      onClick={() => handleDeleteCustomer(u.email)}
                      style={{
                        background: "transparent",
                        color: "#ff4d4d",
                        border: "1px solid #ff4d4d",
                        padding: "0.3rem 0.8rem",
                        borderRadius: "20px",
                        cursor: "pointer",
                        fontSize: "0.7rem",
                        fontWeight: "bold",
                      }}
                    >
                      ELIMINAR
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
