import { type FormEvent, useState, useEffect, useMemo } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useStore, getCurrentSessionUser, type OrderDetailsInput } from "./store"

const money = (value: number) => `S/. ${(Number(value) || 0).toFixed(2)}`

export interface DistrictInfo {
  name: string
  code: string
  x: number
  y: number
}

export const LIMA_DISTRICTS: DistrictInfo[] = [
  { name: 'San Bartolo', code: 'SBT', x: 387, y: 178 },
  { name: 'Punta Hermosa', code: 'PTH', x: 370, y: 165 },
  { name: 'Punta Negra', code: 'PTN', x: 378, y: 172 },
  { name: 'Santa María del Mar', code: 'SMM', x: 395, y: 185 },
  { name: 'Pucusana', code: 'PUC', x: 405, y: 195 },
  { name: 'Lurín', code: 'LUR', x: 358, y: 155 },
  { name: 'Miraflores', code: 'MFL', x: 295, y: 95 },
  { name: 'Barranco', code: 'BCO', x: 310, y: 110 },
  { name: 'Chorrillos', code: 'CHO', x: 320, y: 125 },
  { name: 'San Isidro', code: 'SIS', x: 288, y: 88 },
  { name: 'Santiago de Surco', code: 'SUR', x: 325, y: 105 },
  { name: 'San Borja', code: 'SBJ', x: 315, y: 92 },
  { name: 'La Molina', code: 'MOL', x: 345, y: 85 },
  { name: 'Surquillo', code: 'SQO', x: 300, y: 98 },
  { name: 'Magdalena del Mar', code: 'MAG', x: 280, y: 86 },
  { name: 'San Miguel', code: 'SMG', x: 270, y: 80 },
  { name: 'Jesús María', code: 'JMA', x: 278, y: 75 },
  { name: 'Lince', code: 'LNC', x: 285, y: 78 },
  { name: 'Pueblo Libre', code: 'PLB', x: 272, y: 72 },
  { name: 'Lima (Cercado)', code: 'LIM', x: 260, y: 55 },
  { name: 'San Juan de Miraflores', code: 'SJM', x: 335, y: 125 },
  { name: 'Villa El Salvador', code: 'VES', x: 345, y: 145 },
  { name: 'Los Olivos', code: 'LOL', x: 245, y: 32 },
  { name: 'San Martín de Porres', code: 'SMP', x: 240, y: 38 },
]

interface ConfirmedOrderState extends OrderDetailsInput {
  id: string
  number: string
  total: number
  subtotal: number
}

