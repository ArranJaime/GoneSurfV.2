import { type FormEvent, useState, useEffect, useMemo, useCallback } from "react"
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

const money = (value: number) => formatPEN(value)

/**
 * Constante global del número de atención / WhatsApp de la tienda
 * Fácil de cambiar por el número real
 */
export const STORE_PHONE = "9999888777"

export interface DistrictInfo {
  name: string
  code: string
  x: number
  y: number
}

export const LIMA_DISTRICTS: DistrictInfo[] = [
  { name: "San Bartolo", code: "SBT", x: 387, y: 178 },
  { name: "Punta Hermosa", code: "PTH", x: 370, y: 165 },
  { name: "Punta Negra", code: "PTN", x: 378, y: 172 },
  { name: "Santa María del Mar", code: "SMM", x: 395, y: 185 },
  { name: "Pucusana", code: "PUC", x: 405, y: 195 },
  { name: "Lurín", code: "LUR", x: 358, y: 155 },
  { name: "Miraflores", code: "MFL", x: 295, y: 95 },
  { name: "Barranco", code: "BCO", x: 310, y: 110 },
  { name: "Chorrillos", code: "CHO", x: 320, y: 125 },
  { name: "San Isidro", code: "SIS", x: 288, y: 88 },
  { name: "Santiago de Surco", code: "SUR", x: 325, y: 105 },
  { name: "San Borja", code: "SBJ", x: 315, y: 92 },
  { name: "La Molina", code: "MOL", x: 345, y: 85 },
  { name: "Surquillo", code: "SQO", x: 300, y: 98 },
  { name: "Magdalena del Mar", code: "MAG", x: 280, y: 86 },
  { name: "San Miguel", code: "SMG", x: 270, y: 80 },
  { name: "Jesús María", code: "JMA", x: 278, y: 75 },
  { name: "Lince", code: "LNC", x: 285, y: 78 },
  { name: "Pueblo Libre", code: "PLB", x: 272, y: 72 },
  { name: "Lima (Cercado)", code: "LIM", x: 260, y: 55 },
  { name: "San Juan de Miraflores", code: "SJM", x: 335, y: 125 },
  { name: "Villa El Salvador", code: "VES", x: 345, y: 145 },
  { name: "Los Olivos", code: "LOL", x: 245, y: 32 },
  { name: "San Martín de Porres", code: "SMP", x: 240, y: 38 },
]

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
    const dest = {
      name: orderConfirmed.districtName,
      code: orderConfirmed.districtCode,
      x: orderConfirmed.districtX,
      y: orderConfirmed.districtY,
    }
    return (
      <section
        className="checkout-confirmed-section"
        style={{
          minHeight: "100vh",
          backgroundColor: "#111",
          color: "#fff",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "4rem 1rem",
          fontFamily: '"Inter", sans-serif',
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url(/assets/underwater.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "brightness(0.3) blur(4px)",
            zIndex: 0,
          }}
        ></div>
        <div
          className="checkout-confirmed-card"
          style={{
            position: "relative",
            zIndex: 10,
            textAlign: "center",
            width: "100%",
            maxWidth: "600px",
          }}
        >
          <p
            style={{
              fontSize: "0.65rem",
              textTransform: "uppercase",
              letterSpacing: "2px",
              color: "#888",
              margin: "0 0 1rem 0",
            }}
          >
            GONE SURFING / ORDEN CONFIRMADA
          </p>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              border: "1px solid #fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem auto",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h1
            style={{
              fontSize: "3.5rem",
              fontWeight: 600,
              letterSpacing: "-1px",
              margin: "0 0 0.5rem 0",
            }}
          >
            El ruido se apaga.
          </h1>
          <p
            style={{ color: "#aaa", fontSize: "0.85rem", marginBottom: "3rem" }}
          >
            Tu orden{" "}
            <strong style={{ color: "#fff" }}>#{orderConfirmed.id}</strong> está
            confirmada.
          </p>
          <div
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              padding: "2.5rem",
              textAlign: "left",
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                borderBottom: "1px dashed rgba(255,255,255,0.2)",
                paddingBottom: "2rem",
                marginBottom: "2rem",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: 900,
                    display: "block",
                    marginBottom: "1rem",
                    letterSpacing: "-1px",
                  }}
                >
                  GONE SURFING
                </span>
                <p
                  style={{
                    fontSize: "0.65rem",
                    textTransform: "uppercase",
                    letterSpacing: "2px",
                    color: "#888",
                    margin: "0 0 0.5rem 0",
                  }}
                >
                  ORIGEN
                </p>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "1rem" }}
                >
                  <h2 style={{ fontSize: "3rem", margin: 0, fontWeight: 300 }}>
                    LIM
                  </h2>
                  <span style={{ color: "#666" }}>→</span>
                  <h2 style={{ fontSize: "3rem", margin: 0, fontWeight: 300 }}>
                    {dest.code}
                  </h2>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "3.5rem",
                    marginTop: "0.5rem",
                  }}
                >
                  <span style={{ fontSize: "0.7rem", color: "#888" }}>
                    EL RUIDO
                  </span>
                  <span style={{ fontSize: "0.7rem", color: "#888" }}>
                    {dest.name.toUpperCase()}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <p
                  style={{
                    fontSize: "0.5rem",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    color: "#888",
                    margin: "0 0 1rem 0",
                    lineHeight: 1.5,
                  }}
                >
                  PASS DE EMBARQUE A LA COSTA
                  <br />
                  SOLO IDA / OFFLINE
                </p>
                <svg
                  width="40"
                  height="60"
                  viewBox="0 0 40 60"
                  fill="currentColor"
                  style={{ opacity: 0.8 }}
                >
                  <rect x="0" width="4" height="60" />
                  <rect x="6" width="2" height="60" />
                  <rect x="10" width="6" height="60" />
                  <rect x="18" width="2" height="60" />
                  <rect x="22" width="8" height="60" />
                  <rect x="32" width="4" height="60" />
                  <rect x="38" width="2" height="60" />
                </svg>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "2rem",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "0.6rem",
                    color: "#888",
                    letterSpacing: "1px",
                    margin: "0 0 0.3rem 0",
                  }}
                >
                  ORDEN
                </p>
                <p
                  style={{ fontSize: "0.8rem", margin: 0, fontWeight: "bold" }}
                >
                  {orderConfirmed.id}
                </p>
              </div>
              <div>
                <p
                  style={{
                    fontSize: "0.6rem",
                    color: "#888",
                    letterSpacing: "1px",
                    margin: "0 0 0.3rem 0",
                  }}
                >
                  ACCESO
                </p>
                <p
                  style={{ fontSize: "0.8rem", margin: 0, fontWeight: "bold" }}
                >
                  CULTURA SURF
                </p>
              </div>
              <div>
                <p
                  style={{
                    fontSize: "0.6rem",
                    color: "#888",
                    letterSpacing: "1px",
                    margin: "0 0 0.3rem 0",
                  }}
                >
                  ESTADO
                </p>
                <p
                  style={{ fontSize: "0.8rem", margin: 0, fontWeight: "bold" }}
                >
                  CONFIRMADO
                </p>
              </div>
            </div>
            <div
              style={{
                borderTop: "1px solid rgba(255,255,255,0.1)",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
                padding: "1.5rem 0",
                marginBottom: "2rem",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <p
                style={{
                  fontSize: "0.65rem",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  color: "#888",
                  margin: 0,
                  textAlign: "center",
                }}
              >
                TU PRÓXIMO CAPÍTULO EMPIEZA AQUÍ
              </p>
              {orderConfirmed.items.map((item, position) => {
                const prod = products.find((p) => p.id === item.productId)
                if (!prod) return null
                const qty = item.quantity || 1
                return (
                  <div
                    key={`${item.productId}-${item.size}-${position}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span>
                      {qty > 1 ? `${qty}x ` : ""}
                      {prod.name}
                      <small
                        style={{
                          display: "block",
                          color: "#888",
                          fontSize: "0.75rem",
                          marginTop: "4px",
                        }}
                      >
                        Talla: {item.size}
                      </small>
                    </span>
                    <strong>{money(prod.price * qty)}</strong>
                  </div>
                )
              })}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "2rem",
              }}
            >
              <span style={{ fontSize: "0.9rem", fontWeight: "bold" }}>
                Total de prueba (IGV incl.)
              </span>
              <strong style={{ fontSize: "1.5rem" }}>
                {money(orderConfirmed.total)}
              </strong>
            </div>
            <div
              style={{
                background: "#0a0a0a",
                border: "1px solid #222",
                borderRadius: "8px",
                padding: "1rem",
                position: "relative",
                height: "220px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  position: "absolute",
                  top: "1rem",
                  left: "1rem",
                  right: "1rem",
                  zIndex: 2,
                }}
              >
                <span
                  style={{
                    fontSize: "0.6rem",
                    color: "#666",
                    letterSpacing: "1px",
                  }}
                >
                  RUMBO A LA COSTA
                </span>
                <span
                  style={{
                    fontSize: "0.6rem",
                    color: "#666",
                    letterSpacing: "1px",
                  }}
                >
                  RUTA ILUSTRATIVA
                </span>
              </div>
              <svg
                viewBox="0 0 600 220"
                preserveAspectRatio="xMidYMid slice"
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                }}
              >
                <defs>
                  <pattern
                    id="map-grid"
                    width="35"
                    height="35"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M35 0H0V35"
                      fill="none"
                      stroke="#ffffff"
                      strokeOpacity=".045"
                    />
                  </pattern>
                </defs>
                <rect width="600" height="220" fill="#171e1d" />
                <path
                  d="M0 0H182L191 24 177 55 215 90 201 119 234 152 224 177 253 220H0Z"
                  fill="#0c1518"
                />
                <rect width="600" height="220" fill="url(#map-grid)" />
                <g
                  fill="none"
                  stroke="#5d685f"
                  strokeOpacity=".3"
                  strokeWidth="1"
                >
                  <path d="M200 0 280 62 305 124 383 156 402 220M250 0 338 60 350 140 437 192 460 220M350 0 385 70 437 115 488 220M175 40 600 62M210 93 600 123M230 170 600 193" />
                  <path d="M500 0 445 56 515 110 480 178 538 220M290 8 260 52 299 103 273 172 320 220" />
                </g>
                <path
                  d={`M 253 45 Q ${(253 + dest.x) / 2} ${(45 + dest.y) / 2} ${dest.x} ${dest.y}`}
                  fill="none"
                  stroke="#b7c4ad"
                  strokeWidth="2"
                  strokeDasharray="5 5"
                />
                <circle cx="253" cy="45" r="4" fill="#b7c4ad" />
                <circle
                  cx={dest.x}
                  cy={dest.y}
                  r="15"
                  fill="#b7c4ad"
                  fillOpacity=".15"
                />
                <circle cx={dest.x} cy={dest.y} r="5" fill="#d6e0cd" />
                <g
                  fill="#abb2ab"
                  fontFamily="Inter, sans-serif"
                  fontSize="9"
                  letterSpacing="1.5"
                >
                  <text x="270" y="35">
                    LIMA
                  </text>
                  <text x={dest.x + 16} y={dest.y + 4}>
                    {dest.name.toUpperCase()}
                  </text>
                  <text x="32" y="115" fill="#72838a" fontSize="8">
                    PACIFIC OCEAN
                  </text>
                </g>
              </svg>
              <div
                style={{
                  position: "absolute",
                  bottom: "1rem",
                  left: "1rem",
                  background: "#1a1a1a",
                  border: "1px solid #333",
                  padding: "0.4rem 0.8rem",
                  borderRadius: "20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  zIndex: 2,
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#4CAF50",
                  }}
                ></span>
                <span style={{ fontSize: "0.65rem", color: "#ddd" }}>
                  Tus olas están en camino a {dest.name}
                </span>
              </div>
            </div>
            <div style={{ marginTop: "1.5rem" }}>
              {orderConfirmed.paymentMethod === "yape_plin" && (
                <div
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    borderRadius: "8px",
                    padding: "1.5rem",
                    textAlign: "center",
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      color: "#ffffff",
                      margin: "0 0 0.8rem 0",
                      fontWeight: "bold",
                    }}
                  >
                    PAGO PENDIENTE CON YAPE / PLIN
                  </p>
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "#ddd",
                      margin: "0 0 1rem 0",
                    }}
                  >
                    Escanea el siguiente código QR o transfiere al número{" "}
                    <strong>999 888 777</strong> (Gone Surfing Perú)
                  </p>
                  <div
                    style={{
                      display: "inline-block",
                      background: "#fff",
                      padding: "12px",
                      borderRadius: "8px",
                      marginBottom: "0.8rem",
                    }}
                  >
                    <svg
                      width="130"
                      height="130"
                      viewBox="0 0 100 100"
                      fill="#000"
                    >
                      <rect width="100" height="100" fill="#fff" />
                      <path d="M10,10 h30 v30 h-30 z M15,15 v20 h20 v-20 z M20,20 h10 v10 h-10 z" />
                      <path d="M60,10 h30 v30 h-30 z M65,15 v20 h20 v-20 z M70,20 h10 v10 h-10 z" />
                      <path d="M10,60 h30 v30 h-30 z M15,65 v20 h20 v-20 z M20,70 h10 v10 h-10 z" />
                      <rect x="45" y="10" width="5" height="15" />
                      <rect x="45" y="30" width="10" height="10" />
                      <rect x="45" y="55" width="20" height="10" />
                      <rect x="70" y="55" width="20" height="10" />
                      <rect x="55" y="70" width="10" height="20" />
                      <rect x="70" y="75" width="20" height="15" />
                    </svg>
                  </div>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "#aaa",
                      margin: 0,
                    }}
                  >
                    Monto total:{" "}
                    <strong style={{ color: "#fff" }}>
                      {money(orderConfirmed.total)}
                    </strong>
                  </p>
                  <a
                    href={`https://wa.me/${STORE_PHONE}?text=${encodeURIComponent(
                      `Hola, adjunto comprobante de mi pago por Yape/Plin del pedido #${orderConfirmed.id} por el monto de S/. ${orderConfirmed.total.toFixed(2)}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      background: "#ffffff",
                      color: "#0a0a0a",
                      padding: "10px 18px",
                      borderRadius: "3px",
                      textDecoration: "none",
                      fontWeight: 800,
                      fontSize: "0.85rem",
                      fontFamily: '"Barlow Condensed", sans-serif',
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      marginTop: "12px",
                      transition: "all 0.2s ease",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = "#e0e0e0"
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = "#ffffff"
                    }}
                  >
                    Enviar comprobante por WhatsApp
                  </a>
                </div>
              )}
              {orderConfirmed.paymentMethod === "efectivo" && (
                <div>
                  <p
                    style={{
                      fontSize: "0.6rem",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      color: "#888",
                      margin: "0 0 0.5rem 0",
                    }}
                  >
                    MÉTODO DE PAGO
                  </p>
                  <p style={{ fontSize: "0.85rem", color: "#ddd", margin: 0 }}>
                    Pago contra entrega en efectivo. Pagarás{" "}
                    <strong>{money(orderConfirmed.total)}</strong> al recibir tu
                    pedido en tu domicilio.
                  </p>
                </div>
              )}
              {orderConfirmed.paymentMethod === "tarjeta" && (
                <div>
                  <p
                    style={{
                      fontSize: "0.6rem",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      color: "#888",
                      margin: "0 0 0.5rem 0",
                    }}
                  >
                    MÉTODO DE PAGO
                  </p>
                  <p style={{ fontSize: "0.85rem", color: "#ddd", margin: 0 }}>
                    Tarjeta de Crédito / Débito procesada de forma segura.
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={() => {
                window.location.href = "/"
              }}
              style={{
                width: "100%",
                padding: "1.2rem",
                background: "#c2c9b4",
                color: "#000",
                border: "none",
                borderRadius: "4px",
                fontWeight: "bold",
                fontSize: "0.9rem",
                marginTop: "2rem",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                transition: "background 0.2s ease",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = "#d6e0cd")
              }
              onMouseOut={(e) => (e.currentTarget.style.background = "#c2c9b4")}
            >
              SEGUIR EXPLORANDO <span style={{ fontSize: "1.2rem" }}>↗</span>
            </button>
          </div>
          <div style={{ marginTop: "3rem" }}>
            <span
              style={{
                fontFamily: "serif",
                fontStyle: "italic",
                fontSize: "2rem",
                fontWeight: "bold",
              }}
            >
              stay real
            </span>
            <p
              style={{
                fontSize: "0.5rem",
                letterSpacing: "3px",
                color: "#888",
                marginTop: "0.5rem",
              }}
            >
              PARA LOS DÍAS SIN PLANES.
            </p>
          </div>
        </div>
      </section>
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
            {cart.some((item) => !products.some((p) => p.id === item.productId)) && (
              <button
                type="button"
                onClick={() => {
                  cart
                    .filter((item) => !products.some((p) => p.id === item.productId))
                    .forEach((orphan) => handleRemoveItem(orphan.productId, orphan.size))
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
              <span style={{ color: "#999", fontSize: "0.9rem" }}>03</span> Método de Pago
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
      {showYapeModal && pendingYapeOrder && (
        <div
          className="yape-modal-overlay"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(8px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          <div
            className="yape-modal-content"
            style={{
              backgroundColor: "#0d0e12",
              color: "#ffffff",
              border: "1px solid #23272f",
              borderRadius: "4px",
              maxWidth: "440px",
              width: "100%",
              padding: "2rem",
              textAlign: "center",
              boxShadow:
                "0 20px 50px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.05)",
              position: "relative",
            }}
          >
            {/* Header del modal con badges Yape / Plin y Orden */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.25rem",
                paddingBottom: "0.75rem",
                borderBottom: "1px solid #1a1e26",
              }}
            >
              <div style={{ display: "flex", gap: "6px" }}>
                <span
                  style={{
                    fontSize: "0.65rem",
                    background: "#742284",
                    color: "#ffffff",
                    padding: "3px 8px",
                    borderRadius: "2px",
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                  }}
                >
                  YAPE
                </span>
                <span
                  style={{
                    fontSize: "0.65rem",
                    background: "#00a1df",
                    color: "#ffffff",
                    padding: "3px 8px",
                    borderRadius: "2px",
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                  }}
                >
                  PLIN
                </span>
              </div>
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontFamily: '"Barlow Condensed", sans-serif',
                  letterSpacing: "1px",
                  background: "#161920",
                  padding: "2px 8px",
                  borderRadius: "2px",
                  border: "1px solid #282d38",
                }}
              >
                ORDEN #{pendingYapeOrder.id}
              </span>
            </div>

            {/* Mensaje con tipografía estilizada branding Gone Surfing */}
            <span
              style={{
                fontFamily: "serif",
                fontStyle: "italic",
                fontSize: "1.25rem",
                color: "#ffffff",
                display: "block",
                marginBottom: "0.2rem",
              }}
            >
              ¡Buenas olas!
            </span>

            <h3
              style={{
                fontFamily: '"Barlow Condensed", sans-serif',
                fontSize: "1.75rem",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                color: "#ffffff",
                margin: "0 0 1rem 0",
                lineHeight: 1.15,
              }}
            >
              Tu pedido está separado
            </h3>

            {/* Monto total a pagar destacado */}
            <div
              style={{
                background: "#14171d",
                border: "1px solid #23272f",
                borderRadius: "3px",
                padding: "0.75rem 1rem",
                marginBottom: "1.25rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  color: "#8b949e",
                  fontWeight: 600,
                }}
              >
                Monto a pagar:
              </span>
              <strong
                style={{
                  fontSize: "1.25rem",
                  color: "#ffffff",
                  fontWeight: 800,
                  letterSpacing: "0.5px",
                }}
              >
                S/. {pendingYapeOrder.total.toFixed(2)}
              </strong>
            </div>

            {/* Código QR Yape / Plin */}
            <div style={{ marginBottom: "1.25rem", textAlign: "center" }}>
              <img
                src="/qr-yape.png"
                alt="QR Yape / Plin Oficial"
                style={{
                  maxWidth: "200px",
                  margin: "0 auto",
                  borderRadius: "12px",
                  display: "block",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.45)",
                }}
              />
            </div>

            {/* Datos de transferencia */}
            <div
              style={{
                backgroundColor: "#14171d",
                border: "1px solid #23272f",
                borderRadius: "3px",
                padding: "0.75rem 1rem",
                marginBottom: "1.25rem",
                fontSize: "0.8rem",
                color: "#9ca3af",
                textAlign: "left",
                lineHeight: "1.6",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "4px",
                }}
              >
                <span>Número Yape / Plin:</span>
                <strong style={{ color: "#ffffff", letterSpacing: "0.5px" }}>
                  999 888 777
                </strong>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>Titular:</span>
                <strong style={{ color: "#ffffff" }}>
                  Gone Surfing Perú S.A.C.
                </strong>
              </div>
            </div>

            {/* Botón primario de WhatsApp (Configurado con STORE_PHONE = "9999888777") */}
            <a
              href={`https://wa.me/${STORE_PHONE}?text=${encodeURIComponent(
                `Hola, adjunto comprobante de mi pago por Yape/Plin del pedido #${pendingYapeOrder.id} por el monto de S/. ${pendingYapeOrder.total.toFixed(2)}.`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                backgroundColor: "#ffffff",
                color: "#0a0a0a",
                padding: "0.95rem 1.25rem",
                borderRadius: "3px",
                textDecoration: "none",
                fontWeight: 800,
                fontFamily: '"Barlow Condensed", sans-serif',
                fontSize: "1.05rem",
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                marginBottom: "0.75rem",
                transition: "all 0.2s ease",
                boxShadow: "0 4px 14px rgba(0, 0, 0, 0.4)",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#e0e0e0"
                e.currentTarget.style.color = "#0a0a0a"
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "#ffffff"
                e.currentTarget.style.color = "#0a0a0a"
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              Enviar comprobante por WhatsApp
            </a>

            {/* Botón para finalizar / ver ticket */}
            <button
              type="button"
              onClick={() => {
                setOrderConfirmed(pendingYapeOrder)
                setShowYapeModal(false)
              }}
              style={{
                width: "100%",
                padding: "0.85rem",
                background: "transparent",
                color: "#9ca3af",
                border: "1px solid #333842",
                borderRadius: "3px",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: 600,
                fontFamily: '"Barlow Condensed", sans-serif',
                textTransform: "uppercase",
                letterSpacing: "1px",
                transition: "all 0.2s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = "#ffffff"
                e.currentTarget.style.borderColor = "#ffffff"
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = "#9ca3af"
                e.currentTarget.style.borderColor = "#333842"
              }}
            >
              Ya envié el comprobante / Ver mi orden →
            </button>

            {/* Firma de marca discreta */}
            <div style={{ marginTop: "1rem", textAlign: "center" }}>
              <span
                style={{
                  fontFamily: "serif",
                  fontStyle: "italic",
                  fontSize: "0.95rem",
                  color: "#4b5563",
                }}
              >
                stay real
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
