import { useState } from "react"
import { Link } from "react-router-dom"

export default function Collections() {
  const [active, setActive] = useState(0)

  const slides = [
    {
      id: 1,
      category: "ESENCIALES DE LA COSTA",
      number: "01 / 03",
      subtitle: "No plans. Just tides.",
      title: "The slow days",
      image: "/assets/underwater.jpg",
      link: "/shop?collection=The%20slow%20days"
    },
    {
      id: 2,
      category: "HIGH PERFORMANCE",
      number: "02 / 03",
      subtitle: "Born to conquer.",
      title: "The Blue",
      image: "/assets/hero-surf.jpg",
      link: "/shop?collection=The%20Blue"
    },
    {
      id: 3,
      category: "LIFESTYLE",
      number: "03 / 03",
      subtitle: "Beyond the waves.",
      title: "Golden Hour",
      image: "/assets/story.jpg",
      link: "/shop?category=BEST%20SELLERS"
    }
  ]

  const next = () => setActive((prev) => (prev + 1) % slides.length)
  const prev = () => setActive((prev) => (prev - 1 + slides.length) % slides.length)

  return (
    <main style={{ backgroundColor: '#050505', color: '#fff', minHeight: '100vh', paddingTop: '100px', paddingBottom: '120px', fontFamily: '"Inter", -apple-system, sans-serif', overflow: 'hidden', position: 'relative' }}>
      
      {/* Tipografía adaptada con un tono gris neutro elegante para integrar con la paleta monocromática */}
      <div style={{ textAlign: 'center', padding: '2rem 1rem 3.5rem 1rem', position: 'relative', zIndex: 20 }}>
        <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.25em', color: '#888', margin: '0 0 1.5rem 0', fontWeight: 600 }}>
          Distintos lugares. La misma actitud.
        </p>
        <h1 style={{ fontSize: '4.5rem', margin: '0 0 1.5rem 0', fontWeight: 900, letterSpacing: '-0.04em' }}>
          Nuestras colecciones.
        </h1>
        <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.25em', color: '#888', margin: 0, fontWeight: 600 }}>
          Different ways to get lost.
        </p>
      </div>

      <div style={{ position: 'relative', width: '100%', height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {slides.map((slide, i) => {
          let offset = i - active
          if (offset < -1) offset += slides.length
          if (offset > 1) offset -= slides.length
          if (Math.abs(offset) > 1) return null;

          const isActive = offset === 0;
          const isPrev = offset === -1;
          const isNext = offset === 1;

          let translateX = "0%"
          let scale = 1
          let opacity = 1
          let zIndex = 10

          if (isPrev) { translateX = "-75%"; scale = 0.85; opacity = 0.4; zIndex = 5 } 
          else if (isNext) { translateX = "75%"; scale = 0.85; opacity = 0.4; zIndex = 5 }

          return (
            <div 
              key={slide.id}
              style={{ position: 'absolute', width: '70vw', maxWidth: '900px', height: '100%', transition: 'all 0.6s cubic-bezier(0.25, 1, 0.5, 1)', transform: `translateX(${translateX}) scale(${scale})`, opacity, zIndex, cursor: isActive ? 'default' : 'pointer' }}
              onClick={() => { if (isPrev) prev(); if (isNext) next() }}
            >
              <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '4px', overflow: 'hidden' }}>
                <img src={slide.image} alt={slide.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)' }}></div>
                
                <div style={{ position: 'absolute', top: '2rem', left: '2.5rem', right: '2.5rem', display: 'flex', justifyContent: 'space-between', opacity: isActive ? 1 : 0, transition: 'opacity 0.3s 0.3s' }}>
                  <span style={{ fontSize: '0.7rem', color: '#fff', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600 }}>{slide.category}</span>
                  <span style={{ fontSize: '0.7rem', color: '#fff', letterSpacing: '2px', fontWeight: 600 }}>{slide.number}</span>
                </div>

                <div style={{ position: 'absolute', bottom: '3rem', left: '2.5rem', opacity: isActive ? 1 : 0, transition: 'opacity 0.3s 0.3s' }}>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700 }}>{slide.subtitle}</p>
                  <h2 style={{ margin: '0 0 1.2rem 0', fontSize: '4.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>{slide.title}</h2>
                  <Link to={slide.link} style={{ fontSize: '0.75rem', color: '#fff', textDecoration: 'none', borderBottom: '2px solid #fff', paddingBottom: '0.3rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Explorar Colección</Link>
                </div>

                {isActive && (
                  <>
                    <button onClick={(e) => { e.stopPropagation(); prev(); }} style={{ position: 'absolute', left: '2rem', top: '50%', transform: 'translateY(-50%)', width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(8px)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.8)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(0,0,0,0.4)'}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>
                    <button onClick={(e) => { e.stopPropagation(); next(); }} style={{ position: 'absolute', right: '2rem', top: '50%', transform: 'translateY(-50%)', width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(8px)', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.8)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(0,0,0,0.4)'}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg></button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '3rem' }}>
        {slides.map((_, i) => (
          <button key={i} onClick={() => setActive(i)} style={{ width: '24px', height: '2px', background: active === i ? '#fff' : '#333', border: 'none', cursor: 'pointer', padding: 0, transition: 'background 0.3s ease' }} aria-label={`Ir a colección ${i + 1}`} />
        ))}
      </div>
    </main>
  )
}