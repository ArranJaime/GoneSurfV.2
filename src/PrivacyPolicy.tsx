import React from "react"
import { Link } from "react-router-dom"

export default function PrivacyPolicy() {
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
            Protección de Datos Personales • Ley N° 29733
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
              lineHeight: 1.05,
            }}
          >
            Política de Privacidad y Tratamiento de Datos
          </h1>
          <p
            style={{
              color: "#94a3b8",
              fontSize: "0.9rem",
              marginTop: "0.8rem",
              lineHeight: 1.6,
            }}
          >
            En cumplimiento estricto de la <strong>Ley N° 29733</strong> (Ley de
            Protección de Datos Personales de la República del Perú) y su
            Reglamento aprobado por el{" "}
            <strong>Decreto Supremo N° 003-2013-JUS</strong>.
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
              1. Titular del Banco de Datos Personales
            </h2>
            <p>
              El titular del banco de datos personales correspondiente a los
              usuarios y clientes de la tienda en línea es{" "}
              <strong>Gone Surfing Perú S.A.C.</strong>, con domicilio legal en
              Lima, Perú, y correo electrónico de contacto:{" "}
              <strong>privacidad@gonesurfing.pe</strong>.
            </p>
            <p style={{ marginTop: "0.8rem" }}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam
              erat volutpat. Ut tincidunt, nisl nec feugiat pellentesque, turpis
              enim hendrerit neque, eu interdum nulla lorem a sem. Suspendisse
              potenti. Nunc dignissim bibendum hendrerit.
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
              2. Datos Personales Objeto de Tratamiento
            </h2>
            <p>
              Para la correcta prestación de nuestros servicios de comercio
              electrónico, despacho a domicilio y atención al cliente,
              recopilamos los siguientes datos personales:
            </p>
            <ul style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
              <li>
                <strong>Datos de Identificación:</strong> Nombres, apellidos,
                tipo y número de documento de identidad (DNI, CE o Pasaporte).
              </li>
              <li>
                <strong>Datos de Contacto:</strong> Correo electrónico, número
                de teléfono fijo o móvil.
              </li>
              <li>
                <strong>Datos de Ubicación y Entrega:</strong> Dirección
                domiciliaria, departamento, provincia, distrito y puntos de
                referencia.
              </li>
              <li>
                <strong>Datos de Transacción:</strong> Historial de compras,
                productos seleccionados, montos facturados y método de pago
                elegido.
              </li>
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
              3. Finalidad del Tratamiento de Datos
            </h2>
            <p>
              Los datos personales recolectados serán tratados con las
              siguientes finalidades:
            </p>
            <ol style={{ paddingLeft: "1.5rem", marginTop: "0.5rem" }}>
              <li>Validar y procesar las órdenes de compra en línea.</li>
              <li>
                Coordinar el despacho y la entrega de productos en la dirección
                indicada por el usuario.
              </li>
              <li>
                Emitir los comprobantes de pago electrónicos correspondientes
                exigidos por SUNAT.
              </li>
              <li>
                Atender consultas, reclamos o sugerencias a través del Libro de
                Reclamaciones o canales de soporte.
              </li>
              <li>
                Remitir comunicaciones sobre el estado de su pedido mediante
                correo electrónico o WhatsApp.
              </li>
            </ol>
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
              4. Consentimiento Libre, Previo, Expreso e Informado
            </h2>
            <p>
              Al marcar la casilla de verificación correspondiente durante el
              proceso de registro o checkout, el usuario otorga su
              consentimiento previo, expreso, inequívoco e informado para el
              tratamiento de sus datos personales conforme a las finalidades
              aquí expuestas.
            </p>
            <p style={{ marginTop: "0.8rem" }}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras sed
              felis eget velit aliquet aliquet. Morbi dapibus, eros sed interdum
              molestie, velit nulla vulputate mi, non elementum turpis odio a
              magna.
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
              5. Transferencia y Terceros Encargados del Tratamiento
            </h2>
            <p>
              Sus datos personales podrán ser compartidos exclusivamente con
              proveedores indispensables para la prestación del servicio
              (empresas de logística/courier y procesadores de pago seguros).
              Dichos terceros se encuentran contractualmente obligados a
              garantizar la confidencialidad y seguridad de la información. No
              vendemos ni alquilamos bases de datos a terceros.
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
              6. Ejercicio de los Derechos ARCO (Acceso, Rectificación,
              Cancelación y Oposición)
            </h2>
            <p>
              Conforme a la Ley N° 29733, los titulares de los datos tienen
              derecho a acceder a sus datos personales, solicitar su
              rectificación cuando sean inexactos o incompletos, exigir su
              cancelación cuando hayan dejado de ser necesarios para las
              finalidades recopiladas, u oponerse a su tratamiento.
            </p>
            <p style={{ marginTop: "0.8rem" }}>
              Para ejercer cualquiera de sus derechos ARCO, puede remitir una
              solicitud formal al correo{" "}
              <strong>privacidad@gonesurfing.pe</strong> adjuntando copia de su
              documento de identidad. Su requerimiento será atendido dentro de
              los plazos fijados por ley.
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
              7. Medidas de Seguridad y Conservación
            </h2>
            <p>
              Implementamos rigurosas medidas técnicas, organizativas y legales
              de seguridad para proteger los datos personales contra accesos no
              autorizados, pérdida accidental, alteración o divulgación
              indebida, incluyendo cifrado SSL en tránsito y almacenamiento
              seguro en infraestructura de nube de Amazon Web Services (AWS).
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
