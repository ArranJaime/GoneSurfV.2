import { useEffect, useRef, useState } from "react"
import { BrowserRouter, Link, Route, Routes, useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { StoreProvider, type Product, type Size, useStore } from "./store"
import Admin from "./Admin"
import Collections from "./Collections"
import Checkout from "./Checkout"

const SIZES: Size[] = ["S", "M", "L", "XL"]
const money = (value: number) => `S/. ${value.toFixed(2)}`
const getSubtotal = (cart: any[], products: Product[]) => cart.reduce((sum, item) => sum + (products.find((p) => p.id === item.productId)?.price ?? 0) * item.quantity, 0)

function Logo() {
  return <span className="logo" aria-label="Gone Surfing" style={{ color: '#fff' }}>GONE<br />SURFING</span>
}

function Icon({ name }: { name: "search" | "user" | "bag" }) {
  if (name === "search") return <svg viewBox="0 0 24 24" aria-hidden="true" style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 2 }}><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></svg>
  if (name === "user") return <svg viewBox="0 0 24 24" aria-hidden="true" style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 2 }}><circle cx="12" cy="7" r="4" /><path d="M4.5 21v-2.2a7.5 7.5 0 0 1 15 0V21z" /></svg>
  return <svg viewBox="0 0 24 24" aria-hidden="true" style={{ fill: 'currentColor' }}><path d="M4 8h16l-1 13H5L4 8Z" /><path d="M8.5 9V6a3.5 3.5 0 0 1 7 0v3" /></svg>
}

