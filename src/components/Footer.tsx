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

          {/* Libro de Reclamaciones con Destaque Visual Indecopi */}
          <Link
            to="/libro-reclamaciones"
            style={{
              fontSize: "11px",
              color: "#e2e8f0",
              textDecoration: "none",
              letterSpacing: "0.5px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "#16181d",
              border: "1px solid #282f3a",
              padding: "3px 9px",
              borderRadius: "3px",
              fontWeight: 600,
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = "#64748b"
              e.currentTarget.style.color = "#ffffff"
              e.currentTarget.style.backgroundColor = "#1e2229"
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = "#282f3a"
              e.currentTarget.style.color = "#e2e8f0"
              e.currentTarget.style.backgroundColor = "#16181d"
            }}
            title="Libro de Reclamaciones Virtual conforme a Indecopi"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M6 2v20" />
            </svg>
            <span>Libro de Reclamaciones</span>
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
