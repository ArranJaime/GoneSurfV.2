import { useEffect, useMemo, useRef, useState } from "react"
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom"
import {
  StoreProvider,
  getCurrentSessionUser,
  type CartItem,
  type Product,
  type Size,
  useStore,
} from "./store"
import Admin from "./Admin"
import Collections from "./Collections"
import Checkout from "./Checkout"
import ProfileView from "./components/profile/ProfileView"
import Footer from "./components/Footer"
import Terms from "./Terms"
import PrivacyPolicy from "./PrivacyPolicy"
import ComplaintsBook from "./ComplaintsBook"
import { api } from "./services/api"
import { formatPEN } from "./utils/accounting"
import { sanitizeString, sanitizeUrlParam } from "./utils/security"

const SIZES: Size[] = ["S", "M", "L", "XL"]
const UNIQUE_SIZES: Size[] = ["Única"]
const money = (value: number) => formatPEN(value)

const getSubtotal = (cart: CartItem[], products: Product[]) =>
  cart.reduce(
    (sum, item) =>
      sum +
      (products.find((p) => p.id === item.productId)?.price ?? 0) *
        item.quantity,
    0,
  )

function Logo() {
  return (
    <img
      src="/logo-gone-surfing.png"
      alt="Gone Surfing Logo"
      className="brand-logo"
    />
  )
}

function Icon({ name }: { name: "search" | "user" | "bag" }) {
  if (name === "search") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        style={{ fill: "none", stroke: "currentColor", strokeWidth: 2 }}
      >
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 5 5" />
      </svg>
    )
  }
  if (name === "user") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        style={{ fill: "none", stroke: "currentColor", strokeWidth: 2 }}
      >
        <circle cx="12" cy="7" r="4" />
        <path d="M4.5 21v-2.2a7.5 7.5 0 0 1 15 0V21z" />
      </svg>
    )
  }
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ fill: "currentColor" }}
    >
      <path d="M4 8h16l-1 13H5L4 8Z" />
      <path d="M8.5 9V6a3.5 3.5 0 0 1 7 0v3" />
    </svg>
  )
}

