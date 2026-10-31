import React, { useState } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"

export interface FooterProps {
  openChat?: () => void
}

export default function Footer({ openChat }: FooterProps = {}) {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState("")
  const [subscribed, setSubscribed] = useState(false)

  if (location.pathname === "/admin" || location.pathname === "/checkout") {
    return null
  }

  const handleSubscribe = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !cleanEmail.includes("@")) return

    try {
      const prev = JSON.parse(
        localStorage.getItem("gone_newsletter_subscribers") || "[]",
      )
      if (Array.isArray(prev) && !prev.includes(cleanEmail)) {
        localStorage.setItem(
          "gone_newsletter_subscribers",
          JSON.stringify([...prev, cleanEmail]),
        )
      }
    } catch {}

    setSubscribed(true)
    setEmail("")
    setTimeout(() => {
      setSubscribed(false)
    }, 5000)
  }

  return (
    <footer
      style={{
        backgroundColor: "#0a0a0a",
        borderTop: "1px solid #1a1a1a",
        color: "#ffffff",
        padding: "36px 24px 28px",
        width: "100%",
      }}
      className="bg-[#0a0a0a] border-t border-[#1a1a1a] text-white px-6 py-9 w-full"
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "24px",
        }}
        className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 w-full"
      >
        {/* ================================================================= */}
        {/* BLOQUE IZQUIERDA: Logo "GONE SURFING" en blanco                   */}
        {/* ================================================================= */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            minWidth: "180px",
          }}
          className="flex items-center justify-center md:justify-start w-full md:w-auto"
        >
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
        </div>

        {/* ================================================================= */}
        {/* BLOQUE CENTRO: Suscripción a la Comunidad + Enlaces Legales       */}
        {/* ================================================================= */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            width: "100%",
            maxWidth: "460px",
            margin: "0 auto",
          }}
          className="flex flex-col items-center justify-center text-center w-full max-w-md mx-auto"
        >
          <p
            style={{
              margin: "0 0 10px 0",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "2.5px",
              textTransform: "uppercase",
              color: "#ffffff",
              fontFamily: '"Barlow Condensed", sans-serif',
            }}
            className="text-xs uppercase tracking-[0.2em] font-medium text-white mb-2.5"
          >
            SUSCRÍBETE A LA COMUNIDAD
          </p>

          <form
            onSubmit={handleSubscribe}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              width: "100%",
              maxWidth: "380px",
            }}
            className="w-full max-w-sm relative flex items-center"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Tu correo electrónico"
              required
              style={{
                width: "100%",
                backgroundColor: "rgba(255, 255, 255, 0.02)",
                border: "1px solid #374151",
                borderRadius: "2px",
                color: "#ffffff",
                fontSize: "12px",
                padding: "9px 38px 9px 14px",
                outline: "none",
                transition: "border-color 0.2s ease",
              }}
              className="w-full bg-transparent border border-gray-700 text-white text-xs px-3.5 py-2 pr-10 rounded-sm focus:outline-none focus:border-white transition-colors placeholder-gray-500"
            />
            <button
              type="submit"
              style={{
                position: "absolute",
                right: "4px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: 0,
                color: "#ffffff",
                cursor: "pointer",
                padding: "6px 10px",
                fontSize: "15px",
                lineHeight: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "color 0.2s ease, transform 0.2s ease",
              }}
              className="absolute right-1 text-white hover:text-gray-400 bg-transparent border-0 cursor-pointer transition-colors text-base"
              aria-label="Suscribirse a la comunidad"
              title="Suscribirse"
            >
              →
            </button>
          </form>

          {subscribed && (
            <p
              style={{
                margin: "8px 0 0 0",
                fontSize: "11px",
                color: "#4ade80",
                fontWeight: 600,
                letterSpacing: "0.5px",
              }}
              className="text-xs text-green-400 mt-2 font-medium"
            >
              ¡Gracias por unirte a la comunidad!
            </p>
          )}

          {/* Fila Inferior de Enlaces Legales Unificados */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              flexWrap: "wrap",
              marginTop: "16px",
            }}
            className="flex items-center justify-center gap-3 mt-4 flex-wrap"
          >
            <Link
              to="/terminos"
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              style={{
                fontSize: "11px",
                color: "#6b7280",
                textDecoration: "none",
                letterSpacing: "0.4px",
                transition: "color 0.2s ease",
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = "#d1d5db")}
              onMouseOut={(e) => (e.currentTarget.style.color = "#6b7280")}
            >
              Términos y Condiciones
            </Link>

            <span
              style={{ color: "#4b5563", fontSize: "10px" }}
              className="text-gray-600 text-[10px]"
            >
              •
            </span>

            <Link
              to="/privacidad"
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              style={{
                fontSize: "11px",
                color: "#6b7280",
                textDecoration: "none",
                letterSpacing: "0.4px",
                transition: "color 0.2s ease",
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = "#d1d5db")}
              onMouseOut={(e) => (e.currentTarget.style.color = "#6b7280")}
            >
              Políticas de Privacidad
            </Link>

            <span
              style={{ color: "#4b5563", fontSize: "10px" }}
              className="text-gray-600 text-[10px]"
            >
              •
            </span>

            <Link
              to="/libro-reclamaciones"
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              style={{
                fontSize: "11px",
                color: "#6b7280",
                textDecoration: "none",
                letterSpacing: "0.4px",
                transition: "color 0.2s ease",
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = "#d1d5db")}
              onMouseOut={(e) => (e.currentTarget.style.color = "#6b7280")}
            >
              Libro de Reclamaciones
            </Link>
          </div>
        </div>

        {/* ================================================================= */}
        {/* BLOQUE DERECHA: Redes Sociales Minimalistas                       */}
        {/* ================================================================= */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "18px",
            minWidth: "180px",
          }}
          className="flex items-center justify-center md:justify-end gap-4 w-full md:w-auto"
        >
          {/* Instagram */}
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            title="Instagram"
            style={{
              color: "#ffffff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "color 0.2s ease",
            }}
            className="text-white hover:text-gray-400 transition-colors"
            onMouseOver={(e) => (e.currentTarget.style.color = "#9ca3af")}
            onMouseOut={(e) => (e.currentTarget.style.color = "#ffffff")}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
            </svg>
          </a>

          {/* TikTok */}
          <a
            href="https://tiktok.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok"
            title="TikTok"
            style={{
              color: "#ffffff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "color 0.2s ease",
            }}
            className="text-white hover:text-gray-400 transition-colors"
            onMouseOver={(e) => (e.currentTarget.style.color = "#9ca3af")}
            onMouseOut={(e) => (e.currentTarget.style.color = "#ffffff")}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.11V9.42a6.34 6.34 0 0 0-.86-.06 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.16 8.16 0 0 0 4.77 1.52V6.82a4.84 4.84 0 0 1-1-.13z" />
            </svg>
          </a>

          {/* YouTube */}
          <a
            href="https://youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="YouTube"
            title="YouTube"
            style={{
              color: "#ffffff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "color 0.2s ease",
            }}
            className="text-white hover:text-gray-400 transition-colors"
            onMouseOver={(e) => (e.currentTarget.style.color = "#9ca3af")}
            onMouseOut={(e) => (e.currentTarget.style.color = "#ffffff")}
          >
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.376.55 9.376.55s7.505 0 9.377-.55a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </a>

          {/* X (Twitter) */}
          <a
            href="https://x.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="X (Twitter)"
            title="X (Twitter)"
            style={{
              color: "#ffffff",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "color 0.2s ease",
            }}
            className="text-white hover:text-gray-400 transition-colors"
            onMouseOver={(e) => (e.currentTarget.style.color = "#9ca3af")}
            onMouseOut={(e) => (e.currentTarget.style.color = "#ffffff")}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  )
}
