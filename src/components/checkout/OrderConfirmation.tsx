import React from "react"
import { Link } from "react-router-dom"
import type { CartItem, Product, Size } from "../../types"
import { formatPEN } from "../../utils/accounting"
import { useAuth } from "../../hooks/useAuth"

const money = (value: number) => formatPEN(value)

export interface ConfirmedOrderState {
  id: string
  number: string
  total: number
  subtotal: number
  paymentMethod: "tarjeta" | "yape_plin" | "efectivo"
  districtName: string
  districtCode: string
  districtX: number
  districtY: number
  items?: CartItem[]
  email?: string
  firstName?: string
  lastName?: string
  phone?: string
  address?: string
  reference?: string
}

export interface OrderConfirmationProps {
  order: ConfirmedOrderState
  products: Product[]
  storePhone: string
}

export default function OrderConfirmation({
  order,
  products,
  storePhone,
}: OrderConfirmationProps) {
  const { currentUser, isAuth } = useAuth()
  const isGuest = !isAuth || !currentUser || Boolean(currentUser.isGuest)

  const dest = {
    name: order.districtName,
    code: order.districtCode,
    x: order.districtX,
    y: order.districtY,
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
        <p style={{ color: "#aaa", fontSize: "0.85rem", marginBottom: "3rem" }}>
          Tu orden <strong style={{ color: "#fff" }}>#{order.id}</strong> está
          confirmada.
        </p>

        <div
          style={{
            background: "#161616",
            border: "1px solid #333",
            borderRadius: "8px",
            padding: "2rem",
            textAlign: "left",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderBottom: "1px solid #333",
              paddingBottom: "1rem",
              marginBottom: "1rem",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "0.6rem",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  color: "#888",
                }}
              >
                DESTINO
              </span>
              <p
                style={{
                  margin: "0.3rem 0 0 0",
                  fontSize: "0.9rem",
                  fontWeight: "bold",
                }}
              >
                {order.districtName} ({order.districtCode})
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <span
                style={{
                  fontSize: "0.6rem",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  color: "#888",
                }}
              >
                CÓDIGO DE ORDEN
              </span>
              <p
                style={{
                  margin: "0.3rem 0 0 0",
                  fontSize: "0.9rem",
                  fontWeight: "bold",
                }}
              >
                #{order.number}
              </p>
            </div>
          </div>

          <div
            style={{
              borderBottom: "1px solid #333",
              paddingBottom: "1rem",
              marginBottom: "1rem",
            }}
          >
            <span
              style={{
                fontSize: "0.6rem",
                textTransform: "uppercase",
                letterSpacing: "1px",
                color: "#888",
                display: "block",
                marginBottom: "0.5rem",
              }}
            >
              PRENDAS
            </span>
            {(order.items || []).map((item, idx) => {
              const prod = products.find((p) => p.id === item.productId)
              if (!prod) return null
              const qty = item.quantity || 1
              return (
                <div
                  key={`${item.productId}-${item.size}-${idx}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.85rem",
                    marginBottom: "0.4rem",
                  }}
                >
                  <span>
                    {qty}x {prod.name}
                    <small
                      style={{
                        display: "block",
                        color: "#888",
                        fontSize: "0.75rem",
                        marginTop: "2px",
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
              Total (IGV incl.)
            </span>
            <strong style={{ fontSize: "1.5rem" }}>{money(order.total)}</strong>
          </div>

          {/* Mapa Ilustrativo */}
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
                  id="map-grid-conf"
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
              <rect width="600" height="220" fill="url(#map-grid-conf)" />
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

          <div style={{ marginTop: "1.75rem" }}>
            {order.paymentMethod === "yape_plin" && (
              <div
                style={{
                  borderTop: "1px solid #262626",
                  paddingTop: "1.75rem",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
                className="border-t border-gray-800 pt-7 text-center flex flex-col items-center"
              >
                <h4
                  style={{
                    fontSize: "0.85rem",
                    textTransform: "uppercase",
                    letterSpacing: "1.5px",
                    color: "#ffffff",
                    margin: "0 0 0.6rem 0",
                    fontWeight: 700,
                    fontFamily: '"Barlow Condensed", sans-serif',
                  }}
                  className="text-sm uppercase font-bold text-white tracking-wider mb-2"
                >
                  ¿AÚN NO REALIZASTE EL PAGO?
                </h4>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "#d1d5db",
                    margin: "0 0 0.4rem 0",
                    lineHeight: 1.5,
                    maxWidth: "460px",
                  }}
                  className="text-sm text-gray-300 mb-1 leading-relaxed"
                >
                  En caso de haberte saltado el paso anterior, escanea el código QR o transfiere al número{" "}
                  <strong style={{ color: "#ffffff" }}>999 888 777</strong> (Titular: Gone Surfing Perú S.A.C.).
                </p>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "#9ca3af",
                    fontStyle: "italic",
                    margin: "0.4rem 0 1.25rem 0",
                    lineHeight: 1.4,
                    maxWidth: "460px",
                  }}
                  className="text-xs text-gray-400 italic mt-2 mb-4"
                >
                  Nota: Si ya realizaste el pago y enviaste tu comprobante, por favor ignora este código QR.
                </p>
                <div
                  style={{
                    display: "inline-block",
                    background: "#ffffff",
                    padding: "10px",
                    borderRadius: "8px",
                    marginBottom: "0.8rem",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
                  }}
                >
                  <img
                    src="/qr-yape.png"
                    alt="QR Yape / Plin"
                    style={{
                      width: "130px",
                      height: "130px",
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                </div>
                <p
                  style={{
                    fontSize: "0.8rem",
                    color: "#9ca3af",
                    margin: "0 0 1rem 0",
                  }}
                >
                  Monto total:{" "}
                  <strong style={{ color: "#ffffff", fontSize: "1rem" }}>
                    {money(order.total)}
                  </strong>
                </p>
                <a
                  href={`https://wa.me/${storePhone}?text=${encodeURIComponent(
                    `Hola, adjunto comprobante de mi pago por Yape/Plin del pedido #${order.id} por el monto de S/. ${order.total.toFixed(2)}.`,
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
                    padding: "11px 20px",
                    borderRadius: "3px",
                    textDecoration: "none",
                    fontWeight: 800,
                    fontSize: "0.85rem",
                    fontFamily: '"Barlow Condensed", sans-serif',
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    transition: "all 0.2s ease",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = "#e0e0e0"
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "#ffffff"
                  }}
                >
                  ENVIAR COMPROBANTE POR WHATSAPP
                </a>
              </div>
            )}
            {order.paymentMethod === "efectivo" && (
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
                  <strong>{money(order.total)}</strong> al recibir tu pedido en
                  tu domicilio.
                </p>
              </div>
            )}
            {order.paymentMethod === "tarjeta" && (
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

          {/* CTA: Incentivo de registro / login para seguimiento de pedido */}
          {isGuest ? (
            <div
              className="text-sm text-gray-400 text-center mt-4 mb-4"
              style={{
                marginTop: "1.25rem",
                marginBottom: "1.25rem",
                textAlign: "center",
                fontSize: "0.85rem",
                lineHeight: "1.5",
                color: "#9ca3af",
                padding: "0.85rem 1rem",
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "6px",
              }}
            >
              Para ver en qué estado se encuentra tu pedido,{" "}
              <Link
                to={order.email ? `/login?email=${encodeURIComponent(order.email)}` : "/login"}
                className="text-white hover:underline font-semibold"
                style={{
                  color: "#ffffff",
                  fontWeight: 600,
                  textDecoration: "underline",
                  transition: "color 0.2s ease",
                }}
              >
                inicia sesión
              </Link>{" "}
              o{" "}
              <Link
                to={order.email ? `/register?email=${encodeURIComponent(order.email)}` : "/register"}
                className="text-white hover:underline font-semibold"
                style={{
                  color: "#ffffff",
                  fontWeight: 600,
                  textDecoration: "underline",
                  transition: "color 0.2s ease",
                }}
              >
                créate una cuenta
              </Link>{" "}
              con el correo electrónico que acabas de introducir.
            </div>
          ) : (
            <div
              className="text-sm text-gray-400 text-center mt-4 mb-4"
              style={{
                marginTop: "1.25rem",
                marginBottom: "1.25rem",
                textAlign: "center",
                fontSize: "0.85rem",
                lineHeight: "1.5",
                color: "#9ca3af",
                padding: "0.85rem 1rem",
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "6px",
              }}
            >
              Para ver en qué estado se encuentra tu pedido, puedes acceder directamente a{" "}
              <Link
                to="/profile"
                className="text-white hover:underline font-semibold"
                style={{
                  color: "#ffffff",
                  fontWeight: 600,
                  textDecoration: "underline",
                  transition: "color 0.2s ease",
                }}
              >
                Ver mis pedidos
              </Link>
              .
            </div>
          )}

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
              marginTop: "1rem",
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              transition: "background 0.2s ease",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#d6e0cd")}
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