export default function Checkout() {
  const { products, cart, users, completeOrder, changeQuantity } = useStore()
  const navigate = useNavigate()

  const isAuth = sessionStorage.getItem("gone_customer") === "true" && Boolean(getCurrentSessionUser())

  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard')
  const [documentType, setDocumentType] = useState<'DNI' | 'CE'>('DNI')
  const [selectedDistrictName, setSelectedDistrictName] = useState(isAuth ? 'Punta Negra' : 'San Bartolo')
  const [orderConfirmed, setOrderConfirmed] = useState<ConfirmedOrderState | null>(null)

  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [documentNumber, setDocumentNumber] = useState("")

  useEffect(() => {
    if (isAuth) {
      const storedUser = getCurrentSessionUser()
      if (storedUser) {
        setFirstName(storedUser.firstName || "")
        setLastName(storedUser.lastName || "")
        setEmail(storedUser.email || "")
        setPhone(storedUser.phone || "")
        setAddress(storedUser.address || "")
        setDocumentNumber(storedUser.document || "")
        if (storedUser.documentType === "DNI" || storedUser.documentType === "CE") {
          setDocumentType(storedUser.documentType)
        }
        if (storedUser.district && LIMA_DISTRICTS.some((d) => d.name === storedUser.district)) {
          setSelectedDistrictName(storedUser.district)
        }
      }
    }
  }, [isAuth])

  const emailHasExistingAccount = useMemo(() => {
    const clean = email.trim().toLowerCase()
    if (!clean) return false
    return users.some((u) => (u.email || "").toLowerCase() === clean)
  }, [email, users])

  const itemsTotalCents = cart.reduce(
    (sum, item) => sum + Math.round((products.find((p) => p.id === item.productId)?.price || 0) * 100) * (item.quantity || 1),
    0
  )
  const shippingCents = shippingMethod === 'express' ? 3000 : itemsTotalCents >= 30000 ? 0 : 1500
  const subtotalCents = Math.round(itemsTotalCents / 1.18)
  const taxCents = itemsTotalCents - subtotalCents
  const totalCents = itemsTotalCents + shippingCents

  if (!cart.length && !orderConfirmed) {
    return (
      <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '2rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#666', letterSpacing: '1px' }}>TU PRÓXIMA OLA TE ESPERA</span>
        <h1 style={{ fontSize: '2.5rem', textTransform: 'uppercase', margin: '1rem 0' }}>Tu bolsa está vacía.</h1>
        <p style={{ color: '#888', marginBottom: '2rem' }}>Añade tus favoritos antes de continuar al checkout.</p>
        <Link to="/shop" style={{ padding: '1rem 2rem', background: '#000', color: '#fff', textDecoration: 'none', fontWeight: 'bold', borderRadius: '4px' }}>EXPLORAR EL DROP <span>→</span></Link>
      </section>
    )
  }

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const districtObj = LIMA_DISTRICTS.find((d) => d.name === selectedDistrictName) || LIMA_DISTRICTS[0]

    const details: OrderDetailsInput = {
      customer: `${String(data.get("firstName") || "").trim()} ${String(data.get("lastName") || "").trim()}`.trim(),
      documentType,
      document: String(data.get("documentNumber") || "").trim(),
      email: String(data.get("email") || "").trim(),
      phone: String(data.get("phone") || "").trim(),
      districtCode: districtObj.code,
      districtName: districtObj.name,
      districtX: districtObj.x,
      districtY: districtObj.y,
      address: String(data.get("address") || "").trim(),
      shippingMethod,
      shipping: shippingCents / 100,
      total: totalCents / 100,
      subtotal: subtotalCents / 100,
      items: cart.map((i) => ({ ...i })),
    }

    try {
      const order = completeOrder(details)
      setOrderConfirmed({
        ...details,
        id: order.id,
        number: order.id,
        total: totalCents / 100,
        subtotal: subtotalCents / 100,
      })
    } catch {
      alert("Error al procesar el pedido. Verifica el stock disponible.")
    }
  }

  if (orderConfirmed) {
    const dest = { name: orderConfirmed.districtName, code: orderConfirmed.districtCode, x: orderConfirmed.districtX, y: orderConfirmed.districtY }
    return (
      <section style={{ minHeight: '100vh', backgroundColor: '#111', color: '#fff', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 1rem', fontFamily: '"Inter", sans-serif' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(https://images.unsplash.com/photo-1636353990836-b20b196dd41e?auto=format&fit=crop&w=2400&q=85)', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.3) blur(4px)', zIndex: 0 }}></div>
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', width: '100%', maxWidth: '600px' }}>
          <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '2px', color: '#888', margin: '0 0 1rem 0' }}>GONE SURFING / CONFIRMACIÓN DE PRUEBA</p>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 6L9 17l-5-5"/></svg></div>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 600, letterSpacing: '-1px', margin: '0 0 0.5rem 0' }}>El ruido se apaga.</h1>
          <p style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '3rem' }}>Tu orden <strong style={{ color: '#fff' }}>#{orderConfirmed.id}</strong> está confirmada.</p>
          <div style={{ background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '2.5rem', textAlign: 'left', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px dashed rgba(255,255,255,0.2)', paddingBottom: '2rem', marginBottom: '2rem' }}>
              <div>
                <span style={{ fontSize: '1.2rem', fontWeight: 900, display: 'block', marginBottom: '1rem', letterSpacing: '-1px' }}>GONE SURFING</span>
                <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '2px', color: '#888', margin: '0 0 0.5rem 0' }}>ORIGEN</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><h2 style={{ fontSize: '3rem', margin: 0, fontWeight: 300 }}>LIM</h2><span style={{ color: '#666' }}>→</span><h2 style={{ fontSize: '3rem', margin: 0, fontWeight: 300 }}>{dest.code}</h2></div>
                <div style={{ display: 'flex', gap: '3.5rem', marginTop: '0.5rem' }}><span style={{ fontSize: '0.7rem', color: '#888' }}>EL RUIDO</span><span style={{ fontSize: '0.7rem', color: '#888' }}>{dest.name.toUpperCase()}</span></div>
              </div>
              <div style={{ textAlign: 'right' }}><p style={{ fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#888', margin: '0 0 1rem 0', lineHeight: 1.5 }}>PASS DE EMBARQUE A LA COSTA<br/>SOLO IDA / OFFLINE</p><svg width="40" height="60" viewBox="0 0 40 60" fill="currentColor" style={{ opacity: 0.8 }}><rect x="0" width="4" height="60"/><rect x="6" width="2" height="60"/><rect x="10" width="6" height="60"/><rect x="18" width="2" height="60"/><rect x="22" width="8" height="60"/><rect x="32" width="4" height="60"/><rect x="38" width="2" height="60"/></svg></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <div><p style={{ fontSize: '0.6rem', color: '#888', letterSpacing: '1px', margin: '0 0 0.3rem 0' }}>ORDEN</p><p style={{ fontSize: '0.8rem', margin: 0, fontWeight: 'bold' }}>{orderConfirmed.id}</p></div>
              <div><p style={{ fontSize: '0.6rem', color: '#888', letterSpacing: '1px', margin: '0 0 0.3rem 0' }}>ACCESO</p><p style={{ fontSize: '0.8rem', margin: 0, fontWeight: 'bold' }}>CULTURA SURF</p></div>
              <div><p style={{ fontSize: '0.6rem', color: '#888', letterSpacing: '1px', margin: '0 0 0.3rem 0' }}>ESTADO</p><p style={{ fontSize: '0.8rem', margin: 0, fontWeight: 'bold' }}>CONFIRMADO</p></div>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '1.5rem 0', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#888', margin: 0, textAlign: 'center' }}>TU PRÓXIMO CAPÍTULO EMPIEZA AQUÍ</p>
              {orderConfirmed.items.map((item, position) => {
                const prod = products.find(p => p.id === item.productId)
                if (!prod) return null
                const qty = item.quantity || 1
                return (<div key={`${item.productId}-${item.size}-${position}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span>{qty > 1 ? `${qty}x ` : ''}{prod.name}<small style={{ display: 'block', color: '#888', fontSize: '0.75rem', marginTop: '4px' }}>Talla: {item.size}</small></span><strong>{money(prod.price * qty)}</strong></div>)
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}><span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Total de prueba</span><strong style={{ fontSize: '1.5rem' }}>{money(orderConfirmed.total)}</strong></div>
            <div style={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: '8px', padding: '1rem', position: 'relative', height: '220px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'absolute', top: '1rem', left: '1rem', right: '1rem', zIndex: 2 }}><span style={{ fontSize: '0.6rem', color: '#666', letterSpacing: '1px' }}>RUMBO A LA COSTA</span><span style={{ fontSize: '0.6rem', color: '#666', letterSpacing: '1px' }}>RUTA ILUSTRATIVA</span></div>
              <svg viewBox="0 0 600 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                <defs><pattern id="map-grid" width="35" height="35" patternUnits="userSpaceOnUse"><path d="M35 0H0V35" fill="none" stroke="#ffffff" strokeOpacity=".045" /></pattern></defs>
                <rect width="600" height="220" fill="#171e1d" />
                <path d="M0 0H182L191 24 177 55 215 90 201 119 234 152 224 177 253 220H0Z" fill="#0c1518" />
                <rect width="600" height="220" fill="url(#map-grid)" />
                <g fill="none" stroke="#5d685f" strokeOpacity=".3" strokeWidth="1">
                  <path d="M200 0 280 62 305 124 383 156 402 220M250 0 338 60 350 140 437 192 460 220M350 0 385 70 437 115 488 220M175 40 600 62M210 93 600 123M230 170 600 193" />
                  <path d="M500 0 445 56 515 110 480 178 538 220M290 8 260 52 299 103 273 172 320 220" />
                </g>
                <path d={`M 253 45 Q ${(253 + dest.x) / 2} ${(45 + dest.y) / 2} ${dest.x} ${dest.y}`} fill="none" stroke="#b7c4ad" strokeWidth="2" strokeDasharray="5 5" />
                <circle cx="253" cy="45" r="4" fill="#b7c4ad" />
                <circle cx={dest.x} cy={dest.y} r="15" fill="#b7c4ad" fillOpacity=".15" />
                <circle cx={dest.x} cy={dest.y} r="5" fill="#d6e0cd" />
                <g fill="#abb2ab" fontFamily="Inter, sans-serif" fontSize="9" letterSpacing="1.5"><text x="270" y="35">LIMA</text><text x={dest.x + 16} y={dest.y + 4}>{dest.name.toUpperCase()}</text><text x="32" y="115" fill="#72838a" fontSize="8">PACIFIC OCEAN</text></g>
              </svg>
              <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', background: '#1a1a1a', border: '1px solid #333', padding: '0.4rem 0.8rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 2 }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4CAF50' }}></span><span style={{ fontSize: '0.65rem', color: '#ddd' }}>Tus olas están en camino a {dest.name}</span></div>
            </div>
            <div style={{ marginTop: '1.5rem' }}><p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#888', margin: '0 0 0.5rem 0' }}>ESTADO DE ÉXITO SIMULADO</p><p style={{ fontSize: '0.75rem', color: '#aaa', margin: 0 }}>No se ha realizado ningún cobro ni se ha enviado una boleta o correo real.</p></div>
            <button onClick={() => navigate('/')} style={{ width: '100%', padding: '1.2rem', background: '#c2c9b4', color: '#000', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.9rem', marginTop: '2rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.2s ease' }} onMouseOver={e => e.currentTarget.style.background = '#d6e0cd'} onMouseOut={e => e.currentTarget.style.background = '#c2c9b4'}>SEGUIR EXPLORANDO <span style={{ fontSize: '1.2rem' }}>↗</span></button>
          </div>
          <div style={{ marginTop: '3rem' }}><span style={{ fontFamily: 'serif', fontStyle: 'italic', fontSize: '2rem', fontWeight: 'bold' }}>stay real</span><p style={{ fontSize: '0.5rem', letterSpacing: '3px', color: '#888', marginTop: '0.5rem' }}>PARA LOS DÍAS SIN PLANES.</p></div>
        </div>
      </section>
    )
  }

  return (
    <section style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#fff', color: '#000', fontFamily: '"Inter", -apple-system, sans-serif' }}>
      <div style={{ flex: '1 1 60%', padding: '4rem 8%', overflowY: 'auto' }}>
        <Link to="/shop" style={{ fontSize: '0.8rem', color: '#666', textDecoration: 'none', marginBottom: '2rem', display: 'inline-block', fontWeight: 'bold' }}>← VOLVER A LA TIENDA</Link>
        <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#666', fontWeight: 600, marginBottom: '1rem' }}>UN PASO MÁS CERCA DEL OCÉANO</p>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 600, letterSpacing: '-1px', margin: '0 0 2rem 0' }}>Tu próxima ola.</h1>
        <div style={{ display: 'flex', gap: '2rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#aaa', marginBottom: '3rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}><span style={{ color: '#000' }}>01 CONTACTO</span><span>02 ENVÍO</span><span>03 PAGO</span></div>
        <div style={{ backgroundColor: '#f2f4ee', padding: '1.5rem', borderRadius: '4px', borderLeft: '4px solid #c2c9b4', marginBottom: '3rem' }}><strong style={{ display: 'block', fontSize: '0.75rem', letterSpacing: '1px', marginBottom: '0.5rem' }}>PROTOTIPO / SIN COBROS</strong><span style={{ fontSize: '0.85rem', color: '#555' }}>No ingreses datos reales. Este checkout usa una pasarela de prueba y no procesa pagos ni envía correos.</span></div>
        
        <form id="checkout-form" onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}><span style={{ color: '#999', fontSize: '0.9rem' }}>01</span> Información de Contacto</h2>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem' }}>Correo electrónico</label>
            <input name="email" type="email" required placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem', marginBottom: '0.5rem' }} />

            {!isAuth && emailHasExistingAccount && (
              <div style={{ background: '#f9f9f9', padding: '1rem', borderLeft: '4px solid #000', marginTop: '0.5rem', marginBottom: '1rem', fontSize: '0.8rem', animation: 'fadeIn 0.3s ease' }}>
                <p style={{ margin: '0 0 0.5rem 0', color: '#333' }}>Parece que ya tienes una cuenta con nosotros.</p>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => navigate('/profile?mode=login')} style={{ background: 'transparent', border: 'none', fontWeight: 'bold', textDecoration: 'underline', cursor: 'pointer', padding: 0, color: '#000' }}>Iniciar sesión para un pago rápido</button>
                  <span style={{ color: '#888', fontStyle: 'italic' }}>o continúa tu compra como invitado abajo</span>
                </div>
              </div>
            )}
            
            <p style={{ fontSize: '0.7rem', color: '#888', margin: '0 0 1rem 0' }}>Aquí enviaremos tu boleta electrónica y el tiempo estimado de envío</p>
            {!isAuth && (
              <button type="button" onClick={() => navigate('/profile?mode=login')} style={{ background: 'none', border: 'none', color: '#000', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
                ¿Ya tienes cuenta? Inicia sesión ↗
              </button>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}><span style={{ color: '#999', fontSize: '0.9rem' }}>02</span> Dirección de Envío</h2>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}><label style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem' }}>Nombre</label><input name="firstName" required placeholder="Tu nombre" value={firstName} onChange={e => setFirstName(e.target.value)} style={{ width: '100%', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem' }} /></div>
              <div style={{ flex: 1 }}><label style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem' }}>Apellidos</label><input name="lastName" required placeholder="Tus apellidos" value={lastName} onChange={e => setLastName(e.target.value)} style={{ width: '100%', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem' }} /></div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}><label style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem' }}>Tipo de Documento</label><select value={documentType} onChange={e => setDocumentType(e.target.value as 'DNI' | 'CE')} style={{ width: '100%', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem', backgroundColor: '#fff' }}><option value="DNI">DNI</option><option value="CE">CE</option></select></div>
              <div style={{ flex: 1 }}><label style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem' }}>Número de Documento</label><input name="documentNumber" required placeholder={documentType === 'DNI' ? '8 dígitos' : '9 a 12 dígitos'} maxLength={documentType === 'DNI' ? 8 : 12} value={documentNumber} onChange={e => setDocumentNumber(e.target.value)} style={{ width: '100%', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem' }} /></div>
            </div>
            <div style={{ marginBottom: '1rem' }}><label style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem' }}>Dirección completa</label><input name="address" required placeholder="Calle, número, departamento o referencia" value={address} onChange={e => setAddress(e.target.value)} style={{ width: '100%', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem' }} /></div>
            <div style={{ marginBottom: '1rem' }}><label style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem' }}>Distrito (Lima Metropolitana)</label><select name="district" value={selectedDistrictName} onChange={e => setSelectedDistrictName(e.target.value)} style={{ width: '100%', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem', backgroundColor: '#fff' }}>{LIMA_DISTRICTS.map(d => (<option key={d.code} value={d.name}>{d.name} ({d.code})</option>))}</select></div>
            <div style={{ marginBottom: '1rem' }}><label style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem' }}>Teléfono</label><input name="phone" required type="tel" placeholder="Ej. 999 999 999" value={phone} onChange={e => setPhone(e.target.value)} style={{ width: '100%', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem' }} /></div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>Métodos de Envío</h2>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', border: shippingMethod === 'standard' ? '1px solid #000' : '1px solid #ddd', borderRadius: '4px', backgroundColor: shippingMethod === 'standard' ? '#fcfdfb' : '#fff', cursor: 'pointer', marginBottom: '1rem' }}><div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><input type="radio" name="shipping" value="standard" checked={shippingMethod === 'standard'} onChange={() => setShippingMethod('standard')} style={{ accentColor: '#000' }} /><div><strong style={{ display: 'block', fontSize: '0.9rem' }}>Envío Estándar</strong><span style={{ fontSize: '0.75rem', color: '#666' }}>3-5 días hábiles</span></div></div><strong>{itemsTotalCents >= 30000 ? 'Gratis' : money(15)}</strong></label>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', border: shippingMethod === 'express' ? '1px solid #000' : '1px solid #ddd', borderRadius: '4px', backgroundColor: shippingMethod === 'express' ? '#fcfdfb' : '#fff', cursor: 'pointer' }}><div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><input type="radio" name="shipping" value="express" checked={shippingMethod === 'express'} onChange={() => setShippingMethod('express')} style={{ accentColor: '#000' }} /><div><strong style={{ display: 'block', fontSize: '0.9rem' }}>Envío Express</strong><span style={{ fontSize: '0.75rem', color: '#666' }}>24 horas</span></div></div><strong>{money(30)}</strong></label>
          </div>

          <div>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}><span style={{ color: '#999', fontSize: '0.9rem' }}>03</span> Pago con Tarjeta <span style={{ fontSize: '0.7rem', background: '#eee', padding: '2px 6px', borderRadius: '4px', color: '#666' }}>VISA / MC</span></h2>
            <p style={{ fontSize: '0.75rem', color: '#888', marginBottom: '1rem' }}>Tarjeta de prueba. No se enviarán ni guardarán estos datos.</p>
            <div style={{ marginBottom: '1rem' }}><label style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem' }}>Número de Tarjeta</label><input defaultValue="4242 4242 4242 4242" required style={{ width: '100%', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem' }} /></div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}><div style={{ flex: 1 }}><label style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem' }}>Fecha de Venc.</label><input defaultValue="12/30" placeholder="MM/AA" required style={{ width: '100%', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem' }} /></div><div style={{ flex: 1 }}><label style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem' }}>CVC</label><input defaultValue="123" required style={{ width: '100%', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem' }} /></div></div>
            <div><label style={{ display: 'block', fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem' }}>Nombre del Titular</label><input defaultValue="SURF DEMO" required style={{ width: '100%', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '0.9rem' }} /></div>
          </div>
        </form>
      </div>

      <aside style={{ flex: '1 1 40%', backgroundColor: '#f9f9f9', borderLeft: '1px solid #eee', padding: '4rem 5%', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
        <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#888', fontWeight: 600, marginBottom: '1rem' }}>THE GOOD STUFF</p>
        <h2 style={{ fontSize: '2rem', fontWeight: 600, margin: '0 0 2rem 0' }}>Tu pedido.</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', borderBottom: '1px solid #e5e5e5', paddingBottom: '2rem', marginBottom: '2rem' }}>
          {cart.map((item) => {
            const prod = products.find(p => p.id === item.productId)
            if (!prod) return null
            const maxStock = prod.stocks[item.size] ?? 0
            return (
              <div key={`${item.productId}-${item.size}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ position: 'relative' }}><img src={prod.image} alt={prod.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #eee' }} /><span style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#888', color: '#fff', fontSize: '0.65rem', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>{item.quantity}</span></div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.9rem' }}>{prod.name}</strong>
                    <span style={{ fontSize: '0.75rem', color: '#666', display: 'block', marginBottom: '0.3rem' }}>Talla: <b style={{ color: '#000' }}>{item.size}</b></span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '4px', background: '#fff' }}>
                        <button type="button" onClick={() => changeQuantity(item.productId, item.size, -1)} style={{ background: '#f5f5f5', border: 'none', width: '24px', height: '24px', cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                        <span style={{ fontSize: '0.75rem', padding: '0 8px', minWidth: '16px', textAlign: 'center' }}>{item.quantity}</span>
                        <button type="button" onClick={() => changeQuantity(item.productId, item.size, 1)} disabled={item.quantity >= maxStock} style={{ background: '#f5f5f5', border: 'none', width: '24px', height: '24px', cursor: item.quantity >= maxStock ? 'not-allowed' : 'pointer', fontWeight: 'bold', opacity: item.quantity >= maxStock ? 0.4 : 1 }}>+</button>
                      </div>
                    </div>
                  </div>
                </div>
                <strong style={{ fontSize: '0.9rem' }}>{money(prod.price * item.quantity)}</strong>
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem', color: '#555', borderBottom: '1px solid #e5e5e5', paddingBottom: '2rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal (Base Imponible)</span><span>{money(subtotalCents / 100)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Costo de Envío</span><span>{money(shippingCents / 100)}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>IGV (18% incluido)</span><span>{money(taxCents / 100)}</span></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}><span style={{ fontSize: '1.2rem' }}>Total a Pagar</span><strong style={{ fontSize: '1.8rem' }}>{money(totalCents / 100)}</strong></div>
        <button type="submit" form="checkout-form" disabled={cart.length === 0} style={{ width: '100%', padding: '1.5rem', background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: cart.length === 0 ? 0.5 : 1 }}>Pagar Pedido <span>→</span></button>
        <p style={{ fontSize: '0.65rem', color: '#888', marginTop: '1rem', textAlign: 'center' }}>Resumen estimado de demostración. El cobro requiere backend conectado.</p>
        <div style={{ textAlign: 'center', marginTop: '4rem' }}><span style={{ fontFamily: 'serif', fontStyle: 'italic', fontSize: '1.5rem', fontWeight: 'bold', color: '#000' }}>stay real</span><p style={{ fontSize: '0.4rem', letterSpacing: '2px', color: '#999', margin: '0.5rem 0 0 0' }}>PARA LOS DÍAS SIN PLANES.</p></div>
      </aside>
    </section>
  )
}