function Header() {
  const { cart, products } = useStore()
  const count = cart.reduce((sum, item) => sum + item.quantity, 0)
  const navigate = useNavigate()
  const location = useLocation()
  const [isSearching, setIsSearching] = useState(false)
  const [query, setQuery] = useState("")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  const isHiddenRoute =
    location.pathname === "/admin" || location.pathname === "/checkout"

  const handleSearch = (e?: React.FormEvent | React.MouseEvent) => {
    if (e && e.preventDefault) e.preventDefault()
    const cleanQuery = sanitizeString(query)
    if (cleanQuery) {
      navigate(`/shop?search=${encodeURIComponent(cleanQuery)}`)
      setIsSearching(false)
      setQuery("")
    }
  }

  const liveResults = useMemo(() => {
    const cleanQuery = sanitizeString(query).toLowerCase()
    if (!cleanQuery) return []
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(cleanQuery) ||
          p.category.toLowerCase().includes(cleanQuery),
      )
      .slice(0, 3)
  }, [products, query])

  if (isHiddenRoute) return null

  return (
    <>
      <header
        className="header"
        style={{
          backgroundColor: "#000000",
          color: "#ffffff",
          borderBottom: "1px solid #1a1a1a",
          position: "relative",
          zIndex: 1000,
        }}
      >
        <button
          type="button"
          className="mobile-menu"
          aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
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
            {isMobileMenuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
        <button
          className="logo-button"
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
        <nav
          className="desktop-nav"
          style={{
            display: "flex",
            gap: "2rem",
            backgroundColor: "transparent",
          }}
        >
          <button
            onClick={() => navigate("/shop")}
            style={{
              color: "#fff",
              background: "transparent",
              border: "none",
              fontWeight: "bold",
              cursor: "pointer",
              textTransform: "uppercase",
            }}
          >
            SHOP⌄
          </button>
          <button
            onClick={() => navigate("/collections")}
            style={{
              color: "#fff",
              background: "transparent",
              border: "none",
              fontWeight: "bold",
              cursor: "pointer",
              textTransform: "uppercase",
            }}
          >
            COLLECTIONS⌄
          </button>
          <button
            onClick={() => navigate("/about")}
            style={{
              color: "#fff",
              background: "transparent",
              border: "none",
              fontWeight: "bold",
              cursor: "pointer",
              textTransform: "uppercase",
            }}
          >
            ABOUT
          </button>
        </nav>
        <div
          className="header-actions utilities"
          style={{
            display: "flex",
            gap: "1.5rem",
            color: "#fff",
            alignItems: "center",
          }}
        >
          {isSearching ? (
            <div style={{ position: "relative" }}>
              <form
                onSubmit={handleSearch}
                style={{ display: "flex", margin: 0 }}
              >
                <input
                  autoFocus
                  type="text"
                  placeholder="Buscar prenda..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onBlur={() => {
                    if (!query) setIsSearching(false)
                  }}
                  style={{
                    padding: "0.4rem 2rem 0.4rem 1rem",
                    borderRadius: "20px",
                    border: "1px solid #333",
                    outline: "none",
                    background: "#111",
                    color: "#fff",
                    fontSize: "0.8rem",
                    width: "200px",
                    transition: "all 0.3s ease",
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsSearching(false)
                    setQuery("")
                  }}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#888",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  ✕
                </button>
              </form>
              {query.trim().length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 12px)",
                    right: 0,
                    width: "320px",
                    background: "#0a0a0a",
                    borderRadius: "8px",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.8)",
                    overflow: "hidden",
                    zIndex: 100,
                    color: "#fff",
                    border: "1px solid #222",
                  }}
                >
                  {liveResults.length > 0 ? (
                    <>
                      {liveResults.map((p) => (
                        <div
                          key={p.id}
                          onMouseDown={() => {
                            navigate(
                              `/shop?search=${encodeURIComponent(p.name)}`,
                            )
                            setIsSearching(false)
                            setQuery("")
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "1rem",
                            padding: "1rem",
                            cursor: "pointer",
                            borderBottom: "1px solid #1a1a1a",
                            transition: "background 0.2s",
                          }}
                          onMouseOver={(e) =>
                            (e.currentTarget.style.backgroundColor = "#161616")
                          }
                          onMouseOut={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              "transparent")
                          }
                        >
                          <div
                            style={{
                              width: "48px",
                              height: "48px",
                              flexShrink: 0,
                              borderRadius: "4px",
                              overflow: "hidden",
                              backgroundColor: "#111",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <img
                              src={p.imageUrl || p.image}
                              alt={p.name}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          </div>
                          <div style={{ overflow: "hidden" }}>
                            <strong
                              style={{
                                display: "block",
                                fontSize: "0.85rem",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                color: "#fff",
                              }}
                            >
                              {p.name}
                            </strong>
                            <span
                              style={{ fontSize: "0.75rem", color: "#888" }}
                            >
                              {money(p.price)}
                            </span>
                          </div>
                        </div>
                      ))}
                      <div
                        onMouseDown={handleSearch}
                        style={{
                          padding: "1rem",
                          textAlign: "center",
                          fontSize: "0.75rem",
                          fontWeight: "bold",
                          background: "#111",
                          cursor: "pointer",
                          color: "#fff",
                        }}
                        onMouseOver={(e) =>
                          (e.currentTarget.style.backgroundColor = "#1a1a1a")
                        }
                        onMouseOut={(e) =>
                          (e.currentTarget.style.backgroundColor = "#111")
                        }
                      >
                        Ver todos los resultados →
                      </div>
                    </>
                  ) : (
                    <div
                      style={{
                        padding: "1.5rem 1rem",
                        textAlign: "center",
                        fontSize: "0.8rem",
                        color: "#666",
                      }}
                    >
                      No se encontraron prendas para "{query}"
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <button
              aria-label="Buscar"
              onClick={() => setIsSearching(true)}
              style={{
                color: "#fff",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                width: "24px",
              }}
            >
              <Icon name="search" />
            </button>
          )}
          <button
            aria-label="Cuenta"
            onClick={() => navigate("/profile")}
            style={{
              color: "#fff",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              width: "24px",
            }}
          >
            <Icon name="user" />
          </button>
          <button
            className="bag"
            aria-label="Carrito"
            onClick={() => navigate("/cart")}
            style={{
              color: "#fff",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              width: "24px",
              position: "relative",
            }}
          >
            <Icon name="bag" />
            {count > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-8px",
                  right: "-8px",
                  background: "white",
                  color: "black",
                  borderRadius: "50%",
                  width: "18px",
                  height: "18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "10px",
                  fontWeight: "bold",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                }}
              >
                {count}
              </span>
            )}
          </button>
        </div>
      </header>
      {isMobileMenuOpen && (
        <div
          className="mobile-dropdown-menu"
          style={{
            backgroundColor: "#111315",
            borderBottom: "1px solid #222",
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            position: "sticky",
            top: "52px",
            zIndex: 999,
          }}
        >
          <button
            onClick={() => {
              navigate("/shop")
              setIsMobileMenuOpen(false)
            }}
            style={{
              color: "#fff",
              background: "transparent",
              border: "none",
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "15px",
              fontWeight: 600,
              letterSpacing: "1.5px",
              textAlign: "left",
              cursor: "pointer",
              textTransform: "uppercase",
            }}
          >
            SHOP
          </button>
          <button
            onClick={() => {
              navigate("/collections")
              setIsMobileMenuOpen(false)
            }}
            style={{
              color: "#fff",
              background: "transparent",
              border: "none",
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "15px",
              fontWeight: 600,
              letterSpacing: "1.5px",
              textAlign: "left",
              cursor: "pointer",
              textTransform: "uppercase",
            }}
          >
            COLLECTIONS
          </button>
          <button
            onClick={() => {
              navigate("/about")
              setIsMobileMenuOpen(false)
            }}
            style={{
              color: "#fff",
              background: "transparent",
              border: "none",
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "15px",
              fontWeight: 600,
              letterSpacing: "1.5px",
              textAlign: "left",
              cursor: "pointer",
              textTransform: "uppercase",
            }}
          >
            ABOUT
          </button>
        </div>
      )}
    </>
  )
}

