import { useState, useEffect, useMemo } from "react"

import { Link } from "react-router-dom"

import { useStore } from "./store"

export default function Collections() {
  const { collections } = useStore()

  const [active, setActive] = useState(0)

  const activeSlides = useMemo(
    () => collections.filter((c) => c.active),
    [collections],
  )

  useEffect(() => {
    if (active >= activeSlides.length && activeSlides.length > 0) {
      setActive(Math.max(0, activeSlides.length - 1))
    }
  }, [activeSlides.length, active])

  const next = () => {
    if (activeSlides.length === 0) return

    setActive((prev) => (prev + 1) % activeSlides.length)
  }

  const prev = () => {
    if (activeSlides.length === 0) return

    setActive((prev) => (prev - 1 + activeSlides.length) % activeSlides.length)
  }

  if (activeSlides.length === 0) {
    return (
      <main
        style={{
          backgroundColor: "#050505",
          color: "#fff",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p
          style={{
            color: "#888",
            letterSpacing: "2px",
            textTransform: "uppercase",
          }}
        >
          No hay colecciones activas en este momento.
        </p>
      </main>
    )
  }

  return (
    <main
      style={{
        backgroundColor: "#050505",
        color: "#fff",
        minHeight: "100vh",
        paddingTop: "100px",
        paddingBottom: "120px",
        fontFamily: '"Inter", -apple-system, sans-serif',
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* CABECERA DE LA PÁGINA */}
      <div
        style={{
          textAlign: "center",
          padding: "2rem 1rem 3.5rem 1rem",
          position: "relative",
          zIndex: 20,
        }}
      >
        <p
          style={{
            fontSize: "0.75rem",
            textTransform: "uppercase",
            letterSpacing: "0.25em",
            color: "#888",
            margin: "0 0 1.5rem 0",
            fontWeight: 600,
          }}
        >
          Distintos lugares. La misma actitud.
        </p>
        <h1
          style={{
            fontSize: "4.5rem",
            margin: "0 0 1.5rem 0",
            fontWeight: 900,
            letterSpacing: "-0.04em",
          }}
        >
          Nuestras colecciones.
        </h1>
        <p
          style={{
            fontSize: "0.75rem",
            textTransform: "uppercase",
            letterSpacing: "0.25em",
            color: "#888",
            margin: 0,
            fontWeight: 600,
          }}
        >
          Different ways to get lost.
        </p>
      </div>

      {/* CARRUSEL DINÁMICO */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {activeSlides.map((slide, i) => {
          let offset = i - active

          if (offset < -1) offset += activeSlides.length

          if (offset > 1) offset -= activeSlides.length

          if (Math.abs(offset) > 1) return null

          const isActive = offset === 0

          const isPrev = offset === -1

          const isNext = offset === 1

          let translateX = "0%"

          let scale = 1

          let opacity = 1

          let zIndex = 10

          if (isPrev) {
            translateX = "-75%"
            scale = 0.85
            opacity = 0.4
            zIndex = 5
          } else if (isNext) {
            translateX = "75%"
            scale = 0.85
            opacity = 0.4
            zIndex = 5
          }

          const slideNumber = `${String(i + 1).padStart(2, "0")} / ${String(activeSlides.length).padStart(2, "0")}`

          const displayTitle = slide.title || "Colección Sin Nombre"

          const displayCategory = slide.category || "General"

          const displaySubtitle = slide.subtitle || "Explora las novedades"

          return (
            <div
              key={slide.id}
              style={{
                position: "absolute",
                width: "70vw",
                maxWidth: "900px",
                height: "100%",
                transition: "all 0.6s cubic-bezier(0.25, 1, 0.5, 1)",
                transform: `translateX(${translateX}) scale(${scale})`,
                opacity,
                zIndex,
                cursor: isActive ? "default" : "pointer",
              }}
              onClick={() => {
                if (isPrev) prev()
                if (isNext) next()
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  borderRadius: "4px",
                  overflow: "hidden",
                  backgroundColor: "#111",
                }}
              >
                {slide.image && (
                  <img
                    src={slide.image}
                    alt={displayTitle}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                )}

                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)",
                  }}
                ></div>

                <div
                  style={{
                    position: "absolute",
                    top: "2rem",
                    left: "2.5rem",
                    right: "2.5rem",
                    display: "flex",
                    justifyContent: "space-between",
                    opacity: isActive ? 1 : 0,
                    transition: "opacity 0.3s 0.3s",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: "#fff",
                      letterSpacing: "2px",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    {displayCategory}
                  </span>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: "#fff",
                      letterSpacing: "2px",
                      fontWeight: 600,
                    }}
                  >
                    {slideNumber}
                  </span>
                </div>

                <div
                  style={{
                    position: "absolute",
                    bottom: "3rem",
                    left: "2.5rem",
                    opacity: isActive ? 1 : 0,
                    transition: "opacity 0.3s 0.3s",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 0.5rem 0",
                      fontSize: "0.75rem",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      fontWeight: 700,
                    }}
                  >
                    {displaySubtitle}
                  </p>
                  <h2
                    style={{
                      margin: "0 0 1.2rem 0",
                      fontSize: "4.5rem",
                      fontWeight: 700,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {displayTitle}
                  </h2>

                  <Link
                    to={`/shop?collection=${encodeURIComponent(displayTitle)}`}
                    style={{
                      fontSize: "0.75rem",
                      color: "#fff",
                      textDecoration: "none",
                      borderBottom: "2px solid #fff",
                      paddingBottom: "0.3rem",
                      textTransform: "uppercase",
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                    }}
                  >
                    Explorar Colección
                  </Link>
                </div>

                {isActive && activeSlides.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        prev()
                      }}
                      style={{
                        position: "absolute",
                        left: "2rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: "44px",
                        height: "44px",
                        borderRadius: "50%",
                        background: "rgba(0,0,0,0.4)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        backdropFilter: "blur(8px)",
                        transition: "background 0.2s",
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.background = "rgba(0,0,0,0.8)")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.background = "rgba(0,0,0,0.4)")
                      }
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M15 18l-6-6 6-6" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        next()
                      }}
                      style={{
                        position: "absolute",
                        right: "2rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: "44px",
                        height: "44px",
                        borderRadius: "50%",
                        background: "rgba(0,0,0,0.4)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        backdropFilter: "blur(8px)",
                        transition: "background 0.2s",
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.background = "rgba(0,0,0,0.8)")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.background = "rgba(0,0,0,0.4)")
                      }
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {activeSlides.length > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "0.5rem",
            marginTop: "3rem",
          }}
        >
          {activeSlides.map((slide, i) => (
            <button
              key={slide.id}
              onClick={() => setActive(i)}
              style={{
                width: "24px",
                height: "2px",
                background: active === i ? "#fff" : "#333",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "background 0.3s ease",
              }}
              aria-label={`Ir a colección ${i + 1}`}
            />
          ))}
        </div>
      )}
    </main>
  )
}
