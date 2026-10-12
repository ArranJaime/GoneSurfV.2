import { useEffect, useRef, useState } from "react"
import { BrowserRouter, Link, Route, Routes, useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { StoreProvider, type Product, type Size, useStore } from "./store"
import Admin from "./Admin"
import Collections from "./Collections"
import Checkout, { LIMA_DISTRICTS } from "./Checkout"

const SIZES: Size[] = ["S", "M", "L", "XL"]
const money = (value: number) => `S/. ${value.toFixed(2)}`
const getSubtotal = (cart: any[], products: Product[]) => cart.reduce((sum, item) => sum + (products.find((p) => p.id === item.productId)?.price ?? 0) * item.quantity, 0)

function Logo() { return <span className="logo" aria-label="Gone Surfing" style={{ color: '#fff' }}>GONE<br />SURFING</span> }

function Icon({ name }: { name: "search" | "user" | "bag" }) {
  if (name === "search") return <svg viewBox="0 0 24 24" aria-hidden="true" style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 2 }}><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></svg>
  if (name === "user") return <svg viewBox="0 0 24 24" aria-hidden="true" style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 2 }}><circle cx="12" cy="7" r="4" /><path d="M4.5 21v-2.2a7.5 7.5 0 0 1 15 0V21z" /></svg>
  return <svg viewBox="0 0 24 24" aria-hidden="true" style={{ fill: 'currentColor' }}><path d="M4 8h16l-1 13H5L4 8Z" /><path d="M8.5 9V6a3.5 3.5 0 0 1 7 0v3" /></svg>
}

