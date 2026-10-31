import React from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"

export interface FooterProps {
  openChat: () => void
}

export default function Footer({ openChat }: FooterProps) {
  const navigate = useNavigate()
  const location = useLocation()

  if (location.pathname === "/admin" || location.pathname === "/checkout") {
    return null
  }

  return (
    <footer
      style={{
        minHeight: "85px",
        padding: "20px 25px",
        backgroundColor: "#0a0a0a",
        borderTop: "1px solid #1a1a1a",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1.25rem",
      }}
    >
      {/* Columna Izquierda: Logo */}
      <button
        onClick={() => navigate("/")}
        style={{
          background: "transparent",
          border: 0,
          padding: 0,
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
        }}
        aria-label="Gone Surfing Home"
      >
        <img
          src="/logo-gone-surfing.png"
          alt="Gone Surfing Logo"
          className="brand-logo"
        />
      </button>

      {/* Columna Central: Slogan & Enlaces Legales Perú */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            margin: 0,
            font: '500 10px "Barlow Condensed"',
            letterSpacing: "1.4px",
            opacity: 0.7,
            textTransform: "uppercase",
            color: "#ffffff",
          }}
        >
          SURF CULTURE FROM LIMA, PERÚ.
        </p>

        {/* Fila de Enlaces Legales */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <Link
            to="/terminos"
            className="text-xs text-gray-400 hover:text-white transition-colors"
            style={{
              fontSize: "11px",
              color: "#9ca3af",
              textDecoration: "none",
              letterSpacing: "0.5px",
              transition: "color 0.2s ease",
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = "#ffffff")}
            onMouseOut={(e) => (e.currentTarget.style.color = "#9ca3af")}
          >
            Términos y Condiciones
          </Link>

          <span style={{ color: "#374151", fontSize: "10px" }}>•</span>

          <Link
            to="/privacidad"
            className="text-xs text-gray-400 hover:text-white transition-colors"
            style={{
              fontSize: "11px",
              color: "#9ca3af",
              textDecoration: "none",
              letterSpacing: "0.5px",
              transition: "color 0.2s ease",
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = "#ffffff")}
            onMouseOut={(e) => (e.currentTarget.style.color = "#9ca3af")}
          >
            Políticas de Privacidad
          </Link>

          <span style={{ color: "#374151", fontSize: "10px" }}>•</span>

          <Link
            to="/libro-reclamaciones"
            className="text-xs text-gray-400 hover:text-white transition-colors"
            style={{
              fontSize: "11px",
              color: "#9ca3af",
              textDecoration: "none",
              letterSpacing: "0.5px",
              transition: "color 0.2s ease",
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = "#ffffff")}
            onMouseOut={(e) => (e.currentTarget.style.color = "#9ca3af")}
            title="Libro de Reclamaciones Virtual conforme a Indecopi"
          >
            Libro de Reclamaciones
          </Link>
        </div>
      </div>

      {/* Columna Derecha: Chat */}
      <button
        onClick={openChat}
        style={{
          alignSelf: "center",
          minWidth: "106px",
          padding: "8px 16px",
          border: "1px solid #22262a",
          background: "#101214",
          color: "white",
          cursor: "pointer",
          borderRadius: "3px",
          fontFamily: '"Barlow Condensed", sans-serif',
          fontSize: "0.85rem",
          letterSpacing: "1px",
          textTransform: "uppercase",
        }}
      >
        ◯ &nbsp; Chat
      </button>
    </footer>
  )
}
