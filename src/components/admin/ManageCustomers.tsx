import { useEffect, useMemo, useState } from "react"
import { useStore } from "../../store"
import { useClients } from "../../hooks/useClients"
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
  cognitoId?: string
  ordersCount: number
  totalSpent: number
}

export interface ManageCustomersProps {
  orders?: OrderTransaction[]
}

export default function ManageCustomers({ orders }: ManageCustomersProps = {}) {
  const { users: storeUsers, transactions: storeTransactions, deleteUser } = useStore()
  const { clients: liveClients, isLoading: isLoadingClients, deleteClient } = useClients()
  const transactions = orders ?? storeTransactions

  const [customerToDelete, setCustomerToDelete] = useState<DirectoryCustomerRow | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [removedEmails, setRemovedEmails] = useState<Set<string>>(new Set())
  const [notification, setNotification] = useState<{
    message: string
    type: "success" | "error"
  } | null>(null)

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  // Unir clientes registrados de la base de datos (con prioridad en datos vivos de AWS)
  const users = useMemo(() => {
    const map = new Map<string, any>()
    storeUsers.forEach((u) => {
      if (u.email) map.set(u.email.toLowerCase(), u)
    })
    liveClients.forEach((u) => {
      if (u.email) map.set(u.email.toLowerCase(), u)
    })
    return Array.from(map.values())
  }, [storeUsers, liveClients])

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
        isRegistered: u.isGuest !== true,
        cognitoId: u.cognitoId,
        ordersCount: 0,
        totalSpent: 0,
      })
    })

    transactions.forEach((t) => {
      const key = (t.email || "").toLowerCase()
      if (!key) return
      const existing = map.get(key)
      const isCancelled = t.status === "Cancelado"

      // Una orden que tiene isGuest = false, cognitoId o userStatus = "Registrado" confirma el estatus
      const orderIndicatesRegistered =
        t.isGuest === false ||
        Boolean(t.cognitoId) ||
        t.userStatus === "Registrado"

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
        if (orderIndicatesRegistered) {
          existing.isRegistered = true
        }
        if (t.cognitoId && !existing.cognitoId) {
          existing.cognitoId = t.cognitoId
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
          isRegistered: orderIndicatesRegistered,
          cognitoId: t.cognitoId,
          ordersCount: 1,
          totalSpent: isCancelled ? 0 : t.total || 0,
        })
      }
    })

    return Array.from(map.values()).filter(
      (u) => !removedEmails.has((u.email || "").toLowerCase()),
    )
  }, [users, transactions, removedEmails])

  const handleConfirmDelete = async () => {
    if (!customerToDelete) return
    const targetEmail = (customerToDelete.email || "").trim().toLowerCase()
    setIsDeleting(true)
    setDeleteError(null)

    try {
      // 1. Borrado en cascada en AWS (Cognito, UsersTable, OrdersTable)
      await deleteClient(targetEmail)

      // 2. Limpieza en store local
      deleteUser(targetEmail)

      // 3. Reactividad inmediata en UI
      setRemovedEmails((prev) => new Set(prev).add(targetEmail))

      setNotification({
        type: "success",
        message: `✓ Cliente "${targetEmail}" y su historial fueron eliminados con éxito (Cognito, DynamoDB y Órdenes).`,
      })
      setCustomerToDelete(null)
    } catch (err: any) {
      console.error("[ManageCustomers] Error durante el borrado en cascada:", err)
      setDeleteError(
        err?.message || "Ocurrió un error al procesar el borrado en cascada en AWS.",
      )
    } finally {
      setIsDeleting(false)
    }
  }

  if (directory.length === 0 && !customerToDelete) {
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
        position: "relative",
      }}
    >
      {notification && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            zIndex: 10000,
            background: notification.type === "success" ? "#0a0a0a" : "#d32f2f",
            color: "#fff",
            padding: "1rem 1.5rem",
            borderRadius: "6px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
            fontWeight: "bold",
            fontSize: "0.85rem",
            borderLeft:
              notification.type === "success"
                ? "4px solid #4caf50"
                : "4px solid #ffeb3b",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {notification.message}
        </div>
      )}

      <div
        style={{
          padding: "1.5rem",
          borderBottom: "2px solid #000",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "1rem", textTransform: "uppercase" }}>
            Directorio de Clientes
          </h2>
          <span style={{ fontSize: "0.75rem", color: "#666" }}>
            Total en sistema: {directory.length} cliente(s)
          </span>
        </div>
        {isLoadingClients && (
          <span style={{ fontSize: "0.75rem", color: "#888", fontStyle: "italic" }}>
            Sincronizando con AWS...
          </span>
        )}
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
              <th style={{ padding: "1rem", textAlign: "right" }}>ACCIONES</th>
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
                  {u.cognitoId && (
                    <span
                      style={{
                        display: "block",
                        fontSize: "0.62rem",
                        color: "#999",
                        marginTop: "1px",
                      }}
                    >
                      ID: {u.cognitoId}
                    </span>
                  )}
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
                  <button
                    onClick={() => {
                      setDeleteError(null)
                      setCustomerToDelete(u)
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "#fff",
                      color: "#d32f2f",
                      border: "1px solid #ffcdd2",
                      padding: "0.45rem 0.85rem",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#ffebee"
                      e.currentTarget.style.borderColor = "#d32f2f"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#fff"
                      e.currentTarget.style.borderColor = "#ffcdd2"
                    }}
                    title={`Eliminar cliente ${u.email}`}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                    ELIMINAR
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL DE CONFIRMACIÓN ESTRICTO PARA ELIMINACIÓN DE CLIENTE */}
      {customerToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            padding: "1rem",
            backdropFilter: "blur(4px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) {
              setCustomerToDelete(null)
            }
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "8px",
              maxWidth: "500px",
              width: "100%",
              padding: "2rem",
              boxShadow: "0 25px 50px rgba(0,0,0,0.35)",
              borderTop: "6px solid #d32f2f",
              animation: "fadeIn 0.2s ease-out",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  background: "#ffebee",
                  color: "#d32f2f",
                  borderRadius: "50%",
                  width: "40px",
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.2rem",
                  flexShrink: 0,
                }}
              >
                ⚠️
              </div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "1.1rem",
                  color: "#111",
                  textTransform: "uppercase",
                  fontWeight: 800,
                }}
              >
                ¿Estás seguro de eliminar a este cliente?
              </h3>
            </div>

            <div
              style={{
                background: "#fff5f5",
                borderLeft: "4px solid #d32f2f",
                padding: "0.9rem",
                borderRadius: "4px",
                marginBottom: "1.5rem",
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: "#c62828",
                  fontSize: "0.85rem",
                  fontWeight: "bold",
                  lineHeight: 1.4,
                }}
              >
                Esta acción borrará su perfil, sus accesos y su historial de pedidos.
              </p>
            </div>

            <div
              style={{
                background: "#f9f9f9",
                border: "1px solid #eee",
                borderRadius: "6px",
                padding: "1rem",
                marginBottom: "1.5rem",
                fontSize: "0.85rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <div>
                <span style={{ color: "#666" }}>Cliente: </span>
                <strong>
                  {customerToDelete.firstName} {customerToDelete.lastName}
                </strong>
              </div>
              <div>
                <span style={{ color: "#666" }}>Correo Electrónico: </span>
                <strong style={{ color: "#0277bd" }}>{customerToDelete.email}</strong>
              </div>
              <div>
                <span style={{ color: "#666" }}>Documento: </span>
                <span>{customerToDelete.document}</span>
              </div>
              <div>
                <span style={{ color: "#666" }}>Historial de compras: </span>
                <span>
                  {customerToDelete.ordersCount} pedido(s) ({money(customerToDelete.totalSpent)})
                </span>
              </div>
              <div>
                <span style={{ color: "#666" }}>Tipo de cuenta: </span>
                <span
                  style={{
                    color: customerToDelete.isRegistered ? "#2e7d32" : "#e65100",
                    fontWeight: "bold",
                  }}
                >
                  {customerToDelete.isRegistered
                    ? "Cuenta Registrada (Cognito / DynamoDB)"
                    : "Invitado Checkout"}
                </span>
              </div>
            </div>

            {deleteError && (
              <div
                style={{
                  background: "#ffebee",
                  color: "#b71c1c",
                  padding: "0.75rem",
                  borderRadius: "4px",
                  fontSize: "0.8rem",
                  marginBottom: "1.2rem",
                  borderLeft: "4px solid #d32f2f",
                }}
              >
                {deleteError}
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.75rem",
              }}
            >
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setCustomerToDelete(null)}
                style={{
                  background: "#eee",
                  color: "#333",
                  border: "none",
                  padding: "0.75rem 1.25rem",
                  borderRadius: "4px",
                  fontSize: "0.85rem",
                  fontWeight: "bold",
                  cursor: isDeleting ? "not-allowed" : "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                style={{
                  background: "#d32f2f",
                  color: "#fff",
                  border: "none",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "4px",
                  fontSize: "0.85rem",
                  fontWeight: "bold",
                  cursor: isDeleting ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  opacity: isDeleting ? 0.7 : 1,
                  boxShadow: "0 2px 6px rgba(211,47,47,0.4)",
                }}
              >
                {isDeleting ? "Eliminando en cascada..." : "Eliminar Definitivamente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
