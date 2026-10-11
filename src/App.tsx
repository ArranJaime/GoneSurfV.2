import { type FormEvent, useEffect, useRef, useState } from "react"
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom"
import { StoreProvider, type Product, type Size, useStore } from "./store"
import Admin from "./Admin"
import Collections from "./Collections"

type View = "home" | "shop" | "cart" | "checkout" | "about"

const SIZES: Size[] = ["S", "M", "L", "XL"]
const money = (value: number) => `S/. ${value.toFixed(2)}`
const getSubtotal = (cart: any[], products: Product[]) =>
  cart.reduce((sum, item) => sum + (products.find((p) => p.id === item.productId)?.price ?? 0) * item.quantity, 0)

function Logo() {
  return (
    <span className="logo" aria-label="Gone Surfing" style={{ color: '#fff' }}>
      GONE<br />SURFING
    </span>
  )
}

function Icon({ name }: { name: "search" | "user" | "bag" }) {
  if (name === "search")
    return <svg viewBox="0 0 24 24" aria-hidden="true" style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 2 }}><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></svg>
  if (name === "user")
    return <svg viewBox="0 0 24 24" aria-hidden="true" style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 2 }}><circle cx="12" cy="7" r="4" /><path d="M4.5 21v-2.2a7.5 7.5 0 0 1 15 0V21z" /></svg>
  return <svg viewBox="0 0 24 24" aria-hidden="true" style={{ fill: 'currentColor' }}><path d="M4 8h16l-1 13H5L4 8Z" /><path d="M8.5 9V6a3.5 3.5 0 0 1 7 0v3" /></svg>
}

