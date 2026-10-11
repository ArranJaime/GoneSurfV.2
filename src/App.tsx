import { type FormEvent, useEffect, useMemo, useRef, useState } from "react"
import {
  BrowserRouter,
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom"
import { StoreProvider, type Product, type Size, useStore } from "./store"

type View = "home" | "shop" | "cart" | "checkout" | "admin" | "about"
type DateFilter = "today" | "week" | "month" | "custom"

const money = (value: number) => `S/. ${value.toFixed(2)}`
const SIZES: Size[] = ["S", "M", "L", "XL"]

function Logo() {
  return (
    <span className="logo" aria-label="Gone Surfing">
      GONE
      <br />
      SURFING
    </span>
  )
}

function Icon({ name }: { name: "search" | "user" | "bag" }) {
  if (name === "search")
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 5 5" />
      </svg>
    )
  if (name === "user")
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="7" r="4" />
        <path d="M4.5 21v-2.2a7.5 7.5 0 0 1 15 0V21z" />
      </svg>
    )
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 8h16l-1 13H5L4 8Z" />
      <path d="M8.5 9V6a3.5 3.5 0 0 1 7 0v3" />
    </svg>
  )
}

function Header({ view, go }: { view: View; go: (view: View) => void }) {
  const { cart } = useStore()
  const count = cart.reduce((sum, item) => sum + item.quantity, 0)
  return (
    <header className="header">
      <button className="logo-button" onClick={() => go("home")}>
        <Logo />
      </button>
      <nav>
        <button
          className={view === "shop" ? "active" : ""}
          onClick={() => go("shop")}
        >
          SHOP⌄
        </button>
        <button onClick={() => go("shop")}>COLLECTIONS⌄</button>
        <button onClick={() => go("about")}>ABOUT</button>
      </nav>
      <div className="header-actions">
        <button aria-label="Buscar" onClick={() => go("shop")}>
          <Icon name="search" />
        </button>
        <button aria-label="Administración" onClick={() => go("admin")}>
          <Icon name="user" />
        </button>
        <button className="bag" aria-label="Carrito" onClick={() => go("cart")}>
          <Icon name="bag" />
          {count > 0 && <span>{count}</span>}
        </button>
      </div>
    </header>
  )
}

