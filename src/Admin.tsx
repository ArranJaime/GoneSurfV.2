import { type FormEvent, useMemo, useState, useRef } from "react"
import { useStore, type Size } from "./store"

const SIZES: Size[] = ["S", "M", "L", "XL"]
const money = (value: number) => `S/. ${value.toFixed(2)}`

function Logo({ dark = false }: { dark?: boolean }) {
  return <span style={{ fontWeight: 900, fontSize: '1.5rem', lineHeight: 1, letterSpacing: '-1px', color: dark ? '#000' : 'inherit', display: 'block', marginBottom: '1rem' }}>GONE<br />SURFING</span>
}

function UploadPrenda() {
  const { addProduct } = useStore()
  
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [category, setCategory] = useState("Accesorios")
  const [collection, setCollection] = useState("Catálogo General")
  const [image, setImage] = useState<string | null>(null)
  const [stocks, setStocks] = useState<Record<string, number>>({ Única: 25, S: 10, M: 10, L: 10, XL: 10 })
  const [success, setSuccess] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isUnique = category === "Accesorios"

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setImage(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!name || !price || !image) {
      alert("Por favor completa nombre, precio y sube una imagen.")
      return
    }

    // CORRECCIÓN DE TYPESCRIPT: Declaración explícita del tipo
    const activeStocks: Record<string, number> = isUnique 
      ? { Única: stocks["Única"] } 
      : { S: stocks.S, M: stocks.M, L: stocks.L, XL: stocks.XL }

    addProduct({
      name,
      price: parseFloat(price),
      category,
      collectionName: collection,
      image,
      stocks: activeStocks
    })

    setSuccess(true)
    setName(""); setPrice(""); setImage(null);
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <section style={{ backgroundColor: '#111', color: '#fff', padding: '2rem', borderRadius: '8px', marginBottom: '2rem' }}>
      <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Subir nueva prenda al catálogo</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        
        <div 
          onClick={() => fileInputRef.current?.click()}
          style={{ flex: '1 1 300px', border: '1px dashed #444', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '250px', backgroundColor: '#1a1a1a', cursor: 'pointer', overflow: 'hidden', position: 'relative' }}
        >
          {image ? (
            <img src={image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <>
              <svg viewBox="0 0 24 24" style={{ width: '40px', height: '40px', fill: 'none', stroke: '#888', strokeWidth: 2, marginBottom: '1rem' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
              <p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.9rem', color: '#ddd' }}>Haz clic para subir PNG</p>
            </>
          )}
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} />
        </div>
        
        <div style={{ flex: '2 1 400px', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Nombre de la prenda</label>
            <input value={name} onChange={e => setName(e.target.value)} type="text" placeholder="Ej. Stay Real Wetsuit" style={{ width: '100%', padding: '0.8rem', backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff', borderRadius: '4px' }} required />
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Precio (S/.)</label>
              <input value={price} onChange={e => setPrice(e.target.value)} type="number" step="0.01" placeholder="120.00" style={{ width: '100%', padding: '0.8rem', backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff', borderRadius: '4px' }} required />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Categoría</label>
              <select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: '0.8rem', backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}>
                <option value="Accesorios">Accesorios (Talla Única)</option>
                <option value="Merch">Merch</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Colección / Drop</label>
            <select value={collection} onChange={e => setCollection(e.target.value)} style={{ width: '100%', padding: '0.8rem', backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}>
              <option value="Catálogo General">Ninguna (Catálogo General)</option>
              <option value="The slow days">The slow days</option>
              <option value="The Blue">The Blue</option>
            </select>
          </div>

          <div style={{ border: '1px solid #333', padding: '1.2rem', borderRadius: '4px', backgroundColor: '#161616' }}>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.75rem', color: '#aaa', fontWeight: 'bold', textTransform: 'uppercase' }}>Control de Stock por Variantes ({isUnique ? 'Talla Única' : 'S, M, L, XL'})</p>
            {isUnique ? (
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#888', marginBottom: '0.3rem' }}>Unidades Talla Única</label>
                <input value={stocks["Única"]} onChange={e => setStocks({...stocks, Única: Number(e.target.value)})} type="number" min="0" style={{ width: '100%', padding: '0.6rem', backgroundColor: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px' }} />
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {["S", "M", "L", "XL"].map(sz => (
                  <div key={sz} style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#888', marginBottom: '0.3rem' }}>Talla {sz}</label>
                    <input value={stocks[sz]} onChange={e => setStocks({...stocks, [sz]: Number(e.target.value)})} type="number" min="0" style={{ width: '100%', padding: '0.6rem', backgroundColor: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px' }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" style={{ alignSelf: 'flex-end', background: success ? '#4CAF50' : 'transparent', color: '#fff', border: '1px solid #fff', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', padding: '0.8rem 1.5rem', marginTop: '1rem', transition: 'all 0.3s' }}>
            {success ? "¡PRENDA PUBLICADA!" : "PUBLICAR EN LA TIENDA"}
          </button>
        </div>
      </form>
    </section>
  )
}

function AdminDashboard() {
  const { products, transactions, changeStock } = useStore()
  const [filter, setFilter] = useState<"today" | "week" | "month" | "custom">("week")

  const filtered = useMemo(() => {
    const start = new Date()
    if (filter === "today") start.setHours(0, 0, 0, 0)
    if (filter === "week") start.setDate(start.getDate() - 7)
    if (filter === "month") start.setDate(start.getDate() - 30)
    return transactions.filter(t => new Date(t.date) >= start)
  }, [transactions, filter])

  return (
    <main style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', padding: '3rem 5%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 'bold', color: '#666' }}>GONE SURFING / ADMIN</p>
          <h1 style={{ margin: '0.5rem 0 0 0', fontSize: '3rem', textTransform: 'uppercase' }}>Dashboard</h1>
        </div>
      </div>
      
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
        <article style={{ background: '#fff', padding: '1.5rem', border: '1px solid #eee' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>Recaudación</span>
          <strong style={{ display: 'block', fontSize: '2.5rem', margin: '0.5rem 0' }}>{money(filtered.reduce((s, i) => s + i.total, 0))}</strong>
          <small style={{ color: '#888', fontSize: '0.75rem' }}>{filtered.length} TRANSACCIONES</small>
        </article>
        <article style={{ background: '#fff', padding: '1.5rem', border: '1px solid #eee' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>IGV Acumulado</span>
          <strong style={{ display: 'block', fontSize: '2.5rem', margin: '0.5rem 0' }}>{money(filtered.reduce((s, i) => s + i.igv, 0))}</strong>
        </article>
        <article style={{ background: '#fff', padding: '1.5rem', border: '1px solid #eee' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>Stock Total</span>
          <strong style={{ display: 'block', fontSize: '2.5rem', margin: '0.5rem 0' }}>{products.reduce((s, p) => s + Object.values(p.stocks || {}).reduce((a, b) => a + b, 0), 0)}</strong>
        </article>
      </section>

      <UploadPrenda />

      <section style={{ background: '#fff', border: '1px solid #eee' }}>
        <div style={{ padding: '1.5rem', borderBottom: '2px solid #000' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', textTransform: 'uppercase' }}>Inventario Activo</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead style={{ background: '#0a0a0a', color: '#fff' }}>
              <tr>
                <th style={{ padding: '1rem' }}>PRODUCTO</th>
                <th style={{ padding: '1rem' }}>COLECCIÓN</th>
                <th style={{ padding: '1rem' }}>PRECIO</th>
                <th style={{ padding: '1rem' }}>STOCK POR TALLA</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img src={p.image} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                    <div>
                      <strong>{p.name}</strong>
                      <span style={{ display: 'block', fontSize: '0.7rem', color: '#888' }}>{p.category}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ background: '#f5f5f5', padding: '0.3rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', color: '#555' }}>
                      {p.collectionName || "Catálogo General"}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>{money(p.price)}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {(p.category === "Accesorios" ? ["Única"] as Size[] : SIZES).map(s => (
                        <div key={s} style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '3px', overflow: 'hidden' }}>
                          <b style={{ padding: '0.2rem 0.5rem', background: '#f5f5f5', borderRight: '1px solid #ddd' }}>{s}</b>
                          <button onClick={() => changeStock(p.id, s, -1)} style={{ border: 'none', background: 'none', padding: '0.2rem 0.5rem', cursor: 'pointer' }}>−</button>
                          <span style={{ padding: '0.2rem 0.2rem' }}>{p.stocks[s] || 0}</span>
                          <button onClick={() => changeStock(p.id, s, 1)} style={{ border: 'none', background: 'none', padding: '0.2rem 0.5rem', cursor: 'pointer' }}>+</button>
                        </div>
                      ))}
                    </div>
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

export default function Admin() {
  const [auth, setAuth] = useState(() => sessionStorage.getItem("gone_admin") === "true")
  const [error, setError] = useState(false)

  const login = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    if (data.get("user") === "admin" && data.get("password") === "admin666") {
      sessionStorage.setItem("gone_admin", "true")
      setAuth(true)
    } else setError(true)
  }

  if (auth) return <AdminDashboard />

  return (
    <main style={{ backgroundColor: '#e5e5e5', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', padding: '3rem', width: '100%', maxWidth: '400px', borderTop: '5px solid #000', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
        <Logo dark />
        <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>Private Access</p>
        <h1 style={{ margin: '0.5rem 0 2rem 0', fontSize: '2.5rem', textTransform: 'uppercase' }}>Admin Login</h1>
        
        <form onSubmit={login} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>USUARIO</label><input name="user" required style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd' }} /></div>
          <div><label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>CONTRASEÑA</label><input name="password" type="password" required style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd' }} /></div>
          {error && <small style={{ color: 'red' }}>Credenciales incorrectas.</small>}
          <button style={{ background: '#000', color: '#fff', border: 'none', padding: '1rem', fontWeight: 'bold', textTransform: 'uppercase', cursor: 'pointer', marginTop: '1rem' }}>Enter Dashboard</button>
        </form>
      </div>
    </main>
  )
}