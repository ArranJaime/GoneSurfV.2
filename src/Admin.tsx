import { type FormEvent, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useStore, type Size } from "./store"

const SIZES: Size[] = ["S", "M", "L", "XL"]
const money = (value: number) => `S/. ${(Number(value) || 0).toFixed(2)}`

function Logo({ dark = false }: { dark?: boolean }) {
  return <span style={{ fontWeight: 900, fontSize: '1.5rem', lineHeight: 1, letterSpacing: '-1px', color: dark ? '#000' : 'inherit', display: 'block', marginBottom: '1rem' }}>GONE<br />SURFING</span>
}

function ManageCollections() {
  const { collections, addCollection, toggleCollection, deleteCollection } = useStore()
  const [title, setTitle] = useState(""); const [subtitle, setSubtitle] = useState(""); const [category, setCategory] = useState("LIFESTYLE"); const [image, setImage] = useState<string | null>(null); const fileInputRef = useRef<HTMLInputElement>(null)
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setImage(reader.result as string); reader.readAsDataURL(file) } }
  const handleCreate = (e: FormEvent) => { e.preventDefault(); if (!title || !image) { alert("Título e imagen obligatorios."); return }
    addCollection({ title, subtitle, category, image }); setTitle(""); setSubtitle(""); setImage(null)
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <section style={{ backgroundColor: '#111', color: '#fff', padding: '2rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Crear Nueva Colección</h2>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <div onClick={() => fileInputRef.current?.click()} style={{ flex: '1 1 200px', border: '1px dashed #444', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '180px', backgroundColor: '#1a1a1a', cursor: 'pointer', overflow: 'hidden', position: 'relative' }}>
            {image ? <img src={image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <p style={{ fontSize: '0.8rem', color: '#888' }}>Subir Portada</p>}
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} />
          </div>
          <form onSubmit={handleCreate} style={{ flex: '2 1 400px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 2 }}><label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', marginBottom: '0.5rem' }}>TÍTULO DE COLECCIÓN</label><input value={title} onChange={e => setTitle(e.target.value)} type="text" placeholder="Ej. The Summer Drop" style={{ width: '100%', padding: '0.8rem', backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff', borderRadius: '4px' }} required /></div>
              <div style={{ flex: 1 }}><label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', marginBottom: '0.5rem' }}>ETIQUETA SUP.</label><input value={category} onChange={e => setCategory(e.target.value)} type="text" placeholder="Ej. LIFESTYLE" style={{ width: '100%', padding: '0.8rem', backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff', borderRadius: '4px' }} required /></div>
            </div>
            <div><label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', marginBottom: '0.5rem' }}>SUBTÍTULO</label><input value={subtitle} onChange={e => setSubtitle(e.target.value)} type="text" placeholder="Ej. Ride the sun." style={{ width: '100%', padding: '0.8rem', backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff', borderRadius: '4px' }} required /></div>
            <button type="submit" style={{ alignSelf: 'flex-start', background: '#fff', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', padding: '0.8rem 1.5rem' }}>AÑADIR COLECCIÓN AL CARRUSEL</button>
          </form>
        </div>
        <div style={{ borderTop: '1px solid #333', paddingTop: '1.5rem' }}>
          <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#888' }}>COLECCIONES REGISTRADAS</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {collections.map(col => (
              <div key={col.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1a1a1a', padding: '1rem', borderRadius: '6px', border: '1px solid #333', width: 'calc(50% - 0.5rem)', minWidth: '300px' }}>
                <div><strong style={{ display: 'block', fontSize: '1rem' }}>{col.title || "Colección Sin Nombre"}</strong><small style={{ color: '#888' }}>{col.active ? "Mostrándose en web" : "Oculta"}</small></div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => toggleCollection(col.id)} style={{ background: col.active ? 'transparent' : '#fff', color: col.active ? '#fff' : '#000', border: '1px solid #fff', padding: '0.4rem 1rem', borderRadius: '20px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>{col.active ? "DESACTIVAR" : "ACTIVAR"}</button>
                  <button onClick={() => { if (window.confirm(`¿Estás seguro de eliminar "${col.title}"?`)) { deleteCollection(col.id) } }} style={{ background: 'transparent', color: '#ff4d4d', border: '1px solid #ff4d4d', padding: '0.4rem 1rem', borderRadius: '20px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>ELIMINAR</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function UploadPrenda() {
  const { collections, addProduct, products, changeStock, updateProductCollection, deleteProduct } = useStore()
  const [name, setName] = useState(""); const [price, setPrice] = useState(""); const [category, setCategory] = useState("New Arrivals"); const [collection, setCollection] = useState("Catálogo General"); const [image, setImage] = useState<string | null>(null); const [stocks, setStocks] = useState<Record<string, number>>({ Única: 25, S: 10, M: 10, L: 10, XL: 10 }); const [success, setSuccess] = useState(false); const fileInputRef = useRef<HTMLInputElement>(null)
  const isUnique = category === "Accesorios"

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setImage(reader.result as string); reader.readAsDataURL(file) } }
  const handleSubmit = (e: FormEvent) => { e.preventDefault(); if (!name || !price || !image) { alert("Completa nombre, precio e imagen."); return }
    const activeStocks: Record<string, number> = isUnique ? { Única: stocks["Única"] } : { S: stocks.S, M: stocks.M, L: stocks.L, XL: stocks.XL }
    addProduct({ name, price: parseFloat(price), category, collectionName: collection, image, stocks: activeStocks })
    setSuccess(true); setName(""); setPrice(""); setImage(null); setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <section style={{ backgroundColor: '#111', color: '#fff', padding: '2rem', borderRadius: '8px', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Subir nueva prenda al catálogo</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div onClick={() => fileInputRef.current?.click()} style={{ flex: '1 1 300px', border: '1px dashed #444', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '250px', backgroundColor: '#1a1a1a', cursor: 'pointer', overflow: 'hidden', position: 'relative' }}>
            {image ? <img src={image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <><svg viewBox="0 0 24 24" style={{ width: '40px', height: '40px', fill: 'none', stroke: '#888', strokeWidth: 2, marginBottom: '1rem' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg><p style={{ margin: 0, fontWeight: 'bold', fontSize: '0.9rem', color: '#ddd' }}>Haz clic para subir PNG</p></>}
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} />
          </div>
          <div style={{ flex: '2 1 400px', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div><label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', marginBottom: '0.5rem' }}>Nombre de la prenda</label><input value={name} onChange={e => setName(e.target.value)} type="text" style={{ width: '100%', padding: '0.8rem', backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff', borderRadius: '4px' }} required /></div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}><label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', marginBottom: '0.5rem' }}>Precio (S/.)</label><input value={price} onChange={e => setPrice(e.target.value)} type="number" step="0.01" style={{ width: '100%', padding: '0.8rem', backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff', borderRadius: '4px' }} required /></div>
              <div style={{ flex: 1 }}><label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', marginBottom: '0.5rem' }}>Categoría Principal</label><select value={category} onChange={e => setCategory(e.target.value)} style={{ width: '100%', padding: '0.8rem', backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}><option value="New Arrivals">New Arrivals</option><option value="Best Sellers">Best Sellers</option><option value="Merch">Merch</option><option value="Accesorios">Accesorios (Talla Única)</option></select></div>
            </div>
            <div><label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', marginBottom: '0.5rem' }}>Vincular a Colección</label><select value={collection} onChange={e => setCollection(e.target.value)} style={{ width: '100%', padding: '0.8rem', backgroundColor: '#1a1a1a', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}><option value="Catálogo General">Ninguna (Catálogo General)</option>{collections.map(c => (<option key={c.id} value={c.title || c.id}>{c.title || "Colección Sin Nombre"}</option>))}</select></div>
            <div style={{ border: '1px solid #333', padding: '1.2rem', borderRadius: '4px', backgroundColor: '#161616' }}>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.75rem', color: '#aaa', fontWeight: 'bold' }}>Control de Stock</p>
              {isUnique ? <div><label style={{ display: 'block', fontSize: '0.75rem', color: '#888', marginBottom: '0.3rem' }}>Unidades Talla Única</label><input value={stocks["Única"]} onChange={e => setStocks({...stocks, Única: Number(e.target.value)})} type="number" min="0" style={{ width: '100%', padding: '0.6rem', backgroundColor: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px' }} /></div> : <div style={{ display: 'flex', gap: '0.5rem' }}>{["S", "M", "L", "XL"].map(sz => (<div key={sz} style={{ flex: 1 }}><label style={{ display: 'block', fontSize: '0.75rem', color: '#888', marginBottom: '0.3rem' }}>Talla {sz}</label><input value={stocks[sz]} onChange={e => setStocks({...stocks, [sz]: Number(e.target.value)})} type="number" min="0" style={{ width: '100%', padding: '0.6rem', backgroundColor: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px' }} /></div>))}</div>}
            </div>
            <button type="submit" style={{ alignSelf: 'flex-end', background: success ? '#4CAF50' : 'transparent', color: '#fff', border: '1px solid #fff', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', padding: '0.8rem 1.5rem', marginTop: '1rem' }}>{success ? "¡PRENDA PUBLICADA!" : "PUBLICAR EN LA TIENDA"}</button>
          </div>
        </form>
      </section>

      <section style={{ background: '#fff', border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '2px solid #000' }}><h2 style={{ margin: 0, fontSize: '1rem', textTransform: 'uppercase' }}>Inventario Activo</h2></div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead style={{ background: '#0a0a0a', color: '#fff' }}><tr><th style={{ padding: '1rem' }}>PRODUCTO</th><th style={{ padding: '1rem' }}>COLECCIÓN</th><th style={{ padding: '1rem' }}>PRECIO</th><th style={{ padding: '1rem' }}>STOCK POR TALLA</th><th style={{ padding: '1rem' }}></th></tr></thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}><img src={p.image} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} /><div><strong>{p.name}</strong><span style={{ display: 'block', fontSize: '0.7rem', color: '#888' }}>{p.category}</span></div></td>
                  <td style={{ padding: '1rem' }}>{p.collectionName && p.collectionName !== "Catálogo General" ? <span style={{ background: '#000', padding: '0.3rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold', color: '#fff', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>{p.collectionName} <button onClick={() => updateProductCollection(p.id, "Catálogo General")} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}>✕</button></span> : <span style={{ color: '#888', fontStyle: 'italic', fontSize: '0.8rem' }}>Sin colección</span>}</td>
                  <td style={{ padding: '1rem' }}>{money(p.price)}</td>
                  <td style={{ padding: '1rem' }}><div style={{ display: 'flex', gap: '0.5rem' }}>{(p.category === "Accesorios" ? ["Única"] as Size[] : SIZES).map(s => (<div key={s} style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '3px', overflow: 'hidden' }}><b style={{ padding: '0.2rem 0.5rem', background: '#f5f5f5', borderRight: '1px solid #ddd' }}>{s}</b><button onClick={() => changeStock(p.id, s, -1)} style={{ border: 'none', background: 'none', padding: '0.2rem 0.5rem', cursor: 'pointer' }}>−</button><span style={{ padding: '0.2rem 0.2rem' }}>{p.stocks[s] || 0}</span><button onClick={() => changeStock(p.id, s, 1)} style={{ border: 'none', background: 'none', padding: '0.2rem 0.5rem', cursor: 'pointer' }}>+</button></div>))}</div></td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}><button onClick={() => { if(window.confirm(`¿Seguro que deseas eliminar permanentemente el producto "${p.name}"?`)) { deleteProduct(p.id) } }} style={{ background: 'transparent', color: '#ff4d4d', border: '1px solid #ff4d4d', padding: '0.3rem 0.8rem', borderRadius: '20px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 'bold' }}>ELIMINAR</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function MetricsDashboard() {
  const { transactions } = useStore()
  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
        <article style={{ background: '#fff', padding: '1.5rem', border: '1px solid #eee', borderRadius: '8px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>Recaudación Total</span>
          <strong style={{ display: 'block', fontSize: '2.5rem', margin: '0.5rem 0' }}>{money(transactions.reduce((s, i) => s + (i.total || 0), 0))}</strong>
          <small style={{ color: '#888', fontSize: '0.75rem' }}>{transactions.length} TRANSACCIONES EN EL SISTEMA</small>
        </article>
      </section>
    </div>
  )
}

function ManageOrders() {
  const { transactions, updateOrderStatus } = useStore()

  if (transactions.length === 0) return <div style={{ padding: '3rem', textAlign: 'center', background: '#fff', borderRadius: '8px', border: '1px solid #eee' }}><h3>Aún no hay pedidos registrados.</h3></div>

  return (
    <section style={{ background: '#fff', border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ padding: '1.5rem', borderBottom: '2px solid #000' }}><h2 style={{ margin: 0, fontSize: '1rem', textTransform: 'uppercase' }}>Gestión y Despacho de Pedidos</h2></div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead style={{ background: '#0a0a0a', color: '#fff' }}>
            <tr><th style={{ padding: '1rem' }}>ID & FECHA</th><th style={{ padding: '1rem' }}>CLIENTE</th><th style={{ padding: '1rem' }}>CONTACTO / ENVÍO</th><th style={{ padding: '1rem' }}>DETALLE DE COMPRA</th><th style={{ padding: '1rem' }}>TOTAL</th><th style={{ padding: '1rem' }}>ESTADO ACTUAL</th></tr>
          </thead>
          <tbody>
            {[...transactions].reverse().map((t: any) => (
              <tr key={t.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '1rem' }}><strong style={{ display: 'block' }}>{t.id}</strong><span style={{ color: '#888', fontSize: '0.75rem' }}>{new Date(t.date).toLocaleDateString('es-PE')}</span></td>
                <td style={{ padding: '1rem' }}><strong style={{ display: 'block' }}>{t.customer || "Anónimo"}</strong><span style={{ color: '#888', fontSize: '0.75rem' }}>DNI: {t.document || "N/A"}</span></td>
                <td style={{ padding: '1rem' }}><span style={{ display: 'block', fontWeight: 'bold', fontSize: '0.75rem', color: '#0277bd' }}>{t.email || "Sin correo"}</span><span style={{ fontSize: '0.7rem', color: '#666', display: 'block', marginTop: '4px' }}>{t.address || "Dirección no registrada"} - {t.districtName || ""}</span></td>
                <td style={{ padding: '1rem', maxWidth: '250px' }}><span style={{ fontSize: '0.8rem', lineHeight: '1.4', display: 'block' }}>{t.detail}</span></td>
                <td style={{ padding: '1rem' }}><strong style={{ fontSize: '1.1rem' }}>{money(t.total)}</strong></td>
                <td style={{ padding: '1rem' }}>
                  <select value={t.status || "Procesando"} onChange={(e) => updateOrderStatus(t.id, e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', fontWeight: 'bold', cursor: 'pointer', background: t.status === "Entregado" ? "#e8f5e9" : t.status === "Enviado" ? "#e3f2fd" : "#fff3e0", color: t.status === "Entregado" ? "#2e7d32" : t.status === "Enviado" ? "#0277bd" : "#e65100" }}>
                    <option value="Procesando">Procesando</option><option value="Enviado">Enviado</option><option value="Entregado">Entregado</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function ManageCustomers() {
  const [users, setUsers] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem("gone_users") || "[]") } catch(e) { return [] }
  })

  const deleteUser = (email: string) => {
    if(window.confirm(`¿Estás seguro de que deseas eliminar permanentemente al cliente con correo ${email}?`)) {
      const newUsers = users.filter((u: any) => u.email !== email)
      setUsers(newUsers)
      localStorage.setItem("gone_users", JSON.stringify(newUsers))
    }
  }

  if (users.length === 0) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', background: '#fff', borderRadius: '8px', border: '1px solid #eee' }}>
        <h3>Aún no hay clientes registrados en el sistema.</h3>
        <p style={{color: '#666'}}>Cuando un cliente cree su cuenta, aparecerá en este directorio.</p>
      </div>
    )
  }

  return (
    <section style={{ background: '#fff', border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ padding: '1.5rem', borderBottom: '2px solid #000' }}><h2 style={{ margin: 0, fontSize: '1rem', textTransform: 'uppercase' }}>Directorio de Clientes</h2></div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead style={{ background: '#0a0a0a', color: '#fff' }}>
            <tr>
              <th style={{ padding: '1rem' }}>NOMBRE COMPLETO</th>
              <th style={{ padding: '1rem' }}>DOCUMENTO</th>
              <th style={{ padding: '1rem' }}>CONTACTO</th>
              <th style={{ padding: '1rem' }}>DIRECCIÓN DE ENVÍO</th>
              <th style={{ padding: '1rem' }}></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '1rem' }}><strong style={{ display: 'block' }}>{u.firstName} {u.lastName}</strong></td>
                <td style={{ padding: '1rem' }}>DNI: {u.document || 'N/A'}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ display: 'block', fontWeight: 'bold', color: '#0277bd' }}>{u.email}</span>
                  <span style={{ color: '#666', fontSize: '0.75rem' }}>Tel: {u.phone || 'N/A'}</span>
                </td>
                <td style={{ padding: '1rem', maxWidth: '250px' }}>
                  <span style={{ display: 'block' }}>{u.address || 'N/A'}</span>
                  <span style={{ color: '#888', fontSize: '0.75rem' }}>{u.district || 'N/A'}</span>
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <button onClick={() => deleteUser(u.email)} style={{ background: 'transparent', color: '#ff4d4d', border: '1px solid #ff4d4d', padding: '0.3rem 0.8rem', borderRadius: '20px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 'bold' }}>ELIMINAR</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function AdminDashboard() {
  const navigate = useNavigate()
  const [currentView, setCurrentView] = useState<"dashboard" | "orders" | "upload" | "collections" | "customers">("dashboard")

  // FUNCIÓN MAESTRA PARA LIMPIAR EL DEMO
  const resetDemoData = () => {
    if (window.confirm("🚨 ¿Seguro que deseas BORRAR TODOS los pedidos, clientes y carritos de prueba para iniciar un demo limpio? (Tus productos no se borrarán)")) {
      localStorage.removeItem("gone_transactions");
      localStorage.removeItem("gone_users");
      localStorage.removeItem("gone_cart");
      sessionStorage.clear();
      window.location.reload();
    }
  }

  return (
    <main style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', padding: '3rem 5%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div><p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 'bold', color: '#666' }}>GONE SURFING / ADMIN</p></div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {/* BOTÓN ROJO PARA VACIAR LOS DATOS DE PRUEBA RÁPIDAMENTE */}
          <button onClick={resetDemoData} style={{ background: '#ff4d4d', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>VACIAR DATOS DE PRUEBA</button>
          <button onClick={() => navigate('/shop')} style={{ background: '#000', color: '#fff', border: 'none', padding: '0.6rem 1.2rem', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer' }}>VER TIENDA PÚBLICA</button>
        </div>
      </div>
      
      <div style={{ marginBottom: '2rem' }}>
        <nav style={{ display: 'flex', gap: '2rem', borderBottom: '2px solid #ddd', overflowX: 'auto' }}>
          <button onClick={() => setCurrentView('dashboard')} style={{ background: 'transparent', border: 'none', borderBottom: currentView === 'dashboard' ? '2px solid #000' : '2px solid transparent', padding: '0 0 0.5rem 0', fontWeight: 'bold', fontSize: '0.9rem', color: currentView === 'dashboard' ? '#000' : '#888', cursor: 'pointer', textTransform: 'uppercase', marginBottom: '-2px' }}>Dashboard</button>
          <button onClick={() => setCurrentView('orders')} style={{ background: 'transparent', border: 'none', borderBottom: currentView === 'orders' ? '2px solid #000' : '2px solid transparent', padding: '0 0 0.5rem 0', fontWeight: 'bold', fontSize: '0.9rem', color: currentView === 'orders' ? '#000' : '#888', cursor: 'pointer', textTransform: 'uppercase', marginBottom: '-2px' }}>Gestión de Pedidos</button>
          <button onClick={() => setCurrentView('customers')} style={{ background: 'transparent', border: 'none', borderBottom: currentView === 'customers' ? '2px solid #000' : '2px solid transparent', padding: '0 0 0.5rem 0', fontWeight: 'bold', fontSize: '0.9rem', color: currentView === 'customers' ? '#000' : '#888', cursor: 'pointer', textTransform: 'uppercase', marginBottom: '-2px' }}>Gestión de Clientes</button>
          <button onClick={() => setCurrentView('upload')} style={{ background: 'transparent', border: 'none', borderBottom: currentView === 'upload' ? '2px solid #000' : '2px solid transparent', padding: '0 0 0.5rem 0', fontWeight: 'bold', fontSize: '0.9rem', color: currentView === 'upload' ? '#000' : '#888', cursor: 'pointer', textTransform: 'uppercase', marginBottom: '-2px' }}>Subir Catálogo</button>
          <button onClick={() => setCurrentView('collections')} style={{ background: 'transparent', border: 'none', borderBottom: currentView === 'collections' ? '2px solid #000' : '2px solid transparent', padding: '0 0 0.5rem 0', fontWeight: 'bold', fontSize: '0.9rem', color: currentView === 'collections' ? '#000' : '#888', cursor: 'pointer', textTransform: 'uppercase', marginBottom: '-2px' }}>Colecciones</button>
        </nav>
      </div>
      
      {currentView === 'dashboard' && <MetricsDashboard />}
      {currentView === 'orders' && <ManageOrders />}
      {currentView === 'customers' && <ManageCustomers />}
      {currentView === 'upload' && <UploadPrenda />}
      {currentView === 'collections' && <ManageCollections />}
    </main>
  )
}

export default function Admin() {
  const [auth, setAuth] = useState(() => sessionStorage.getItem("gone_admin") === "true")
  const [error, setError] = useState(false)

  const login = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    if (data.get("user") === "admin" && data.get("password") === "admin666") { sessionStorage.setItem("gone_admin", "true"); setAuth(true) } else setError(true)
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