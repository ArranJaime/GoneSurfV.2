import React, { useState, useEffect } from "react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import {
  useStore,
  getCurrentSessionUser,
  type CustomerUser,
} from "../../store"
import { api } from "../../services/api"
import {
  validateDocument,
  validateEmail,
  validatePhone,
  sanitizeString,
} from "../../utils/security"
import { formatPEN } from "../../utils/accounting"
import { LIMA_DISTRICTS } from "../../Checkout"

const money = (value: number) => formatPEN(value)

export default function Profile() {
  const {
    transactions,
    registerUser,
    authenticateUser,
    updateUserProfile,
  } = useStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [currentUser, setCurrentUser] = useState<CustomerUser | null>(() =>
    getCurrentSessionUser(),
  )
  const [isAuth, setIsAuth] = useState(
    () =>
      sessionStorage.getItem("gone_customer") === "true" &&
      Boolean(getCurrentSessionUser()),
  )
  const [authMode, setAuthMode] = useState<"login" | "register">(
    searchParams.get("mode") === "register" ? "register" : "login",
  )
  const [error, setError] = useState(false)
  const [registerError, setRegisterError] = useState("")
  const [registerAcceptedTerms, setRegisterAcceptedTerms] = useState(false)
  const [currentTab, setCurrentTab] = useState<"pedidos" | "perfil">("pedidos")

  // Estados interactivos para edición de perfil
  const [profileFirstName, setProfileFirstName] = useState("")
  const [profileLastName, setProfileLastName] = useState("")
  const [profilePhone, setProfilePhone] = useState("")
  const [profileDocument, setProfileDocument] = useState("")
  const [profileAddress, setProfileAddress] = useState("")
  const [profileReference, setProfileReference] = useState("")
  const [profileDistrict, setProfileDistrict] = useState("Lima")
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("")
  const [profileErrorMsg, setProfileErrorMsg] = useState("")
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

  // Sincronizar campos del formulario con el usuario en sesión
  useEffect(() => {
    if (currentUser) {
      setProfileFirstName(currentUser.firstName || "")
      setProfileLastName(currentUser.lastName || "")
      setProfilePhone(currentUser.phone || "")
      setProfileDocument(currentUser.document || "")
      setProfileAddress(currentUser.address || "")
      setProfileReference(currentUser.reference || "")
      setProfileDistrict(currentUser.district || "Lima")
    }
  }, [currentUser])

  useEffect(() => {
    const mode = searchParams.get("mode")
    if (mode === "login" || mode === "register") {
      setAuthMode(mode)
      setError(false)
      setRegisterError("")
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const email = sanitizeString(data.get("email")).toLowerCase()
    const pass = String(data.get("password") || "")

    // Intentar autenticación con AWS primero
    const customerRes = await api.auth.loginCustomer(email, pass)
    if (customerRes) {
      setCurrentUser(customerRes)
      setIsAuth(true)
      setError(false)
      return
    }

    // Fallback a autenticación local
    const authenticated = authenticateUser(email, pass)
    if (authenticated) {
      setCurrentUser(authenticated)
      setIsAuth(true)
      setError(false)
    } else {
      setError(true)
    }
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!registerAcceptedTerms) {
      setRegisterError(
        "Debes leer y aceptar los Términos y Condiciones y la Política de Privacidad para crear tu cuenta.",
      )
      return
    }

    const data = new FormData(e.currentTarget)

    const rawEmail = sanitizeString(data.get("email")).toLowerCase()
    if (!validateEmail(rawEmail)) {
      setRegisterError("Por favor ingresa un correo electrónico válido.")
      return
    }

    const rawDoc = sanitizeString(data.get("document"))
    const docCheck = validateDocument("DNI", rawDoc)
    if (!docCheck.valid) {
      setRegisterError(docCheck.error || "DNI no válido.")
      return
    }

    const rawPhone = sanitizeString(data.get("phone"))
    if (!validatePhone(rawPhone)) {
      setRegisterError("Número de teléfono no válido.")
      return
    }

    const newUser: CustomerUser = {
      firstName: sanitizeString(data.get("firstName")),
      lastName: sanitizeString(data.get("lastName")),
      documentType: "DNI",
      document: rawDoc,
      phone: rawPhone,
      address: sanitizeString(data.get("address")),
      reference: sanitizeString(data.get("reference")),
      district: sanitizeString(data.get("district")),
      email: rawEmail,
      password: String(data.get("password") || ""),
    }

    // Registro en AWS o almacenamiento local con sincronización de pedidos de invitado
    const res = await api.auth.registerCustomer(newUser)
    if (!res.ok) {
      setRegisterError(res.error || "No se pudo completar el registro.")
      return
    }

    const registeredUser = res.user || newUser
    registerUser(registeredUser)
    setCurrentUser(registeredUser)
    setIsAuth(true)
    setError(false)
    setRegisterError("")
  }

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setProfileSuccessMsg("")
    setProfileErrorMsg("")
    setIsUpdatingProfile(true)

    try {
      if (!currentUser?.email) {
        setProfileErrorMsg(
          "Sesión no identificada. Por favor vuelve a iniciar sesión.",
        )
        setIsUpdatingProfile(false)
        return
      }

      const cleanFirst = sanitizeString(profileFirstName)
      const cleanLast = sanitizeString(profileLastName)
      const cleanPhone = sanitizeString(profilePhone)
      const cleanDoc = sanitizeString(profileDocument)
      const cleanAddr = sanitizeString(profileAddress)
      const cleanRef = sanitizeString(profileReference)
      const cleanDist = sanitizeString(profileDistrict)

      if (!cleanFirst || !cleanLast) {
        setProfileErrorMsg("El nombre y los apellidos son obligatorios.")
        setIsUpdatingProfile(false)
        return
      }

      if (cleanDoc) {
        const docCheck = validateDocument("DNI", cleanDoc)
        if (!docCheck.valid) {
          setProfileErrorMsg(
            docCheck.error || "DNI no válido (debe contener 8 dígitos).",
          )
          setIsUpdatingProfile(false)
          return
        }
      }

      if (cleanPhone && !validatePhone(cleanPhone)) {
        setProfileErrorMsg("Número de teléfono no válido.")
        setIsUpdatingProfile(false)
        return
      }

      const res = await updateUserProfile({
        email: currentUser.email,
        firstName: cleanFirst,
        lastName: cleanLast,
        phone: cleanPhone,
        document: cleanDoc,
        documentType: "DNI",
        address: cleanAddr,
        reference: cleanRef,
        district: cleanDist,
      })

      if (res.ok && res.user) {
        setCurrentUser(res.user)
        setProfileSuccessMsg(
          "¡Tus datos y dirección de entrega han sido actualizados con éxito!",
        )
      } else {
        setProfileErrorMsg(res.error || "No se pudo actualizar el perfil.")
      }
    } catch {
      setProfileErrorMsg("Error de conexión al actualizar el perfil.")
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem("gone_customer")
    sessionStorage.removeItem("gone_current_user")
    setCurrentUser(null)
    setIsAuth(false)
    setCurrentTab("pedidos")
  }

  if (!isAuth || !currentUser) {
    return (
      <main
        style={{
          backgroundColor: "#f9f9f9",
          minHeight: "80vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <div
          style={{
            background: "#fff",
            padding: "3rem",
            width: "100%",
            maxWidth: authMode === "login" ? "400px" : "550px",
            borderTop: "4px solid #000",
            boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
            borderRadius: "4px",
            transition: "max-width 0.3s",
          }}
        >
          <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
            <button
              onClick={() => {
                setAuthMode("login")
                setError(false)
                setRegisterError("")
              }}
              style={{
                flex: 1,
                padding: "0.8rem",
                background: authMode === "login" ? "#000" : "#f5f5f5",
                color: authMode === "login" ? "#fff" : "#666",
                border: "none",
                fontWeight: "bold",
                cursor: "pointer",
                borderRadius: "4px",
              }}
            >
              INICIAR SESIÓN
            </button>
            <button
              onClick={() => {
                setAuthMode("register")
                setError(false)
                setRegisterError("")
              }}
              style={{
                flex: 1,
                padding: "0.8rem",
                background: authMode === "register" ? "#000" : "#f5f5f5",
                color: authMode === "register" ? "#fff" : "#666",
                border: "none",
                fontWeight: "bold",
                cursor: "pointer",
                borderRadius: "4px",
              }}
            >
              CREAR CUENTA
            </button>
          </div>

          {authMode === "login" ? (
            <form
              onSubmit={handleLogin}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.2rem",
                animation: "fadeIn 0.3s ease",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                    marginBottom: "0.5rem",
                    textTransform: "uppercase",
                  }}
                >
                  Correo Electrónico
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  style={{
                    width: "100%",
                    padding: "1rem",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
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
                    textTransform: "uppercase",
                  }}
                >
                  Contraseña
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  style={{
                    width: "100%",
                    padding: "1rem",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                  }}
                />
              </div>
              {error && (
                <small style={{ color: "#d32f2f", fontWeight: "bold" }}>
                  El correo o la contraseña son incorrectos.
                </small>
              )}
              <button
                style={{
                  background: "#000",
                  color: "#fff",
                  border: "none",
                  padding: "1rem",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  marginTop: "1rem",
                  borderRadius: "4px",
                }}
              >
                Entrar a mi cuenta
              </button>
            </form>
          ) : (
            <form
              onSubmit={handleRegister}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.2rem",
                animation: "fadeIn 0.3s ease",
              }}
            >
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 200px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                      marginBottom: "0.5rem",
                      textTransform: "uppercase",
                    }}
                  >
                    Nombres
                  </label>
                  <input
                    name="firstName"
                    required
                    style={{
                      width: "100%",
                      padding: "1rem",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                    }}
                  />
                </div>
                <div style={{ flex: "1 1 200px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                      marginBottom: "0.5rem",
                      textTransform: "uppercase",
                    }}
                  >
                    Apellidos
                  </label>
                  <input
                    name="lastName"
                    required
                    style={{
                      width: "100%",
                      padding: "1rem",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                    }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 200px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                      marginBottom: "0.5rem",
                      textTransform: "uppercase",
                    }}
                  >
                    DNI
                  </label>
                  <input
                    name="document"
                    required
                    maxLength={8}
                    pattern="\d{8}"
                    title="Ingresa los 8 dígitos de tu DNI"
                    style={{
                      width: "100%",
                      padding: "1rem",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                    }}
                  />
                </div>
                <div style={{ flex: "1 1 200px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                      marginBottom: "0.5rem",
                      textTransform: "uppercase",
                    }}
                  >
                    Teléfono
                  </label>
                  <input
                    name="phone"
                    required
                    type="tel"
                    style={{
                      width: "100%",
                      padding: "1rem",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                    }}
                  />
                </div>
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                    marginBottom: "0.5rem",
                    textTransform: "uppercase",
                  }}
                >
                  Dirección Completa
                </label>
                <input
                  name="address"
                  required
                  placeholder="Calle, número, departamento"
                  style={{
                    width: "100%",
                    padding: "1rem",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
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
                    textTransform: "uppercase",
                  }}
                >
                  Punto de Referencia (Opcional)
                </label>
                <input
                  name="reference"
                  placeholder="ej. Frente al parque, reja negra"
                  style={{
                    width: "100%",
                    padding: "1rem",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
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
                    textTransform: "uppercase",
                  }}
                >
                  Distrito
                </label>
                <select
                  name="district"
                  required
                  style={{
                    width: "100%",
                    padding: "1rem",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    backgroundColor: "#fff",
                  }}
                >
                  {LIMA_DISTRICTS.map((d) => (
                    <option key={d.code} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 200px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                      marginBottom: "0.5rem",
                      textTransform: "uppercase",
                    }}
                  >
                    Correo Electrónico
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    style={{
                      width: "100%",
                      padding: "1rem",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                    }}
                  />
                </div>
                <div style={{ flex: "1 1 200px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                      marginBottom: "0.5rem",
                      textTransform: "uppercase",
                    }}
                  >
                    Contraseña
                  </label>
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    style={{
                      width: "100%",
                      padding: "1rem",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                    }}
                  />
                </div>
              </div>
              {registerError && (
                <small style={{ color: "#d32f2f", fontWeight: "bold" }}>
                  {registerError}
                </small>
              )}

              {/* Checkbox Legal Obligatorio (Términos y Privacidad) */}
              <div
                style={{
                  marginTop: "0.5rem",
                  padding: "0.85rem 1rem",
                  backgroundColor: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: "4px",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    cursor: "pointer",
                    fontSize: "0.78rem",
                    color: "#374151",
                    lineHeight: 1.45,
                  }}
                >
                  <input
                    type="checkbox"
                    required
                    checked={registerAcceptedTerms}
                    onChange={(e) => setRegisterAcceptedTerms(e.target.checked)}
                    style={{
                      marginTop: "2px",
                      accentColor: "#000000",
                      width: "16px",
                      height: "16px",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  />
                  <span>
                    He leído y acepto los{" "}
                    <Link
                      to="/terminos"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#000000", fontWeight: 700, textDecoration: "underline" }}
                    >
                      Términos y Condiciones
                    </Link>{" "}
                    y la{" "}
                    <Link
                      to="/privacidad"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#000000", fontWeight: 700, textDecoration: "underline" }}
                    >
                      Política de Privacidad y Tratamiento de Datos Personales
                    </Link>
                    .
                  </span>
                </label>
              </div>

              <button
                style={{
                  background: "#000",
                  color: "#fff",
                  border: "none",
                  padding: "1rem",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  marginTop: "1rem",
                  borderRadius: "4px",
                }}
              >
                Registrarme de manera segura
              </button>
            </form>
          )}
        </div>
      </main>
    )
  }

  const displayOrders = transactions.filter(
    (t) =>
      (t.email || "").toLowerCase() === (currentUser.email || "").toLowerCase(),
  )

  return (
    <main
      style={{
        padding: "4rem 5%",
        minHeight: "80vh",
        display: "flex",
        flexDirection: "row",
        gap: "4rem",
        flexWrap: "wrap",
        fontFamily: '"Inter", sans-serif',
      }}
    >
      <aside style={{ flex: "1 1 250px", maxWidth: "300px" }}>
        <h1
          style={{
            fontSize: "2rem",
            textTransform: "uppercase",
            marginBottom: "0.5rem",
            letterSpacing: "-1px",
          }}
        >
          Mi Cuenta
        </h1>
        <p style={{ color: "#666", marginBottom: "2.5rem" }}>
          Hola, {currentUser.firstName}
        </p>
        <nav style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <button
            onClick={() => setCurrentTab("pedidos")}
            style={{
              textAlign: "left",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: currentTab === "pedidos" ? "bold" : "normal",
              color: currentTab === "pedidos" ? "#000" : "#666",
              textTransform: "uppercase",
              letterSpacing: "1px",
              transition: "color 0.2s",
            }}
          >
            Mis Pedidos
          </button>
          <button
            onClick={() => setCurrentTab("perfil")}
            style={{
              textAlign: "left",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: currentTab === "perfil" ? "bold" : "normal",
              color: currentTab === "perfil" ? "#000" : "#666",
              textTransform: "uppercase",
              letterSpacing: "1px",
              transition: "color 0.2s",
            }}
          >
            Mi Perfil
          </button>
          <button
            onClick={handleLogout}
            style={{
              textAlign: "left",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "0.9rem",
              color: "#d32f2f",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginTop: "2rem",
            }}
          >
            Cerrar Sesión
          </button>
        </nav>
      </aside>

      <section style={{ flex: "2 1 500px" }}>
        {currentTab === "pedidos" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <h2
              style={{
                fontSize: "1.5rem",
                textTransform: "uppercase",
                marginBottom: "2rem",
                borderBottom: "1px solid #eee",
                paddingBottom: "1rem",
              }}
            >
              Historial de Compras
            </h2>
            {displayOrders.length === 0 ? (
              <div
                style={{
                  padding: "3rem",
                  textAlign: "center",
                  background: "#f9f9f9",
                  borderRadius: "8px",
                  border: "1px dashed #ccc",
                }}
              >
                <p style={{ color: "#666", marginBottom: "1rem" }}>
                  No tienes pedidos recientes con el correo {currentUser.email}.
                </p>
                <button
                  onClick={() => navigate("/shop")}
                  className="black-button"
                  style={{ padding: "0.8rem 2rem", width: "auto" }}
                >
                  Ir a la tienda
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.5rem",
                }}
              >
                {displayOrders.map((o, i) => {
                  const status = o.status || "Procesando"
                  const statusColor =
                    status === "Entregado"
                      ? "#2e7d32"
                      : status === "Enviado"
                        ? "#0277bd"
                        : status === "Cancelado"
                          ? "#c62828"
                          : "#e65100"
                  const statusBg =
                    status === "Entregado"
                      ? "#e8f5e9"
                      : status === "Enviado"
                        ? "#e3f2fd"
                        : status === "Cancelado"
                          ? "#ffebee"
                          : "#fff3e0"
                  return (
                    <div
                      key={o.id || i}
                      style={{
                        border: "1px solid #eee",
                        borderRadius: "8px",
                        padding: "1.5rem",
                        background: "#fff",
                        transition: "box-shadow 0.2s",
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.boxShadow =
                          "0 4px 15px rgba(0,0,0,0.05)")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.boxShadow = "none")
                      }
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: "1rem",
                          marginBottom: "1rem",
                          borderBottom: "1px solid #f5f5f5",
                          paddingBottom: "1rem",
                        }}
                      >
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "0.65rem",
                              color: "#888",
                              textTransform: "uppercase",
                              letterSpacing: "1px",
                              marginBottom: "4px",
                            }}
                          >
                            Orden
                          </span>
                          <strong style={{ fontSize: "0.9rem" }}>{o.id}</strong>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "0.65rem",
                              color: "#888",
                              textTransform: "uppercase",
                              letterSpacing: "1px",
                              marginBottom: "4px",
                            }}
                          >
                            Fecha
                          </span>
                          <strong style={{ fontSize: "0.9rem" }}>
                            {new Date(o.date).toLocaleDateString("es-PE")}
                          </strong>
                        </div>
                        <div>
                          <span
                            style={{
                              display: "block",
                              fontSize: "0.65rem",
                              color: "#888",
                              textTransform: "uppercase",
                              letterSpacing: "1px",
                              marginBottom: "4px",
                            }}
                          >
                            Total
                          </span>
                          <strong style={{ fontSize: "0.9rem" }}>
                            {money(o.total)}
                          </strong>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span
                            style={{
                              display: "block",
                              fontSize: "0.65rem",
                              color: "#888",
                              textTransform: "uppercase",
                              letterSpacing: "1px",
                              marginBottom: "4px",
                            }}
                          >
                            Estado
                          </span>
                          <span
                            style={{
                              background: statusBg,
                              color: statusColor,
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "0.75rem",
                              fontWeight: "bold",
                            }}
                          >
                            {status}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span
                          style={{
                            fontSize: "0.85rem",
                            color: "#555",
                            lineHeight: "1.5",
                          }}
                        >
                          {o.detail}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
        {currentTab === "perfil" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div
              style={{
                marginBottom: "2rem",
                borderBottom: "1px solid #eee",
                paddingBottom: "1rem",
              }}
            >
              <h2
                style={{
                  fontSize: "1.5rem",
                  textTransform: "uppercase",
                  margin: 0,
                }}
              >
                Mi Perfil y Dirección de Entrega
              </h2>
              <p
                style={{
                  color: "#666",
                  fontSize: "0.85rem",
                  margin: "0.4rem 0 0 0",
                }}
              >
                Actualiza tus datos y punto de entrega para agilizar tus futuras compras.
              </p>
            </div>

            {profileSuccessMsg && (
              <div
                style={{
                  background: "#e8f5e9",
                  color: "#2e7d32",
                  padding: "1rem 1.5rem",
                  borderRadius: "4px",
                  fontWeight: "bold",
                  fontSize: "0.85rem",
                  marginBottom: "1.5rem",
                  border: "1px solid #a5d6a7",
                }}
              >
                ✓ {profileSuccessMsg}
              </div>
            )}

            {profileErrorMsg && (
              <div
                style={{
                  background: "#ffebee",
                  color: "#c62828",
                  padding: "1rem 1.5rem",
                  borderRadius: "4px",
                  fontWeight: "bold",
                  fontSize: "0.85rem",
                  marginBottom: "1.5rem",
                  border: "1px solid #ef9a9a",
                }}
              >
                ⚠ {profileErrorMsg}
              </div>
            )}

            <form
              onSubmit={handleUpdateProfile}
              style={{
                background: "#fff",
                border: "1px solid #eee",
                borderRadius: "8px",
                padding: "2rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                    marginBottom: "0.5rem",
                    textTransform: "uppercase",
                    color: "#888",
                  }}
                >
                  Correo Electrónico (Identificador de Cuenta)
                </label>
                <input
                  type="email"
                  value={currentUser.email}
                  disabled
                  style={{
                    width: "100%",
                    padding: "0.9rem 1rem",
                    border: "1px solid #eee",
                    borderRadius: "4px",
                    backgroundColor: "#f5f5f5",
                    color: "#777",
                    cursor: "not-allowed",
                    fontSize: "0.9rem",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 200px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                      marginBottom: "0.5rem",
                      textTransform: "uppercase",
                    }}
                  >
                    Nombres *
                  </label>
                  <input
                    name="firstName"
                    required
                    value={profileFirstName}
                    onChange={(e) => setProfileFirstName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.9rem 1rem",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      fontSize: "0.9rem",
                    }}
                  />
                </div>
                <div style={{ flex: "1 1 200px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                      marginBottom: "0.5rem",
                      textTransform: "uppercase",
                    }}
                  >
                    Apellidos *
                  </label>
                  <input
                    name="lastName"
                    required
                    value={profileLastName}
                    onChange={(e) => setProfileLastName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.9rem 1rem",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      fontSize: "0.9rem",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 200px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                      marginBottom: "0.5rem",
                      textTransform: "uppercase",
                    }}
                  >
                    Documento de Identidad (DNI)
                  </label>
                  <input
                    name="document"
                    maxLength={8}
                    placeholder="8 dígitos"
                    value={profileDocument}
                    onChange={(e) => setProfileDocument(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.9rem 1rem",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      fontSize: "0.9rem",
                    }}
                  />
                </div>
                <div style={{ flex: "1 1 200px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                      marginBottom: "0.5rem",
                      textTransform: "uppercase",
                    }}
                  >
                    Teléfono de Contacto
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    placeholder="ej. 987654321"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.9rem 1rem",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      fontSize: "0.9rem",
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                    marginBottom: "0.5rem",
                    textTransform: "uppercase",
                  }}
                >
                  Dirección de Entrega
                </label>
                <input
                  name="address"
                  placeholder="Calle, jirón, avenida, número y dpto"
                  value={profileAddress}
                  onChange={(e) => setProfileAddress(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.9rem 1rem",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "0.9rem",
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
                    textTransform: "uppercase",
                  }}
                >
                  Punto de Referencia (Punto de entrega)
                </label>
                <input
                  name="reference"
                  placeholder="ej. Frente al parque, casa blanca con rejas negras"
                  value={profileReference}
                  onChange={(e) => setProfileReference(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.9rem 1rem",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "0.9rem",
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
                    textTransform: "uppercase",
                  }}
                >
                  Distrito Predeterminado
                </label>
                <select
                  name="district"
                  value={profileDistrict}
                  onChange={(e) => setProfileDistrict(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.9rem 1rem",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    backgroundColor: "#fff",
                    fontSize: "0.9rem",
                  }}
                >
                  {LIMA_DISTRICTS.map((d) => (
                    <option key={d.code} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginTop: "1rem" }}>
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  style={{
                    background: "#000",
                    color: "#fff",
                    border: "none",
                    padding: "1rem 2.5rem",
                    fontWeight: "bold",
                    fontSize: "0.85rem",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    cursor: isUpdatingProfile ? "not-allowed" : "pointer",
                    borderRadius: "4px",
                    opacity: isUpdatingProfile ? 0.7 : 1,
                    transition: "opacity 0.2s",
                  }}
                >
                  {isUpdatingProfile ? "GUARDANDO CAMBIOS..." : "ACTUALIZAR PERFIL"}
                </button>
              </div>
            </form>
          </div>
        )}
      </section>
    </main>
  )
}