function Home(_props: { openPanel: (panel: string) => void }) {
  const { products, transactions } = useStore()
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const bestSellers = useMemo(() => {
    if (!products || products.length === 0) return []

    const salesMap: Record<string, number> = {}
    if (Array.isArray(transactions)) {
      for (const t of transactions) {
        if (Array.isArray(t.items)) {
          for (const item of t.items) {
            salesMap[item.productId] =
              (salesMap[item.productId] || 0) + (item.quantity || 1)
          }
        }
      }
    }

    return [...products]
      .sort(
        (a, b) =>
          ((b.salesCount ?? salesMap[b.id]) || 0) -
          ((a.salesCount ?? salesMap[a.id]) || 0),
      )
      .slice(0, 4)
  }, [products, transactions])

  const categories = useMemo(
    () => [
      {
        title: "NEW ARRIVALS",
        image: "/assets/cat-new-arrivals.png",
        url: "/shop?category=NEW%20ARRIVALS",
      },
      {
        title: "ACCESORIOS",
        image: "/assets/cat-accesorios.png",
        url: "/shop?category=ACCESORIOS",
      },
      {
        title: "MERCH",
        image: "/assets/cat-merch.png",
        url: "/shop?category=MERCH",
      },
      {
        title: "BEST SELLERS",
        image:
          bestSellers[0]?.image ||
          products.find(
            (p) => p.category?.toUpperCase() === "BEST SELLERS" && p.image,
          )?.image ||
          products[0]?.image ||
          "/assets/cat-new-arrivals.png",
        url: "/shop?filter=bestsellers",
      },
    ],
    [bestSellers, products],
  )

  const stories = [
    { title: "STAY REAL", image: "/assets/story.jpg", url: "about" },
    {
      title: "YOUTUBE",
      image: "/assets/underwater.jpg",
      word: "NEW\nWAVES",
      url: "https://www.youtube.com/c/WorldSurfLeague",
    },
    {
      title: "STORIES / MAGAZINE",
      image: "/assets/magazine.jpg",
      url: "https://www.surfer.com/",
    },
    {
      title: "SURF TRIPS",
      image: "/assets/trips.jpg",
      url: "https://www.surfline.com/travel/",
    },
  ]

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (isPlaying) {
      video.pause()
      setIsPlaying(false)
    } else {
      video
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false))
    }
  }

  const openStory = (url: string) => {
    if (url === "about") {
      navigate("/about")
    } else {
      window.open(url, "_blank", "noopener,noreferrer")
    }
  }

  return (
    <main>
      <button
        className="hero"
        aria-label="Ver colección"
        onClick={() => navigate("/shop")}
      >
        <img src="/assets/hero-surf.jpg" alt="Surfista" />
      </button>
      <section
        className="category-grid"
        aria-label="Colecciones"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "20px",
        }}
      >
        {categories.map((category) => (
          <Link
            key={category.title}
            to={category.url}
            style={{
              padding: 0,
              border: 0,
              background: "transparent",
              textAlign: "left",
              color: "inherit",
              textDecoration: "none",
              display: "block",
            }}
          >
            <span
              className="category-image"
              style={{
                backgroundColor: "#f5f4f2",
                width: "100%",
                aspectRatio: "1 / 1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                borderRadius: "2px",
              }}
            >
              <img
                src={category.image}
                alt={category.title}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  padding: "16px",
                  mixBlendMode: "multiply",
                  display: "block",
                  boxSizing: "border-box",
                  transition: "transform 0.4s ease",
                }}
              />
            </span>
            <strong>{category.title}</strong>
          </Link>
        ))}
      </section>

      <section
        className="video-block"
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16/9",
          maxHeight: "80vh",
          backgroundColor: "#000",
          overflow: "hidden",
          display: "flex",
          cursor: "pointer",
        }}
        onClick={togglePlay}
      >
        <video
          ref={videoRef}
          src="/assets/video.mp4"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          loop
          playsInline
          onEnded={() => setIsPlaying(false)}
        />
        {!isPlaying && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.3)",
              pointerEvents: "none",
            }}
          ></div>
        )}
        <button
          aria-label={isPlaying ? "Pausar video" : "Reproducir video"}
          onClick={(e) => {
            e.stopPropagation()
            togglePlay()
          }}
          style={{
            position: "absolute",
            bottom: "2rem",
            left: "2.5rem",
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            border: "2px solid rgba(255, 255, 255, 0.8)",
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            cursor: "pointer",
            zIndex: 2,
            backdropFilter: "blur(4px)",
            transition: "transform 0.2s ease",
          }}
          onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
          onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {isPlaying ? (
            <svg
              viewBox="0 0 24 24"
              style={{ fill: "white", width: "20px", height: "20px" }}
            >
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              style={{
                fill: "white",
                width: "22px",
                height: "22px",
                marginLeft: "4px",
              }}
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </section>
      <section className="story-grid">
        {stories.map((story) => (
          <article
            key={story.title}
            role="button"
            tabIndex={0}
            onClick={() => openStory(story.url)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                openStory(story.url)
              }
            }}
          >
            <img src={story.image} alt="" />
            {story.word && <b>{story.word}</b>}
            <span>{story.title}</span>
          </article>
        ))}
      </section>
    </main>
  )
}

