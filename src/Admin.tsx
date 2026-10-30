import { type FormEvent, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "./services/api"
import { useOrders } from "./hooks/useOrders"
import ManageCollections from "./components/admin/ManageCollections"
import UploadPrenda from "./components/admin/UploadPrenda"
import MetricsDashboard from "./components/admin/MetricsDashboard"
import ManageOrders from "./components/admin/ManageOrders"
import ManageCustomers from "./components/admin/ManageCustomers"

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <span
      style={{
        fontWeight: 900,
        fontSize: "1.5rem",
        lineHeight: 1,
        letterSpacing: "-1px",
        color: dark ? "#000" : "inherit",
        display: "block",
        marginBottom: "1rem",
      }}
    >
      GONE
      <br />
      SURFING
    </span>
  )
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate()
  const [currentView, setCurrentView] =
    useState<"dashboard" | "orders" | "upload" | "collections" | "customers">(
      "dashboard",
    )
  const {
    orders: liveOrders,
    isLoading: isLoadingOrders,
    error: ordersError,
    refreshOrders: fetchLiveOrders,
    updateStatus: handleStatusChange,
  } = useOrders()

  return (
    <main
      style={{
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
        padding: "3rem 5%",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: "0.75rem",
              fontWeight: "bold",
              color: "#666",
            }}
          >
            GONE SURFING / ADMIN
          </p>
        </div>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <button
            onClick={() => navigate("/shop")}
            style={{
              background: "#000",
              color: "#fff",
              border: "none",
              padding: "0.6rem 1.2rem",
              fontWeight: "bold",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            VER TIENDA PÚBLICA
          </button>
          <button
            onClick={onLogout}
            style={{
              background: "transparent",
              color: "#000",
              border: "1px solid #000",
              padding: "0.6rem 1.2rem",
              fontWeight: "bold",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            CERRAR SESIÓN
          </button>
        </div>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <nav
          style={{
            display: "flex",
            gap: "2rem",
            borderBottom: "2px solid #ddd",
            overflowX: "auto",
          }}
        >
          <button
            onClick={() => setCurrentView("dashboard")}
            style={{
              background: "transparent",
              border: "none",
              borderBottom:
                currentView === "dashboard"
                  ? "2px solid #000"
                  : "2px solid transparent",
              padding: "0 0 0.5rem 0",
              fontWeight: "bold",
              fontSize: "0.9rem",
              color: currentView === "dashboard" ? "#000" : "#888",
              cursor: "pointer",
              textTransform: "uppercase",
              marginBottom: "-2px",
            }}
          >
            Dashboard
          </button>
          <button
            onClick={() => setCurrentView("orders")}
            style={{
              background: "transparent",
              border: "none",
              borderBottom:
                currentView === "orders"
                  ? "2px solid #000"
                  : "2px solid transparent",
              padding: "0 0 0.5rem 0",
              fontWeight: "bold",
              fontSize: "0.9rem",
              color: currentView === "orders" ? "#000" : "#888",
              cursor: "pointer",
              textTransform: "uppercase",
              marginBottom: "-2px",
            }}
          >
            Gestión de Pedidos
          </button>
          <button
            onClick={() => setCurrentView("customers")}
            style={{
              background: "transparent",
              border: "none",
              borderBottom:
                currentView === "customers"
                  ? "2px solid #000"
                  : "2px solid transparent",
              padding: "0 0 0.5rem 0",
              fontWeight: "bold",
              fontSize: "0.9rem",
              color: currentView === "customers" ? "#000" : "#888",
              cursor: "pointer",
              textTransform: "uppercase",
              marginBottom: "-2px",
            }}
          >
            Gestión de Clientes
          </button>
          <button
            onClick={() => setCurrentView("upload")}
            style={{
              background: "transparent",
              border: "none",
              borderBottom:
                currentView === "upload"
                  ? "2px solid #000"
                  : "2px solid transparent",
              padding: "0 0 0.5rem 0",
              fontWeight: "bold",
              fontSize: "0.9rem",
              color: currentView === "upload" ? "#000" : "#888",
              cursor: "pointer",
              textTransform: "uppercase",
              marginBottom: "-2px",
            }}
          >
            Subir Catálogo
          </button>
          <button
            onClick={() => setCurrentView("collections")}
            style={{
              background: "transparent",
              border: "none",
              borderBottom:
                currentView === "collections"
                  ? "2px solid #000"
                  : "2px solid transparent",
              padding: "0 0 0.5rem 0",
              fontWeight: "bold",
              fontSize: "0.9rem",
              color: currentView === "collections" ? "#000" : "#888",
              cursor: "pointer",
              textTransform: "uppercase",
              marginBottom: "-2px",
            }}
          >
            Colecciones
          </button>
        </nav>
      </div>

      {currentView === "dashboard" && (
        <MetricsDashboard
          orders={liveOrders}
          isLoading={isLoadingOrders}
          error={ordersError}
          onRefresh={fetchLiveOrders}
        />
      )}
      {currentView === "orders" && (
        <ManageOrders
          orders={liveOrders}
          isLoading={isLoadingOrders}
          error={ordersError}
          onRefresh={fetchLiveOrders}
          onStatusChange={handleStatusChange}
        />
      )}
      {currentView === "customers" && <ManageCustomers orders={liveOrders} />}
      {currentView === "upload" && <UploadPrenda />}
      {currentView === "collections" && <ManageCollections />}
    </main>
  )
}

export default function Admin() {
  const [auth, setAuth] = useState(() => Boolean(api.auth.getAdminSession()))
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Verify periodic session expiration
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const session = api.auth.getAdminSession()
      if (!session && auth) {
        setAuth(false)
        setErrorMessage(
          "Tu sesión ha expirado por seguridad. Por favor, ingresa nuevamente.",
        )
      }
    }, 10000)

    return () => clearInterval(checkInterval)
  }, [auth])

  const login = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage("")

    const data = new FormData(e.currentTarget)
    const user = String(data.get("user") || "").trim()
    const password = String(data.get("password") || "")

    try {
      const res = await api.auth.loginAdmin(user, password)
      if (res.ok) {
        setAuth(true)
        setErrorMessage("")
      } else {
        setErrorMessage(res.error || "Credenciales incorrectas.")
      }
    } catch {
      setErrorMessage("Error de conexión al autenticar.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const logout = async () => {
    await api.auth.logoutAdmin()
    setAuth(false)
    setErrorMessage("")
  }

  if (auth) return <AdminDashboard onLogout={logout} />

  return (
    <main
      style={{
        backgroundColor: "#e5e5e5",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "3rem",
          width: "100%",
          maxWidth: "400px",
          borderTop: "5px solid #000",
          boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
        }}
      >
        <Logo dark />
        <p
          style={{
            margin: 0,
            fontSize: "0.75rem",
            fontWeight: "bold",
            color: "#666",
            textTransform: "uppercase",
          }}
        >
          Private Access
        </p>
        <h1
          style={{
            margin: "0.5rem 0 2rem 0",
            fontSize: "2.5rem",
            textTransform: "uppercase",
          }}
        >
          Admin Login
        </h1>

        <form
          onSubmit={login}
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.75rem",
                fontWeight: "bold",
                marginBottom: "0.5rem",
              }}
            >
              USUARIO
            </label>
            <input
              name="user"
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #ddd",
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.75rem",
                fontWeight: "bold",
                marginBottom: "0.5rem",
              }}
            >
              CONTRASEÑA
            </label>
            <input
              name="password"
              type="password"
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #ddd",
              }}
            />
          </div>
          {errorMessage && (
            <small style={{ color: "red", fontWeight: "bold" }}>
              {errorMessage}
            </small>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              background: "#000",
              color: "#fff",
              border: "none",
              padding: "1rem",
              fontWeight: "bold",
              textTransform: "uppercase",
              cursor: "pointer",
              marginTop: "1rem",
              opacity: isSubmitting ? 0.6 : 1,
            }}
          >
            {isSubmitting ? "Validando..." : "Enter Dashboard"}
          </button>
        </form>
      </div>
    </main>
  )
}
