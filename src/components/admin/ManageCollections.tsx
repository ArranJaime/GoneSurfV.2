import { type FormEvent, useEffect, useRef, useState } from "react"
import { api } from "../../services/api"
import { useStore } from "../../store"
import { sanitizeString, validateImageFile } from "../../utils/security"

export function ManageCollections() {
  const { collections, addCollection, toggleCollection, deleteCollection } =
    useStore()
  const [title, setTitle] = useState("")
  const [subtitle, setSubtitle] = useState("")
  const [category, setCategory] = useState("LIFESTYLE")
  const [image, setImage] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const previewUrlRef = useRef<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (previewUrlRef.current && previewUrlRef.current.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrlRef.current)
        previewUrlRef.current = null
      }
    }
  }, [])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validation = validateImageFile(file)
    if (!validation.ok) {
      setUploadError(validation.error || "Archivo de imagen no válido.")
      return
    }

    if (previewUrlRef.current && previewUrlRef.current.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }

    const objectUrl = URL.createObjectURL(file)
    previewUrlRef.current = objectUrl
    setPreviewUrl(objectUrl)

    try {
      setUploading(true)
      setUploadError("")
      const res = await api.media.uploadImage(file)
      setImage(res.url)
    } catch (err) {
      console.error("Error optimizando imagen de colección:", err)
      setUploadError("Error al procesar la imagen.")
    } finally {
      setUploading(false)
    }
  }

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    const cleanTitle = sanitizeString(title)
    const cleanSubtitle = sanitizeString(subtitle)
    const cleanCategory = sanitizeString(category)

    if (!cleanTitle) {
      alert("El título de la colección es obligatorio.")
      return
    }

    try {
      setIsSubmitting(true)
      await addCollection({
        title: cleanTitle,
        subtitle: cleanSubtitle || "",
        category: cleanCategory || "",
        image: image || "/assets/hero-surf.jpg",
      })

      if (previewUrlRef.current && previewUrlRef.current.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrlRef.current)
        previewUrlRef.current = null
      }
      setPreviewUrl(null)
      setTitle("")
      setSubtitle("")
      setCategory("LIFESTYLE")
      setImage(null)
      setUploadError("")
      if (fileInputRef.current) fileInputRef.current.value = ""
    } catch (err) {
      console.error("Error al crear colección:", err)
      alert("Ocurrió un error al guardar la colección. Inténtalo nuevamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <section
        style={{
          backgroundColor: "#111",
          color: "#fff",
          padding: "2rem",
          borderRadius: "8px",
          marginBottom: "2rem",
        }}
      >
        <h2
          style={{
            fontSize: "1.1rem",
            marginBottom: "1.5rem",
            textTransform: "uppercase",
            letterSpacing: "1px",
          }}
        >
          Crear Nueva Colección
        </h2>
        <div
          style={{
            display: "flex",
            gap: "2rem",
            flexWrap: "wrap",
            marginBottom: "2rem",
          }}
        >
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              flex: "1 1 200px",
              border: "1px dashed #444",
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "180px",
              backgroundColor: "#1a1a1a",
              cursor: "pointer",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {previewUrl || image ? (
              <img
                src={previewUrl || image!}
                alt="Preview"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <p style={{ fontSize: "0.8rem", color: "#888" }}>
                {uploading
                  ? "Optimizando imagen..."
                  : "Subir Portada (WebP/JPG)"}
              </p>
            )}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageUpload}
              style={{ display: "none" }}
            />
          </div>
          <form
            onSubmit={handleCreate}
            style={{
              flex: "2 1 400px",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            {uploadError && (
              <div style={{ color: "#ff4d4d", fontSize: "0.8rem" }}>
                {uploadError}
              </div>
            )}
            <div style={{ display: "flex", gap: "1rem" }}>
              <div style={{ flex: 2 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    color: "#aaa",
                    marginBottom: "0.5rem",
                  }}
                >
                  TÍTULO DE COLECCIÓN
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  type="text"
                  placeholder="Ej. The Summer Drop"
                  style={{
                    width: "100%",
                    padding: "0.8rem",
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #333",
                    color: "#fff",
                    borderRadius: "4px",
                  }}
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    color: "#aaa",
                    marginBottom: "0.5rem",
                  }}
                >
                  ETIQUETA SUP.
                </label>
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  type="text"
                  placeholder="Ej. LIFESTYLE (Opcional)"
                  style={{
                    width: "100%",
                    padding: "0.8rem",
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #333",
                    color: "#fff",
                    borderRadius: "4px",
                  }}
                />
              </div>
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  color: "#aaa",
                  marginBottom: "0.5rem",
                }}
              >
                SUBTÍTULO
              </label>
              <input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                type="text"
                placeholder="Ej. Ride the sun. (Opcional)"
                style={{
                  width: "100%",
                  padding: "0.8rem",
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #333",
                  color: "#fff",
                  borderRadius: "4px",
                }}
              />
            </div>
            <button
              type="submit"
              disabled={uploading || isSubmitting}
              style={{
                alignSelf: "flex-start",
                background: "#fff",
                color: "#000",
                border: "none",
                borderRadius: "4px",
                fontWeight: "bold",
                cursor: uploading || isSubmitting ? "not-allowed" : "pointer",
                padding: "0.8rem 1.5rem",
                opacity: uploading || isSubmitting ? 0.6 : 1,
              }}
            >
              {isSubmitting ? "GUARDANDO..." : "AÑADIR COLECCIÓN AL CARRUSEL"}
            </button>
          </form>
        </div>
        <div style={{ borderTop: "1px solid #333", paddingTop: "1.5rem" }}>
          <h3
            style={{ fontSize: "0.9rem", marginBottom: "1rem", color: "#888" }}
          >
            COLECCIONES REGISTRADAS
          </h3>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {collections.map((col) => (
              <div
                key={col.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "#1a1a1a",
                  padding: "1rem",
                  borderRadius: "6px",
                  border: "1px solid #333",
                  width: "calc(50% - 0.5rem)",
                  minWidth: "300px",
                }}
              >
                <div>
                  <strong style={{ display: "block", fontSize: "1rem" }}>
                    {col.title || "Colección Sin Nombre"}
                  </strong>
                  <small style={{ color: "#888" }}>
                    {col.active ? "Mostrándose en web" : "Oculta"}
                  </small>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => toggleCollection(col.id)}
                    style={{
                      background: col.active ? "transparent" : "#fff",
                      color: col.active ? "#fff" : "#000",
                      border: "1px solid #fff",
                      padding: "0.4rem 1rem",
                      borderRadius: "20px",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                    }}
                  >
                    {col.active ? "DESACTIVAR" : "ACTIVAR"}
                  </button>
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          `¿Estás seguro de eliminar "${col.title}"?`,
                        )
                      ) {
                        deleteCollection(col.id)
                      }
                    }}
                    style={{
                      background: "transparent",
                      color: "#ff4d4d",
                      border: "1px solid #ff4d4d",
                      padding: "0.4rem 1rem",
                      borderRadius: "20px",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                    }}
                  >
                    ELIMINAR
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default ManageCollections