function Header() {
  const { cart } = useStore()
  const count = cart.reduce((sum, item) => sum + item.quantity, 0)
  const navigate = useNavigate()
  const location = useLocation()
  
  if (location.pathname === '/admin') return null;

  return (
    // Header forzado a negro sólido (#000)
    <header className="header" style={{ backgroundColor: '#000000', color: '#ffffff', borderBottom: '1px solid #1a1a1a' }}>
      <button className="logo-button" onClick={() => navigate("/")} style={{ background: 'transparent' }}>
        <Logo />
      </button>
      
      {/* SOLUCIÓN: backgroundColor: 'transparent' agregado para sobreescribir el bloque gris */}
      <nav style={{ display: 'flex', gap: '2rem', backgroundColor: 'transparent' }}>
        <button onClick={() => navigate("/shop")} style={{ color: '#fff', background: 'transparent', border: 'none', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' }}>SHOP⌄</button>
        <button onClick={() => navigate("/collections")} style={{ color: '#fff', background: 'transparent', border: 'none', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' }}>COLLECTIONS⌄</button>
        <button onClick={() => navigate("/about")} style={{ color: '#fff', background: 'transparent', border: 'none', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' }}>ABOUT</button>
      </nav>

      <div className="header-actions" style={{ display: 'flex', gap: '1.5rem', color: '#fff' }}>
        <button aria-label="Buscar" onClick={() => navigate("/shop")} style={{ color: '#fff', background: 'transparent', border: 'none', cursor: 'pointer', width: '24px' }}>
          <Icon name="search" />
        </button>
        <button aria-label="Administración" onClick={() => navigate("/admin")} style={{ color: '#fff', background: 'transparent', border: 'none', cursor: 'pointer', width: '24px' }}>
          <Icon name="user" />
        </button>
        <button className="bag" aria-label="Carrito" onClick={() => navigate("/cart")} style={{ color: '#fff', background: 'transparent', border: 'none', cursor: 'pointer', width: '24px', position: 'relative' }}>
          <Icon name="bag" />
          {count > 0 && <span style={{ position: 'absolute', top: '-5px', right: '-10px', background: 'white', color: 'black', borderRadius: '50%', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold' }}>{count}</span>}
        </button>
      </div>
    </header>
  )
}

function Home({ openVideo, openPanel }: { openVideo: () => void; openPanel: (panel: string) => void }) {
  const { products } = useStore()
  const navigate = useNavigate()
  const categories = [
    { title: "NEW ARRIVALS", image: products[1]?.image },
    { title: "ACCESORIOS", image: products[2]?.image },
    { title: "MERCH", image: products[0]?.image },
    { title: "BEST SELLERS", image: products[3]?.image },
  ]
  const stories = [
    { title: "STAY REAL", image: "/assets/story.jpg", url: "about" },
    { title: "YOUTUBE", image: "/assets/underwater.jpg", word: "NEW\nWAVES", url: "https://www.youtube.com/c/WorldSurfLeague" },
    { title: "STORIES / MAGAZINE", image: "/assets/magazine.jpg", url: "https://www.surfer.com/" },
    { title: "SURF TRIPS", image: "/assets/trips.jpg", url: "https://www.surfline.com/travel/" },
  ]

  const DEMO_VIDEO_ID = "q5-5u1TIf40"

  return (
    <main>
      <button className="hero" aria-label="Ver colección" onClick={() => navigate("/shop")}>
        <img src="/assets/hero-surf.jpg" alt="Surfista dentro de una ola" />
      </button>

      <section className="category-grid" aria-label="Colecciones">
        {categories.map((category) => (
          <Link key={category.title} to={`/shop?category=${encodeURIComponent(category.title)}`} style={{ padding: 0, border: 0, background: "white", textAlign: "left", color: "inherit", textDecoration: "none" }}>
            <span className="category-image"><img src={category.image} alt="" /></span>
            <strong>{category.title}</strong>
          </Link>
        ))}
      </section>

      <section className="video-block" style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          <iframe src={`https://www.youtube.com/embed/${DEMO_VIDEO_ID}?autoplay=1&mute=1&controls=0&disablekb=1&loop=1&playlist=${DEMO_VIDEO_ID}&playsinline=1`} style={{ width: "100vw", height: "56.25vw", minHeight: "100%", minWidth: "177.77vh", position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", border: "none" }} allow="autoplay; encrypted-media" title="Background Video" />
        </div>
        <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.3)" }}></div>
        <button aria-label="Reproducir video" onClick={openVideo} style={{ position: "relative", zIndex: 2, width: "80px", height: "80px", borderRadius: "50%", border: "2px solid white", backgroundColor: "rgba(0,0,0,0.4)", display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer", transition: "transform 0.2s ease" }} onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.1)")} onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}>
          <svg viewBox="0 0 24 24" style={{ fill: "white", width: "36px", height: "36px", marginLeft: "6px" }}><path d="M8 5v14l11-7z" /></svg>
        </button>
      </section>

      <section className="story-grid">
        {stories.map((story) => (
          <article key={story.title} role="button" tabIndex={0} onClick={() => { if (story.url === "about") { navigate("/about") } else { window.open(story.url, "_blank", "noopener,noreferrer") } }}>
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
  const isUnique = product.category === "Accesorios" || /gorra/i.test(product.name)
  const sizes = isUnique ? (["Única"] as Size[]) : SIZES
  const [size, setSize] = useState<Size>(sizes[0])
  const [added, setAdded] = useState(false)

  useEffect(() => { setSize(sizes[0]) }, [product, sizes])

  const add = () => {
    addToCart(product.id, size)
    setAdded(true)
    window.setTimeout(() => setAdded(false), 900)
  }

  return (
    <article className="product-card">
      <div className="product-photo"><img src={product.image} alt={product.name} /><span>{product.category}</span></div>
      <div className="product-info">
        <div><h2>{product.name}</h2><p>{money(product.price)}</p></div>
        <div className="sizes" aria-label="Seleccionar talla">
          {sizes.map((opt) => (
            <button key={opt} className={size === opt ? "selected" : ""} disabled={product.stocks[opt] === 0} onClick={() => setSize(opt)}>{opt}</button>
          ))}
        </div>
        <button className="black-button" onClick={add} disabled={product.stocks[size] === 0}>{added ? "AÑADIDO" : "AGREGAR AL CARRITO"}</button>
      </div>
    </article>
  )
}

function Shop() {
  const { products } = useStore()
  const [params, setParams] = useSearchParams()
  const category = params.get("category")?.toUpperCase()
  const collectionParam = params.get("collection")
  const navigate = useNavigate()

  const visibleProducts = products.filter((p) => {
    if (collectionParam) {
      return p.collectionName === collectionParam;
    }
    
    if (!category || category === "ALL PRODUCTS") return true;
    if (category === "NEW ARRIVALS") return p.category === "Accesorios" || /tee/i.test(p.name);
    if (category === "BEST SELLERS") return p.category === "Merch" || /leash/i.test(p.name);
    return p.category.toUpperCase() === category;
  })

  const pageTitle = collectionParam 
    ? `COLECCIÓN: ${collectionParam}` 
    : (category || "ALL PRODUCTS")

  const shopCategories = ["ALL PRODUCTS", "NEW ARRIVALS", "ACCESORIOS", "MERCH", "BEST SELLERS"]

  return (
    <main className="page shop-page" style={{ padding: "2rem 5%" }}>
      <div className="page-title" style={{ marginBottom: "1.5rem" }}>
        <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: "bold", color: "#666", textTransform: "uppercase" }}>GONE SURFING / SHOP</p>
        <h1 style={{ margin: "0.5rem 0", fontSize: "3rem", textTransform: "uppercase", letterSpacing: "-1px" }}>{pageTitle}</h1>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e5e5e5", paddingBottom: "1rem", marginBottom: "2.5rem" }}>
        <nav style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
          {shopCategories.map(cat => {
            const isActive = (!collectionParam && (category === cat || (!category && cat === "ALL PRODUCTS")));
            return (
              <button 
                key={cat} 
                onClick={() => { if (cat === "ALL PRODUCTS") { navigate("/shop") } else { setParams({ category: cat }) } }} 
                style={{ 
                  background: "none", 
                  border: "none", 
                  cursor: "pointer", 
                  fontSize: "0.85rem",
                  fontWeight: isActive ? "bold" : "600", 
                  color: isActive ? "#000" : "#999", 
                  textTransform: "uppercase",
                  padding: "0.5rem 0",
                  transition: "color 0.2s ease"
                }}
              >
                {cat}
              </button>
            )
          })}
        </nav>
        <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#666" }}>{visibleProducts.length} ITEMS</span>
      </div>

      <section className="product-grid">
        {visibleProducts.map((p) => <ProductCard key={p.id} product={p} />)}
      </section>
    </main>
  )
}

function Cart() {
  const { products, cart, changeQuantity } = useStore()
  const navigate = useNavigate()
  const subtotal = getSubtotal(cart, products)

  return (
    <main className="page cart-page">
      <div className="page-title row-title"><div><p>GONE SURFING / BAG</p><h1>YOUR BAG</h1></div><span>{cart.reduce((sum, item) => sum + item.quantity, 0)} ITEMS</span></div>
      {cart.length === 0 ? (
        <section className="empty"><h2>YOUR BAG IS EMPTY</h2><button className="black-button" onClick={() => navigate("/shop")}>EXPLORE SHOP</button></section>
      ) : (
        <div className="cart-layout">
          <section>
            {cart.map((item) => {
              const product = products.find((p) => p.id === item.productId)
              if (!product) return null
              return (
                <article className="cart-item" key={`${item.productId}-${item.size}`}>
                  <img src={product.image} alt={product.name} />
                  <div className="cart-copy"><h2>{product.name}</h2><p>SIZE: {item.size}</p><p>{money(product.price)}</p></div>
                  <div className="quantity"><button onClick={() => changeQuantity(item.productId, item.size, -1)}>−</button><span>{item.quantity}</span><button onClick={() => changeQuantity(item.productId, item.size, 1)}>+</button></div>
                  <strong>{money(product.price * item.quantity)}</strong>
                </article>
              )
            })}
          </section>
          <aside className="summary">
            <h2>ORDER SUMMARY</h2><div><span>SUBTOTAL</span><b>{money(subtotal)}</b></div><p>Shipping calculated at checkout.</p><button className="black-button" onClick={() => navigate("/checkout")}>CHECKOUT</button>
          </aside>
        </div>
      )}
    </main>
  )
}

function Checkout() {
  const { products, cart, completeOrder } = useStore()
  const navigate = useNavigate()
  const [express, setExpress] = useState(false)
  const [result, setResult] = useState({ success: "", error: "" })
  const subtotal = getSubtotal(cart, products)
  const shipping = express ? 30 : subtotal >= 300 ? 0 : 15

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    try {
      const order = completeOrder({ customer: String(data.get("customer")), email: String(data.get("email")), district: String(data.get("district")), address: String(data.get("address")), shipping })
      setResult({ success: order.id, error: "" })
    } catch (err) { setResult({ success: "", error: err instanceof Error ? err.message : "Error al procesar." }) }
  }

  if (result.success) return <main className="page confirmation"><p>ORDER CONFIRMED</p><h1>THANK YOU.</h1><span>Pedido {result.success}</span><button className="black-button" onClick={() => navigate("/")}>BACK HOME</button></main>

  return (
    <main className="page checkout-page">
      <div className="page-title"><p>SECURE CHECKOUT</p><h1>DELIVERY DETAILS</h1></div>
      <form className="checkout-layout" onSubmit={submit}>
        <section className="form-panel">
          <label>NOMBRE COMPLETO<input name="customer" required autoComplete="name" /></label>
          <label>CORREO ELECTRÓNICO<input name="email" type="email" required autoComplete="email" /></label>
          <label>DISTRITO<input name="district" required /></label>
          <label>DIRECCIÓN<input name="address" required autoComplete="street-address" /></label>
          <fieldset><legend>TIPO DE ENVÍO</legend><label className="radio"><input type="radio" checked={!express} onChange={() => setExpress(false)} /> ESTÁNDAR — {subtotal >= 300 ? "GRATIS" : money(15)}</label><label className="radio"><input type="radio" checked={express} onChange={() => setExpress(true)} /> EXPRESS — {money(30)}</label></fieldset>
        </section>
        <aside className="summary tax-summary">
          {result.error && <p role="alert">{result.error}</p>}
          <h2>PAYMENT SUMMARY</h2><div><span>SUBTOTAL ITEMS</span><b>{money(subtotal)}</b></div><div><span>BASE IMPONIBLE</span><b>{money(subtotal / 1.18)}</b></div><div><span>IGV (18%)</span><b>{money(subtotal - subtotal / 1.18)}</b></div><div><span>ENVÍO</span><b>{shipping === 0 ? "GRATIS" : money(shipping)}</b></div><div className="total"><span>TOTAL</span><b>{money(subtotal + shipping)}</b></div><button className="black-button" disabled={cart.length === 0}>COMPLETE ORDER</button>
        </aside>
      </form>
    </main>
  )
}

function Footer({ openChat }: { openChat: () => void }) {
  const location = useLocation()
  if (location.pathname === '/admin') return null;

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
  const [isVideoOpen, setIsVideoOpen] = useState(false)
  const [panel, setPanel] = useState<string | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const videoId = "q5-5u1TIf40"

  useEffect(() => {
    const d = dialog.current
    if (!d) return
    if (isVideoOpen || panel) {
      if (!d.open) d.showModal()
    } else {
      d.close()
    }
  }, [isVideoOpen, panel])

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [location.pathname])

  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home openVideo={() => setIsVideoOpen(true)} openPanel={setPanel} />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/collections" element={<Collections />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/about" element={<main className="page"><div className="page-title"><h1>STAY REAL</h1></div><p>SURF CULTURE FROM LIMA, PERÚ.</p></main>} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
      <Footer openChat={() => setPanel("chat")} />

      <dialog ref={dialog} onCancel={() => { setIsVideoOpen(false); setPanel(null) }} style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", margin: 0, padding: 0, border: "none", background: "black", width: "90vw", maxWidth: "900px", zIndex: 9999, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}>
        <div style={{ padding: "10px", display: "flex", justifyContent: "flex-end", backgroundColor: "black" }}>
          <button aria-label="Cerrar" onClick={() => { setIsVideoOpen(false); setPanel(null) }} style={{ background: "transparent", border: "none", color: "white", cursor: "pointer", fontSize: "16px" }}>Cerrar ✕</button>
        </div>
        {isVideoOpen ? (
          <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
            <iframe title="GONE SURFING — YouTube" src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
          </div>
        ) : (
          <div style={{ padding: "3rem", color: "white", textAlign: "center" }}><h2 style={{ textTransform: "uppercase", marginBottom: "1rem" }}>{panel || "Chat"}</h2><p>Contenido pendiente de proporcionar.</p></div>
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