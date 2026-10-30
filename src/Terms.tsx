import React from "react"
import { Link } from "react-router-dom"

export default function Terms() {
  return (
    <main
      style={{
        backgroundColor: "#0d0e12",
        color: "#e2e8f0",
        minHeight: "100vh",
        padding: "4rem 1.5rem 6rem",
        fontFamily: '"Inter", -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: "840px",
          margin: "0 auto",
        }}
      >
        {/* Navigation Breadcrumb */}
        <div style={{ marginBottom: "2rem" }}>
          <Link
            to="/shop"
            style={{
              color: "#94a3b8",
              textDecoration: "none",
              fontSize: "0.8rem",
              fontWeight: 600,
              letterSpacing: "1px",
              textTransform: "uppercase",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            ← Volver a la Tienda
          </Link>
        </div>

        {/* Header */}
        <header
          style={{
            borderBottom: "1px solid #1e293b",
            paddingBottom: "2rem",
            marginBottom: "3rem",
          }}
        >
          <span
            style={{
              display: "block",
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: "0.85rem",
              fontWeight: 700,
              letterSpacing: "2px",
              color: "#64748b",
              textTransform: "uppercase",
              marginBottom: "0.5rem",
            }}
          >
            Marco Legal • Gone Surfing Perú
          </span>
          <h1
            style={{
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: "clamp(2.5rem, 5vw, 3.8rem)",
              fontWeight: 800,
              letterSpacing: "-0.5px",
              textTransform: "uppercase",
              color: "#ffffff",
              margin: 0,
              lineHeight: 1,
            }}
          >
            Términos y Condiciones de Uso
          </h1>
          <p
            style={{
              color: "#94a3b8",
              fontSize: "0.9rem",
              marginTop: "0.8rem",
              lineHeight: 1.6,
            }}
          >
            Vigencia a partir de: <strong>Octubre 2026</strong> • Aplicable para todas las transacciones realizadas en la plataforma oficial de <strong>Gone Surfing Perú S.A.C.</strong> conforme a la legislación de la República del Perú.
          </p>
        </header>

        {/* Content Body */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "2.5rem",
            fontSize: "0.95rem",
            lineHeight: 1.8,
            color: "#cbd5e1",
          }}
        >
          <section>
            <h2
              style={{
                fontFamily: '"Barlow Condensed", sans-serif',
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "#ffffff",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                marginBottom: "0.8rem",
              }}
            >
              1. Aspectos Generales y Aceptación
            </h2>
            <p>
              Bienvenido al portal de comercio electrónico de <strong>Gone Surfing Perú S.A.C.</strong> El acceso y uso de este sitio web se rige por los presentes Términos y Condiciones, así como por la legislación vigente en la República del Perú, en particular la Ley N° 29571 (Código de Protección y Defensa del Consumidor) y la Ley N° 29733 (Ley de Protección de Datos Personales).
            </p>
            <p style={{ marginTop: "0.8rem" }}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi. Nulla quis sem at nibh elementum imperdiet. Duis sagittis ipsum. Praesent mauris. Fusce nec tellus sed augue semper porta. Mauris massa. Vestibulum lacinia arcu eget nulla.
            </p>
          </section>

          <section>
            <h2
              style={{
                fontFamily: '"Barlow Condensed", sans-serif',
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "#ffffff",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                marginBottom: "0.8rem",
              }}
            >
              2. Registro de Usuario y Privacidad de la Cuenta
            </h2>
            <p>
              El usuario puede realizar compras como cliente invitado o creando una cuenta registrada. En caso de registro, el usuario es responsable del resguardo de su contraseña. Todas las actividades realizadas con su cuenta serán de su exclusiva responsabilidad.
            </p>
            <p style={{ marginTop: "0.8rem" }}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
            </p>
          </section>

          <section>
            <h2
              style={{
                fontFamily: '"Barlow Condensed", sans-serif',
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "#ffffff",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                marginBottom: "0.8rem",
              }}
            >
              3. Precios, Moneda y Stock de Productos
            </h2>
            <p>
              Todos los precios de los productos exhibidos en la tienda virtual están expresados en <strong>Soles Peruanos (S/.)</strong> e incluyen el Impuesto General a las Ventas (IGV) correspondiente al 18% conforme a la normativa de SUNAT. Los costos de envío se desglosan por separado antes de confirmar la compra.
            </p>
            <p style={{ marginTop: "0.8rem" }}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur sodales ligula in libero. Sed dignissim lacinia nunc. Curabitur tortor. Pellentesque nibh. Aenean quam. In scelerisque sem at dolor. Maecenas mattis. Sed convallis tristique sem. Proin ut ligula vel nunc egestas porttitor.
            </p>
          </section>

          <section>
            <h2
              style={{
                fontFamily: '"Barlow Condensed", sans-serif',
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "#ffffff",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                marginBottom: "0.8rem",
              }}
            >
              4. Medios de Pago Autorizados
            </h2>
            <p>
              Aceptamos los siguientes medios de pago seguros:
            </p>
            <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
              <li><strong>Billeteras Digitales (Yape / Plin):</strong> Transferencia directa al número oficial con validación de comprobante vía WhatsApp.</li>
              <li><strong>Pago Contra Entrega:</strong> Disponible en distritos seleccionados de Lima Metropolitana con pago en efectivo al recibir el pedido.</li>
              <li><strong>Tarjetas de Crédito / Débito:</strong> Procesadas con encriptación SSL de nivel bancario.</li>
            </ul>
          </section>

          <section>
            <h2
              style={{
                fontFamily: '"Barlow Condensed", sans-serif',
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "#ffffff",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                marginBottom: "0.8rem",
              }}
            >
              5. Despacho, Tiempos de Entrega y Puntos de Referencia
            </h2>
            <p>
              Los envíos se realizan a nivel de Lima Metropolitana y provincias. Es responsabilidad del consumidor ingresar una dirección precisa con referencias claras para garantizar una entrega oportuna. Los plazos estimados de entrega oscilan entre 24 y 48 horas hábiles en Lima y 72 a 96 horas en otras regiones del país.
            </p>
            <p style={{ marginTop: "0.8rem" }}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus feugiat, magna sed rhoncus finibus, nulla risus facilisis libero, eget cursus turpis libero sit amet lorem. Vivamus aliquet, justo eu luctus laoreet, mi urna lobortis erat, vel pellentesque lacus ipsum eu arcu.
            </p>
          </section>

          <section>
            <h2
              style={{
                fontFamily: '"Barlow Condensed", sans-serif',
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "#ffffff",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                marginBottom: "0.8rem",
              }}
            >
              6. Política de Cambios y Devoluciones
            </h2>
            <p>
              Se aceptan solicitudes de cambio de talla o modelo dentro de los <strong>7 días calendario</strong> posteriores a la recepción del producto, siempre que la prenda se encuentre sin señales de uso, con etiquetas originales y empaque intacto.
            </p>
            <p style={{ marginTop: "0.8rem" }}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras id dui. Nam ipsum risus, rutrum vitae, vestibulum eu, molestie vel, lacus. Sed augue ipsum, egestas nec, vestibulum et, malesuada adipiscing, dui. Vestibulum facilisis, purus nec pulvinar iaculis, ligula mi congue nunc, vitae euismod ligula urna in dolor.
            </p>
          </section>

          <section>
            <h2
              style={{
                fontFamily: '"Barlow Condensed", sans-serif',
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "#ffffff",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                marginBottom: "0.8rem",
              }}
            >
              7. Propiedad Intelectual
            </h2>
            <p>
              Todas las marcas, logos, diseños gráficos, fotografías, material audiovisual y textos presentes en este sitio web son propiedad exclusiva de <strong>Gone Surfing Perú S.A.C.</strong> o cuentan con las autorizaciones debidas. Queda prohibida su reproducción o distribución sin autorización previa por escrito.
            </p>
          </section>

          <section>
            <h2
              style={{
                fontFamily: '"Barlow Condensed", sans-serif',
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "#ffffff",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                marginBottom: "0.8rem",
              }}
            >
              8. Jurisdicción y Solución de Controversias
            </h2>
            <p>
              Cualquier controversia derivada del uso de este sitio web será resuelta bajo las leyes de la República del Perú y sometida a la jurisdicción de los jueces y tribunales del distrito judicial de Lima. Asimismo, ponemos a disposición nuestro Libro de Reclamaciones Virtual en cumplimiento con INDECOPI.
            </p>
          </section>
        </div>

        {/* Footer Brand Note */}
        <div
          style={{
            marginTop: "4rem",
            paddingTop: "2rem",
            borderTop: "1px solid #1e293b",
            textAlign: "center",
          }}
        >
          <span
            style={{
              fontFamily: "serif",
              fontStyle: "italic",
              fontSize: "1.5rem",
              color: "#94a3b8",
            }}
          >
            stay real
          </span>
          <p
            style={{
              fontSize: "0.75rem",
              letterSpacing: "2px",
              color: "#64748b",
              marginTop: "0.3rem",
            }}
          >
            SURF CULTURE FROM LIMA, PERÚ.
          </p>
        </div>
      </div>
    </main>
  )
}