function Header() {
  const { cart } = useStore(); const count = cart.reduce((sum, item) => sum + item.quantity, 0)
  const navigate = useNavigate(); const location = useLocation()
  
  if (location.pathname === '/admin' || location.pathname === '/checkout') return null; 

  return (
    <header className="header" style={{ backgroundColor: '#000000', color: '#ffffff', borderBottom: '1px solid #1a1a1a' }}>
      <button className="logo-button" onClick={() => navigate("/")} style={{ background: 'transparent' }}><Logo /></button>
      <nav style={{ display: 'flex', gap: '2rem', backgroundColor: 'transparent' }}>
        <button onClick={() => navigate("/shop")} style={{ color: '#fff', background: 'transparent', border: 'none', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' }}>SHOP⌄</button>
        <button onClick={() => navigate("/collections")} style={{ color: '#fff', background: 'transparent', border: 'none', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' }}>COLLECTIONS⌄</button>
        <button onClick={() => navigate("/about")} style={{ color: '#fff', background: 'transparent', border: 'none', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' }}>ABOUT</button>
      </nav>
      <div className="header-actions" style={{ display: 'flex', gap: '1.5rem', color: '#fff' }}>
        <button aria-label="Buscar" onClick={() => navigate("/shop")} style={{ color: '#fff', background: 'transparent', border: 'none', cursor: 'pointer', width: '24px' }}><Icon name="search" /></button>
        <button className="bag" aria-label="Carrito" onClick={() => navigate("/cart")} style={{ color: '#fff', background: 'transparent', border: 'none', cursor: 'pointer', width: '24px', position: 'relative' }}>
          <Icon name="bag" />
          {count > 0 && <span style={{ position: 'absolute', top: '-5px', right: '-10px', background: 'white', color: 'black', borderRadius: '50%', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold' }}>{count}</span>}
        </button>
      </div>
    </header>
  )
}

function Home({ openPanel }: { openPanel: (panel: string) => void }) {
  const { products } = useStore()
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const categories = [{ title: "NEW ARRIVALS", image: products[1]?.image }, { title: "ACCESORIOS", image: products[2]?.image }, { title: "MERCH", image: products[0]?.image }, { title: "BEST SELLERS", image: products[3]?.image }]
  const stories = [{ title: "STAY REAL", image: "/assets/story.jpg", url: "about" }, { title: "YOUTUBE", image: "/assets/underwater.jpg", word: "NEW\nWAVES", url: "https://www.youtube.com/c/WorldSurfLeague" }, { title: "STORIES / MAGAZINE", image: "/assets/magazine.jpg", url: "https://www.surfer.com/" }, { title: "SURF TRIPS", image: "/assets/trips.jpg", url: "https://www.surfline.com/travel/" }]

  // LÓGICA DEL REPRODUCTOR NATIVO
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  return (
    <main>
      <button className="hero" aria-label="Ver colección" onClick={() => navigate("/shop")}><img src="/assets/hero-surf.jpg" alt="Surfista dentro de una ola" /></button>
      <section className="category-grid" aria-label="Colecciones">
        {categories.map((category) => (
          <Link key={category.title} to={`/shop?category=${encodeURIComponent(category.title)}`} style={{ padding: 0, border: 0, background: "white", textAlign: "left", color: "inherit", textDecoration: "none" }}><span className="category-image"><img src={category.image} alt="" /></span><strong>{category.title}</strong></Link>
        ))}
      </section>

      {/* NUEVO BLOQUE DE VIDEO INTEGRADO (A PRUEBA DE DESAJUSTES ESTRUCTURALES) */}
      <section 
        className="video-block" 
        style={{ position: "relative", width: "100%", aspectRatio: "16/9", maxHeight: "80vh", backgroundColor: "#000", overflow: "hidden", display: "flex", cursor: "pointer" }} 
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
        
        {/* Capa oscurecedora suave cuando está pausado */}
        {!isPlaying && <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.3)", pointerEvents: "none" }}></div>}

        {/* BOTÓN PLAY/PAUSE (POSICIONADO ABAJO A LA IZQUIERDA) */}
        <button 
          aria-label={isPlaying ? "Pausar video" : "Reproducir video"} 
          onClick={(e) => { e.stopPropagation(); togglePlay(); }} 
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
            transition: "transform 0.2s ease" 
          }} 
          onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.1)")} 
          onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24" style={{ fill: "white", width: "20px", height: "20px" }}><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" style={{ fill: "white", width: "22px", height: "22px", marginLeft: "4px" }}><path d="M8 5v14l11-7z" /></svg>
          )}
        </button>
      </section>

      <section className="story-grid">
        {stories.map((story) => (
          <article key={story.title} role="button" tabIndex={0} onClick={() => { if (story.url === "about") { navigate("/about") } else { window.open(story.url, "_blank", "noopener,noreferrer") } }}><img src={story.image} alt="" />{story.word && <b>{story.word}</b>}<span>{story.title}</span></article>
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

  const add = () => { addToCart(product.id, size); setAdded(true); window.setTimeout(() => setAdded(false), 900) }

  return (
    <article className="product-card">
      <div className="product-photo"><img src={product.image} alt={product.name} /><span>{product.category}</span></div>
      <div className="product-info">
        <div><h2>{product.name}</h2><p>{money(product.price)}</p></div>
        <div className="sizes" aria-label="Seleccionar talla">{sizes.map((opt) => (<button key={opt} className={size === opt ? "selected" : ""} disabled={product.stocks[opt] === 0} onClick={() => setSize(opt)}>{opt}</button>))}</div>
        <button className="black-button" onClick={add} disabled={product.stocks[size] === 0}>{added ? "AÑADIDO" : "AGREGAR AL CARRITO"}</button>
      </div>
    </article>
  )
}

function Shop() {
  const { products } = useStore(); const [params, setParams] = useSearchParams(); const category = params.get("category")?.toUpperCase(); const collectionParam = params.get("collection"); const navigate = useNavigate()

  const visibleProducts = products.filter((p) => {
    if (collectionParam) return p.collectionName === collectionParam;
    if (!category || category === "ALL PRODUCTS") return true;
    const prodCat = p.category.toUpperCase().trim()
    if (category === "NEW ARRIVALS") return prodCat === "NEW ARRIVALS" || prodCat === "ACCESORIOS" || /tee/i.test(p.name);
    if (category === "BEST SELLERS") return prodCat === "BEST SELLERS" || prodCat === "MERCH" || /leash/i.test(p.name);
    return prodCat === category;
  })

  const pageTitle = collectionParam ? `COLECCIÓN: ${collectionParam}` : (category || "ALL PRODUCTS")
  const shopCategories = ["ALL PRODUCTS", "NEW ARRIVALS", "ACCESORIOS", "MERCH", "BEST SELLERS"]

  return (
    <main className="page shop-page" style={{ padding: "2rem 5%" }}>
      <div className="page-title" style={{ marginBottom: "1.5rem" }}><p style={{ margin: 0, fontSize: "0.75rem", fontWeight: "bold", color: "#666", textTransform: "uppercase" }}>GONE SURFING / SHOP</p><h1 style={{ margin: "0.5rem 0", fontSize: "3rem", textTransform: "uppercase", letterSpacing: "-1px" }}>{pageTitle}</h1></div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e5e5e5", paddingBottom: "1rem", marginBottom: "2.5rem" }}>
        <nav style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
          {shopCategories.map(cat => {
            const isActive = (!collectionParam && (category === cat || (!category && cat === "ALL PRODUCTS")));
            return (
              <button key={cat} onClick={() => { if (cat === "ALL PRODUCTS") { navigate("/shop") } else { setParams({ category: cat }) } }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: isActive ? "bold" : "600", color: isActive ? "#000" : "#999", textTransform: "uppercase", padding: "0.5rem 0", transition: "color 0.2s ease" }}>{cat}</button>
            )
          })}
        </nav>
        <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#666" }}>{visibleProducts.length} ITEMS</span>
      </div>
      <section className="product-grid">{visibleProducts.map((p) => <ProductCard key={p.id} product={p} />)}</section>
    </main>
  )
}

function Cart() {
  const { products, cart, changeQuantity } = useStore(); const navigate = useNavigate(); const subtotal = getSubtotal(cart, products)

  return (
    <main className="page cart-page">
      <div className="page-title row-title"><div><p>GONE SURFING / BAG</p><h1>YOUR BAG</h1></div><span>{cart.reduce((sum, item) => sum + item.quantity, 0)} ITEMS</span></div>
      {cart.length === 0 ? (
        <section className="empty"><h2>YOUR BAG IS EMPTY</h2><button className="black-button" onClick={() => navigate("/shop")}>EXPLORE SHOP</button></section>
      ) : (
        <div className="cart-layout">
          <section>
            {cart.map((item) => {
              const product = products.find((p) => p.id === item.productId); if (!product) return null
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

function Footer({ openChat }: { openChat: () => void }) {
  const location = useLocation()
  if (location.pathname === '/admin' || location.pathname === '/checkout') return null;

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
  const [panel, setPanel] = useState<string | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => { const d = dialog.current; if (!d) return; if (panel) { if (!d.open) d.showModal() } else { d.close() } }, [panel])
  useEffect(() => { window.scrollTo({ top: 0 }) }, [location.pathname])

  return (
    <>
      <Header />
      <Routes>
        {/* EL MODAL DE YOUTUBE SE ELIMINÓ; EL VIDEO SE REPRODUCE DIRECTO EN HOME */}
        <Route path="/" element={<Home openPanel={setPanel} />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/collections" element={<Collections />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/about" element={<main className="page"><div className="page-title"><h1>STAY REAL</h1></div><p>SURF CULTURE FROM LIMA, PERÚ.</p></main>} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
      <Footer openChat={() => setPanel("chat")} />

      {/* MODAL LIMPIO EXCLUSIVO PARA EL CHAT */}
      <dialog ref={dialog} onCancel={() => setPanel(null)} style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", margin: 0, padding: 0, border: "none", background: "black", width: "90vw", maxWidth: "900px", zIndex: 9999, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}>
        <div style={{ padding: "10px", display: "flex", justifyContent: "flex-end", backgroundColor: "black" }}><button aria-label="Cerrar" onClick={() => setPanel(null)} style={{ background: "transparent", border: "none", color: "white", cursor: "pointer", fontSize: "16px" }}>Cerrar ✕</button></div>
        <div style={{ padding: "3rem", color: "white", textAlign: "center" }}><h2 style={{ textTransform: "uppercase", marginBottom: "1rem" }}>{panel || "Chat"}</h2><p>Contenido pendiente de proporcionar.</p></div>
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