function ProductCard({ product }: { product: Product }) {
  const { addToCart, cart } = useStore()
  const isUnique =
    product.category === "Accesorios" || /gorra/i.test(product.name)
  const sizes = isUnique ? UNIQUE_SIZES : SIZES

  const [size, setSize] = useState<Size>(
    () => sizes.find((s) => (product.stocks[s] ?? 0) > 0) ?? sizes[0],
  )
  const [added, setAdded] = useState(false)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    const firstAvailable =
      sizes.find((s) => (product.stocks[s] ?? 0) > 0) ?? sizes[0]
    setSize((current) =>
      sizes.includes(current) && (product.stocks[current] ?? 0) > 0
        ? current
        : firstAvailable,
    )
  }, [product, sizes])

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [])

  const inCartQty =
    cart.find((item) => item.productId === product.id && item.size === size)
      ?.quantity ?? 0
  const availableStock = product.stocks[size] ?? 0
  const totalProductStock = Object.values(product.stocks).reduce(
    (sum, v) => sum + (v || 0),
    0,
  )
  const isEntirelyOutOfStock = totalProductStock <= 0
  const reachedMaxStock = availableStock <= 0 || inCartQty >= availableStock

  const add = () => {
    if (reachedMaxStock) return
    addToCart(product.id, size)
    setAdded(true)
    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => setAdded(false), 900)
  }

  return (
    <article className="product-card">
      <div className="product-photo">
        <img src={product.imageUrl || product.image} alt={product.name} />
        <span>{product.category}</span>
      </div>
      <div className="product-info">
        <div>
          <h2>{product.name}</h2>
          <p>{money(product.price)}</p>
        </div>
        <div className="sizes" aria-label="Seleccionar talla">
          {sizes.map((opt) => (
            <button
              key={opt}
              className={size === opt ? "selected" : ""}
              disabled={(product.stocks[opt] ?? 0) === 0}
              onClick={() => setSize(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
        <button
          className="black-button"
          onClick={add}
          disabled={reachedMaxStock}
        >
          {added
            ? "AÑADIDO"
            : isEntirelyOutOfStock
              ? "AGOTADO"
              : availableStock === 0
                ? "TALLA AGOTADA"
                : reachedMaxStock
                  ? "MÁX. EN BOLSA"
                  : "AGREGAR AL CARRITO"}
        </button>
      </div>
    </article>
  )
}

function Shop() {
  const { products, transactions } = useStore()
  const [params, setParams] = useSearchParams()
  const filterParam = sanitizeUrlParam(params.get("filter")).toLowerCase()
  const rawCategory = sanitizeUrlParam(params.get("category")).toUpperCase()
  const isBestSellers =
    filterParam === "bestsellers" || rawCategory === "BEST SELLERS"
  const isNewArrivals =
    rawCategory === "NEW ARRIVALS" ||
    rawCategory === "NEW-ARRIVALS" ||
    rawCategory === "NEWARRIVALS" ||
    filterParam === "newarrivals" ||
    filterParam === "new-arrivals"
  const category = isBestSellers
    ? "BEST SELLERS"
    : isNewArrivals
      ? "NEW ARRIVALS"
      : rawCategory
  const collectionParam = sanitizeUrlParam(params.get("collection"))
  const searchParam = sanitizeUrlParam(params.get("search")).toLowerCase()
  const navigate = useNavigate()

  const visibleProducts = useMemo(() => {
    const filtered = products.filter((p) => {
      if (searchParam)
        return (
          p.name.toLowerCase().includes(searchParam) ||
          p.category.toLowerCase().includes(searchParam)
        )
      if (collectionParam) return p.collectionName === collectionParam
      if (isBestSellers) return true
      if (isNewArrivals) return true
      if (!category || category === "ALL PRODUCTS") return true
      const prodCat = p.category.toUpperCase().trim()
      if (category === "ACCESORIOS") return prodCat === "ACCESORIOS"
      if (category === "MERCH") return prodCat === "MERCH"
      return prodCat === category
    })

    if (isBestSellers) {
      const salesMap: Record<string, number> = {}
      if (Array.isArray(transactions)) {
        for (const t of transactions) {
          if (Array.isArray(t.items)) {
            for (const item of t.items) {
              salesMap[item.productId] =
                (salesMap[item.productId] || 0) + (item.quantity || 1)
            }
          }
        }
      }

      return [...filtered].sort((a, b) => {
        const countA = (a.salesCount ?? salesMap[a.id]) || 0
        const countB = (b.salesCount ?? salesMap[b.id]) || 0
        return countB - countA
      })
    }

    if (isNewArrivals) {
      return [...filtered]
        .sort((a, b) => {
          const timeA = a.createdAt
            ? new Date(a.createdAt).getTime()
            : parseInt((a.id || "").replace(/\D/g, ""), 10) || 0
          const timeB = b.createdAt
            ? new Date(b.createdAt).getTime()
            : parseInt((b.id || "").replace(/\D/g, ""), 10) || 0
          return timeB - timeA
        })
        .slice(0, 12)
    }

    return filtered
  }, [
    products,
    searchParam,
    collectionParam,
    category,
    isBestSellers,
    isNewArrivals,
    transactions,
  ])

  const pageTitle = searchParam
    ? `RESULTADOS PARA: "${searchParam.toUpperCase()}"`
    : collectionParam
      ? `COLECCIÓN: ${collectionParam}`
      : isBestSellers
        ? "BEST SELLERS"
        : category || "ALL PRODUCTS"
  const shopCategories = [
    "ALL PRODUCTS",
    "NEW ARRIVALS",
    "ACCESORIOS",
    "MERCH",
    "BEST SELLERS",
  ]

  return (
    <main
      className="page shop-page flex-1 flex flex-col"
      style={{ padding: "2rem 5%", minHeight: "80vh", flex: "1 0 auto" }}
    >
      <div className="page-title" style={{ marginBottom: "1.5rem" }}>
        <p
          style={{
            margin: 0,
            fontSize: "0.75rem",
            fontWeight: "bold",
            color: "#666",
            textTransform: "uppercase",
          }}
        >
          GONE SURFING / SHOP
        </p>
        <h1
          style={{
            margin: "0.5rem 0",
            fontSize: "3rem",
            textTransform: "uppercase",
            letterSpacing: "-1px",
          }}
        >
          {pageTitle}
        </h1>
      </div>
      {!searchParam && (
        <div
          className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between border-b border-[#e5e5e5] pb-4 mb-10 w-full"
        >
          <nav
            className="flex flex-wrap items-center gap-x-4 gap-y-2 md:gap-6 w-full md:w-auto"
          >
            {shopCategories.map((cat) => {
              const isActive =
                !collectionParam &&
                ((cat === "BEST SELLERS" && isBestSellers) ||
                  (category === cat && !isBestSellers) ||
                  (!category && !isBestSellers && cat === "ALL PRODUCTS"))
              return (
                <button
                  key={cat}
                  onClick={() => {
                    if (cat === "ALL PRODUCTS") {
                      navigate("/shop")
                    } else if (cat === "BEST SELLERS") {
                      setParams({ filter: "bestsellers" })
                    } else {
                      setParams({ category: cat })
                    }
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: isActive ? "bold" : "600",
                    color: isActive ? "#000" : "#999",
                    textTransform: "uppercase",
                    padding: "0.5rem 0",
                    transition: "color 0.2s ease",
                  }}
                >
                  {cat}
                </button>
              )
            })}
          </nav>
          <span
            className="self-end md:self-auto whitespace-nowrap"
            style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#666" }}
          >
            {visibleProducts.length} ITEMS
          </span>
        </div>
      )}
      {visibleProducts.length === 0 ? (
        <div
          className="empty-state-container"
          style={{
            padding: "5rem 1rem",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "45vh",
          }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "2px",
              color: "#888",
              fontWeight: 600,
              marginBottom: "1rem",
            }}
          >
            GONE SURFING / TIENDA
          </span>
          <h2
            style={{
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: "clamp(2rem, 5vw, 3rem)",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "-0.5px",
              color: "#111",
              margin: "0 0 2rem 0",
              lineHeight: 1.1,
            }}
          >
            EL CATÁLOGO SE ESTÁ ACTUALIZANDO. VUELVE PRONTO.
          </h2>
          <button
            onClick={() => navigate("/")}
            className="black-button"
            style={{
              width: "auto",
              padding: "0.9rem 2.5rem",
              fontSize: "0.85rem",
              letterSpacing: "1.5px",
            }}
          >
            VOLVER AL INICIO
          </button>
        </div>
      ) : (
        <section className="product-grid">
          {visibleProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </section>
      )}
    </main>
  )
}

function Cart() {
  const { products, cart, changeQuantity, removeFromCart } = useStore()
  const navigate = useNavigate()
  const subtotal = getSubtotal(cart, products)

  return (
    <main className="page cart-page">
      <div className="page-title row-title">
        <div>
          <p>GONE SURFING / BAG</p>
          <h1>YOUR BAG</h1>
        </div>
        <span>{cart.reduce((sum, item) => sum + item.quantity, 0)} ITEMS</span>
      </div>
      {cart.length === 0 ? (
        <section className="empty">
          <h2>YOUR BAG IS EMPTY</h2>
          <button className="black-button" onClick={() => navigate("/shop")}>
            EXPLORE SHOP
          </button>
        </section>
      ) : (
        <div className="cart-layout">
          <section>
            {cart.map((item) => {
              const product = products.find((p) => p.id === item.productId)
              if (!product) return null
              const maxStock = product.stocks[item.size] ?? 0
              return (
                <article
                  className="cart-item"
                  key={`${item.productId}-${item.size}`}
                >
                  <img
                    src={product.imageUrl || product.image}
                    alt={product.name}
                  />
                  <div className="cart-copy">
                    <h2>{product.name}</h2>
                    <p>SIZE: {item.size}</p>
                    <p>{money(product.price)}</p>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.productId, item.size)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#dc2626",
                        fontSize: "0.72rem",
                        padding: 0,
                        cursor: "pointer",
                        marginTop: "4px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "3px",
                        fontWeight: 600,
                      }}
                      title="Eliminar prenda de la bolsa"
                    >
                      ✕ Eliminar
                    </button>
                  </div>
                  <div className="quantity">
                    <button
                      onClick={() =>
                        changeQuantity(item.productId, item.size, -1)
                      }
                    >
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() =>
                        changeQuantity(item.productId, item.size, 1)
                      }
                      disabled={item.quantity >= maxStock}
                    >
                      +
                    </button>
                  </div>
                  <strong>{money(product.price * item.quantity)}</strong>
                </article>
              )
            })}
          </section>
          <aside className="summary">
            <h2>ORDER SUMMARY</h2>
            <div>
              <span>SUBTOTAL</span>
              <b>{money(subtotal)}</b>
            </div>
            <p>Shipping calculated at checkout.</p>
            <button
              className="black-button"
              onClick={() => navigate("/checkout")}
            >
              CHECKOUT
            </button>
          </aside>
        </div>
      )}
    </main>
  )
}

function Profile() {
  return <ProfileView />
}

function LoginRedirect() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get("email")
  const target = email
    ? `/profile?mode=login&email=${encodeURIComponent(email)}`
    : "/profile?mode=login"
  return <Navigate to={target} replace />
}

