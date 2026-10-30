import {
  type FormEvent,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react"
import { useNavigate, Link } from "react-router-dom"
import {
  useStore,
  getCurrentSessionUser,
  type OrderDetailsInput,
  type Size,
} from "./store"
import { api, type OrderTransaction } from "./services/api"
import {
  validateDocument,
  validateEmail,
  validatePhone,
  sanitizeString,
} from "./utils/security"
import { calculateOrderAmounts, formatPEN } from "./utils/accounting"
import { type DistrictInfo, LIMA_DISTRICTS } from "./utils/districts"
import YapeModal from "./components/checkout/YapeModal"
import OrderConfirmation from "./components/checkout/OrderConfirmation"

const money = (value: number) => formatPEN(value)

/**
 * Constante global del número de atención / WhatsApp de la tienda
 * Fácil de cambiar por el número real
 */
export const STORE_PHONE = "9999888777"
export type { DistrictInfo }
export { LIMA_DISTRICTS }

export type PaymentMethod = "tarjeta" | "yape_plin" | "efectivo"

interface ConfirmedOrderState extends OrderDetailsInput {
  id: string
  number: string
  total: number
  subtotal: number
  paymentMethod: PaymentMethod
}

export default function Checkout() {
  const store = useStore()
  const products = store?.products ?? []
  const cart = store?.cart ?? []
  const users = store?.users ?? []
  const completeOrder = store?.completeOrder
  const changeQuantity = store?.changeQuantity
  const removeFromCart = store?.removeFromCart
  const isLoadingProducts = store?.isLoadingProducts ?? false

  const navigate = useNavigate()

  const [hasError, setHasError] = useState(false)
  const [validationError, setValidationError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isAuth =
    sessionStorage.getItem("gone_customer") === "true" &&
    Boolean(getCurrentSessionUser())

  const handleRemoveItem = useCallback(
    (productId: string, size?: Size) => {
      if (removeFromCart) {
        removeFromCart(productId, size)
      } else if (changeQuantity) {
        const item = cart.find(
          (i) => i.productId === productId && (!size || i.size === size),
        )
        if (item) changeQuantity(productId, item.size, -item.quantity)
      }
      setValidationError("")
    },
    [removeFromCart, changeQuantity, cart],
  )

  // Auto-limpieza silenciosa de productos huérfanos que no existen en el catálogo
  useEffect(() => {
    if (isLoadingProducts) return
    if (!cart.length) return

    const orphans = cart.filter(
      (item) => !products.some((p) => p.id === item.productId),
    )

    if (orphans.length > 0) {
      console.warn(
        "[Checkout] Limpiando automáticamente productos no disponibles del carrito:",
        orphans.map((o) => o.productId),
      )
      orphans.forEach((orphan) => {
        handleRemoveItem(orphan.productId, orphan.size)
      })
    }
  }, [isLoadingProducts, products, cart, handleRemoveItem])

  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">(
    "standard",
  )
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("tarjeta")
  const [showYapeModal, setShowYapeModal] = useState(false)
  const [pendingYapeOrder, setPendingYapeOrder] =
    useState<ConfirmedOrderState | null>(null)
  const [documentType, setDocumentType] = useState<"DNI" | "CE">("DNI")
  const [selectedDistrictName, setSelectedDistrictName] = useState(
    isAuth ? "Punta Negra" : "San Bartolo",
  )
  const [orderConfirmed, setOrderConfirmed] =
    useState<ConfirmedOrderState | null>(null)

  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [reference, setReference] = useState("")
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [documentNumber, setDocumentNumber] = useState("")

  useEffect(() => {
    if (isAuth) {
      try {
        const storedUser = getCurrentSessionUser()
        if (storedUser) {
          setFirstName(storedUser.firstName || "")
          setLastName(storedUser.lastName || "")
          setEmail(storedUser.email || "")
          setPhone(storedUser.phone || "")
          setAddress(storedUser.address || "")
          setReference(storedUser.reference || "")
          setDocumentNumber(storedUser.document || "")
          if (
            storedUser.documentType === "DNI" ||
            storedUser.documentType === "CE"
          ) {
            setDocumentType(storedUser.documentType)
          }
          if (
            storedUser.district &&
            LIMA_DISTRICTS.some((d) => d.name === storedUser.district)
          ) {
            setSelectedDistrictName(storedUser.district)
          }
        }
      } catch (err) {
        console.error("Error al recuperar usuario en sesión:", err)
      }
    }
  }, [isAuth])

  const emailHasExistingAccount = useMemo(() => {
    try {
      const clean = email.trim().toLowerCase()
      if (!clean) return false
      return users.some((u) => (u?.email || "").toLowerCase() === clean)
    } catch {
      return false
    }
  }, [email, users])

  // SUNAT Perú Integer Cents Accounting calculation strictly from catalog
  const accounting = useMemo(() => {
    return calculateOrderAmounts(cart, products, shippingMethod)
  }, [cart, products, shippingMethod])

  if (hasError) {
    return (
      <div style={{ padding: "4rem", textAlign: "center" }}>
        <h2>Ups, ocurrió un inconveniente al cargar el checkout.</h2>
        <button
          onClick={() => {
            setHasError(false)
            navigate("/shop")
          }}
          className="black-button"
          style={{ marginTop: "1.5rem", width: "auto", padding: "1rem 2rem" }}
        >
          Volver a la tienda
        </button>
      </div>
    )
  }

  // Pantalla de sincronización mientras los productos cargan de DynamoDB (evita race conditions)
  if (isLoadingProducts) {
    return (
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          padding: "2rem",
          fontFamily: '"Barlow Condensed", sans-serif',
        }}
      >
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: "bold",
            color: "#888",
            letterSpacing: "2px",
            textTransform: "uppercase",
            marginBottom: "1rem",
          }}
        >
          GONE SURFING / CHECKOUT
        </span>
        <h2
          style={{
            fontSize: "2.2rem",
            textTransform: "uppercase",
            margin: "0 0 1rem 0",
          }}
        >
          Sincronizando inventario con la tienda...
        </h2>
        <p style={{ color: "#666", fontSize: "0.95rem" }}>
          Verificando disponibilidad de tu selección en tiempo real.
        </p>
      </section>
    )
  }

  // No redirigir ni expulsar al usuario si se está procesando, completando o si el modal Yape está abierto
  if (
    !cart.length &&
    !orderConfirmed &&
    !showYapeModal &&
    !pendingYapeOrder &&
    !isSubmitting
  ) {
    return (
      <section
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          padding: "2rem",
        }}
      >
        <span
          style={{
            fontSize: "0.75rem",
            fontWeight: "bold",
            color: "#666",
            letterSpacing: "1px",
          }}
        >
          TU PRÓXIMA OLA TE ESPERA
        </span>
        <h1
          style={{
            fontSize: "2.5rem",
            textTransform: "uppercase",
            margin: "1rem 0",
          }}
        >
          Tu bolsa está vacía.
        </h1>
        <p style={{ color: "#888", marginBottom: "2rem" }}>
          Añade tus favoritos antes de continuar al checkout.
        </p>
        <Link
          to="/shop"
          style={{
            padding: "1rem 2rem",
            background: "#000",
            color: "#fff",
            textDecoration: "none",
            fontWeight: "bold",
            borderRadius: "4px",
          }}
        >
          EXPLORAR EL DROP <span>→</span>
        </Link>
      </section>
    )
  }

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setValidationError("")
    setIsSubmitting(true)

    try {
      if (!completeOrder) {
        setValidationError("El sistema de tienda no está inicializado.")
        return
      }

      if (!acceptedTerms) {
        setValidationError(
          "Debes leer y aceptar los Términos y Condiciones y la Política de Privacidad para continuar con tu compra.",
        )
        return
      }

      // Security validations
      const cleanEmail = sanitizeString(email)
      if (!validateEmail(cleanEmail)) {
        setValidationError("Por favor ingresa un correo electrónico válido.")
        return
      }

      const cleanDoc = sanitizeString(documentNumber)
      const docCheck = validateDocument(documentType, cleanDoc)
      if (!docCheck.valid) {
        setValidationError(
          docCheck.error || "Documento de identidad no válido.",
        )
        return
      }

      const cleanPhone = sanitizeString(phone)
      if (!validatePhone(cleanPhone)) {
        setValidationError(
          "Por favor ingresa un número de teléfono válido (mínimo 7 dígitos).",
        )
        return
      }

      const cleanFirst = sanitizeString(firstName)
      const cleanLast = sanitizeString(lastName)
      const cleanAddr = sanitizeString(address)
      const cleanRef = sanitizeString(reference)
      if (!cleanFirst || !cleanLast || !cleanAddr) {
        setValidationError(
          "Por favor completa tu nombre, apellidos y dirección de entrega.",
        )
        return
      }

      if (isLoadingProducts) {
        setValidationError(
          "Sincronizando inventario con la tienda. Por favor espera un momento e intenta nuevamente.",
        )
        return
      }

      // Auto-limpieza y verificación de productos huérfanos que ya no existen en la BD
      const invalidItems = cart.filter(
        (item) => !products.some((p) => p.id === item.productId),
      )
      if (invalidItems.length > 0) {
        invalidItems.forEach((inv) => handleRemoveItem(inv.productId, inv.size))
        setValidationError(
          "Uno o más productos en tu bolsa ya no están disponibles en la tienda y fueron retirados automáticamente. Por favor revisa tu pedido.",
        )
        return
      }

      // Verify stock availability
      for (const item of cart) {
        const prod = products.find((p) => p.id === item.productId)
        if (!prod) {
          handleRemoveItem(item.productId, item.size)
          setValidationError(
            "Un producto no disponible ha sido retirado de tu bolsa. Por favor revisa tu pedido.",
          )
          return
        }
        const available = prod.stocks[item.size] ?? 0
        if (available < item.quantity) {
          setValidationError(
            `Stock insuficiente para "${prod.name}" en talla ${item.size}. Disponible: ${available}.`,
          )
          return
        }
      }

      const districtObj =
        LIMA_DISTRICTS.find((d) => d.name === selectedDistrictName) ||
        LIMA_DISTRICTS[0]

      const details: OrderDetailsInput = {
        customer: `${cleanFirst} ${cleanLast}`.trim(),
        documentType,
        document: cleanDoc,
        email: cleanEmail,
        phone: cleanPhone,
        districtCode: districtObj.code,
        districtName: districtObj.name,
        districtX: districtObj.x,
        districtY: districtObj.y,
        address: cleanAddr,
        reference: cleanRef,
        isGuest: !isAuth,
        shippingMethod,
        paymentMethod,
        shipping: accounting.shipping,
        total: accounting.total,
        subtotal: accounting.subtotal,
        items: cart.map((i) => ({ ...i })),
      }

      // Invocación al endpoint de Backend DynamoDB (/orders)
      const apiUrl = (
        import.meta.env.VITE_API_URL ||
        import.meta.env.VITE_AWS_API_GATEWAY_URL ||
        ""
      ).replace(/\/$/, "")

      console.log(
        `[Checkout] Registrando orden en API (${apiUrl || "modo local"})...`,
        details,
      )

      let savedOrder: OrderTransaction

      if (apiUrl) {
        const response = await fetch(`${apiUrl}/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(details),
        })

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}))
          console.error(
            `[Checkout] Error HTTP ${response.status} en POST /orders:`,
            errBody,
          )
          throw new Error(
            errBody.message ||
              `Error al registrar el pedido en el servidor (HTTP ${response.status})`,
          )
        }

        savedOrder = await response.json()
        console.log(
          "[Checkout] Orden registrada exitosamente en DynamoDB:",
          savedOrder,
        )
      } else {
        // Fallback al servicio API
        savedOrder = await api.orders.create(details, products)
      }

      // PASO 4: Preparar estado y mostrar el Modal QR / Pantalla de éxito
      const confirmedData: ConfirmedOrderState = {
        ...details,
        id: savedOrder.id,
        number: savedOrder.id,
        total: savedOrder.total || accounting.total,
        subtotal: savedOrder.subtotal || accounting.subtotal,
        paymentMethod,
      }

      if (paymentMethod === "yape_plin") {
        setPendingYapeOrder(confirmedData)
        setShowYapeModal(true)
      } else {
        setOrderConfirmed(confirmedData)
      }

      // PASO 5: SOLO ENTONCES registrar en store y limpiar el carrito
      completeOrder(details, savedOrder)
    } catch (err: any) {
      console.error("[Checkout] Error crítico procesando orden:", err)
      const msg = err?.message || ""
      const match = msg.match(/Producto con ID ([\w-]+) no encontrado/i)
      const orphanId = match ? match[1] : null

      if (orphanId) {
        handleRemoveItem(orphanId)
        setValidationError(
          `El producto no disponible (ID: ${orphanId}) fue retirado de tu bolsa. Por favor verifica tu pedido y vuelve a presionar Pagar.`,
        )
      } else {
        setValidationError(
          msg ||
            "Error al procesar el pedido. Verifica el stock disponible en la tienda o tu conexión a internet.",
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (orderConfirmed) {
    return (
      <OrderConfirmation
        order={orderConfirmed}
        products={products}
        storePhone={STORE_PHONE}
      />
    )
  }

  return (
    <section
      className="checkout-page-section"
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#fff",
        color: "#000",
        fontFamily: '"Inter", -apple-system, sans-serif',
      }}
    >
      <div
        className="checkout-main-col"
        style={{ flex: "1 1 60%", padding: "4rem 8%", overflowY: "auto" }}
      >
        <Link
          to="/shop"
          style={{
            fontSize: "0.8rem",
            color: "#666",
            textDecoration: "none",
            marginBottom: "2rem",
            display: "inline-block",
            fontWeight: "bold",
          }}
        >
          ← VOLVER A LA TIENDA
        </Link>
        <p
          style={{
            fontSize: "0.75rem",
            textTransform: "uppercase",
            letterSpacing: "1px",
            color: "#666",
            fontWeight: 600,
            marginBottom: "1rem",
          }}
        >
          UN PASO MÁS CERCA DEL OCÉANO
        </p>
        <h1
          className="checkout-title"
          style={{
            fontSize: "3.5rem",
            fontWeight: 600,
            letterSpacing: "-1px",
            margin: "0 0 2rem 0",
          }}
        >
          Tu próxima ola.
        </h1>
        <div
          className="checkout-steps"
          style={{
            display: "flex",
            gap: "2rem",
            fontSize: "0.75rem",
            fontWeight: "bold",
            color: "#aaa",
            marginBottom: "3rem",
            borderBottom: "1px solid #eee",
            paddingBottom: "1rem",
          }}
        >
          <span style={{ color: "#000" }}>01 CONTACTO</span>
          <span>02 ENVÍO</span>
          <span>03 PAGO</span>
        </div>

        {validationError && (
          <div
            style={{
              background: "#ffebee",
              color: "#c62828",
              padding: "1rem 1.25rem",
              borderRadius: "4px",
              borderLeft: "4px solid #c62828",
              marginBottom: "2rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <span style={{ fontSize: "0.85rem", fontWeight: "bold", flex: 1 }}>
              {validationError}
            </span>
            {cart.some(
              (item) => !products.some((p) => p.id === item.productId),
            ) && (
              <button
                type="button"
                onClick={() => {
                  cart
                    .filter(
                      (item) => !products.some((p) => p.id === item.productId),
                    )
                    .forEach((orphan) =>
                      handleRemoveItem(orphan.productId, orphan.size),
                    )
                }}
                className="black-button"
                style={{
                  width: "auto",
                  padding: "0.5rem 1rem",
                  fontSize: "0.75rem",
                  backgroundColor: "#c62828",
                  borderColor: "#c62828",
                  whiteSpace: "nowrap",
                }}
              >
                Eliminar producto no disponible
              </button>
            )}
          </div>
        )}

        <form
          id="checkout-form"
          onSubmit={submit}
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          <div style={{ marginBottom: "1.5rem" }}>
            <h2
              style={{
                fontSize: "1.2rem",
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <span style={{ color: "#999", fontSize: "0.9rem" }}>01</span>{" "}
              Información de Contacto
            </h2>
            <label
              style={{
                display: "block",
                fontSize: "0.75rem",
                color: "#666",
                marginBottom: "0.5rem",
              }}
            >
              Correo electrónico
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "1rem",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "0.9rem",
                marginBottom: "0.5rem",
              }}
            />

            {!isAuth && emailHasExistingAccount && (
              <div
                style={{
                  background: "#f9f9f9",
                  padding: "1rem",
                  borderLeft: "4px solid #000",
                  marginTop: "0.5rem",
                  marginBottom: "1rem",
                  fontSize: "0.8rem",
                  animation: "fadeIn 0.3s ease",
                }}
              >
                <p style={{ margin: "0 0 0.5rem 0", color: "#333" }}>
                  Parece que ya tienes una cuenta con nosotros.
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: "1rem",
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => navigate("/profile?mode=login")}
                    style={{
                      background: "transparent",
                      border: "none",
                      fontWeight: "bold",
                      textDecoration: "underline",
                      cursor: "pointer",
                      padding: 0,
                      color: "#000",
                    }}
                  >
                    Iniciar sesión para un pago rápido
                  </button>
                  <span style={{ color: "#888", fontStyle: "italic" }}>
                    o continúa tu compra como invitado abajo
                  </span>
                </div>
              </div>
            )}

            <p
              style={{
                fontSize: "0.7rem",
                color: "#888",
                margin: "0 0 1rem 0",
              }}
            >
              Aquí enviaremos tu boleta electrónica y el tiempo estimado de
              envío
            </p>
            {!isAuth && (
              <button
                type="button"
                onClick={() => navigate("/profile?mode=login")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#000",
                  fontSize: "0.85rem",
                  fontWeight: "bold",
                  cursor: "pointer",
                  padding: 0,
                  textDecoration: "underline",
                }}
              >
                ¿Ya tienes cuenta? Inicia sesión ↗
              </button>
            )}
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <h2
              style={{
                fontSize: "1.2rem",
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <span style={{ color: "#999", fontSize: "0.9rem" }}>02</span>{" "}
              Dirección de Envío
            </h2>
            <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    color: "#666",
                    marginBottom: "0.5rem",
                  }}
                >
                  Nombre
                </label>
                <input
                  name="firstName"
                  required
                  placeholder="Tu nombre"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "1rem",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "0.9rem",
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    color: "#666",
                    marginBottom: "0.5rem",
                  }}
                >
                  Apellidos
                </label>
                <input
                  name="lastName"
                  required
                  placeholder="Tus apellidos"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "1rem",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "0.9rem",
                  }}
                />
              </div>
            </div>
            <div
              className="checkout-row-2col"
              style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}
            >
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    color: "#666",
                    marginBottom: "0.5rem",
                  }}
                >
                  Tipo de Documento
                </label>
                <select
                  value={documentType}
                  onChange={(e) =>
                    setDocumentType(e.target.value as "DNI" | "CE")
                  }
                  style={{
                    width: "100%",
                    padding: "1rem",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "0.9rem",
                    backgroundColor: "#fff",
                  }}
                >
                  <option value="DNI">DNI (8 dígitos)</option>
                  <option value="CE">CE (Carné Extranjería)</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    color: "#666",
                    marginBottom: "0.5rem",
                  }}
                >
                  Número de Documento
                </label>
                <input
                  name="documentNumber"
                  required
                  placeholder={
                    documentType === "DNI" ? "8 dígitos" : "9 a 12 dígitos"
                  }
                  maxLength={documentType === "DNI" ? 8 : 12}
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "1rem",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "0.9rem",
                  }}
                />
              </div>
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  color: "#666",
                  marginBottom: "0.5rem",
                }}
              >
                Dirección completa
              </label>
              <input
                name="address"
                required
                placeholder="Calle, número, departamento"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                style={{
                  width: "100%",
                  padding: "1rem",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "0.9rem",
                }}
              />
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  color: "#666",
                  marginBottom: "0.5rem",
                }}
              >
                Punto de Referencia (ej. Frente al parque, portón azul)
              </label>
              <input
                name="reference"
                placeholder="Punto de Referencia (ej. Frente al parque)"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                style={{
                  width: "100%",
                  padding: "1rem",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "0.9rem",
                }}
              />
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  color: "#666",
                  marginBottom: "0.5rem",
                }}
              >
                Distrito (Lima Metropolitana)
              </label>
              <select
                name="district"
                value={selectedDistrictName}
                onChange={(e) => setSelectedDistrictName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "1rem",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "0.9rem",
                  backgroundColor: "#fff",
                }}
              >
                {LIMA_DISTRICTS.map((d) => (
                  <option key={d.code} value={d.name}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  color: "#666",
                  marginBottom: "0.5rem",
                }}
              >
                Teléfono
              </label>
              <input
                name="phone"
                required
                type="tel"
                placeholder="Ej. 999 999 999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{
                  width: "100%",
                  padding: "1rem",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "0.9rem",
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <h2
              style={{
                fontSize: "1.2rem",
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              Métodos de Envío
            </h2>
            <label
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "1.5rem",
                border:
                  shippingMethod === "standard"
                    ? "1px solid #000"
                    : "1px solid #ddd",
                borderRadius: "4px",
                backgroundColor:
                  shippingMethod === "standard" ? "#fcfdfb" : "#fff",
                cursor: "pointer",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "1rem" }}
              >
                <input
                  type="radio"
                  name="shipping"
                  value="standard"
                  checked={shippingMethod === "standard"}
                  onChange={() => setShippingMethod("standard")}
                  style={{ accentColor: "#000" }}
                />
                <div>
                  <strong style={{ display: "block", fontSize: "0.9rem" }}>
                    Envío Estándar
                  </strong>
                  <span style={{ fontSize: "0.75rem", color: "#666" }}>
                    3-5 días hábiles
                  </span>
                </div>
              </div>
              <strong>
                {accounting.itemsTotalCents >= 30000 ? "Gratis" : money(15)}
              </strong>
            </label>
            <label
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "1.5rem",
                border:
                  shippingMethod === "express"
                    ? "1px solid #000"
                    : "1px solid #ddd",
                borderRadius: "4px",
                backgroundColor:
                  shippingMethod === "express" ? "#fcfdfb" : "#fff",
                cursor: "pointer",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "1rem" }}
              >
                <input
                  type="radio"
                  name="shipping"
                  value="express"
                  checked={shippingMethod === "express"}
                  onChange={() => setShippingMethod("express")}
                  style={{ accentColor: "#000" }}
                />
                <div>
                  <strong style={{ display: "block", fontSize: "0.9rem" }}>
                    Envío Express
                  </strong>
                  <span style={{ fontSize: "0.75rem", color: "#666" }}>
                    24 horas
                  </span>
                </div>
              </div>
              <strong>{money(30)}</strong>
            </label>
          </div>

          <div>
            <h2
              style={{
                fontSize: "1.2rem",
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "1rem",
              }}
            >
              <span style={{ color: "#999", fontSize: "0.9rem" }}>03</span>{" "}
              Método de Pago
            </h2>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                marginBottom: "1.5rem",
              }}
            >
              {/* Opción 1: Tarjeta */}
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "1rem 1.25rem",
                  border: "1px solid",
                  borderColor: paymentMethod === "tarjeta" ? "#000" : "#ddd",
                  borderRadius: "4px",
                  cursor: "pointer",
                  backgroundColor:
                    paymentMethod === "tarjeta" ? "#fbfbfb" : "#fff",
                  transition: "all 0.2s ease",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                  }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="tarjeta"
                    checked={paymentMethod === "tarjeta"}
                    onChange={() => setPaymentMethod("tarjeta")}
                    style={{ accentColor: "#000" }}
                  />
                  <div>
                    <strong style={{ display: "block", fontSize: "0.9rem" }}>
                      Tarjeta de Crédito / Débito (Pasarela Segura)
                    </strong>
                    <span style={{ fontSize: "0.75rem", color: "#666" }}>
                      Visa, Mastercard, American Express
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <span
                    style={{
                      fontSize: "0.65rem",
                      background: "#eee",
                      padding: "2px 6px",
                      borderRadius: "3px",
                      fontWeight: "bold",
                    }}
                  >
                    VISA
                  </span>
                  <span
                    style={{
                      fontSize: "0.65rem",
                      background: "#eee",
                      padding: "2px 6px",
                      borderRadius: "3px",
                      fontWeight: "bold",
                    }}
                  >
                    MC
                  </span>
                </div>
              </label>

              {/* Opción 2: Yape / Plin */}
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "1rem 1.25rem",
                  border: "1px solid",
                  borderColor: paymentMethod === "yape_plin" ? "#000" : "#ddd",
                  borderRadius: "4px",
                  cursor: "pointer",
                  backgroundColor:
                    paymentMethod === "yape_plin" ? "#fbfbfb" : "#fff",
                  transition: "all 0.2s ease",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                  }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="yape_plin"
                    checked={paymentMethod === "yape_plin"}
                    onChange={() => setPaymentMethod("yape_plin")}
                    style={{ accentColor: "#000" }}
                  />
                  <div>
                    <strong style={{ display: "block", fontSize: "0.9rem" }}>
                      Yape / Plin (QR o transferencia)
                    </strong>
                    <span style={{ fontSize: "0.75rem", color: "#666" }}>
                      Pago móvil instantáneo sin comisiones
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <span
                    style={{
                      fontSize: "0.65rem",
                      background: "#742284",
                      color: "#fff",
                      padding: "2px 6px",
                      borderRadius: "3px",
                      fontWeight: "bold",
                    }}
                  >
                    YAPE
                  </span>
                  <span
                    style={{
                      fontSize: "0.65rem",
                      background: "#00a1df",
                      color: "#fff",
                      padding: "2px 6px",
                      borderRadius: "3px",
                      fontWeight: "bold",
                    }}
                  >
                    PLIN
                  </span>
                </div>
              </label>

              {/* Opción 3: Pago contra entrega */}
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "1rem 1.25rem",
                  border: "1px solid",
                  borderColor: paymentMethod === "efectivo" ? "#000" : "#ddd",
                  borderRadius: "4px",
                  cursor: "pointer",
                  backgroundColor:
                    paymentMethod === "efectivo" ? "#fbfbfb" : "#fff",
                  transition: "all 0.2s ease",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                  }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="efectivo"
                    checked={paymentMethod === "efectivo"}
                    onChange={() => setPaymentMethod("efectivo")}
                    style={{ accentColor: "#000" }}
                  />
                  <div>
                    <strong style={{ display: "block", fontSize: "0.9rem" }}>
                      Pago contra entrega (Efectivo)
                    </strong>
                    <span style={{ fontSize: "0.75rem", color: "#666" }}>
                      Paga al recibir en tu domicilio
                    </span>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: "0.65rem",
                    background: "#e8f5e9",
                    color: "#2e7d32",
                    padding: "2px 6px",
                    borderRadius: "3px",
                    fontWeight: "bold",
                  }}
                >
                  EFECTIVO
                </span>
              </label>
            </div>

            {/* Mensajes informativos según selección */}
            {paymentMethod === "yape_plin" && (
              <div
                style={{
                  backgroundColor: "#f5eff7",
                  border: "1px solid #d8bfd8",
                  borderRadius: "4px",
                  padding: "1.25rem",
                  marginBottom: "1.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#742284"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <rect x="7" y="7" width="3" height="3" />
                  <rect x="14" y="7" width="3" height="3" />
                  <rect x="7" y="14" width="3" height="3" />
                  <rect x="14" y="14" width="3" height="3" />
                </svg>
                <div>
                  <strong
                    style={{
                      display: "block",
                      fontSize: "0.85rem",
                      color: "#111",
                    }}
                  >
                    Al confirmar, te mostraremos el QR para el pago.
                  </strong>
                  <span style={{ fontSize: "0.75rem", color: "#666" }}>
                    Podrás escanearlo con Yape o Plin desde tu celular para
                    validar tu pedido de inmediato.
                  </span>
                </div>
              </div>
            )}

            {paymentMethod === "efectivo" && (
              <div
                style={{
                  backgroundColor: "#eef7ee",
                  border: "1px solid #c8e6c9",
                  borderRadius: "4px",
                  padding: "1.25rem",
                  marginBottom: "1.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#2e7d32"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="6" width="20" height="12" rx="2" />
                  <circle cx="12" cy="12" r="2" />
                  <path d="M6 12h.01M18 12h.01" />
                </svg>
                <div>
                  <strong
                    style={{
                      display: "block",
                      fontSize: "0.85rem",
                      color: "#111",
                    }}
                  >
                    Pagarás al recibir tu pedido.
                  </strong>
                  <span style={{ fontSize: "0.75rem", color: "#666" }}>
                    Ten listo el monto en efectivo o solicita pagar con POS
                    móvil al repartidor al momento de la entrega.
                  </span>
                </div>
              </div>
            )}

            {paymentMethod === "tarjeta" && (
              <div
                style={{
                  backgroundColor: "#fff",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  padding: "1.5rem",
                  marginBottom: "1.5rem",
                }}
              >
                <div style={{ marginBottom: "1rem" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      color: "#666",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Número de Tarjeta
                  </label>
                  <input
                    placeholder="•••• •••• •••• ••••"
                    required={paymentMethod === "tarjeta"}
                    maxLength={19}
                    style={{
                      width: "100%",
                      padding: "1rem",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      fontSize: "0.9rem",
                    }}
                  />
                </div>
                <div
                  className="checkout-row-2col"
                  style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}
                >
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.75rem",
                        color: "#666",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Fecha de Venc.
                    </label>
                    <input
                      placeholder="MM/AA"
                      maxLength={5}
                      required={paymentMethod === "tarjeta"}
                      style={{
                        width: "100%",
                        padding: "1rem",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                        fontSize: "0.9rem",
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.75rem",
                        color: "#666",
                        marginBottom: "0.5rem",
                      }}
                    >
                      CVC / CVV
                    </label>
                    <input
                      placeholder="123"
                      maxLength={4}
                      required={paymentMethod === "tarjeta"}
                      style={{
                        width: "100%",
                        padding: "1rem",
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
                      color: "#666",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Nombre del Titular
                  </label>
                  <input
                    placeholder="Como figura en la tarjeta"
                    required={paymentMethod === "tarjeta"}
                    style={{
                      width: "100%",
                      padding: "1rem",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      fontSize: "0.9rem",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </form>
      </div>

      <aside
        className="checkout-aside-col"
        style={{
          flex: "1 1 40%",
          backgroundColor: "#f9f9f9",
          borderLeft: "1px solid #eee",
          padding: "4rem 5%",
          position: "sticky",
          top: 0,
          height: "100vh",
          overflowY: "auto",
        }}
      >
        <p
          style={{
            fontSize: "0.65rem",
            textTransform: "uppercase",
            letterSpacing: "1px",
            color: "#888",
            fontWeight: 600,
            marginBottom: "1rem",
          }}
        >
          THE GOOD STUFF
        </p>
        <h2 style={{ fontSize: "2rem", fontWeight: 600, margin: "0 0 2rem 0" }}>
          Tu pedido.
        </h2>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem",
            borderBottom: "1px solid #e5e5e5",
            paddingBottom: "2rem",
            marginBottom: "2rem",
          }}
        >
          {cart.map((item) => {
            const prod = products.find((p) => p.id === item.productId)
            if (!prod) {
              return (
                <div
                  key={`${item.productId}-${item.size}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.75rem 1rem",
                    backgroundColor: "#fff5f5",
                    borderRadius: "4px",
                    border: "1px dashed #e57373",
                  }}
                >
                  <div>
                    <strong
                      style={{
                        fontSize: "0.85rem",
                        color: "#c62828",
                        display: "block",
                      }}
                    >
                      Producto no disponible
                    </strong>
                    <span style={{ fontSize: "0.75rem", color: "#888" }}>
                      Talla: {item.size}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.productId, item.size)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#c62828",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      textDecoration: "underline",
                      fontWeight: "bold",
                    }}
                  >
                    Eliminar producto no disponible
                  </button>
                </div>
              )
            }
            const maxStock = prod.stocks[item.size] ?? 0
            return (
              <div
                key={`${item.productId}-${item.size}`}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "1rem" }}
                >
                  <div style={{ position: "relative" }}>
                    <img
                      src={prod.image}
                      alt={prod.name}
                      style={{
                        width: "60px",
                        height: "60px",
                        objectFit: "cover",
                        borderRadius: "4px",
                        border: "1px solid #eee",
                      }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        top: "-8px",
                        right: "-8px",
                        background: "#888",
                        color: "#fff",
                        fontSize: "0.65rem",
                        width: "20px",
                        height: "20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "50%",
                      }}
                    >
                      {item.quantity}
                    </span>
                  </div>
                  <div>
                    <strong style={{ display: "block", fontSize: "0.9rem" }}>
                      {prod.name}
                    </strong>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "#666",
                        display: "block",
                        marginBottom: "0.3rem",
                      }}
                    >
                      Talla: <b style={{ color: "#000" }}>{item.size}</b>{" "}
                      {maxStock <= 0 && (
                        <span style={{ color: "#ff4d4d", fontWeight: "bold" }}>
                          (Agotado)
                        </span>
                      )}
                    </span>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          border: "1px solid #ddd",
                          borderRadius: "4px",
                          background: "#fff",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            changeQuantity &&
                            changeQuantity(item.productId, item.size, -1)
                          }
                          style={{
                            background: "#f5f5f5",
                            border: "none",
                            width: "24px",
                            height: "24px",
                            cursor: "pointer",
                            fontWeight: "bold",
                          }}
                        >
                          -
                        </button>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            padding: "0 8px",
                            minWidth: "16px",
                            textAlign: "center",
                          }}
                        >
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            changeQuantity &&
                            changeQuantity(item.productId, item.size, 1)
                          }
                          disabled={item.quantity >= maxStock}
                          style={{
                            background: "#f5f5f5",
                            border: "none",
                            width: "24px",
                            height: "24px",
                            cursor:
                              item.quantity >= maxStock
                                ? "not-allowed"
                                : "pointer",
                            fontWeight: "bold",
                            opacity: item.quantity >= maxStock ? 0.4 : 1,
                          }}
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleRemoveItem(item.productId, item.size)
                        }
                        style={{
                          background: "none",
                          border: "none",
                          color: "#c62828",
                          fontSize: "0.72rem",
                          cursor: "pointer",
                          padding: "2px 4px",
                          fontWeight: 600,
                        }}
                        title="Eliminar de la orden"
                      >
                        ✕ Eliminar
                      </button>
                    </div>
                  </div>
                </div>
                <strong style={{ fontSize: "0.9rem" }}>
                  {money(prod.price * item.quantity)}
                </strong>
              </div>
            )
          })}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            fontSize: "0.85rem",
            color: "#555",
            borderBottom: "1px solid #e5e5e5",
            paddingBottom: "2rem",
            marginBottom: "2rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Subtotal (Base Imponible)</span>
            <span>{money(accounting.subtotal)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Costo de Envío</span>
            <span>{money(accounting.shipping)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>IGV (18% incluido)</span>
            <span>{money(accounting.igv)}</span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
          }}
        >
          <span style={{ fontSize: "1.2rem" }}>Total a Pagar</span>
          <strong style={{ fontSize: "1.8rem" }}>
            {money(accounting.total)}
          </strong>
        </div>

        {/* Checkbox Legal Obligatorio (Términos y Privacidad) */}
        <div
          style={{
            marginBottom: "1.25rem",
            padding: "1rem",
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
              id="accept-terms-checkbox"
              name="acceptTerms"
              form="checkout-form"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              required
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
              <a
                href="/terminos"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#000000",
                  fontWeight: 700,
                  textDecoration: "underline",
                }}
              >
                Términos y Condiciones
              </a>{" "}
              y la{" "}
              <a
                href="/privacidad"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#000000",
                  fontWeight: 700,
                  textDecoration: "underline",
                }}
              >
                Política de Privacidad y Tratamiento de Datos Personales
              </a>
              .
            </span>
          </label>
        </div>

        <button
          type="submit"
          form="checkout-form"
          disabled={cart.length === 0 || isSubmitting}
          style={{
            width: "100%",
            padding: "1.5rem",
            background: "#0a0a0a",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            fontSize: "1.1rem",
            fontWeight: "bold",
            cursor:
              cart.length === 0 || isSubmitting ? "not-allowed" : "pointer",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            opacity: cart.length === 0 || isSubmitting ? 0.5 : 1,
          }}
        >
          {isSubmitting
            ? "Procesando pedido..."
            : paymentMethod === "yape_plin"
              ? "Continuar con Yape / Plin"
              : paymentMethod === "efectivo"
                ? "Confirmar Contra Entrega"
                : "Pagar Pedido"}{" "}
          <span>{isSubmitting ? "⌛" : "→"}</span>
        </button>
        <p
          style={{
            fontSize: "0.65rem",
            color: "#888",
            marginTop: "1rem",
            textAlign: "center",
          }}
        >
          Cálculos SUNAT conformes (IGV 18% integrado en céntimos enteros).
        </p>
        <div style={{ textAlign: "center", marginTop: "4rem" }}>
          <span
            style={{
              fontFamily: "serif",
              fontStyle: "italic",
              fontSize: "1.5rem",
              fontWeight: "bold",
              color: "#000",
            }}
          >
            stay real
          </span>
          <p
            style={{
              fontSize: "0.4rem",
              letterSpacing: "2px",
              color: "#999",
              margin: "0.5rem 0 0 0",
            }}
          >
            PARA LOS DÍAS SIN PLANES.
          </p>
        </div>
      </aside>

      {/* MODAL UX YAPE / PLIN */}
      <YapeModal
        isOpen={showYapeModal && !!pendingYapeOrder}
        order={pendingYapeOrder}
        storePhone={STORE_PHONE}
        onClose={() => {
          setOrderConfirmed(pendingYapeOrder)
          setShowYapeModal(false)
        }}
      />
    </section>
  )
}
