import React, { useState } from "react"
import { Link } from "react-router-dom"
import { api } from "./services/api"
import type { ComplaintInput, ComplaintRecord } from "./types"

export default function ComplaintsBook() {
  const [consumerName, setConsumerName] = useState("")
  const [documentType, setDocumentType] = useState<"DNI" | "CE" | "Pasaporte">("DNI")
  const [documentNumber, setDocumentNumber] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [isMinor, setIsMinor] = useState(false)
  const [parentName, setParentName] = useState("")
  const [parentDocument, setParentDocument] = useState("")

  const [goodType, setGoodType] = useState<"producto" | "servicio">("producto")
  const [claimedAmount, setClaimedAmount] = useState<string>("")
  const [goodDescription, setGoodDescription] = useState("")

  const [claimType, setClaimType] = useState<"reclamo" | "queja">("reclamo")
  const [detail, setDetail] = useState("")
  const [consumerRequest, setConsumerRequest] = useState("")

  const [acceptedDeclaration, setAcceptedDeclaration] = useState(false)
  const [acceptedNotification, setAcceptedNotification] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [confirmedComplaint, setConfirmedComplaint] = useState<ComplaintRecord | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!acceptedDeclaration || !acceptedNotification) {
      setErrorMessage("Debes aceptar la declaración jurada y el consentimiento de notificación para proceder.")
      return
    }

    if (!consumerName.trim() || !documentNumber.trim() || !address.trim() || !phone.trim() || !email.trim()) {
      setErrorMessage("Por favor, completa todos los datos personales obligatorios.")
      return
    }

    if (!goodDescription.trim() || !detail.trim() || !consumerRequest.trim()) {
      setErrorMessage("Por favor, completa la descripción del bien, el detalle y tu pedido concreto.")
      return
    }

    if (isMinor && (!parentName.trim() || !parentDocument.trim())) {
      setErrorMessage("Al ser menor de edad, debes ingresar los datos de tu padre, madre o apoderado legal.")
      return
    }

    setIsSubmitting(true)

    const payload: ComplaintInput = {
      consumerName: consumerName.trim(),
      documentType,
      documentNumber: documentNumber.trim(),
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      isMinor,
      parentName: isMinor ? parentName.trim() : undefined,
      parentDocument: isMinor ? parentDocument.trim() : undefined,
      goodType,
      claimedAmount: claimedAmount ? parseFloat(claimedAmount) : 0,
      goodDescription: goodDescription.trim(),
      claimType,
      detail: detail.trim(),
      consumerRequest: consumerRequest.trim(),
    }

    try {
      const res = await api.complaints.submit(payload)
      if (res.ok && res.complaint) {
        setConfirmedComplaint(res.complaint)
        window.scrollTo({ top: 0, behavior: "smooth" })
      } else {
        setErrorMessage(res.error || "Ocurrió un error al enviar tu hoja de reclamación. Inténtalo nuevamente.")
      }
    } catch {
      setErrorMessage("Error de conexión al enviar el formulario. Verifica tu conexión a internet.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // ---------------------------------------------------------------------------
  // VISTA: HOJA DE RECLAMACIÓN CONFIRMADA (COMPROBANTE OFICIAL INDECOPI)
  // ---------------------------------------------------------------------------
  if (confirmedComplaint) {
    return (
      <main
        style={{
          backgroundColor: "#0d0e12",
          color: "#e2e8f0",
          minHeight: "100vh",
          padding: "3rem 1.5rem 6rem",
          fontFamily: '"Inter", -apple-system, sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: "760px",
            margin: "0 auto",
            backgroundColor: "#13161c",
            border: "1px solid #232832",
            borderRadius: "6px",
            padding: "2.5rem",
            boxShadow: "0 25px 50px rgba(0,0,0,0.6)",
          }}
          className="print-container"
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              borderBottom: "2px solid #2e3542",
              paddingBottom: "1.5rem",
              marginBottom: "1.5rem",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "0.7rem",
                  fontFamily: '"Barlow Condensed", sans-serif',
                  letterSpacing: "2px",
                  color: "#94a3b8",
                  textTransform: "uppercase",
                }}
              >
                REPÚBLICA DEL PERÚ • INDECOPI (D.S. N° 011-2011-PCM)
              </span>
              <h1
                style={{
                  fontFamily: '"Barlow Condensed", sans-serif',
                  fontSize: "2rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  color: "#ffffff",
                  margin: "0.2rem 0",
                  letterSpacing: "0.5px",
                }}
              >
                Hoja de Reclamación Virtual
              </h1>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#94a3b8" }}>
                Razón Social: <strong>GONE SURFING PERÚ S.A.C.</strong> • RUC: 20609876543
              </p>
            </div>
            <div
              style={{
                background: "#1c212a",
                border: "1px solid #333c4d",
                padding: "0.75rem 1rem",
                borderRadius: "4px",
                textAlign: "right",
              }}
            >
              <span style={{ display: "block", fontSize: "0.7rem", color: "#94a3b8", letterSpacing: "1px" }}>
                CÓDIGO DE RECLAMACIÓN
              </span>
              <strong style={{ fontSize: "1.25rem", color: "#38bdf8", letterSpacing: "1px" }}>
                {confirmedComplaint.id}
              </strong>
              <span style={{ display: "block", fontSize: "0.7rem", color: "#64748b", marginTop: "2px" }}>
                Fecha: {new Date(confirmedComplaint.createdAt).toLocaleString("es-PE")}
              </span>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "rgba(56, 189, 248, 0.08)",
              border: "1px solid rgba(56, 189, 248, 0.2)",
              padding: "1rem",
              borderRadius: "4px",
              marginBottom: "2rem",
              fontSize: "0.85rem",
              color: "#bae6fd",
            }}
          >
            ✓ <strong>Hoja registrada con éxito.</strong> Conforme a la <strong>Ley N° 31435</strong>, el proveedor deberá dar respuesta al reclamo o queja en un plazo no mayor a <strong>15 días hábiles</strong> improrrogables. Se ha remitido una copia a tu correo electrónico registrado.
          </div>

          {/* Resumen 1: Consumidor */}
          <div style={{ marginBottom: "1.5rem", borderBottom: "1px solid #232832", paddingBottom: "1.2rem" }}>
            <h3
              style={{
                fontFamily: '"Barlow Condensed", sans-serif',
                fontSize: "1.1rem",
                fontWeight: 700,
                color: "#f8fafc",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                margin: "0 0 0.8rem 0",
              }}
            >
              1. Identificación del Consumidor Reclamante
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem", fontSize: "0.85rem" }}>
              <div>
                <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>Nombre Completo</span>
                <strong>{confirmedComplaint.consumerName}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>Documento ({confirmedComplaint.documentType})</span>
                <strong>{confirmedComplaint.documentNumber}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>Teléfono / Celular</span>
                <strong>{confirmedComplaint.phone}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>Correo Electrónico</span>
                <strong>{confirmedComplaint.email}</strong>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>Domicilio</span>
                <strong>{confirmedComplaint.address}</strong>
              </div>
              {confirmedComplaint.isMinor && (
                <div style={{ gridColumn: "1 / -1", background: "#1a1e26", padding: "0.5rem 0.75rem", borderRadius: "3px" }}>
                  <span style={{ color: "#94a3b8", display: "block", fontSize: "0.75rem" }}>Padre / Madre / Apoderado (Menor de Edad)</span>
                  <strong>{confirmedComplaint.parentName} — DNI: {confirmedComplaint.parentDocument}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Resumen 2: Bien Contratado */}
          <div style={{ marginBottom: "1.5rem", borderBottom: "1px solid #232832", paddingBottom: "1.2rem" }}>
            <h3
              style={{
                fontFamily: '"Barlow Condensed", sans-serif',
                fontSize: "1.1rem",
                fontWeight: 700,
                color: "#f8fafc",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                margin: "0 0 0.8rem 0",
              }}
            >
              2. Identificación del Bien o Servicio Contratado
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem", fontSize: "0.85rem" }}>
              <div>
                <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>Naturaleza</span>
                <strong style={{ textTransform: "uppercase" }}>{confirmedComplaint.goodType}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>Monto Reclamado</span>
                <strong>S/. {(confirmedComplaint.claimedAmount || 0).toFixed(2)}</strong>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>Descripción del Bien / Pedido</span>
                <p style={{ margin: "0.2rem 0 0 0", color: "#cbd5e1" }}>{confirmedComplaint.goodDescription}</p>
              </div>
            </div>
          </div>

          {/* Resumen 3: Detalle de Reclamación */}
          <div style={{ marginBottom: "2rem" }}>
            <h3
              style={{
                fontFamily: '"Barlow Condensed", sans-serif',
                fontSize: "1.1rem",
                fontWeight: 700,
                color: "#f8fafc",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                margin: "0 0 0.8rem 0",
              }}
            >
              3. Detalle de la Reclamación y Pedido del Consumidor
            </h3>
            <div style={{ marginBottom: "1rem" }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "4px 10px",
                  borderRadius: "3px",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  backgroundColor: confirmedComplaint.claimType === "reclamo" ? "#fef3c7" : "#e0e7ff",
                  color: confirmedComplaint.claimType === "reclamo" ? "#92400e" : "#3730a3",
                }}
              >
                {confirmedComplaint.claimType.toUpperCase()}
              </span>
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>Detalle de los Hechos</span>
              <p style={{ margin: "0.3rem 0 0 0", color: "#e2e8f0", fontSize: "0.88rem", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                {confirmedComplaint.detail}
              </p>
            </div>
            <div>
              <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>Pedido Concreto del Consumidor</span>
              <p style={{ margin: "0.3rem 0 0 0", color: "#e2e8f0", fontSize: "0.88rem", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                {confirmedComplaint.consumerRequest}
              </p>
            </div>
          </div>

          {/* Acciones */}
          <div
            style={{
              display: "flex",
              gap: "1rem",
              flexWrap: "wrap",
              borderTop: "1px solid #232832",
              paddingTop: "1.5rem",
            }}
          >
            <button
              onClick={() => window.print()}
              style={{
                flex: "1 1 200px",
                padding: "0.9rem 1.5rem",
                backgroundColor: "#ffffff",
                color: "#0a0a0a",
                border: "none",
                borderRadius: "3px",
                fontWeight: 800,
                fontFamily: '"Barlow Condensed", sans-serif',
                fontSize: "1rem",
                letterSpacing: "1px",
                textTransform: "uppercase",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <span>🖨️</span> Imprimir / Guardar en PDF
            </button>
            <Link
              to="/shop"
              style={{
                flex: "1 1 200px",
                padding: "0.9rem 1.5rem",
                backgroundColor: "transparent",
                color: "#94a3b8",
                border: "1px solid #333c4d",
                borderRadius: "3px",
                fontWeight: 700,
                fontFamily: '"Barlow Condensed", sans-serif',
                fontSize: "1rem",
                letterSpacing: "1px",
                textTransform: "uppercase",
                textAlign: "center",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ← Volver a la Tienda
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // ---------------------------------------------------------------------------
  // VISTA: FORMULARIO OFICIAL DEL LIBRO DE RECLAMACIONES
  // ---------------------------------------------------------------------------
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

        {/* Encabezado Principal */}
        <header
          style={{
            borderBottom: "1px solid #1e293b",
            paddingBottom: "2rem",
            marginBottom: "2.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "0.5rem" }}>
            <span
              style={{
                padding: "3px 8px",
                background: "#1e293b",
                borderRadius: "3px",
                fontSize: "0.75rem",
                fontFamily: '"Barlow Condensed", sans-serif',
                letterSpacing: "1px",
                color: "#38bdf8",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              NORMATIVA INDECOPI • D.S. N° 011-2011-PCM
            </span>
          </div>
          <h1
            style={{
              fontFamily: '"Barlow Condensed", sans-serif',
              fontSize: "clamp(2.4rem, 5vw, 3.5rem)",
              fontWeight: 800,
              letterSpacing: "-0.5px",
              textTransform: "uppercase",
              color: "#ffffff",
              margin: 0,
              lineHeight: 1.05,
            }}
          >
            Libro de Reclamaciones Virtual
          </h1>
          <p
            style={{
              color: "#94a3b8",
              fontSize: "0.9rem",
              marginTop: "0.8rem",
              lineHeight: 1.6,
            }}
          >
            <strong>GONE SURFING PERÚ S.A.C.</strong> • RUC: <strong>20609876543</strong> • Domicilio Legal: Lima, Perú.
            <br />
            Conforme a la <strong>Ley N° 31435</strong>, responderemos a su reclamo o queja en un plazo máximo de <strong>15 días hábiles</strong>.
          </p>
        </header>

        {/* Guía informativa de diferencia entre Reclamo y Queja */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1rem",
            marginBottom: "2.5rem",
          }}
        >
          <div
            style={{
              background: "#13161c",
              border: "1px solid #232832",
              padding: "1.2rem",
              borderRadius: "4px",
            }}
          >
            <strong style={{ display: "block", color: "#f59e0b", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.4rem" }}>
              ¿Qué es un Reclamo?
            </strong>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "#94a3b8", lineHeight: 1.5 }}>
              Disconformidad relacionada con los productos o prendas adquiridas en la tienda (tallas, defectos, demoras en el despacho o disconformidad con el bien entregado).
            </p>
          </div>
          <div
            style={{
              background: "#13161c",
              border: "1px solid #232832",
              padding: "1.2rem",
              borderRadius: "4px",
            }}
          >
            <strong style={{ display: "block", color: "#818cf8", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "0.4rem" }}>
              ¿Qué es una Queja?
            </strong>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "#94a3b8", lineHeight: 1.5 }}>
              Malestar o descontento respecto a la atención recibida por parte de nuestro personal o canales de soporte al público, no relacionada directamente al producto.
            </p>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
          {errorMessage && (
            <div
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                border: "1px solid #ef4444",
                padding: "1rem 1.25rem",
                borderRadius: "4px",
                color: "#fca5a5",
                fontSize: "0.9rem",
              }}
            >
              ⚠ {errorMessage}
            </div>
          )}

          {/* SECCIÓN 1: DATOS DEL CONSUMIDOR */}
          <section
            style={{
              background: "#13161c",
              border: "1px solid #232832",
              borderRadius: "6px",
              padding: "2rem",
            }}
          >
            <h2
              style={{
                fontFamily: '"Barlow Condensed", sans-serif',
                fontSize: "1.4rem",
                fontWeight: 700,
                color: "#ffffff",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                margin: "0 0 1.5rem 0",
                borderBottom: "1px solid #1e293b",
                paddingBottom: "0.75rem",
              }}
            >
              1. Identificación del Consumidor Reclamante
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "1px", color: "#94a3b8", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                  Nombres y Apellidos Completos *
                </label>
                <input
                  type="text"
                  required
                  value={consumerName}
                  onChange={(e) => setConsumerName(e.target.value)}
                  placeholder="Ej. Mateo Valdivia Ramos"
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    backgroundColor: "#0a0c10",
                    border: "1px solid #2a3240",
                    borderRadius: "4px",
                    color: "#ffffff",
                    fontSize: "0.9rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "1px", color: "#94a3b8", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                  Tipo de Documento *
                </label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value as any)}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    backgroundColor: "#0a0c10",
                    border: "1px solid #2a3240",
                    borderRadius: "4px",
                    color: "#ffffff",
                    fontSize: "0.9rem",
                  }}
                >
                  <option value="DNI">DNI (Documento Nacional de Identidad)</option>
                  <option value="CE">Carné de Extranjería (CE)</option>
                  <option value="Pasaporte">Pasaporte</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "1px", color: "#94a3b8", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                  Número de Documento *
                </label>
                <input
                  type="text"
                  required
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  placeholder="Ej. 72458912"
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    backgroundColor: "#0a0c10",
                    border: "1px solid #2a3240",
                    borderRadius: "4px",
                    color: "#ffffff",
                    fontSize: "0.9rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "1px", color: "#94a3b8", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                  Teléfono / Celular *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej. 999 888 777"
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    backgroundColor: "#0a0c10",
                    border: "1px solid #2a3240",
                    borderRadius: "4px",
                    color: "#ffffff",
                    fontSize: "0.9rem",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "1px", color: "#94a3b8", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                  Correo Electrónico (Copia oficial) *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    backgroundColor: "#0a0c10",
                    border: "1px solid #2a3240",
                    borderRadius: "4px",
                    color: "#ffffff",
                    fontSize: "0.9rem",
                  }}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "1px", color: "#94a3b8", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                  Domicilio Completo (Dirección, Distrito, Ciudad) *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ej. Malecón de la Marina 450, Dpto 302, Miraflores, Lima"
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    backgroundColor: "#0a0c10",
                    border: "1px solid #2a3240",
                    borderRadius: "4px",
                    color: "#ffffff",
                    fontSize: "0.9rem",
                  }}
                />
              </div>

              <div style={{ gridColumn: "1 / -1", marginTop: "0.5rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.85rem", color: "#94a3b8" }}>
                  <input
                    type="checkbox"
                    checked={isMinor}
                    onChange={(e) => setIsMinor(e.target.checked)}
                    style={{ accentColor: "#ffffff", width: "16px", height: "16px" }}
                  />
                  <span>El consumidor reclamante es menor de edad (requiere datos del apoderado).</span>
                </label>
              </div>

              {isMinor && (
                <>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "1px", color: "#94a3b8", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                      Nombre del Padre / Madre o Apoderado *
                    </label>
                    <input
                      type="text"
                      required={isMinor}
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      placeholder="Nombre del apoderado"
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        backgroundColor: "#0a0c10",
                        border: "1px solid #2a3240",
                        borderRadius: "4px",
                        color: "#ffffff",
                        fontSize: "0.9rem",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "1px", color: "#94a3b8", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                      DNI del Padre / Madre o Apoderado *
                    </label>
                    <input
                      type="text"
                      required={isMinor}
                      value={parentDocument}
                      onChange={(e) => setParentDocument(e.target.value)}
                      placeholder="DNI del apoderado"
                      style={{
                        width: "100%",
                        padding: "0.75rem 1rem",
                        backgroundColor: "#0a0c10",
                        border: "1px solid #2a3240",
                        borderRadius: "4px",
                        color: "#ffffff",
                        fontSize: "0.9rem",
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </section>

          {/* SECCIÓN 2: BIEN O SERVICIO CONTRATADO */}
          <section
            style={{
              background: "#13161c",
              border: "1px solid #232832",
              borderRadius: "6px",
              padding: "2rem",
            }}
          >
            <h2
              style={{
                fontFamily: '"Barlow Condensed", sans-serif',
                fontSize: "1.4rem",
                fontWeight: 700,
                color: "#ffffff",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                margin: "0 0 1.5rem 0",
                borderBottom: "1px solid #1e293b",
                paddingBottom: "0.75rem",
              }}
            >
              2. Identificación del Bien o Servicio Contratado
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "1px", color: "#94a3b8", textTransform: "uppercase", marginBottom: "0.6rem" }}>
                  Tipo de Contratación *
                </label>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <label
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      padding: "0.75rem",
                      backgroundColor: goodType === "producto" ? "#ffffff" : "#0a0c10",
                      color: goodType === "producto" ? "#0a0a0a" : "#94a3b8",
                      border: "1px solid",
                      borderColor: goodType === "producto" ? "#ffffff" : "#2a3240",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: 700,
                      fontFamily: '"Barlow Condensed", sans-serif',
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      fontSize: "0.95rem",
                    }}
                  >
                    <input
                      type="radio"
                      name="goodType"
                      value="producto"
                      checked={goodType === "producto"}
                      onChange={() => setGoodType("producto")}
                      style={{ display: "none" }}
                    />
                    Producto (Prenda)
                  </label>
                  <label
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      padding: "0.75rem",
                      backgroundColor: goodType === "servicio" ? "#ffffff" : "#0a0c10",
                      color: goodType === "servicio" ? "#0a0a0a" : "#94a3b8",
                      border: "1px solid",
                      borderColor: goodType === "servicio" ? "#ffffff" : "#2a3240",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: 700,
                      fontFamily: '"Barlow Condensed", sans-serif',
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      fontSize: "0.95rem",
                    }}
                  >
                    <input
                      type="radio"
                      name="goodType"
                      value="servicio"
                      checked={goodType === "servicio"}
                      onChange={() => setGoodType("servicio")}
                      style={{ display: "none" }}
                    />
                    Servicio
                  </label>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "1px", color: "#94a3b8", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                  Monto Reclamado (S/.)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={claimedAmount}
                  onChange={(e) => setClaimedAmount(e.target.value)}
                  placeholder="0.00"
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    backgroundColor: "#0a0c10",
                    border: "1px solid #2a3240",
                    borderRadius: "4px",
                    color: "#ffffff",
                    fontSize: "0.9rem",
                  }}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "1px", color: "#94a3b8", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                  Descripción del Producto / Servicio / N° de Pedido *
                </label>
                <input
                  type="text"
                  required
                  value={goodDescription}
                  onChange={(e) => setGoodDescription(e.target.value)}
                  placeholder="Ej. Polera Oversize Gone Surfing Talla M - Pedido #ORD-8492"
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    backgroundColor: "#0a0c10",
                    border: "1px solid #2a3240",
                    borderRadius: "4px",
                    color: "#ffffff",
                    fontSize: "0.9rem",
                  }}
                />
              </div>
            </div>
          </section>

          {/* SECCIÓN 3: DETALLE DEL RECLAMO O QUEJA */}
          <section
            style={{
              background: "#13161c",
              border: "1px solid #232832",
              borderRadius: "6px",
              padding: "2rem",
            }}
          >
            <h2
              style={{
                fontFamily: '"Barlow Condensed", sans-serif',
                fontSize: "1.4rem",
                fontWeight: 700,
                color: "#ffffff",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                margin: "0 0 1.5rem 0",
                borderBottom: "1px solid #1e293b",
                paddingBottom: "0.75rem",
              }}
            >
              3. Detalle de la Reclamación y Pedido del Consumidor
            </h2>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "1px", color: "#94a3b8", textTransform: "uppercase", marginBottom: "0.6rem" }}>
                Tipo de Reclamación *
              </label>
              <div style={{ display: "flex", gap: "1rem" }}>
                <label
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "1rem",
                    backgroundColor: claimType === "reclamo" ? "#1e293b" : "#0a0c10",
                    color: claimType === "reclamo" ? "#f59e0b" : "#94a3b8",
                    border: "1px solid",
                    borderColor: claimType === "reclamo" ? "#f59e0b" : "#2a3240",
                    borderRadius: "4px",
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  <input
                    type="radio"
                    name="claimType"
                    value="reclamo"
                    checked={claimType === "reclamo"}
                    onChange={() => setClaimType("reclamo")}
                    style={{ display: "none" }}
                  />
                  <strong style={{ fontFamily: '"Barlow Condensed", sans-serif', fontSize: "1.1rem", textTransform: "uppercase", letterSpacing: "1px" }}>
                    RECLAMO
                  </strong>
                  <span style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "4px" }}>
                    Disconformidad con el producto o servicio adquirido
                  </span>
                </label>

                <label
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "1rem",
                    backgroundColor: claimType === "queja" ? "#1e293b" : "#0a0c10",
                    color: claimType === "queja" ? "#818cf8" : "#94a3b8",
                    border: "1px solid",
                    borderColor: claimType === "queja" ? "#818cf8" : "#2a3240",
                    borderRadius: "4px",
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  <input
                    type="radio"
                    name="claimType"
                    value="queja"
                    checked={claimType === "queja"}
                    onChange={() => setClaimType("queja")}
                    style={{ display: "none" }}
                  />
                  <strong style={{ fontFamily: '"Barlow Condensed", sans-serif', fontSize: "1.1rem", textTransform: "uppercase", letterSpacing: "1px" }}>
                    QUEJA
                  </strong>
                  <span style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "4px" }}>
                    Malestar o descontento respecto a la atención recibida
                  </span>
                </label>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "1px", color: "#94a3b8", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                  Detalle del Reclamo o Queja *
                </label>
                <textarea
                  required
                  rows={4}
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  placeholder="Describa con la mayor claridad posible los hechos ocurridos..."
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    backgroundColor: "#0a0c10",
                    border: "1px solid #2a3240",
                    borderRadius: "4px",
                    color: "#ffffff",
                    fontSize: "0.9rem",
                    resize: "vertical",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "1px", color: "#94a3b8", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                  Pedido Concreto del Consumidor *
                </label>
                <textarea
                  required
                  rows={3}
                  value={consumerRequest}
                  onChange={(e) => setConsumerRequest(e.target.value)}
                  placeholder="Indique con precisión qué solución solicita (ej. cambio de prenda, devolución del importe, disculpas, etc.)..."
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    backgroundColor: "#0a0c10",
                    border: "1px solid #2a3240",
                    borderRadius: "4px",
                    color: "#ffffff",
                    fontSize: "0.9rem",
                    resize: "vertical",
                  }}
                />
              </div>
            </div>
          </section>

          {/* DECLARACIÓN LEGAL Y CHECKBOXES */}
          <section
            style={{
              background: "#13161c",
              border: "1px solid #232832",
              borderRadius: "6px",
              padding: "1.5rem 2rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer", fontSize: "0.85rem", color: "#cbd5e1", lineHeight: 1.5 }}>
              <input
                type="checkbox"
                required
                checked={acceptedDeclaration}
                onChange={(e) => setAcceptedDeclaration(e.target.checked)}
                style={{ marginTop: "3px", accentColor: "#ffffff", width: "16px", height: "16px" }}
              />
              <span>
                <strong>Declaración Jurada:</strong> Declaro ser el titular del bien/servicio o representante legalmente facultado, y doy fe de que los datos consignados en esta Hoja de Reclamación son verídicos conforme al Código de Protección y Defensa del Consumidor (Ley N° 29571).
              </span>
            </label>

            <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer", fontSize: "0.85rem", color: "#cbd5e1", lineHeight: 1.5 }}>
              <input
                type="checkbox"
                required
                checked={acceptedNotification}
                onChange={(e) => setAcceptedNotification(e.target.checked)}
                style={{ marginTop: "3px", accentColor: "#ffffff", width: "16px", height: "16px" }}
              />
              <span>
                <strong>Notificación Electrónica:</strong> Autorizo expresamente que la respuesta a la presente reclamación sea remitida a la dirección de correo electrónico indicada en el formulario.
              </span>
            </label>
          </section>

          {/* BOTÓN DE ENVÍO */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: "100%",
                padding: "1.1rem",
                backgroundColor: "#ffffff",
                color: "#0a0a0a",
                border: "none",
                borderRadius: "4px",
                fontWeight: 800,
                fontFamily: '"Barlow Condensed", sans-serif',
                fontSize: "1.15rem",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                opacity: isSubmitting ? 0.7 : 1,
                boxShadow: "0 10px 20px rgba(0,0,0,0.4)",
                transition: "all 0.2s ease",
              }}
            >
              {isSubmitting ? "REGISTRANDO HOJA DE RECLAMACIÓN..." : "ENVIAR HOJA DE RECLAMACIÓN"}
            </button>
            <p style={{ textAlign: "center", fontSize: "0.75rem", color: "#64748b", marginTop: "0.75rem" }}>
              Al enviar, se generará de inmediato un número de registro único legal para seguimiento.
            </p>
          </div>
        </form>
      </div>
    </main>
  )
}
