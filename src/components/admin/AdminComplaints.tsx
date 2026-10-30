import { useState } from "react"
import { useComplaints } from "../../hooks/useComplaints"
import type { ComplaintRecord, ComplaintStatus } from "../../types"
import { formatPEN } from "../../utils/accounting"

const money = (val?: number) => (val ? formatPEN(val) : "S/. 0.00")

function formatDate(isoString?: string) {
  if (!isoString) return "-"
  try {
    const d = new Date(isoString)
    return d.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return isoString
  }
}

function renderStatusBadge(status?: ComplaintStatus) {
  switch (status) {
    case "Pendiente":
      return (
        <span
          style={{
            display: "inline-block",
            padding: "4px 10px",
            borderRadius: "4px",
            backgroundColor: "#fff8e1",
            border: "1px solid #ffe082",
            color: "#b78103",
            fontSize: "0.75rem",
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          ⏳ Pendiente
        </span>
      )
    case "En Revisión":
    case "En Proceso":
      return (
        <span
          style={{
            display: "inline-block",
            padding: "4px 10px",
            borderRadius: "4px",
            backgroundColor: "#e3f2fd",
            border: "1px solid #90caf9",
            color: "#1565c0",
            fontSize: "0.75rem",
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          🔍 En Revisión
        </span>
      )
    case "Atendido":
    case "Resuelto":
      return (
        <span
          style={{
            display: "inline-block",
            padding: "4px 10px",
            borderRadius: "4px",
            backgroundColor: "#e8f5e9",
            border: "1px solid #a5d6a7",
            color: "#2e7d32",
            fontSize: "0.75rem",
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          ✓ Atendido
        </span>
      )
    case "Cerrado":
      return (
        <span
          style={{
            display: "inline-block",
            padding: "4px 10px",
            borderRadius: "4px",
            backgroundColor: "#f5f5f5",
            border: "1px solid #e0e0e0",
            color: "#616161",
            fontSize: "0.75rem",
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          🔒 Cerrado
        </span>
      )
    default:
      return (
        <span
          style={{
            display: "inline-block",
            padding: "4px 10px",
            borderRadius: "4px",
            backgroundColor: "#fafafa",
            border: "1px solid #ddd",
            color: "#333",
            fontSize: "0.75rem",
            fontWeight: 700,
          }}
        >
          {status || "Pendiente"}
        </span>
      )
  }
}

function renderTypeBadge(type?: string) {
  const isQueja = type?.toLowerCase() === "queja"
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 8px",
        borderRadius: "4px",
        backgroundColor: isQueja ? "#fce4ec" : "#ede7f6",
        border: `1px solid ${isQueja ? "#f48fb1" : "#b39ddb"}`,
        color: isQueja ? "#ad1457" : "#4527a0",
        fontSize: "0.72rem",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
      }}
    >
      {isQueja ? "📢 Queja" : "📋 Reclamo"}
    </span>
  )
}

export default function AdminComplaints() {
  const {
    complaints,
    allComplaints,
    isLoading,
    error,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    searchTerm,
    setSearchTerm,
    refreshComplaints,
    updateStatus,
  } = useComplaints()

  const [selectedComplaint, setSelectedComplaint] =
    useState<ComplaintRecord | null>(null)
  const [modalStatus, setModalStatus] = useState<ComplaintStatus>("Pendiente")
  const [modalResolution, setModalResolution] = useState<string>("")
  const [isUpdating, setIsUpdating] = useState<boolean>(false)
  const [updateMessage, setUpdateMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)

  const handleOpenDetail = (comp: ComplaintRecord) => {
    setSelectedComplaint(comp)
    setModalStatus(comp.status || "Pendiente")
    setModalResolution(comp.resolution || comp.adminNotes || "")
    setUpdateMessage(null)
  }

  const handleCloseDetail = () => {
    setSelectedComplaint(null)
    setUpdateMessage(null)
  }

  const handleQuickStatusChange = async (
    id: string,
    newStatus: ComplaintStatus,
  ) => {
    try {
      await updateStatus(id, newStatus)
    } catch (err: any) {
      console.error("Error al actualizar estado rápido:", err)
    }
  }

  const handleSaveModal = async () => {
    if (!selectedComplaint) return
    setIsUpdating(true)
    setUpdateMessage(null)
    try {
      const res = await updateStatus(selectedComplaint.id, modalStatus, {
        resolution: modalResolution,
        adminNotes: modalResolution,
      })
      if (res.ok) {
        setUpdateMessage({
          type: "success",
          text: "¡Reclamación y resolución guardadas exitosamente en AWS DynamoDB!",
        })
        if (res.complaint) {
          setSelectedComplaint(res.complaint)
        }
      } else {
        setUpdateMessage({
          type: "error",
          text: res.error || "No se pudo actualizar el estado en el servidor.",
        })
      }
    } catch (err: any) {
      setUpdateMessage({
        type: "error",
        text: err?.message || "Error al conectar con la base de datos.",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <section
      style={{
        background: "#fff",
        border: "1px solid #eee",
        borderRadius: "8px",
        overflow: "hidden",
        animation: "fadeIn 0.3s ease",
      }}
    >
      {/* HEADER & FILTERS BAR */}
      <div
        style={{
          padding: "1.25rem 1.5rem",
          borderBottom: "2px solid #000",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: "1rem",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>📖</span> Gestión del Libro de Reclamaciones (Indecopi)
          </h2>
          <span style={{ fontSize: "0.75rem", color: "#666" }}>
            Total registrados: {allComplaints.length} registro(s)
            {(statusFilter !== "Todos los Estados" ||
              typeFilter !== "Todos los Tipos" ||
              searchTerm.trim() !== "") &&
              ` (Filtrados: ${complaints.length})`}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            flexWrap: "wrap",
          }}
        >
          {/* SEARCH INPUT */}
          <input
            type="text"
            placeholder="Buscar por ID, cliente, DNI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: "7px 12px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              fontSize: "0.8rem",
              minWidth: "200px",
              outline: "none",
            }}
          />

          {/* TYPE FILTER */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              padding: "7px 10px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              fontSize: "0.8rem",
              fontWeight: 600,
              background: "#fff",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="Todos los Tipos">Todos los Tipos</option>
            <option value="reclamo">Solo Reclamos</option>
            <option value="queja">Solo Quejas</option>
          </select>

          {/* STATUS FILTER */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: "7px 10px",
              borderRadius: "4px",
              border: "1px solid #ccc",
              fontSize: "0.8rem",
              fontWeight: 600,
              background: "#fff",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="Todos los Estados">Todos los Estados</option>
            <option value="Pendiente">Pendiente</option>
            <option value="En Revisión">En Revisión</option>
            <option value="Atendido">Atendido</option>
            <option value="Cerrado">Cerrado</option>
          </select>

          {/* REFRESH BUTTON */}
          <button
            type="button"
            onClick={refreshComplaints}
            disabled={isLoading}
            style={{
              background: "#0a0a0a",
              color: "#fff",
              border: "none",
              padding: "7px 14px",
              borderRadius: "4px",
              fontSize: "0.8rem",
              fontWeight: 700,
              cursor: isLoading ? "not-allowed" : "pointer",
              opacity: isLoading ? 0.6 : 1,
            }}
            title="Sincronizar reclamos en vivo desde DynamoDB"
          >
            {isLoading ? "Sincronizando..." : "🔄 Sincronizar"}
          </button>
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "#ffebee",
            color: "#c62828",
            fontSize: "0.8rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>⚠️ {error}</span>
          <button
            onClick={refreshComplaints}
            style={{
              background: "transparent",
              border: "1px solid #c62828",
              color: "#c62828",
              padding: "2px 8px",
              borderRadius: "3px",
              cursor: "pointer",
              fontSize: "0.75rem",
            }}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* COMPLAINTS TABLE */}
      {complaints.length === 0 ? (
        <div
          style={{
            padding: "3.5rem 1.5rem",
            textAlign: "center",
            color: "#888",
          }}
        >
          <p
            style={{
              fontSize: "1.1rem",
              fontWeight: "bold",
              marginBottom: "0.5rem",
              color: "#333",
            }}
          >
            No se encontraron hojas de reclamación
          </p>
          <p style={{ fontSize: "0.85rem", margin: 0 }}>
            {searchTerm ||
            statusFilter !== "Todos los Estados" ||
            typeFilter !== "Todos los Tipos"
              ? "Prueba cambiando los filtros o la búsqueda."
              : "Aún no se han enviado quejas o reclamos en la tienda."}
          </p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              fontSize: "0.85rem",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid #eee",
                  backgroundColor: "#fafafa",
                  color: "#555",
                  fontSize: "0.72rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                <th style={{ padding: "12px 16px" }}>ID / Fecha</th>
                <th style={{ padding: "12px 16px" }}>Cliente / Contacto</th>
                <th style={{ padding: "12px 16px" }}>Tipo</th>
                <th style={{ padding: "12px 16px" }}>Motivo Principal</th>
                <th style={{ padding: "12px 16px" }}>Estado</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((item) => (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: "1px solid #f0f0f0",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#fafafa")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  {/* ID / FECHA */}
                  <td style={{ padding: "12px 16px", verticalAlign: "top" }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontFamily: "monospace",
                        color: "#0a0a0a",
                        fontSize: "0.85rem",
                      }}
                    >
                      {item.id}
                    </div>
                    <div
                      style={{
                        fontSize: "0.72rem",
                        color: "#777",
                        marginTop: "3px",
                      }}
                    >
                      {formatDate(item.createdAt)}
                    </div>
                    <span
                      style={{
                        display: "inline-block",
                        marginTop: "4px",
                        fontSize: "0.68rem",
                        color: "#b45309",
                        backgroundColor: "#fef3c7",
                        padding: "1px 6px",
                        borderRadius: "3px",
                        fontWeight: 600,
                      }}
                    >
                      Plazo: 15 días hábiles
                    </span>
                  </td>

                  {/* DATOS DEL CONSUMIDOR */}
                  <td style={{ padding: "12px 16px", verticalAlign: "top" }}>
                    <div style={{ fontWeight: 700, color: "#111" }}>
                      {item.consumerName}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#555",
                        marginTop: "2px",
                      }}
                    >
                      {item.documentType}:{" "}
                      <strong>{item.documentNumber}</strong>
                    </div>
                    <div
                      style={{
                        fontSize: "0.73rem",
                        color: "#666",
                        marginTop: "2px",
                      }}
                    >
                      ✉️ {item.email}
                    </div>
                    <div style={{ fontSize: "0.73rem", color: "#666" }}>
                      📞 {item.phone}
                    </div>
                    {item.isMinor && (
                      <div
                        style={{
                          marginTop: "3px",
                          fontSize: "0.7rem",
                          color: "#c2410c",
                          fontWeight: 600,
                        }}
                      >
                        👶 Menor de edad (Apoderado: {item.parentName || "N/A"})
                      </div>
                    )}
                  </td>

                  {/* TIPO */}
                  <td style={{ padding: "12px 16px", verticalAlign: "top" }}>
                    <div>{renderTypeBadge(item.claimType)}</div>
                    <div
                      style={{
                        fontSize: "0.72rem",
                        color: "#666",
                        marginTop: "5px",
                        textTransform: "capitalize",
                      }}
                    >
                      Bien: <strong>{item.goodType || "Producto"}</strong>
                    </div>
                    {Boolean(item.claimedAmount) && item.claimedAmount! > 0 && (
                      <div
                        style={{
                          fontSize: "0.72rem",
                          color: "#059669",
                          fontWeight: 700,
                          marginTop: "2px",
                        }}
                      >
                        Monto: {money(item.claimedAmount)}
                      </div>
                    )}
                  </td>

                  {/* MOTIVO PRINCIPAL */}
                  <td
                    style={{
                      padding: "12px 16px",
                      verticalAlign: "top",
                      maxWidth: "280px",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        color: "#222",
                        fontSize: "0.8rem",
                      }}
                    >
                      {item.goodDescription}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#666",
                        marginTop: "4px",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        lineHeight: "1.3",
                      }}
                      title={item.detail}
                    >
                      {item.detail}
                    </div>
                  </td>

                  {/* ESTADO CON SELECTOR EN FILA */}
                  <td style={{ padding: "12px 16px", verticalAlign: "top" }}>
                    <div style={{ marginBottom: "6px" }}>
                      {renderStatusBadge(item.status)}
                    </div>
                    <select
                      value={item.status || "Pendiente"}
                      onChange={(e) =>
                        handleQuickStatusChange(
                          item.id,
                          e.target.value as ComplaintStatus,
                        )
                      }
                      style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        background: "#fff",
                        cursor: "pointer",
                        outline: "none",
                        width: "100%",
                      }}
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="En Revisión">En Revisión</option>
                      <option value="Atendido">Atendido</option>
                      <option value="Cerrado">Cerrado</option>
                    </select>
                  </td>

                  {/* ACCIONES */}
                  <td
                    style={{
                      padding: "12px 16px",
                      verticalAlign: "top",
                      textAlign: "right",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(item)}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#000",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Ver Detalle 👁️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL DE DETALLE COMPLETO Y RESOLUCIÓN */}
      {selectedComplaint && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          onClick={handleCloseDetail}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "8px",
              maxWidth: "750px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
              animation: "fadeIn 0.2s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL HEADER */}
            <div
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid #eee",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#0a0a0a",
                color: "#fff",
                position: "sticky",
                top: 0,
                zIndex: 10,
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "0.72rem",
                    color: "#9ca3af",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    fontWeight: 700,
                  }}
                >
                  Libro de Reclamaciones Virtual - D.S. 011-2011-PCM
                </span>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.1rem",
                    letterSpacing: "0.5px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  Hoja de Reclamación: {selectedComplaint.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseDetail}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#fff",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  lineHeight: 1,
                  padding: "4px 8px",
                }}
                aria-label="Cerrar modal"
              >
                ✕
              </button>
            </div>

            {/* MODAL BODY */}
            <div style={{ padding: "1.5rem", color: "#1f2937" }}>
              {/* STATUS & DATE SUMMARY BAR */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "1rem",
                  padding: "0.85rem 1rem",
                  backgroundColor: "#f9fafb",
                  borderRadius: "6px",
                  marginBottom: "1.5rem",
                  border: "1px solid #e5e7eb",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                    Fecha de registro:
                  </span>
                  <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>
                    {formatDate(selectedComplaint.createdAt)}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                    Tipo de Registro:
                  </span>
                  <div style={{ marginTop: "2px" }}>
                    {renderTypeBadge(selectedComplaint.claimType)}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                    Plazo Legal de Respuesta:
                  </span>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      color: "#b45309",
                    }}
                  >
                    15 Días Hábiles (Ley N° 31435)
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                    Estado Actual:
                  </span>
                  <div style={{ marginTop: "2px" }}>
                    {renderStatusBadge(selectedComplaint.status)}
                  </div>
                </div>
              </div>

              {/* SECCIÓN 1: IDENTIFICACIÓN DEL CONSUMIDOR */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h4
                  style={{
                    margin: "0 0 0.75rem 0",
                    fontSize: "0.85rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "#111827",
                    borderBottom: "1px solid #e5e7eb",
                    paddingBottom: "4px",
                  }}
                >
                  1. Identificación del Consumidor Reclamante
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "0.75rem",
                    fontSize: "0.85rem",
                  }}
                >
                  <div>
                    <span style={{ color: "#6b7280", fontSize: "0.75rem" }}>
                      Nombre Completo:
                    </span>
                    <div style={{ fontWeight: 600 }}>
                      {selectedComplaint.consumerName}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: "#6b7280", fontSize: "0.75rem" }}>
                      Documento de Identidad:
                    </span>
                    <div style={{ fontWeight: 600 }}>
                      {selectedComplaint.documentType}:{" "}
                      {selectedComplaint.documentNumber}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: "#6b7280", fontSize: "0.75rem" }}>
                      Teléfono de Contacto:
                    </span>
                    <div style={{ fontWeight: 600 }}>
                      {selectedComplaint.phone}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: "#6b7280", fontSize: "0.75rem" }}>
                      Correo Electrónico:
                    </span>
                    <div style={{ fontWeight: 600 }}>
                      {selectedComplaint.email}
                    </div>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <span style={{ color: "#6b7280", fontSize: "0.75rem" }}>
                      Domicilio:
                    </span>
                    <div style={{ fontWeight: 600 }}>
                      {selectedComplaint.address}
                    </div>
                  </div>
                  {selectedComplaint.isMinor && (
                    <div
                      style={{
                        gridColumn: "1 / -1",
                        backgroundColor: "#fff7ed",
                        padding: "8px 12px",
                        borderRadius: "4px",
                        border: "1px solid #fed7aa",
                        fontSize: "0.8rem",
                      }}
                    >
                      <strong>Menor de Edad:</strong> Padre / Madre o Apoderado:{" "}
                      {selectedComplaint.parentName || "No especificado"} (Doc:{" "}
                      {selectedComplaint.parentDocument || "N/A"})
                    </div>
                  )}
                </div>
              </div>

              {/* SECCIÓN 2: IDENTIFICACIÓN DEL BIEN CONTRATADO */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h4
                  style={{
                    margin: "0 0 0.75rem 0",
                    fontSize: "0.85rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "#111827",
                    borderBottom: "1px solid #e5e7eb",
                    paddingBottom: "4px",
                  }}
                >
                  2. Identificación del Bien Contratado
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "0.75rem",
                    fontSize: "0.85rem",
                  }}
                >
                  <div>
                    <span style={{ color: "#6b7280", fontSize: "0.75rem" }}>
                      Tipo de Bien:
                    </span>
                    <div
                      style={{ fontWeight: 600, textTransform: "capitalize" }}
                    >
                      {selectedComplaint.goodType || "Producto"}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: "#6b7280", fontSize: "0.75rem" }}>
                      Monto Reclamado:
                    </span>
                    <div style={{ fontWeight: 700, color: "#059669" }}>
                      {money(selectedComplaint.claimedAmount)}
                    </div>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <span style={{ color: "#6b7280", fontSize: "0.75rem" }}>
                      Descripción del Producto / Servicio:
                    </span>
                    <div
                      style={{
                        backgroundColor: "#f9fafb",
                        padding: "8px 12px",
                        borderRadius: "4px",
                        fontWeight: 600,
                      }}
                    >
                      {selectedComplaint.goodDescription}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: DETALLE DE LA RECLAMACIÓN Y PEDIDO */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h4
                  style={{
                    margin: "0 0 0.75rem 0",
                    fontSize: "0.85rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "#111827",
                    borderBottom: "1px solid #e5e7eb",
                    paddingBottom: "4px",
                  }}
                >
                  3. Detalle de la Reclamación y Pedido del Consumidor
                </h4>
                <div style={{ marginBottom: "1rem" }}>
                  <span
                    style={{
                      color: "#6b7280",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                    }}
                  >
                    Detalle del Reclamo / Queja:
                  </span>
                  <div
                    style={{
                      backgroundColor: "#f9fafb",
                      padding: "12px",
                      borderRadius: "6px",
                      marginTop: "4px",
                      fontSize: "0.85rem",
                      lineHeight: "1.5",
                      whiteSpace: "pre-wrap",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    {selectedComplaint.detail}
                  </div>
                </div>
                <div>
                  <span
                    style={{
                      color: "#6b7280",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                    }}
                  >
                    Pedido Concreto del Consumidor:
                  </span>
                  <div
                    style={{
                      backgroundColor: "#f9fafb",
                      padding: "12px",
                      borderRadius: "6px",
                      marginTop: "4px",
                      fontSize: "0.85rem",
                      lineHeight: "1.5",
                      whiteSpace: "pre-wrap",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    {selectedComplaint.consumerRequest}
                  </div>
                </div>
              </div>

              {/* SECCIÓN 4: GESTIÓN DE RESOLUCIÓN POR EL ADMINISTRADOR */}
              <div
                style={{
                  backgroundColor: "#f8fafc",
                  padding: "1.25rem",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                }}
              >
                <h4
                  style={{
                    margin: "0 0 0.75rem 0",
                    fontSize: "0.85rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "#0f172a",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>✍️</span> 4. Acciones del Proveedor y Resolución
                </h4>

                {updateMessage && (
                  <div
                    style={{
                      padding: "8px 12px",
                      borderRadius: "4px",
                      marginBottom: "1rem",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      backgroundColor:
                        updateMessage.type === "success"
                          ? "#ecfdf5"
                          : "#fef2f2",
                      color:
                        updateMessage.type === "success"
                          ? "#065f46"
                          : "#991b1b",
                      border: `1px solid ${
                        updateMessage.type === "success" ? "#a7f3d0" : "#fecaca"
                      }`,
                    }}
                  >
                    {updateMessage.text}
                  </div>
                )}

                <div style={{ marginBottom: "1rem" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      marginBottom: "4px",
                      textTransform: "uppercase",
                      color: "#334155",
                    }}
                  >
                    Actualizar Estado del Reclamo:
                  </label>
                  <select
                    value={modalStatus}
                    onChange={(e) =>
                      setModalStatus(e.target.value as ComplaintStatus)
                    }
                    style={{
                      width: "100%",
                      maxWidth: "280px",
                      padding: "8px 12px",
                      borderRadius: "4px",
                      border: "1px solid #94a3b8",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      backgroundColor: "#fff",
                      cursor: "pointer",
                      outline: "none",
                    }}
                  >
                    <option value="Pendiente">⏳ Pendiente</option>
                    <option value="En Revisión">🔍 En Revisión</option>
                    <option value="Atendido">✓ Atendido</option>
                    <option value="Cerrado">🔒 Cerrado</option>
                  </select>
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      marginBottom: "4px",
                      textTransform: "uppercase",
                      color: "#334155",
                    }}
                  >
                    Texto de Resolución / Respuesta Formal al Consumidor:
                  </label>
                  <textarea
                    rows={4}
                    value={modalResolution}
                    onChange={(e) => setModalResolution(e.target.value)}
                    placeholder="Escribe la respuesta formal, acciones adoptadas o descargos respecto al reclamo/queja presentado..."
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "4px",
                      border: "1px solid #94a3b8",
                      fontSize: "0.85rem",
                      lineHeight: "1.4",
                      outline: "none",
                      boxSizing: "border-box",
                      backgroundColor: "#fff",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: "#64748b",
                      marginTop: "3px",
                      display: "block",
                    }}
                  >
                    Esta resolución se guarda en DynamoDB y sirve de sustento
                    ante fiscalizaciones de Indecopi.
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "0.75rem",
                    alignItems: "center",
                  }}
                >
                  <button
                    type="button"
                    onClick={handleCloseDetail}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "transparent",
                      border: "1px solid #cbd5e1",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveModal}
                    disabled={isUpdating}
                    style={{
                      padding: "8px 20px",
                      backgroundColor: "#000",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      cursor: isUpdating ? "not-allowed" : "pointer",
                      opacity: isUpdating ? 0.7 : 1,
                      letterSpacing: "0.5px",
                    }}
                  >
                    {isUpdating
                      ? "Guardando en DynamoDB..."
                      : "Guardar Resolución"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
