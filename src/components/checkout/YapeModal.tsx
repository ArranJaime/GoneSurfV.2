import React from "react"

export interface YapeModalProps {
  isOpen: boolean
  order: {
    id: string
    total: number
  } | null
  storePhone: string
  onClose: () => void
}

export default function YapeModal({
  isOpen,
  order,
  storePhone,
  onClose,
}: YapeModalProps) {
  if (!isOpen || !order) return null

  const whatsappMessage = encodeURIComponent(
    `Hola, adjunto comprobante de mi pago por Yape/Plin del pedido #${order.id} por el monto de S/. ${order.total.toFixed(2)}.`,
  )

  return (
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
        {/* Header del modal con Orden */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: "1.25rem",
            paddingBottom: "0.75rem",
            borderBottom: "1px solid #1a1e26",
          }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              color: "#ffffff",
              fontWeight: 700,
              fontFamily: '"Barlow Condensed", sans-serif',
              letterSpacing: "1px",
              background: "#161920",
              padding: "3px 10px",
              borderRadius: "2px",
              border: "1px solid #282d38",
            }}
          >
            ORDEN #{order.id}
          </span>
        </div>

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
            S/. {order.total.toFixed(2)}
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

        {/* Botón primario de WhatsApp */}
        <a
          href={`https://wa.me/${storePhone}?text=${whatsappMessage}`}
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
          Enviar comprobante por WhatsApp
        </a>

        {/* Botón para finalizar / ver ticket */}
        <button
          type="button"
          onClick={onClose}
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
            letterSpacing: "1px",
            textTransform: "uppercase",
            transition: "all 0.2s ease",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.color = "#ffffff"
            e.currentTarget.style.borderColor = "#606775"
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = "#9ca3af"
            e.currentTarget.style.borderColor = "#333842"
          }}
        >
          Entendido, ver resumen de mi orden →
        </button>
      </div>
    </div>
  )
}