function RegisterRedirect() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get("email")
  const target = email
    ? `/profile?mode=register&email=${encodeURIComponent(email)}`
    : "/profile?mode=register"
  return <Navigate to={target} replace />
}

function AppContent() {
  const location = useLocation()
  const [panel, setPanel] = useState<string | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = dialog.current
    if (!d) return
    if (panel) {
      if (!d.open) d.showModal()
    } else if (d.open) {
      d.close()
    }
  }, [panel])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [location.pathname])

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#fff",
      }}
    >
      <Header />
      <div
        className="flex-1 flex flex-col"
        style={{
          flex: "1 0 auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Routes>
          <Route path="/" element={<Home openPanel={setPanel} />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<LoginRedirect />} />
          <Route path="/register" element={<RegisterRedirect />} />
          <Route
            path="/about"
            element={
              <main className="page">
                <div className="page-title">
                  <h1>STAY REAL</h1>
                </div>
                <p>SURF CULTURE FROM LIMA, PERÚ.</p>
              </main>
            }
          />
          <Route path="/terminos" element={<Terms />} />
          <Route path="/privacidad" element={<PrivacyPolicy />} />
          <Route path="/libro-reclamaciones" element={<ComplaintsBook />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </div>
      <Footer openChat={() => setPanel("chat")} />
      <dialog
        ref={dialog}
        onCancel={() => setPanel(null)}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          margin: 0,
          padding: 0,
          border: "none",
          background: "black",
          width: "90vw",
          maxWidth: "900px",
          zIndex: 9999,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        }}
      >
        <div
          style={{
            padding: "10px",
            display: "flex",
            justifyContent: "flex-end",
            backgroundColor: "black",
          }}
        >
          <button
            aria-label="Cerrar"
            onClick={() => setPanel(null)}
            style={{
              background: "transparent",
              border: "none",
              color: "white",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            Cerrar ✕
          </button>
        </div>
        <div style={{ padding: "3rem", color: "white", textAlign: "center" }}>
          <h2 style={{ textTransform: "uppercase", marginBottom: "1rem" }}>
            {panel || "Chat"}
          </h2>
          <p>Contenido pendiente de proporcionar.</p>
        </div>
      </dialog>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <StoreProvider>
        <AppContent />
      </StoreProvider>
    </BrowserRouter>
  )
}

export { api }