function Home({
  go,
  openVideo,
  openPanel,
}: {
  go: (view: View) => void
  openVideo: () => void
  openPanel: (panel: string) => void
}) {
  const { products } = useStore()
  const categories = [
    { title: "NEW ARRIVALS", image: products[1].image },
    { title: "ACCESORIOS", image: products[2].image },
    { title: "MERCH", image: products[0].image },
    { title: "BEST SELLERS", image: products[3].image },
  ]
  const stories = [
    { title: "STAY REAL", image: "/assets/story.jpg" },
    { title: "YOUTUBE", image: "/assets/underwater.jpg", word: "NEW\nWAVES" },
    { title: "STORIES / MAGAZINE", image: "/assets/magazine.jpg" },
    { title: "SURF TRIPS", image: "/assets/trips.jpg" },
  ]
  return (
    <main>
      <button
        className="hero"
        aria-label="Ver colección"
        onClick={() => go("shop")}
      >
        <img src="/assets/hero-surf.jpg" alt="Surfista dentro de una ola" />
      </button>
      <section className="category-grid" aria-label="Colecciones">
        {categories.map((category) => (
          <Link
            key={category.title}
            to={`/shop?category=${encodeURIComponent(category.title)}`}
            style={{
              padding: 0,
              border: 0,
              background: "white",
              textAlign: "left",
              color: "inherit",
              textDecoration: "none",
            }}
          >
            <span className="category-image">
              <img src={category.image} alt="" />
            </span>
            <strong>{category.title}</strong>
          </Link>
        ))}
      </section>
      <section className="video-block">
        <img src="/assets/underwater.jpg" alt="Surfista bajo una ola" />
        <button
          className="play"
          aria-label="Reproducir video"
          onClick={openVideo}
        >
          <span />
        </button>
      </section>
      <section className="story-grid">
        {stories.map((story) => (
          <article
            key={story.title}
            role="button"
            tabIndex={0}
            onClick={() =>
              story.title === "STAY REAL"
                ? go("about")
                : story.title === "YOUTUBE"
                  ? openVideo()
                  : openPanel(story.title === "SURF TRIPS" ? "trips" : "story")
            }
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                event.currentTarget.click()
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
  const { addToCart } = useStore()
  const sizes = product.category === "Accesorios" ? ["Única"] as Size[] : SIZES
  const [size, setSize] = useState<Size>(sizes[0])
  const [added, setAdded] = useState(false)
  useEffect(() => {
    setSize(
      product.category === "Accesorios" || /gorra/i.test(product.name)
        ? "Única"
        : "S",
    )
  }, [product.category, product.name])
  const add = () => {
    addToCart(product.id, size)
    setAdded(true)
    window.setTimeout(() => setAdded(false), 900)
  }
  return (
    <article className="product-card">
      <div className="product-photo">
        <img src={product.image} alt={product.name} />
        <span>{product.category}</span>
      </div>
      <div className="product-info">
        <div>
          <h2>{product.name}</h2>
          <p>{money(product.price)}</p>
        </div>
        <div className="sizes" aria-label="Seleccionar talla">
          {sizes.map((option) => (
            <button
              key={option}
              className={size === option ? "selected" : ""}
              disabled={product.stocks[option] === 0}
              onClick={() => setSize(option)}
            >
              {option}
            </button>
          ))}
        </div>
        <button
          className="black-button"
          onClick={add}
          disabled={product.stocks[size] === 0}
        >
          {added ? "AÑADIDO" : "AGREGAR AL CARRITO"}
        </button>
      </div>
    </article>
  )
}

function Shop() {
  const { products } = useStore()
  const [params] = useSearchParams()
  const category = params.get("category")?.toUpperCase()
  const visibleProducts = products.filter(
    (product) =>
      !category ||
      category === "NEW ARRIVALS" ||
      category === "BEST SELLERS" ||
      product.category.toUpperCase() === category,
  )
  return (
    <main className="page shop-page">
      <div className="page-title">
        <p>GONE SURFING / SHOP</p>
        <h1>ALL PRODUCTS</h1>
        <span>{visibleProducts.length} ITEMS</span>
      </div>
      <section className="product-grid">
        {visibleProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </section>
    </main>
  )
}

function Cart({ go }: { go: (view: View) => void }) {
  const { products, cart, changeQuantity } = useStore()
  const subtotal = cart.reduce((sum, item) => {
    const product = products.find(
      (candidate) => candidate.id === item.productId,
    )
    return sum + (product?.price ?? 0) * item.quantity
  }, 0)
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
          <button className="black-button" onClick={() => go("shop")}>
            EXPLORE SHOP
          </button>
        </section>
      ) : (
        <div className="cart-layout">
          <section>
            {cart.map((item) => {
              const product = products.find(
                (candidate) => candidate.id === item.productId,
              )
              if (!product) return null
              return (
                <article
                  className="cart-item"
                  key={`${item.productId}-${item.size}`}
                >
                  <img src={product.image} alt={product.name} />
                  <div className="cart-copy">
                    <h2>{product.name}</h2>
                    <p>SIZE: {item.size}</p>
                    <p>{money(product.price)}</p>
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
            <button className="black-button" onClick={() => go("checkout")}>
              CHECKOUT
            </button>
          </aside>
        </div>
      )}
    </main>
  )
}

function Checkout({ go }: { go: (view: View) => void }) {
  const { products, cart, completeOrder } = useStore()
  const [express, setExpress] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const subtotal = cart.reduce((sum, item) => {
    const product = products.find(
      (candidate) => candidate.id === item.productId,
    )
    return sum + (product?.price ?? 0) * item.quantity
  }, 0)
  const shipping = express ? 30 : subtotal >= 300 ? 0 : 15
  const base = subtotal / 1.18
  const igv = subtotal - base
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    try {
      const order = completeOrder({
        customer: String(data.get("customer")),
        email: String(data.get("email")),
        district: String(data.get("district")),
        address: String(data.get("address")),
        shipping,
      })
      setSuccess(order.id)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudo completar el pedido.",
      )
    }
  }
  if (success)
    return (
      <main className="page confirmation">
        <p>ORDER CONFIRMED</p>
        <h1>THANK YOU.</h1>
        <span>Pedido {success}</span>
        <button className="black-button" onClick={() => go("home")}>
          BACK HOME
        </button>
      </main>
    )
  return (
    <main className="page checkout-page">
      <div className="page-title">
        <p>SECURE CHECKOUT</p>
        <h1>DELIVERY DETAILS</h1>
      </div>
      <form className="checkout-layout" onSubmit={submit}>
        <section className="form-panel">
          <label>
            NOMBRE COMPLETO
            <input name="customer" required autoComplete="name" />
          </label>
          <label>
            CORREO ELECTRÓNICO
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label>
            DISTRITO
            <input name="district" required />
          </label>
          <label>
            DIRECCIÓN
            <input name="address" required autoComplete="street-address" />
          </label>
          <fieldset>
            <legend>TIPO DE ENVÍO</legend>
            <label className="radio">
              <input
                type="radio"
                checked={!express}
                onChange={() => setExpress(false)}
              />
              ESTÁNDAR — {subtotal >= 300 ? "GRATIS" : money(15)}
            </label>
            <label className="radio">
              <input
                type="radio"
                checked={express}
                onChange={() => setExpress(true)}
              />
              EXPRESS — {money(30)}
            </label>
          </fieldset>
        </section>
        <aside className="summary tax-summary">
          {error && <p role="alert">{error}</p>}
          <h2>PAYMENT SUMMARY</h2>
          <div>
            <span>SUBTOTAL ITEMS</span>
            <b>{money(subtotal)}</b>
          </div>
          <div>
            <span>BASE IMPONIBLE</span>
            <b>{money(base)}</b>
          </div>
          <div>
            <span>IGV (18%) INCLUIDO</span>
            <b>{money(igv)}</b>
          </div>
          <div>
            <span>ENVÍO</span>
            <b>{shipping === 0 ? "GRATIS" : money(shipping)}</b>
          </div>
          <div className="total">
            <span>TOTAL</span>
            <b>{money(subtotal + shipping)}</b>
          </div>
          <button className="black-button" disabled={cart.length === 0}>
            COMPLETE ORDER
          </button>
        </aside>
      </form>
    </main>
  )
}

function Login({ onLogin }: { onLogin: () => void }) {
  const [error, setError] = useState(false)
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    if (data.get("user") === "admin" && data.get("password") === "admin666") {
      sessionStorage.setItem("gone_admin", "true")
      onLogin()
    } else setError(true)
  }
  return (
    <main className="login-page">
      <section>
        <Logo />
        <p>PRIVATE ACCESS</p>
        <h1>ADMIN LOGIN</h1>
        <form onSubmit={submit}>
          <label>
            USUARIO
            <input name="user" required />
          </label>
          <label>
            CONTRASEÑA
            <input name="password" type="password" required />
          </label>
          {error && <small>Credenciales incorrectas.</small>}
          <button className="black-button">ENTER DASHBOARD</button>
        </form>
      </section>
    </main>
  )
}

function escapeCsv(value: string | number) {
  const text = String(value)
  return `"${(/^[=+\-@\t\r]/.test(text) ? "'" + text : text).replace(/"/g, '""')}"`
}

function Admin() {
  const { products, transactions, changeStock } = useStore()
  const [filter, setFilter] = useState<DateFilter>("week")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const filtered = useMemo(() => {
    const now = new Date()
    const start = new Date(now)
    if (filter === "today") start.setHours(0, 0, 0, 0)
    if (filter === "week") start.setDate(now.getDate() - 7)
    if (filter === "month") start.setDate(now.getDate() - 30)
    return transactions.filter((transaction) => {
      const date = new Date(transaction.date)
      if (filter === "custom") {
        if (from && date < new Date(`${from}T00:00:00`)) return false
        if (to && date > new Date(`${to}T23:59:59`)) return false
        return true
      }
      return date >= start && date <= now
    })
  }, [transactions, filter, from, to])
  const revenue = filtered.reduce((sum, item) => sum + item.total, 0)
  const taxes = filtered.reduce((sum, item) => sum + item.igv, 0)
  function exportCsv() {
    const headers = [
      "ID",
      "Fecha",
      "Cliente",
      "Distrito",
      "Dirección",
      "Detalle de Prendas",
      "Subtotal",
      "IGV",
      "Total",
    ]
    const rows = filtered.map((item) =>
      [
        item.id,
        new Date(item.date).toLocaleString("es-PE"),
        item.customer,
        item.district,
        item.address,
        item.detail,
        item.subtotal.toFixed(2),
        item.igv.toFixed(2),
        item.total.toFixed(2),
      ]
        .map(escapeCsv)
        .join(";"),
    )
    const blob = new Blob([`\uFEFF${headers.join(";")}\n${rows.join("\n")}`], {
      type: "text/csv;charset=utf-8",
    })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "gone-transacciones.csv"
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000)
  }
  return (
    <main className="admin-page">
      <div className="admin-heading">
        <div>
          <p>GONE SURFING / ADMIN</p>
          <h1>DASHBOARD</h1>
        </div>
        <button className="outline-button" onClick={exportCsv}>
          EXPORTAR CSV
        </button>
      </div>
      <div className="filters">
        {([
          ["today", "HOY"],
          ["week", "ÚLTIMOS 7 DÍAS"],
          ["month", "MES"],
          ["custom", "RANGO PERSONALIZADO"],
        ] as [DateFilter, string][]).map(([value, label]) => (
          <button
            className={filter === value ? "selected" : ""}
            onClick={() => setFilter(value)}
            key={value}
          >
            {label}
          </button>
        ))}
        {filter === "custom" && (
          <>
            <input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
            />
            <input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
          </>
        )}
      </div>
      <section className="kpis">
        <article>
          <span>RECAUDACIÓN</span>
          <strong>{money(revenue)}</strong>
          <small>{filtered.length} TRANSACCIONES</small>
        </article>
        <article>
          <span>IGV ACUMULADO</span>
          <strong>{money(taxes)}</strong>
          <small>INCLUIDO EN VENTAS</small>
        </article>
        <article>
          <span>STOCK TOTAL</span>
          <strong>
            {products.reduce(
              (sum, product) =>
                sum + Object.values(product.stocks).reduce((a, b) => a + b, 0),
              0,
            )}
          </strong>
          <small>UNIDADES DISPONIBLES</small>
        </article>
      </section>
      <section className="admin-section">
        <div className="section-heading">
          <h2>PRODUCTOS & STOCK</h2>
          <span>CONTROL POR VARIANTE</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>PRODUCTO</th>
                <th>CATEGORÍA</th>
                <th>PRECIO</th>
                <th>STOCK POR TALLA</th>
                <th>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const sizes =
                  product.category === "Accesorios"
                    ? ["Única"] as Size[]
                    : SIZES
                const total = Object.values(product.stocks).reduce(
                  (sum, value) => sum + value,
                  0,
                )
                return (
                  <tr key={product.id}>
                    <td>
                      <div className="table-product">
                        <img src={product.image} alt="" />
                        <b>{product.name}</b>
                      </div>
                    </td>
                    <td>{product.category}</td>
                    <td>{money(product.price)}</td>
                    <td>
                      <div className="stock-list">
                        {sizes.map((size) => (
                          <div className="stock-pill" key={size}>
                            <b>{size}</b>
                            <button
                              onClick={() => changeStock(product.id, size, -1)}
                            >
                              −
                            </button>
                            <span>{product.stocks[size]}</span>
                            <button
                              onClick={() => changeStock(product.id, size, 1)}
                            >
                              +
                            </button>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td>
                      <b>{total}</b>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
      <section className="admin-section">
        <div className="section-heading">
          <h2>TRANSACCIONES</h2>
          <span>{filtered.length} RESULTADOS</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID / FECHA</th>
                <th>CLIENTE</th>
                <th>ENTREGA</th>
                <th>DETALLE DE PRENDAS</th>
                <th>IGV</th>
                <th>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td>
                    <b>{item.id}</b>
                    <small>{new Date(item.date).toLocaleString("es-PE")}</small>
                  </td>
                  <td>
                    {item.customer}
                    <small>{item.email}</small>
                  </td>
                  <td>
                    {item.district}
                    <small>{item.address}</small>
                  </td>
                  <td>{item.detail}</td>
                  <td>{money(item.igv)}</td>
                  <td>
                    <b>{money(item.total)}</b>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

function Footer({ openChat }: { openChat: () => void }) {
  return (
    <footer>
      <Logo />
      <p>SURF CULTURE FROM LIMA, PERÚ.</p>
      <button onClick={openChat}>◯ &nbsp; Chat</button>
    </footer>
  )
}

function AppContent() {
  const location = useLocation()
  const navigate = useNavigate()
  const path = location.pathname.slice(1)
  const view: View = ["shop", "cart", "checkout", "admin", "about"].includes(
    path,
  )
    ? path as View
    : "home"
  const [isVideoOpen, setIsVideoOpen] = useState(false)
  const [panel, setPanel] = useState<string | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const videoId = import.meta.env.VITE_YOUTUBE_VIDEO_ID as string | undefined
  useEffect(() => {
    if (isVideoOpen || panel) dialog.current?.showModal()
    else dialog.current?.close()
  }, [isVideoOpen, panel])
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [location.pathname])
  const [admin, setAdmin] = useState(
    () => sessionStorage.getItem("gone_admin") === "true",
  )
  const go = (next: View) => {
    navigate(next === "home" ? "/" : `/${next}`)
  }
  return (
    <>
      <Header view={view} go={go} />
      {view === "home" && (
        <Home
          go={go}
          openVideo={() => setIsVideoOpen(true)}
          openPanel={setPanel}
        />
      )}
      {view === "shop" && <Shop />}
      {view === "cart" && <Cart go={go} />}
      {view === "checkout" && <Checkout go={go} />}
      {view === "admin" &&
        (admin ? <Admin /> : <Login onLogin={() => setAdmin(true)} />)}
      {view === "about" && (
        <main className="page">
          <div className="page-title">
            <h1>STAY REAL</h1>
          </div>
          <p>SURF CULTURE FROM LIMA, PERÚ.</p>
        </main>
      )}
      {view !== "admin" && <Footer openChat={() => setPanel("chat")} />}
      <dialog
        ref={dialog}
        onCancel={() => {
          setIsVideoOpen(false)
          setPanel(null)
        }}
      >
        <button
          aria-label="Cerrar"
          onClick={() => {
            setIsVideoOpen(false)
            setPanel(null)
          }}
        >
          Cerrar
        </button>
        {isVideoOpen ? (
          videoId && /^[\w-]{11}$/.test(videoId) ? (
            <iframe
              title="GONE SURFING — YouTube"
              src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <p>Video pendiente de configuración.</p>
          )
        ) : (
          <>
            <h2>
              {panel === "trips"
                ? "SURF TRIPS"
                : panel === "story"
                  ? "STORIES / MAGAZINE"
                  : "Chat"}
            </h2>
            <p>Contenido pendiente de proporcionar.</p>
          </>
        )}
      </dialog>
    </>
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
