import React from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"

export interface FooterProps {
  openChat?: () => void
}

export default function Footer({ openChat }: FooterProps = {}) {
  const navigate = useNavigate()
  const location = useLocation()

  if (location.pathname === "/admin" || location.pathname === "/checkout") {
    return null
  }

  return (
    <footer className="w-full bg-[#0a0a0a] border-t border-[#1a1a1a] text-white py-6 md:py-8 px-6">
      <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-7xl mx-auto gap-6 md:gap-4">
        {/* ================================================================= */}
        {/* BLOQUE IZQUIERDO: Logo                                            */}
        {/* ================================================================= */}
        <div className="flex-1 flex justify-center md:justify-start items-center">
          <button
            onClick={() => navigate("/")}
            className="bg-transparent border-0 p-0 flex items-center cursor-pointer transition-opacity hover:opacity-80"
            aria-label="Gone Surfing Home"
          >
            <img
              src="/logo-gone-surfing.png"
              alt="Gone Surfing Logo"
              className="h-8 md:h-9 w-auto object-contain brand-logo"
            />
          </button>
        </div>

        {/* ================================================================= */}
        {/* BLOQUE CENTRAL: Enlaces Legales e Identidad Fiscal                */}
        {/* ================================================================= */}
        <div className="flex flex-col items-center justify-center text-center shrink-0 px-4">
          <div className="flex flex-wrap md:flex-nowrap items-center justify-center gap-x-3 gap-y-1 text-xs text-gray-400 md:whitespace-nowrap">
            <Link
              to="/terminos"
              className="hover:text-white transition-colors"
            >
              Términos y Condiciones
            </Link>

            <span className="text-gray-600 select-none">•</span>

            <Link
              to="/privacidad"
              className="hover:text-white transition-colors"
            >
              Políticas de Privacidad
            </Link>

            <span className="text-gray-600 select-none">•</span>

            <Link
              to="/cambios-devoluciones"
              className="hover:text-white transition-colors"
            >
              Cambios y Devoluciones
            </Link>

            <span className="text-gray-600 select-none">•</span>

            <Link
              to="/libro-reclamaciones"
              className="hover:text-white transition-colors"
            >
              Libro de Reclamaciones
            </Link>
          </div>

          <div className="mt-2 text-[11px] text-gray-500 tracking-wide">
            <span>© 2026 Gone Surfing Perú S.A.C. • RUC: 20000000000</span>
          </div>
        </div>

        {/* ================================================================= */}
        {/* BLOQUE DERECHO: Redes Sociales                                    */}
        {/* ================================================================= */}
        <div className="flex-1 flex justify-center md:justify-end items-center gap-4 text-white">
          {/* Instagram */}
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            title="Instagram"
            className="text-white hover:text-gray-400 transition-colors inline-flex items-center justify-center"
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
            className="text-white hover:text-gray-400 transition-colors inline-flex items-center justify-center"
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.11V9.42a6.34 6.34 0 0 0-.86-.06 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.16 8.16 0 0 0 4.77 1.52V6.82a4.84 4.84 0 0 1-1-.13z" />
            </svg>
          </a>

          {/* YouTube */}
          <a
            href="https://youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="YouTube"
            title="YouTube"
            className="text-white hover:text-gray-400 transition-colors inline-flex items-center justify-center"
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
            className="text-white hover:text-gray-400 transition-colors inline-flex items-center justify-center"
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