function Header() {
  const { cart, products } = useStore(); const count = cart.reduce((sum, item) => sum + item.quantity, 0)
  const navigate = useNavigate(); const location = useLocation()
  const [isSearching, setIsSearching] = useState(false); const [query, setQuery] = useState("")

  if (location.pathname === '/admin' || location.pathname === '/checkout') return null; 

  const handleSearch = (e?: React.FormEvent | React.MouseEvent) => {
    if (e && e.preventDefault) e.preventDefault()
    if (query.trim()) { navigate(`/shop?search=${encodeURIComponent(query)}`); setIsSearching(false); setQuery("") }
  }

  const liveResults = query.trim() ? products.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.category.toLowerCase().includes(query.toLowerCase())).slice(0, 3) : []

  return (
    <header className="header" style={{ backgroundColor: '#000000', color: '#ffffff', borderBottom: '1px solid #1a1a1a', position: 'relative', zIndex: 1000 }}>
      <button className="logo-button" onClick={() => navigate("/")} style={{ background: 'transparent' }}><Logo /></button>
      <nav style={{ display: 'flex', gap: '2rem', backgroundColor: 'transparent' }}>
        <button onClick={() => navigate("/shop")} style={{ color: '#fff', background: 'transparent', border: 'none', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' }}>SHOP⌄</button>
        <button onClick={() => navigate("/collections")} style={{ color: '#fff', background: 'transparent', border: 'none', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' }}>COLLECTIONS⌄</button>
        <button onClick={() => navigate("/about")} style={{ color: '#fff', background: 'transparent', border: 'none', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase' }}>ABOUT</button>
      </nav>
      <div className="header-actions" style={{ display: 'flex', gap: '1.5rem', color: '#fff', alignItems: 'center' }}>
        {isSearching ? (
          <div style={{ position: 'relative' }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', margin: 0 }}>
              <input autoFocus type="text" placeholder="Buscar prenda..." value={query} onChange={e => setQuery(e.target.value)} onBlur={() => { if (!query) setIsSearching(false) }} style={{ padding: '0.4rem 2rem 0.4rem 1rem', borderRadius: '20px', border: '1px solid #333', outline: 'none', background: '#111', color: '#fff', fontSize: '0.8rem', width: '200px', transition: 'all 0.3s ease' }} />
              <button type="button" onClick={() => { setIsSearching(false); setQuery(""); }} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '12px' }}>✕</button>
            </form>
            {query.trim().length > 0 && (
              <div style={{ position: 'absolute', top: 'calc(100% + 12px)', right: 0, width: '320px', background: '#0a0a0a', borderRadius: '8px', boxShadow: '0 10px 40px rgba(0,0,0,0.8)', overflow: 'hidden', zIndex: 100, color: '#fff', border: '1px solid #222' }}>
                {liveResults.length > 0 ? (
                  <>
                    {liveResults.map(p => (
                      <div key={p.id} onMouseDown={() => { navigate(`/shop?search=${encodeURIComponent(p.name)}`); setIsSearching(false); setQuery(""); }} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', cursor: 'pointer', borderBottom: '1px solid #1a1a1a', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#161616'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <div style={{ width: '48px', height: '48px', flexShrink: 0, borderRadius: '4px', overflow: 'hidden', backgroundColor: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'high-quality' as any }} /></div>
                        <div style={{ overflow: 'hidden' }}><strong style={{ display: 'block', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#fff' }}>{p.name}</strong><span style={{ fontSize: '0.75rem', color: '#888' }}>{money(p.price)}</span></div>
                      </div>
                    ))}
                    <div onMouseDown={handleSearch} style={{ padding: '1rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 'bold', background: '#111', cursor: 'pointer', color: '#fff' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#1a1a1a'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#111'}>Ver todos los resultados →</div>
                  </>
                ) : (<div style={{ padding: '1.5rem 1rem', textAlign: 'center', fontSize: '0.8rem', color: '#666' }}>No se encontraron prendas para "{query}"</div>)}
              </div>
            )}
          </div>
        ) : (<button aria-label="Buscar" onClick={() => setIsSearching(true)} style={{ color: '#fff', background: 'transparent', border: 'none', cursor: 'pointer', width: '24px' }}><Icon name="search" /></button>)}
        <button aria-label="Cuenta" onClick={() => navigate("/profile")} style={{ color: '#fff', background: 'transparent', border: 'none', cursor: 'pointer', width: '24px' }}><Icon name="user" /></button>
        <button className="bag" aria-label="Carrito" onClick={() => navigate("/cart")} style={{ color: '#fff', background: 'transparent', border: 'none', cursor: 'pointer', width: '24px', position: 'relative' }}>
          <Icon name="bag" />
          {count > 0 && (<span style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'white', color: 'black', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{count}</span>)}
        </button>
      </div>
    </header>
  )
}

function Home({ openPanel }: { openPanel: (panel: string) => void }) {
  const { products } = useStore(); const navigate = useNavigate(); const videoRef = useRef<HTMLVideoElement>(null); const [isPlaying, setIsPlaying] = useState(false)
  const categories = [{ title: "NEW ARRIVALS", image: products[1]?.image }, { title: "ACCESORIOS", image: products[2]?.image }, { title: "MERCH", image: products[0]?.image }, { title: "BEST SELLERS", image: products[3]?.image }]
  const stories = [{ title: "STAY REAL", image: "/assets/story.jpg", url: "about" }, { title: "YOUTUBE", image: "/assets/underwater.jpg", word: "NEW\nWAVES", url: "https://www.youtube.com/c/WorldSurfLeague" }, { title: "STORIES / MAGAZINE", image: "/assets/magazine.jpg", url: "https://www.surfer.com/" }, { title: "SURF TRIPS", image: "/assets/trips.jpg", url: "https://www.surfline.com/travel/" }]

  const togglePlay = () => { if (videoRef.current) { if (isPlaying) { videoRef.current.pause() } else { videoRef.current.play() } setIsPlaying(!isPlaying) } }

  return (
    <main>
      <button className="hero" aria-label="Ver colección" onClick={() => navigate("/shop")}><img src="/assets/hero-surf.jpg" alt="Surfista" /></button>
      <section className="category-grid" aria-label="Colecciones">{categories.map((category) => (<Link key={category.title} to={`/shop?category=${encodeURIComponent(category.title)}`} style={{ padding: 0, border: 0, background: "white", textAlign: "left", color: "inherit", textDecoration: "none" }}><span className="category-image"><img src={category.image} alt="" /></span><strong>{category.title}</strong></Link>))}</section>
      <section className="video-block" style={{ position: "relative", width: "100%", aspectRatio: "16/9", maxHeight: "80vh", backgroundColor: "#000", overflow: "hidden", display: "flex", cursor: "pointer" }} onClick={togglePlay}>
        <video ref={videoRef} src="/assets/video.mp4" style={{ width: "100%", height: "100%", objectFit: "cover" }} loop playsInline onEnded={() => setIsPlaying(false)} />
        {!isPlaying && <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.3)", pointerEvents: "none" }}></div>}
        <button aria-label={isPlaying ? "Pausar video" : "Reproducir video"} onClick={(e) => { e.stopPropagation(); togglePlay(); }} style={{ position: "absolute", bottom: "2rem", left: "2.5rem", width: "48px", height: "48px", borderRadius: "50%", border: "2px solid rgba(255, 255, 255, 0.8)", backgroundColor: "rgba(0,0,0,0.4)", display: "flex", justifyContent: "center", alignItems: "center", cursor: "pointer", zIndex: 2, backdropFilter: "blur(4px)", transition: "transform 0.2s ease" }} onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.1)")} onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}>
          {isPlaying ? <svg viewBox="0 0 24 24" style={{ fill: "white", width: "20px", height: "20px" }}><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg> : <svg viewBox="0 0 24 24" style={{ fill: "white", width: "22px", height: "22px", marginLeft: "4px" }}><path d="M8 5v14l11-7z" /></svg>}
        </button>
      </section>
      <section className="story-grid">{stories.map((story) => (<article key={story.title} role="button" tabIndex={0} onClick={() => { if (story.url === "about") { navigate("/about") } else { window.open(story.url, "_blank", "noopener,noreferrer") } }}><img src={story.image} alt="" />{story.word && <b>{story.word}</b>}<span>{story.title}</span></article>))}</section>
    </main>
  )
}

function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useStore(); const isUnique = product.category === "Accesorios" || /gorra/i.test(product.name); const sizes = isUnique ? (["Única"] as Size[]) : SIZES; const [size, setSize] = useState<Size>(sizes[0]); const [added, setAdded] = useState(false)
  useEffect(() => { setSize(sizes[0]) }, [product, sizes]); const add = () => { addToCart(product.id, size); setAdded(true); window.setTimeout(() => setAdded(false), 900) }

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
  const { products } = useStore(); const [params, setParams] = useSearchParams(); const category = params.get("category")?.toUpperCase(); const collectionParam = params.get("collection"); const searchParam = params.get("search")?.toLowerCase(); const navigate = useNavigate()

  const visibleProducts = products.filter((p) => {
    if (searchParam) return p.name.toLowerCase().includes(searchParam) || p.category.toLowerCase().includes(searchParam);
    if (collectionParam) return p.collectionName === collectionParam;
    if (!category || category === "ALL PRODUCTS") return true;
    const prodCat = p.category.toUpperCase().trim()
    if (category === "NEW ARRIVALS") return prodCat === "NEW ARRIVALS" || prodCat === "ACCESORIOS" || /tee/i.test(p.name);
    if (category === "BEST SELLERS") return prodCat === "BEST SELLERS" || prodCat === "MERCH" || /leash/i.test(p.name);
    return prodCat === category;
  })

  const pageTitle = searchParam ? `RESULTADOS PARA: "${searchParam.toUpperCase()}"` : collectionParam ? `COLECCIÓN: ${collectionParam}` : (category || "ALL PRODUCTS")
  const shopCategories = ["ALL PRODUCTS", "NEW ARRIVALS", "ACCESORIOS", "MERCH", "BEST SELLERS"]

  return (
    <main className="page shop-page" style={{ padding: "2rem 5%", minHeight: '80vh' }}>
      <div className="page-title" style={{ marginBottom: "1.5rem" }}><p style={{ margin: 0, fontSize: "0.75rem", fontWeight: "bold", color: "#666", textTransform: "uppercase" }}>GONE SURFING / SHOP</p><h1 style={{ margin: "0.5rem 0", fontSize: "3rem", textTransform: "uppercase", letterSpacing: "-1px" }}>{pageTitle}</h1></div>
      {!searchParam && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e5e5e5", paddingBottom: "1rem", marginBottom: "2.5rem" }}>
          <nav style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
            {shopCategories.map(cat => {
              const isActive = (!collectionParam && (category === cat || (!category && cat === "ALL PRODUCTS")));
              return (<button key={cat} onClick={() => { if (cat === "ALL PRODUCTS") { navigate("/shop") } else { setParams({ category: cat }) } }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem", fontWeight: isActive ? "bold" : "600", color: isActive ? "#000" : "#999", textTransform: "uppercase", padding: "0.5rem 0", transition: "color 0.2s ease" }}>{cat}</button>)
            })}
          </nav>
          <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#666" }}>{visibleProducts.length} ITEMS</span>
        </div>
      )}
      {visibleProducts.length === 0 ? (
        <div style={{ padding: "4rem 0", textAlign: "center" }}><h2>No encontramos productos.</h2><p style={{ color: '#666', marginTop: '0.5rem' }}>Prueba buscando con otras palabras o explora todo el catálogo.</p><button onClick={() => navigate("/shop")} className="black-button" style={{ marginTop: "2rem", width: 'auto', padding: '1rem 3rem' }}>VER TODO EL CATÁLOGO</button></div>
      ) : (<section className="product-grid">{visibleProducts.map((p) => <ProductCard key={p.id} product={p} />)}</section>)}
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
          <aside className="summary"><h2>ORDER SUMMARY</h2><div><span>SUBTOTAL</span><b>{money(subtotal)}</b></div><p>Shipping calculated at checkout.</p><button className="black-button" onClick={() => navigate("/checkout")}>CHECKOUT</button></aside>
        </div>
      )}
    </main>
  )
}

// PERFIL CON FORMULARIO DE REGISTRO COMPLETO (DNI, Dirección, Distrito, Teléfono, etc.)
function Profile() {
  const { transactions } = useStore()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  const [isAuth, setIsAuth] = useState(() => sessionStorage.getItem("gone_customer") === "true")
  // Leer el parámetro mode=login de la URL
  const [authMode, setAuthMode] = useState<"login" | "register">(searchParams.get("mode") === "login" ? "login" : searchParams.get("mode") === "register" ? "register" : "login")
  const [error, setError] = useState(false)
  const [currentTab, setCurrentTab] = useState<"pedidos" | "perfil">("pedidos")

  const defaultUser = { firstName: "Jaime", lastName: "Monroy", email: "jaime@gonesurfing.com", document: "72345678", phone: "+51 999 999 999", address: "Av. Principal 123, Dpto 4", district: "Punta Negra" }
  const user = JSON.parse(sessionStorage.getItem("gone_current_user") || "null") || defaultUser

  useEffect(() => {
    if (searchParams.get("mode")) setAuthMode(searchParams.get("mode") as "login" | "register")
  }, [searchParams])

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const data = new FormData(e.currentTarget)
    const email = data.get("email") as string; const pass = data.get("password") as string
    
    const users = JSON.parse(localStorage.getItem("gone_users") || "[]")
    const foundUser = users.find((u: any) => u.email === email && u.password === pass)

    if (foundUser) {
      sessionStorage.setItem("gone_customer", "true"); sessionStorage.setItem("gone_current_user", JSON.stringify(foundUser))
      setIsAuth(true); setError(false)
    } else if (email === defaultUser.email && pass === "demo123") { 
      sessionStorage.setItem("gone_customer", "true"); sessionStorage.setItem("gone_current_user", JSON.stringify(defaultUser))
      setIsAuth(true); setError(false) 
    } else { setError(true) }
  }

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); const data = new FormData(e.currentTarget)
    const newUser = {
      firstName: data.get("firstName") as string,
      lastName: data.get("lastName") as string,
      document: data.get("document") as string,
      phone: data.get("phone") as string,
      address: data.get("address") as string,
      district: data.get("district") as string,
      email: data.get("email") as string,
      password: data.get("password") as string
    }
    
    const users = JSON.parse(localStorage.getItem("gone_users") || "[]")
    localStorage.setItem("gone_users", JSON.stringify([...users, newUser]))
    
    sessionStorage.setItem("gone_customer", "true")
    sessionStorage.setItem("gone_current_user", JSON.stringify(newUser))
    setIsAuth(true); setError(false)
  }

  const handleLogout = () => { sessionStorage.removeItem("gone_customer"); sessionStorage.removeItem("gone_current_user"); setIsAuth(false); setCurrentTab("pedidos") }

  if (!isAuth) {
    return (
      <main style={{ backgroundColor: '#f9f9f9', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ background: '#fff', padding: '3rem', width: '100%', maxWidth: authMode === 'login' ? '400px' : '550px', borderTop: '4px solid #000', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', borderRadius: '4px', transition: 'max-width 0.3s' }}>
          
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <button onClick={() => {setAuthMode("login"); setError(false)}} style={{ flex: 1, padding: '0.8rem', background: authMode === 'login' ? '#000' : '#f5f5f5', color: authMode === 'login' ? '#fff' : '#666', border: 'none', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px' }}>INICIAR SESIÓN</button>
            <button onClick={() => {setAuthMode("register"); setError(false)}} style={{ flex: 1, padding: '0.8rem', background: authMode === 'register' ? '#000' : '#f5f5f5', color: authMode === 'register' ? '#fff' : '#666', border: 'none', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px' }}>CREAR CUENTA</button>
          </div>

          {authMode === "login" ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', animation: 'fadeIn 0.3s ease' }}>
              <div style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '4px', fontSize: '0.8rem', color: '#666' }}><strong>Cuenta Demo:</strong><br/>Correo: jaime@gonesurfing.com<br/>Clave: demo123</div>
              <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Correo Electrónico</label><input name="email" type="email" required style={{ width: '100%', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px' }} /></div>
              <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Contraseña</label><input name="password" type="password" required style={{ width: '100%', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px' }} /></div>
              {error && <small style={{ color: '#d32f2f', fontWeight: 'bold' }}>El correo o la contraseña son incorrectos.</small>}
              <button style={{ background: '#000', color: '#fff', border: 'none', padding: '1rem', fontWeight: 'bold', textTransform: 'uppercase', cursor: 'pointer', marginTop: '1rem', borderRadius: '4px' }}>Entrar a mi cuenta</button>
            </form>
          ) : (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', animation: 'fadeIn 0.3s ease' }}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px' }}><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Nombres</label><input name="firstName" required style={{ width: '100%', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px' }} /></div>
                <div style={{ flex: '1 1 200px' }}><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Apellidos</label><input name="lastName" required style={{ width: '100%', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px' }} /></div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px' }}><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.5rem', textTransform: 'uppercase' }}>DNI</label><input name="document" required maxLength={8} style={{ width: '100%', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px' }} /></div>
                <div style={{ flex: '1 1 200px' }}><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Teléfono</label><input name="phone" required type="tel" style={{ width: '100%', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px' }} /></div>
              </div>
              <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Dirección Completa</label><input name="address" required placeholder="Calle, número, departamento" style={{ width: '100%', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px' }} /></div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Distrito</label>
                <select name="district" required style={{ width: '100%', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#fff' }}>
                  {LIMA_DISTRICTS.map(d => <option key={d.code} value={d.name}>{d.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 200px' }}><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Correo Electrónico</label><input name="email" type="email" required style={{ width: '100%', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px' }} /></div>
                <div style={{ flex: '1 1 200px' }}><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Contraseña</label><input name="password" type="password" required style={{ width: '100%', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px' }} /></div>
              </div>
              <button style={{ background: '#000', color: '#fff', border: 'none', padding: '1rem', fontWeight: 'bold', textTransform: 'uppercase', cursor: 'pointer', marginTop: '1rem', borderRadius: '4px' }}>Registrarme de manera segura</button>
            </form>
          )}
        </div>
      </main>
    )
  }

  const myOrders = transactions.filter(t => t.email === user.email)
  const displayOrders = myOrders.length > 0 ? myOrders : []

  return (
    <main style={{ padding: "4rem 5%", minHeight: "80vh", display: "flex", flexDirection: "row", gap: "4rem", flexWrap: "wrap", fontFamily: '"Inter", sans-serif' }}>
      <aside style={{ flex: "1 1 250px", maxWidth: "300px" }}>
        <h1 style={{ fontSize: "2rem", textTransform: "uppercase", marginBottom: "0.5rem", letterSpacing: "-1px" }}>Mi Cuenta</h1>
        <p style={{ color: "#666", marginBottom: "2.5rem" }}>Hola, {user.firstName}</p>
        <nav style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <button onClick={() => setCurrentTab("pedidos")} style={{ textAlign: "left", background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem", fontWeight: currentTab === "pedidos" ? "bold" : "normal", color: currentTab === "pedidos" ? "#000" : "#666", textTransform: "uppercase", letterSpacing: "1px", transition: "color 0.2s" }}>Mis Pedidos</button>
          <button onClick={() => setCurrentTab("perfil")} style={{ textAlign: "left", background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem", fontWeight: currentTab === "perfil" ? "bold" : "normal", color: currentTab === "perfil" ? "#000" : "#666", textTransform: "uppercase", letterSpacing: "1px", transition: "color 0.2s" }}>Mi Perfil</button>
          <button onClick={handleLogout} style={{ textAlign: "left", background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem", color: "#d32f2f", textTransform: "uppercase", letterSpacing: "1px", marginTop: "2rem" }}>Cerrar Sesión</button>
        </nav>
      </aside>
      
      <section style={{ flex: "2 1 500px" }}>
        {currentTab === "pedidos" && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <h2 style={{ fontSize: "1.5rem", textTransform: "uppercase", marginBottom: "2rem", borderBottom: "1px solid #eee", paddingBottom: "1rem" }}>Historial de Compras</h2>
            {displayOrders.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', background: '#f9f9f9', borderRadius: '8px', border: '1px dashed #ccc' }}>
                <p style={{ color: "#666", marginBottom: '1rem' }}>No tienes pedidos recientes con el correo {user.email}.</p>
                <button onClick={() => navigate("/shop")} className="black-button" style={{ padding: '0.8rem 2rem', width: 'auto' }}>Ir a la tienda</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {[...displayOrders].reverse().map((o, i) => {
                  const status = o.status || "Procesando"; const statusColor = status === "Entregado" ? "#2e7d32" : status === "Enviado" ? "#0277bd" : "#e65100"; const statusBg = status === "Entregado" ? "#e8f5e9" : status === "Enviado" ? "#e3f2fd" : "#fff3e0";
                  return (
                    <div key={i} style={{ border: "1px solid #eee", borderRadius: "8px", padding: "1.5rem", background: "#fff", transition: "box-shadow 0.2s" }} onMouseOver={e => e.currentTarget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.05)"} onMouseOut={e => e.currentTarget.style.boxShadow = "none"}>
                      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem", borderBottom: "1px solid #f5f5f5", paddingBottom: "1rem" }}>
                          <div><span style={{ display: "block", fontSize: "0.65rem", color: "#888", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Orden</span><strong style={{ fontSize: "0.9rem" }}>{o.id || o.number}</strong></div>
                          <div><span style={{ display: "block", fontSize: "0.65rem", color: "#888", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Fecha</span><strong style={{ fontSize: "0.9rem" }}>{new Date(o.date).toLocaleDateString('es-PE')}</strong></div>
                          <div><span style={{ display: "block", fontSize: "0.65rem", color: "#888", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Total</span><strong style={{ fontSize: "0.9rem" }}>{money(o.total)}</strong></div>
                          <div style={{ textAlign: "right" }}><span style={{ display: "block", fontSize: "0.65rem", color: "#888", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>Estado</span><span style={{ background: statusBg, color: statusColor, padding: "4px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "bold" }}>{status}</span></div>
                      </div>
                      <div><span style={{ fontSize: "0.85rem", color: "#555", lineHeight: "1.5" }}>{o.detail || o.items?.map((item: any) => item.name).join(", ")}</span></div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
        {currentTab === "perfil" && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <h2 style={{ fontSize: "1.5rem", textTransform: "uppercase", marginBottom: "2rem", borderBottom: "1px solid #eee", paddingBottom: "1rem" }}>Detalles de Contacto</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "3rem" }}>
              <div>
                <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", marginBottom: "1.5rem", color: "#000", letterSpacing: "1px" }}>Información Personal</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                  <div><label style={{ fontSize: "0.7rem", color: "#888", textTransform: "uppercase", letterSpacing: "1px" }}>Nombres</label><p style={{ margin: "0.2rem 0 0 0", fontWeight: "500", fontSize: "0.9rem" }}>{user.firstName}</p></div>
                  <div><label style={{ fontSize: "0.7rem", color: "#888", textTransform: "uppercase", letterSpacing: "1px" }}>Apellidos</label><p style={{ margin: "0.2rem 0 0 0", fontWeight: "500", fontSize: "0.9rem" }}>{user.lastName}</p></div>
                  {user.document && <div><label style={{ fontSize: "0.7rem", color: "#888", textTransform: "uppercase", letterSpacing: "1px" }}>DNI</label><p style={{ margin: "0.2rem 0 0 0", fontWeight: "500", fontSize: "0.9rem" }}>{user.document}</p></div>}
                  <div><label style={{ fontSize: "0.7rem", color: "#888", textTransform: "uppercase", letterSpacing: "1px" }}>Correo Electrónico</label><p style={{ margin: "0.2rem 0 0 0", fontWeight: "500", fontSize: "0.9rem" }}>{user.email}</p></div>
                  {user.phone && <div><label style={{ fontSize: "0.7rem", color: "#888", textTransform: "uppercase", letterSpacing: "1px" }}>Teléfono</label><p style={{ margin: "0.2rem 0 0 0", fontWeight: "500", fontSize: "0.9rem" }}>{user.phone}</p></div>}
                </div>
              </div>
              <div>
                <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", marginBottom: "1.5rem", color: "#000", letterSpacing: "1px" }}>Dirección Predeterminada</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                  {user.address && <div><label style={{ fontSize: "0.7rem", color: "#888", textTransform: "uppercase", letterSpacing: "1px" }}>Dirección Completa</label><p style={{ margin: "0.2rem 0 0 0", fontWeight: "500", fontSize: "0.9rem" }}>{user.address}</p></div>}
                  {user.district && <div><label style={{ fontSize: "0.7rem", color: "#888", textTransform: "uppercase", letterSpacing: "1px" }}>Distrito</label><p style={{ margin: "0.2rem 0 0 0", fontWeight: "500", fontSize: "0.9rem" }}>{user.district}</p></div>}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

function Footer({ openChat }: { openChat: () => void }) {
  const location = useLocation(); if (location.pathname === '/admin' || location.pathname === '/checkout') return null;
  return (<footer><Logo /><p>SURF CULTURE FROM LIMA, PERÚ.</p><button onClick={openChat}>◯ &nbsp; Chat</button></footer>)
}

function AppContent() {
  const location = useLocation(); const [panel, setPanel] = useState<string | null>(null); const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => { const d = dialog.current; if (!d) return; if (panel) { if (!d.open) d.showModal() } else { d.close() } }, [panel])
  useEffect(() => { window.scrollTo({ top: 0 }) }, [location.pathname])
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home openPanel={setPanel} />} /><Route path="/shop" element={<Shop />} /><Route path="/collections" element={<Collections />} /><Route path="/cart" element={<Cart />} /><Route path="/checkout" element={<Checkout />} /><Route path="/profile" element={<Profile />} /><Route path="/about" element={<main className="page"><div className="page-title"><h1>STAY REAL</h1></div><p>SURF CULTURE FROM LIMA, PERÚ.</p></main>} /><Route path="/admin" element={<Admin />} />
      </Routes>
      <Footer openChat={() => setPanel("chat")} />
      <dialog ref={dialog} onCancel={() => setPanel(null)} style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", margin: 0, padding: 0, border: "none", background: "black", width: "90vw", maxWidth: "900px", zIndex: 9999, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}>
        <div style={{ padding: "10px", display: "flex", justifyContent: "flex-end", backgroundColor: "black" }}><button aria-label="Cerrar" onClick={() => setPanel(null)} style={{ background: "transparent", border: "none", color: "white", cursor: "pointer", fontSize: "16px" }}>Cerrar ✕</button></div>
        <div style={{ padding: "3rem", color: "white", textAlign: "center" }}><h2 style={{ textTransform: "uppercase", marginBottom: "1rem" }}>{panel || "Chat"}</h2><p>Contenido pendiente de proporcionar.</p></div>
      </dialog>
    </>
  )
}

export default function App() { return (<BrowserRouter><StoreProvider><AppContent /></StoreProvider></BrowserRouter>) }