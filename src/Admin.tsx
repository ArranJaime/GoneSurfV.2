import { type FormEvent, useState, useRef, useEffect, useMemo, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  useStore,
  type Size,
  type OrderStatus,
  type OrderTransaction,
  type Product,
} from "./store"
import { api } from "./services/api"
import {
  validateImageFile,
  sanitizeString,
  validatePrice,
  validateStock,
} from "./utils/security"
import { formatPEN } from "./utils/accounting"

const SIZES: Size[] = ["S", "M", "L", "XL"]
const money = (value: number) => formatPEN(value)

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <span
      style={{
        fontWeight: 900,
        fontSize: "1.5rem",
        lineHeight: 1,
        letterSpacing: "-1px",
        color: dark ? "#000" : "inherit",
        display: "block",
        marginBottom: "1rem",
      }}
    >
      GONE
      <br />
      SURFING
    </span>
  )
}

function ManageCollections() {
  const { collections, addCollection, toggleCollection, deleteCollection } =
    useStore()
  const [title, setTitle] = useState("")
  const [subtitle, setSubtitle] = useState("")
  const [category, setCategory] = useState("LIFESTYLE")
  const [image, setImage] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validation = validateImageFile(file)
    if (!validation.ok) {
      setUploadError(validation.error || "Archivo de imagen no válido.")
      return
    }

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

    // Solo el título es obligatorio según requerimiento del cliente
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
            {image ? (
              <img
                src={image}
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

function UploadPrenda() {
  const {
    collections,
    addProduct,
    updateProduct,
    products,
    changeStock,
    updateProductPrice,
    updateProductCollection,
    deleteProduct,
  } = useStore()

  // Creation form state
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [category, setCategory] = useState("New Arrivals")
  const [collection, setCollection] = useState("Catálogo General")
  const [image, setImage] = useState<string | null>(null)
  const [stocks, setStocks] = useState<Record<string, number>>({
    Única: 25,
    S: 10,
    M: 10,
    L: 10,
    XL: 10,
  })
  const [success, setSuccess] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadError, setUploadError] = useState("")

  // Quick inline price editing state
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null)
  const [tempPrice, setTempPrice] = useState("")

  // Full product edit modal/drawer state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editName, setEditName] = useState("")
  const [editPrice, setEditPrice] = useState("")
  const [editCategory, setEditCategory] = useState("New Arrivals")
  const [editCollection, setEditCollection] = useState("Catálogo General")
  const [editImage, setEditImage] = useState<string>("")
  const [editStocks, setEditStocks] = useState<Record<string, number>>({})
  const [editUploading, setEditUploading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const editFileInputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<number | null>(null)
  const isUnique = category === "Accesorios"

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [])

  // Client-side Canvas Image compression
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validation = validateImageFile(file)
    if (!validation.ok) {
      setUploadError(validation.error || "Archivo no permitido.")
      return
    }

    try {
      setUploading(true)
      setUploadError("")
      const res = await api.media.uploadImage(file)
      setImage(res.url)
    } catch (err) {
      console.error("Error optimizando imagen:", err)
      setUploadError("Error al procesar la imagen.")
    } finally {
      setUploading(false)
    }
  }

  const handleEditImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validation = validateImageFile(file)
    if (!validation.ok) {
      alert(validation.error || "Archivo no permitido.")
      return
    }

    try {
      setEditUploading(true)
      const res = await api.media.uploadImage(file)
      setEditImage(res.url)
    } catch (err) {
      console.error("Error optimizando imagen para edición:", err)
      alert("Error al procesar la imagen.")
    } finally {
      setEditUploading(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    const cleanName = sanitizeString(name)
    const validPrice = validatePrice(price)

    if (!cleanName || !image || !validPrice.valid) {
      alert(
        "Por favor completa el nombre, un precio mayor a 0 y sube una imagen.",
      )
      return
    }

    const activeStocks: Record<string, number> = isUnique
      ? { Única: validateStock(stocks["Única"] ?? 10) }
      : {
          S: validateStock(stocks.S ?? 0),
          M: validateStock(stocks.M ?? 0),
          L: validateStock(stocks.L ?? 0),
          XL: validateStock(stocks.XL ?? 0),
        }

    const productPayload = {
      name: cleanName,
      price: validPrice.value,
      category: sanitizeString(category),
      collectionName: sanitizeString(collection),
      image,
      stocks: activeStocks,
    }

    try {
      setIsSubmitting(true)

      const apiUrl = (
        import.meta.env.VITE_API_URL ||
        import.meta.env.VITE_AWS_API_GATEWAY_URL ||
        ""
      ).replace(/\/$/, "")

      if (apiUrl) {
        const session = api.auth.getAdminSession()
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        }
        if (session && session.token) {
          headers["Authorization"] = `Bearer ${session.token}`
        }

        const res = await fetch(`${apiUrl}/products`, {
          method: "POST",
          headers,
          body: JSON.stringify(productPayload),
        })

        // Solo se acepta si la API devuelve status 200 o 201
        if (res.status !== 200 && res.status !== 201) {
          const errData = await res.json().catch(() => ({}))
          console.error(
            `[Admin] Error HTTP ${res.status} al crear producto:`,
            errData,
          )
          throw new Error(errData.message || `Error HTTP ${res.status}`)
        }

        const createdProduct: Product = await res.json()
        // Actualizar el estado local (añadir el producto a la tabla de la UI) solo tras respuesta 200/201
        await addProduct(createdProduct)
      } else {
        await addProduct(productPayload)
      }

      setSuccess(true)
      setName("")
      setPrice("")
      setImage(null)
      setUploadError("")
      if (fileInputRef.current) fileInputRef.current.value = ""
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error("[Admin] Fallo en la creación del producto:", err)
      alert("Error de conexión con la base de datos. Verifica tu backend.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const saveInlinePrice = (productId: string) => {
    const validPrice = validatePrice(tempPrice)
    if (validPrice.valid) {
      updateProductPrice(productId, validPrice.value)
    }
    setEditingPriceId(null)
    setTempPrice("")
  }

  // Open full product edit
  const openEditModal = (p: Product) => {
    setEditingProduct(p)
    setEditName(p.name)
    setEditPrice(String(p.price))
    setEditCategory(p.category)
    setEditCollection(p.collectionName || "Catálogo General")
    setEditImage(p.image)
    setEditStocks({ ...p.stocks })
  }

  const handleSaveFullEdit = (e: FormEvent) => {
    e.preventDefault()
    if (!editingProduct) return

    const cleanName = sanitizeString(editName)
    const validPrice = validatePrice(editPrice)

    if (!cleanName || !validPrice.valid) {
      alert("Nombre válido y precio mayor a 0 son obligatorios.")
      return
    }

    const isEditAcc = editCategory === "Accesorios"
    const cleanedStocks: Record<string, number> = isEditAcc
      ? { Única: validateStock(editStocks["Única"] ?? 10) }
      : {
          S: validateStock(editStocks.S ?? 0),
          M: validateStock(editStocks.M ?? 0),
          L: validateStock(editStocks.L ?? 0),
          XL: validateStock(editStocks.XL ?? 0),
        }

    updateProduct(editingProduct.id, {
      name: cleanName,
      price: validPrice.value,
      category: editCategory,
      collectionName: editCollection,
      image: editImage,
      stocks: cleanedStocks,
    })

    setEditingProduct(null)
  }

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      {/* FORMULARIO DE CREACIÓN */}
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
          Subir nueva prenda al catálogo
        </h2>
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}
        >
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              flex: "1 1 300px",
              border: "1px dashed #444",
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "250px",
              backgroundColor: "#1a1a1a",
              cursor: "pointer",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {image ? (
              <img
                src={image}
                alt="Preview"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <>
                <svg
                  viewBox="0 0 24 24"
                  style={{
                    width: "40px",
                    height: "40px",
                    fill: "none",
                    stroke: "#888",
                    strokeWidth: 2,
                    marginBottom: "1rem",
                  }}
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                </svg>
                <p
                  style={{
                    margin: 0,
                    fontWeight: "bold",
                    fontSize: "0.9rem",
                    color: "#ddd",
                  }}
                >
                  {uploading
                    ? "Comprimiendo imagen..."
                    : "Haz clic para subir imagen"}
                </p>
                <small style={{ color: "#888", marginTop: "4px" }}>
                  Auto-optimización WebP &lt;800px
                </small>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageUpload}
              style={{ display: "none" }}
            />
          </div>
          <div
            style={{
              flex: "2 1 400px",
              display: "flex",
              flexDirection: "column",
              gap: "1.2rem",
            }}
          >
            {uploadError && (
              <div style={{ color: "#ff4d4d", fontSize: "0.8rem" }}>
                {uploadError}
              </div>
            )}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.75rem",
                  color: "#aaa",
                  marginBottom: "0.5rem",
                }}
              >
                Nombre de la prenda
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                type="text"
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
            <div style={{ display: "flex", gap: "1rem" }}>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    color: "#aaa",
                    marginBottom: "0.5rem",
                  }}
                >
                  Precio (S/.)
                </label>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  type="number"
                  step="0.01"
                  min="0.01"
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
                  Categoría Principal
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    const cat = e.target.value
                    setCategory(cat)
                    if (cat === "Accesorios") {
                      setStocks((prev) => ({ Única: prev["Única"] || 15 }))
                    } else {
                      setStocks((prev) => ({
                        S: prev.S || 10,
                        M: prev.M || 10,
                        L: prev.L || 10,
                        XL: prev.XL || 10,
                      }))
                    }
                  }}
                  style={{
                    width: "100%",
                    padding: "0.8rem",
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #333",
                    color: "#fff",
                    borderRadius: "4px",
                  }}
                >
                  <option value="New Arrivals">New Arrivals</option>
                  <option value="Best Sellers">Best Sellers</option>
                  <option value="Merch">Merch</option>
                  <option value="Accesorios">Accesorios (Talla Única)</option>
                </select>
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
                Vincular a Colección
              </label>
              <select
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.8rem",
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #333",
                  color: "#fff",
                  borderRadius: "4px",
                }}
              >
                <option value="Catálogo General">
                  Ninguna (Catálogo General)
                </option>
                {collections.map((c) => (
                  <option key={c.id} value={c.title || c.id}>
                    {c.title || "Colección Sin Nombre"}
                  </option>
                ))}
              </select>
            </div>
            <div
              style={{
                border: "1px solid #333",
                padding: "1.2rem",
                borderRadius: "4px",
                backgroundColor: "#161616",
              }}
            >
              <p
                style={{
                  margin: "0 0 1rem 0",
                  fontSize: "0.75rem",
                  color: "#aaa",
                  fontWeight: "bold",
                }}
              >
                Control de Stock (
                {isUnique
                  ? "Talla Única bloqueada para Accesorios"
                  : "Variantes S - XL"}
                )
              </p>
              {isUnique ? (
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      color: "#888",
                      marginBottom: "0.3rem",
                    }}
                  >
                    Unidades Talla Única
                  </label>
                  <input
                    value={stocks["Única"] ?? 15}
                    onChange={(e) =>
                      setStocks({
                        ...stocks,
                        Única: validateStock(e.target.value),
                      })
                    }
                    type="number"
                    min="0"
                    style={{
                      width: "100%",
                      padding: "0.6rem",
                      backgroundColor: "#111",
                      border: "1px solid #333",
                      color: "#fff",
                      borderRadius: "4px",
                    }}
                  />
                </div>
              ) : (
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {["S", "M", "L", "XL"].map((sz) => (
                    <div key={sz} style={{ flex: 1 }}>
                      <label
                        style={{
                          display: "block",
                          fontSize: "0.75rem",
                          color: "#888",
                          marginBottom: "0.3rem",
                        }}
                      >
                        Talla {sz}
                      </label>
                      <input
                        value={stocks[sz] ?? 10}
                        onChange={(e) =>
                          setStocks({
                            ...stocks,
                            [sz]: validateStock(e.target.value),
                          })
                        }
                        type="number"
                        min="0"
                        style={{
                          width: "100%",
                          padding: "0.6rem",
                          backgroundColor: "#111",
                          border: "1px solid #333",
                          color: "#fff",
                          borderRadius: "4px",
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={uploading || isSubmitting}
              style={{
                alignSelf: "flex-end",
                background: success ? "#4CAF50" : "transparent",
                color: "#fff",
                border: "1px solid #fff",
                borderRadius: "4px",
                fontWeight: "bold",
                cursor: uploading || isSubmitting ? "not-allowed" : "pointer",
                padding: "0.8rem 1.5rem",
                marginTop: "1rem",
                opacity: uploading || isSubmitting ? 0.6 : 1,
              }}
            >
              {isSubmitting
                ? "PUBLICANDO..."
                : success
                  ? "¡PRENDA PUBLICADA!"
                  : "PUBLICAR EN LA TIENDA"}
            </button>
          </div>
        </form>
      </section>

      {/* MODAL / DRAWER DE EDICIÓN COMPLETA */}
      {editingProduct && (
        <section
          style={{
            backgroundColor: "#0d0d0d",
            color: "#fff",
            padding: "2rem",
            borderRadius: "8px",
            marginBottom: "2rem",
            border: "2px solid #fff",
            animation: "fadeIn 0.2s ease",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem",
            }}
          >
            <h2
              style={{
                fontSize: "1.2rem",
                margin: 0,
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              Editar Prenda: {editingProduct.name}
            </h2>
            <button
              onClick={() => setEditingProduct(null)}
              style={{
                background: "none",
                border: "none",
                color: "#888",
                fontSize: "1.2rem",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>

          <form
            onSubmit={handleSaveFullEdit}
            style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}
          >
            <div
              onClick={() => editFileInputRef.current?.click()}
              style={{
                flex: "1 1 250px",
                border: "1px dashed #555",
                borderRadius: "8px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "220px",
                backgroundColor: "#161616",
                cursor: "pointer",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <img
                src={editImage}
                alt="Edit Preview"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: "rgba(0,0,0,0.7)",
                  padding: "0.4rem",
                  textAlign: "center",
                  fontSize: "0.7rem",
                  color: "#fff",
                }}
              >
                {editUploading ? "Optimizando..." : "Cambiar Imagen"}
              </div>
              <input
                type="file"
                accept="image/*"
                ref={editFileInputRef}
                onChange={handleEditImageUpload}
                style={{ display: "none" }}
              />
            </div>

            <div
              style={{
                flex: "2 1 400px",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    color: "#aaa",
                    marginBottom: "0.4rem",
                  }}
                >
                  Nombre de la prenda
                </label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  type="text"
                  style={{
                    width: "100%",
                    padding: "0.7rem",
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #333",
                    color: "#fff",
                    borderRadius: "4px",
                  }}
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      color: "#aaa",
                      marginBottom: "0.4rem",
                    }}
                  >
                    Precio (S/.)
                  </label>
                  <input
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    type="number"
                    step="0.01"
                    min="0.01"
                    style={{
                      width: "100%",
                      padding: "0.7rem",
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
                      marginBottom: "0.4rem",
                    }}
                  >
                    Categoría
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => {
                      const nextCat = e.target.value
                      setEditCategory(nextCat)
                      if (nextCat === "Accesorios") {
                        setEditStocks({ Única: editStocks["Única"] || 10 })
                      } else {
                        setEditStocks({
                          S: editStocks.S || 10,
                          M: editStocks.M || 10,
                          L: editStocks.L || 10,
                          XL: editStocks.XL || 10,
                        })
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "0.7rem",
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #333",
                      color: "#fff",
                      borderRadius: "4px",
                    }}
                  >
                    <option value="New Arrivals">New Arrivals</option>
                    <option value="Best Sellers">Best Sellers</option>
                    <option value="Merch">Merch</option>
                    <option value="Accesorios">Accesorios (Talla Única)</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    color: "#aaa",
                    marginBottom: "0.4rem",
                  }}
                >
                  Colección
                </label>
                <select
                  value={editCollection}
                  onChange={(e) => setEditCollection(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.7rem",
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #333",
                    color: "#fff",
                    borderRadius: "4px",
                  }}
                >
                  <option value="Catálogo General">
                    Ninguna (Catálogo General)
                  </option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.title || c.id}>
                      {c.title || "Colección Sin Nombre"}
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  border: "1px solid #333",
                  padding: "1rem",
                  borderRadius: "4px",
                  backgroundColor: "#141414",
                }}
              >
                <p
                  style={{
                    margin: "0 0 0.8rem 0",
                    fontSize: "0.75rem",
                    color: "#aaa",
                    fontWeight: "bold",
                  }}
                >
                  Ajuste de Stock por Variante
                </p>
                {editCategory === "Accesorios" ? (
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.7rem",
                        color: "#888",
                        marginBottom: "0.2rem",
                      }}
                    >
                      Talla Única
                    </label>
                    <input
                      value={editStocks["Única"] ?? 10}
                      onChange={(e) =>
                        setEditStocks({
                          ...editStocks,
                          Única: validateStock(e.target.value),
                        })
                      }
                      type="number"
                      min="0"
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        backgroundColor: "#111",
                        border: "1px solid #333",
                        color: "#fff",
                        borderRadius: "4px",
                      }}
                    />
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {["S", "M", "L", "XL"].map((sz) => (
                      <div key={sz} style={{ flex: 1 }}>
                        <label
                          style={{
                            display: "block",
                            fontSize: "0.7rem",
                            color: "#888",
                            marginBottom: "0.2rem",
                          }}
                        >
                          Talla {sz}
                        </label>
                        <input
                          value={editStocks[sz] ?? 0}
                          onChange={(e) =>
                            setEditStocks({
                              ...editStocks,
                              [sz]: validateStock(e.target.value),
                            })
                          }
                          type="number"
                          min="0"
                          style={{
                            width: "100%",
                            padding: "0.5rem",
                            backgroundColor: "#111",
                            border: "1px solid #333",
                            color: "#fff",
                            borderRadius: "4px",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button
                  type="submit"
                  disabled={editUploading}
                  style={{
                    flex: 1,
                    background: "#fff",
                    color: "#000",
                    border: "none",
                    borderRadius: "4px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    padding: "0.8rem",
                  }}
                >
                  GUARDAR CAMBIOS
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  style={{
                    background: "transparent",
                    color: "#fff",
                    border: "1px solid #555",
                    borderRadius: "4px",
                    cursor: "pointer",
                    padding: "0.8rem 1.5rem",
                  }}
                >
                  CANCELAR
                </button>
              </div>
            </div>
          </form>
        </section>
      )}

      {/* TABLA DE INVENTARIO ACTIVO */}
      <section
        style={{
          background: "#fff",
          border: "1px solid #eee",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "1.5rem",
            borderBottom: "2px solid #000",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2
            style={{ margin: 0, fontSize: "1rem", textTransform: "uppercase" }}
          >
            Inventario Activo
          </h2>
          <span
            style={{ fontSize: "0.8rem", color: "#666", fontWeight: "bold" }}
          >
            {products.length} PRODUCTOS REGISTRADOS
          </span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              fontSize: "0.85rem",
            }}
          >
            <thead style={{ background: "#0a0a0a", color: "#fff" }}>
              <tr>
                <th style={{ padding: "1rem" }}>PRODUCTO</th>
                <th style={{ padding: "1rem" }}>COLECCIÓN</th>
                <th style={{ padding: "1rem" }}>PRECIO</th>
                <th style={{ padding: "1rem" }}>STOCK POR TALLA</th>
                <th style={{ padding: "1rem", textAlign: "right" }}>
                  ACCIONES
                </th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: "3rem 1rem",
                      textAlign: "center",
                      color: "#888",
                      fontStyle: "italic",
                    }}
                  >
                    No hay productos registrados en el inventario. Agrega uno nuevo con el formulario superior.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                const isAcc = p.category === "Accesorios"
                const activeSizes: Size[] = isAcc ? ["Única"] as Size[] : SIZES

                return (
                  <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td
                      style={{
                        padding: "1rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                      }}
                    >
                      <img
                        src={p.image}
                        alt=""
                        style={{
                          width: "40px",
                          height: "40px",
                          objectFit: "cover",
                          borderRadius: "4px",
                        }}
                      />
                      <div>
                        <strong>{p.name}</strong>
                        <span
                          style={{
                            display: "block",
                            fontSize: "0.7rem",
                            color: "#888",
                          }}
                        >
                          {p.category}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      {p.collectionName &&
                      p.collectionName !== "Catálogo General" ? (
                        <span
                          style={{
                            background: "#000",
                            padding: "0.3rem 0.6rem",
                            borderRadius: "20px",
                            fontSize: "0.75rem",
                            fontWeight: "bold",
                            color: "#fff",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          {p.collectionName}
                          <button
                            onClick={() =>
                              updateProductCollection(p.id, "Catálogo General")
                            }
                            title="Quitar de colección"
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#fff",
                              cursor: "pointer",
                              padding: 0,
                            }}
                          >
                            ✕
                          </button>
                        </span>
                      ) : (
                        <select
                          value="Catálogo General"
                          onChange={(e) =>
                            updateProductCollection(p.id, e.target.value)
                          }
                          style={{
                            padding: "0.3rem 0.5rem",
                            borderRadius: "4px",
                            border: "1px solid #ddd",
                            fontSize: "0.75rem",
                            color: "#666",
                            background: "#fafafa",
                            cursor: "pointer",
                          }}
                        >
                          <option value="Catálogo General">
                            Sin colección (Asignar...)
                          </option>
                          {collections.map((c) => (
                            <option key={c.id} value={c.title || c.id}>
                              {c.title || "Colección Sin Nombre"}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      {editingPriceId === p.id ? (
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <input
                            type="number"
                            step="0.01"
                            value={tempPrice}
                            onChange={(e) => setTempPrice(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveInlinePrice(p.id)
                              if (e.key === "Escape") setEditingPriceId(null)
                            }}
                            autoFocus
                            style={{
                              width: "75px",
                              padding: "0.25rem 0.4rem",
                              border: "1px solid #000",
                              borderRadius: "4px",
                              fontSize: "0.8rem",
                            }}
                          />
                          <button
                            onClick={() => saveInlinePrice(p.id)}
                            style={{
                              background: "#000",
                              color: "#fff",
                              border: "none",
                              borderRadius: "4px",
                              padding: "0.25rem 0.5rem",
                              cursor: "pointer",
                              fontSize: "0.7rem",
                              fontWeight: "bold",
                            }}
                          >
                            ✓
                          </button>
                        </div>
                      ) : (
                        <span
                          onClick={() => {
                            setEditingPriceId(p.id)
                            setTempPrice(String(p.price))
                          }}
                          title="Haz clic para editar el precio"
                          style={{
                            cursor: "pointer",
                            borderBottom: "1px dashed #ccc",
                            paddingBottom: "2px",
                          }}
                        >
                          {money(p.price)}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          flexWrap: "wrap",
                        }}
                      >
                        {activeSizes.map((s) => (
                          <div
                            key={s}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              border: "1px solid #ddd",
                              borderRadius: "3px",
                              overflow: "hidden",
                            }}
                          >
                            <b
                              style={{
                                padding: "0.2rem 0.5rem",
                                background: "#f5f5f5",
                                borderRight: "1px solid #ddd",
                              }}
                            >
                              {s}
                            </b>
                            <button
                              onClick={() => changeStock(p.id, s, -1)}
                              style={{
                                border: "none",
                                background: "none",
                                padding: "0.2rem 0.5rem",
                                cursor: "pointer",
                              }}
                            >
                              −
                            </button>
                            <span
                              style={{
                                padding: "0.2rem 0.2rem",
                                fontWeight:
                                  (p.stocks[s] || 0) === 0 ? "bold" : "normal",
                                color:
                                  (p.stocks[s] || 0) === 0 ? "#ff4d4d" : "#000",
                              }}
                            >
                              {p.stocks[s] || 0}
                            </span>
                            <button
                              onClick={() => changeStock(p.id, s, 1)}
                              style={{
                                border: "none",
                                background: "none",
                                padding: "0.2rem 0.5rem",
                                cursor: "pointer",
                              }}
                            >
                              +
                            </button>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        textAlign: "right",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <button
                        onClick={() => openEditModal(p)}
                        style={{
                          background: "#000",
                          color: "#fff",
                          border: "none",
                          padding: "0.35rem 0.8rem",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "0.7rem",
                          fontWeight: "bold",
                          marginRight: "0.5rem",
                        }}
                      >
                        EDITAR
                      </button>
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              `¿Seguro que deseas eliminar permanentemente el producto "${p.name}"?`,
                            )
                          ) {
                            deleteProduct(p.id)
                          }
                        }}
                        style={{
                          background: "transparent",
                          color: "#ff4d4d",
                          border: "1px solid #ff4d4d",
                          padding: "0.35rem 0.8rem",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "0.7rem",
                          fontWeight: "bold",
                        }}
                      >
                        ELIMINAR
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function MetricsDashboard() {
  const { transactions, products, users } = useStore()

  const [dateFilter, setDateFilter] =
    useState<"all" | "today" | "yesterday" | "last7" | "last30" | "custom">(
      "all",
    )
  const [customStart, setCustomStart] = useState("")
  const [customEnd, setCustomEnd] = useState("")

  const filteredTransactions = useMemo(() => {
    const now = new Date()
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime()
    const yesterdayStart = todayStart - 86400000

    return transactions.filter((t) => {
      const tTime = new Date(t.date).getTime()
      if (dateFilter === "all") return true
      if (dateFilter === "today") return tTime >= todayStart
      if (dateFilter === "yesterday")
        return tTime >= yesterdayStart && tTime < todayStart
      if (dateFilter === "last7") return tTime >= todayStart - 7 * 86400000
      if (dateFilter === "last30") return tTime >= todayStart - 30 * 86400000
      if (dateFilter === "custom") {
        const startValid = customStart ? new Date(customStart).getTime() : 0
        const endValid = customEnd
          ? new Date(customEnd).getTime() + 86400000
          : Number.MAX_SAFE_INTEGER
        return tTime >= startValid && tTime <= endValid
      }
      return true
    })
  }, [transactions, dateFilter, customStart, customEnd])

  const activeFilteredTransactions = useMemo(
    () => filteredTransactions.filter((t) => t.status !== "Cancelado"),
    [filteredTransactions],
  )
  const totalRevenue = useMemo(
    () => activeFilteredTransactions.reduce((s, i) => s + (i.total || 0), 0),
    [activeFilteredTransactions],
  )
  const revenueByMethod = useMemo(() => {
    const summary = { tarjeta: 0, yape_plin: 0, efectivo: 0 }
    activeFilteredTransactions.forEach((t) => {
      const m = t.paymentMethod || "tarjeta"
      if (m in summary) {
        summary[m as keyof typeof summary] += (t.total || 0)
      } else {
        summary.tarjeta += (t.total || 0)
      }
    })
    return summary
  }, [activeFilteredTransactions])
  const pendingOrders = useMemo(
    () =>
      filteredTransactions.filter((t) => !t.status || t.status === "Procesando")
        .length,
    [filteredTransactions],
  )
  const completedOrders = useMemo(
    () =>
      filteredTransactions.filter(
        (t) => t.status === "Enviado" || t.status === "Entregado",
      ).length,
    [filteredTransactions],
  )

  const inventoryStats = useMemo(() => {
    let totalUnits = 0
    let outOfStockSizes = 0
    products.forEach((p) => {
      const relevantSizes =
        p.category === "Accesorios" ? ["Única"] as Size[] : SIZES
      relevantSizes.forEach((sz) => {
        const units = p.stocks[sz] || 0
        totalUnits += units
        if (units === 0) outOfStockSizes += 1
      })
    })
    return { totalUnits, outOfStockSizes }
  }, [products])

  const uniqueCustomerEmails = useMemo(() => {
    const set = new Set<string>()
    users.forEach((u) => {
      if (u.email) set.add(u.email.toLowerCase())
    })
    filteredTransactions.forEach((t) => {
      if (t.email) set.add(t.email.toLowerCase())
    })
    return set.size
  }, [users, filteredTransactions])

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      {/* BARRA DE FILTROS DE FECHA */}
      <div
        style={{
          background: "#fff",
          padding: "1.2rem 1.5rem",
          borderRadius: "8px",
          border: "1px solid #eee",
          marginBottom: "2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.8rem",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: "bold",
              color: "#666",
              textTransform: "uppercase",
            }}
          >
            Filtrar Periodo:
          </span>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "4px",
              border: "1px solid #ccc",
              fontWeight: "bold",
              fontSize: "0.85rem",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            <option value="all">Histórico Completo</option>
            <option value="today">Hoy</option>
            <option value="yesterday">Ayer</option>
            <option value="last7">Últimos 7 días</option>
            <option value="last30">Último mes (30 días)</option>
            <option value="custom">Rango Personalizado...</option>
          </select>
        </div>

        {dateFilter === "custom" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.8rem",
              flexWrap: "wrap",
              animation: "fadeIn 0.3s ease",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
            >
              <label
                style={{
                  fontSize: "0.7rem",
                  color: "#666",
                  fontWeight: "bold",
                }}
              >
                DESDE:
              </label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                style={{
                  padding: "0.4rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "0.8rem",
                }}
              />
            </div>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
            >
              <label
                style={{
                  fontSize: "0.7rem",
                  color: "#666",
                  fontWeight: "bold",
                }}
              >
                HASTA:
              </label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                style={{
                  padding: "0.4rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "0.8rem",
                }}
              />
            </div>
          </div>
        )}
      </div>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1rem",
          marginBottom: "3rem",
        }}
      >
        <article
          style={{
            background: "#fff",
            padding: "1.5rem",
            border: "1px solid #eee",
            borderRadius: "8px",
          }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: "bold",
              color: "#666",
              textTransform: "uppercase",
            }}
          >
            Recaudación Total
          </span>
          <strong
            style={{ display: "block", fontSize: "2.5rem", margin: "0.5rem 0" }}
          >
            {money(totalRevenue)}
          </strong>
          <small style={{ color: "#888", fontSize: "0.75rem" }}>
            {activeFilteredTransactions.length} VENTAS EN EL PERIODO
          </small>
          <div style={{ display: "flex", gap: "6px", marginTop: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.7rem", padding: "3px 8px", borderRadius: "4px", backgroundColor: "#e8f5e9", border: "1px solid #81c784", color: "#1b5e20", fontWeight: 700 }}>
              💳 Tarjeta: {money(revenueByMethod.tarjeta)}
            </span>
            <span style={{ fontSize: "0.7rem", padding: "3px 8px", borderRadius: "4px", backgroundColor: "#f3e5f5", border: "1px solid #ce93d8", color: "#6a1b9a", fontWeight: 700 }}>
              📱 Yape/Plin: {money(revenueByMethod.yape_plin)}
            </span>
            <span style={{ fontSize: "0.7rem", padding: "3px 8px", borderRadius: "4px", backgroundColor: "#fff3e0", border: "1px solid #ffb74d", color: "#e65100", fontWeight: 700 }}>
              💵 Efectivo: {money(revenueByMethod.efectivo)}
            </span>
          </div>
        </article>

        <article
          style={{
            background: "#fff",
            padding: "1.5rem",
            border: "1px solid #eee",
            borderRadius: "8px",
          }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: "bold",
              color: "#666",
              textTransform: "uppercase",
            }}
          >
            Pedidos por Despachar
          </span>
          <strong
            style={{
              display: "block",
              fontSize: "2.5rem",
              margin: "0.5rem 0",
              color: pendingOrders > 0 ? "#e65100" : "#000",
            }}
          >
            {pendingOrders}
          </strong>
          <small style={{ color: "#888", fontSize: "0.75rem" }}>
            {completedOrders} ENVIADOS O ENTREGADOS
          </small>
        </article>

        <article
          style={{
            background: "#fff",
            padding: "1.5rem",
            border: "1px solid #eee",
            borderRadius: "8px",
          }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: "bold",
              color: "#666",
              textTransform: "uppercase",
            }}
          >
            Unidades en Stock
          </span>
          <strong
            style={{ display: "block", fontSize: "2.5rem", margin: "0.5rem 0" }}
          >
            {inventoryStats.totalUnits}
          </strong>
          <small
            style={{
              color: inventoryStats.outOfStockSizes > 0 ? "#ff4d4d" : "#888",
              fontSize: "0.75rem",
              fontWeight:
                inventoryStats.outOfStockSizes > 0 ? "bold" : "normal",
            }}
          >
            {products.length} PRODUCTOS ({inventoryStats.outOfStockSizes} TALLAS
            AGOTADAS)
          </small>
        </article>

        <article
          style={{
            background: "#fff",
            padding: "1.5rem",
            border: "1px solid #eee",
            borderRadius: "8px",
          }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: "bold",
              color: "#666",
              textTransform: "uppercase",
            }}
          >
            Clientes Activos
          </span>
          <strong
            style={{ display: "block", fontSize: "2.5rem", margin: "0.5rem 0" }}
          >
            {uniqueCustomerEmails}
          </strong>
          <small style={{ color: "#888", fontSize: "0.75rem" }}>
            EN EL PERIODO SELECCIONADO
          </small>
        </article>
      </section>
    </div>
  )
}

function renderPaymentBadge(method?: string) {
  if (method === "yape_plin") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 10px",
          borderRadius: "4px",
          backgroundColor: "#f3e5f5",
          border: "1px solid #ce93d8",
          color: "#6a1b9a",
          fontSize: "0.75rem",
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ fontSize: "0.9rem" }}>📱</span> Yape / Plin
      </span>
    )
  }
  if (method === "efectivo") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 10px",
          borderRadius: "4px",
          backgroundColor: "#fff3e0",
          border: "1px solid #ffb74d",
          color: "#e65100",
          fontSize: "0.75rem",
          fontWeight: 700,
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ fontSize: "0.9rem" }}>💵</span> Pago Contra Entrega
      </span>
    )
  }
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 10px",
        borderRadius: "4px",
        backgroundColor: "#e8f5e9",
        border: "1px solid #81c784",
        color: "#1b5e20",
        fontSize: "0.75rem",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ fontSize: "0.9rem" }}>💳</span> Tarjeta
    </span>
  )
}

function ManageOrders() {
  const { transactions: storeTransactions, updateOrderStatus } = useStore()
  const [liveOrders, setLiveOrders] = useState<OrderTransaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const fetchOrdersFromApi = useCallback(async () => {
    setIsLoading(true)
    setFetchError(null)

    const apiUrl = (
      import.meta.env.VITE_API_URL ||
      import.meta.env.VITE_AWS_API_GATEWAY_URL ||
      ""
    ).replace(/\/$/, "")

    try {
      if (apiUrl) {
        const session = api.auth.getAdminSession()
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        }
        if (session && session.token) {
          headers["Authorization"] = `Bearer ${session.token}`
        }

        const res = await fetch(`${apiUrl}/orders`, { headers })
        if (!res.ok) {
          const errText = await res.text().catch(() => "")
          console.error(`[Admin] Error en GET /orders (${res.status}):`, errText)
          throw new Error(
            `Error HTTP ${res.status} al consultar pedidos del servidor.`,
          )
        }
        const data: OrderTransaction[] = await res.json()
        setLiveOrders(data)
        try {
          localStorage.setItem("gone_transactions", JSON.stringify(data))
        } catch {}
      } else {
        const data = await api.orders.getAll()
        setLiveOrders(data)
      }
    } catch (err: any) {
      console.error("[Admin] Error al obtener órdenes con VITE_API_URL:", err)
      setFetchError(err?.message || "No se pudo sincronizar pedidos en vivo.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrdersFromApi()
  }, [fetchOrdersFromApi])

  const handleStatusChange = async (id: string, nextStatus: OrderStatus) => {
    try {
      updateOrderStatus(id, nextStatus)
      setLiveOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: nextStatus } : o)),
      )
    } catch (err) {
      console.error("[Admin] Error actualizando estado de pedido:", err)
    }
  }

  const displayOrders = liveOrders.length > 0 ? liveOrders : storeTransactions

  if (isLoading && displayOrders.length === 0) {
    return (
      <div
        style={{
          padding: "3rem",
          textAlign: "center",
          background: "#fff",
          borderRadius: "8px",
          border: "1px solid #eee",
        }}
      >
        <h3>Cargando pedidos desde DynamoDB...</h3>
      </div>
    )
  }

  if (displayOrders.length === 0) {
    return (
      <div
        style={{
          padding: "3rem",
          textAlign: "center",
          background: "#fff",
          borderRadius: "8px",
          border: "1px solid #eee",
        }}
      >
        <h3>Aún no hay pedidos registrados.</h3>
        {fetchError && (
          <p
            style={{
              color: "#d32f2f",
              fontSize: "0.85rem",
              marginTop: "0.5rem",
            }}
          >
            {fetchError}
          </p>
        )}
        <button
          type="button"
          onClick={fetchOrdersFromApi}
          style={{
            marginTop: "1rem",
            padding: "8px 16px",
            background: "#0a0a0a",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          🔄 Reintentar conexión
        </button>
      </div>
    )
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
            style={{ margin: 0, fontSize: "1rem", textTransform: "uppercase" }}
          >
            Gestión y Despacho de Pedidos
          </h2>
          <span style={{ fontSize: "0.75rem", color: "#666" }}>
            Total registrados: {displayOrders.length} pedido(s)
          </span>
        </div>
        <button
          type="button"
          onClick={fetchOrdersFromApi}
          disabled={isLoading}
          style={{
            background: "#0a0a0a",
            color: "#fff",
            border: "none",
            padding: "8px 16px",
            borderRadius: "4px",
            fontSize: "0.8rem",
            fontWeight: 700,
            cursor: isLoading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            opacity: isLoading ? 0.6 : 1,
          }}
        >
          {isLoading ? "Cargando..." : "🔄 Actualizar desde Servidor"}
        </button>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
            fontSize: "0.85rem",
          }}
        >
          <thead style={{ background: "#0a0a0a", color: "#fff" }}>
            <tr>
              <th style={{ padding: "1rem" }}>ID & FECHA</th>
              <th style={{ padding: "1rem" }}>CLIENTE</th>
              <th style={{ padding: "1rem" }}>CONTACTO / ENVÍO</th>
              <th style={{ padding: "1rem" }}>DETALLE DE COMPRA</th>
              <th style={{ padding: "1rem" }}>TOTAL</th>
              <th style={{ padding: "1rem" }}>MÉTODO DE PAGO</th>
              <th style={{ padding: "1rem" }}>ESTADO ACTUAL</th>
            </tr>
          </thead>
          <tbody>
            {[...displayOrders].map((t: OrderTransaction) => {
              const status = t.status || "Procesando"
              const badgeBg =
                status === "Entregado"
                  ? "#e8f5e9"
                  : status === "Enviado"
                    ? "#e3f2fd"
                    : status === "Cancelado"
                      ? "#ffebee"
                      : status === "Pendiente de Pago"
                        ? "#fff8e1"
                        : "#fff3e0"
              const badgeColor =
                status === "Entregado"
                  ? "#2e7d32"
                  : status === "Enviado"
                    ? "#0277bd"
                    : status === "Cancelado"
                      ? "#c62828"
                      : status === "Pendiente de Pago"
                        ? "#b78103"
                        : "#e65100"

              return (
                <tr
                  key={t.id}
                  style={{
                    borderBottom: "1px solid #eee",
                    opacity: status === "Cancelado" ? 0.65 : 1,
                  }}
                >
                  <td style={{ padding: "1rem" }}>
                    <strong style={{ display: "block" }}>{t.id}</strong>
                    <span style={{ color: "#888", fontSize: "0.75rem" }}>
                      {new Date(t.date).toLocaleDateString("es-PE")}
                    </span>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <strong style={{ display: "block" }}>
                      {t.customer || "Anónimo"}
                    </strong>
                    <span style={{ color: "#888", fontSize: "0.75rem" }}>
                      {t.documentType || "DNI"}: {t.document || "N/A"}
                    </span>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <span
                      style={{
                        display: "block",
                        fontWeight: "bold",
                        fontSize: "0.75rem",
                        color: "#0277bd",
                      }}
                    >
                      {t.email || "Sin correo"}
                    </span>
                    {t.phone && (
                      <span
                        style={{
                          display: "block",
                          fontSize: "0.72rem",
                          color: "#333",
                          marginTop: "2px",
                        }}
                      >
                        Tel: {t.phone}
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: "0.7rem",
                        color: "#666",
                        display: "block",
                        marginTop: "4px",
                      }}
                    >
                      {t.address || "Dirección no registrada"} -{" "}
                      {t.districtName || ""}
                    </span>
                    <span
                      style={{
                        display: "inline-block",
                        fontSize: "0.65rem",
                        background: "#f5f5f5",
                        padding: "2px 6px",
                        borderRadius: "3px",
                        color: "#555",
                        marginTop: "4px",
                        fontWeight: "bold",
                      }}
                    >
                      {t.shippingMethod === "express"
                        ? "ENVÍO EXPRESS"
                        : "ENVÍO ESTÁNDAR"}{" "}
                      ({t.shipping ? money(t.shipping) : "Gratis"})
                    </span>
                  </td>
                  <td style={{ padding: "1rem", maxWidth: "250px" }}>
                    <span
                      style={{
                        fontSize: "0.8rem",
                        lineHeight: "1.4",
                        display: "block",
                      }}
                    >
                      {t.detail}
                    </span>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <strong style={{ fontSize: "1.1rem" }}>
                      {money(t.total)}
                    </strong>
                  </td>
                  <td style={{ padding: "1rem" }}>
                    {renderPaymentBadge(t.paymentMethod)}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <select
                      value={status}
                      onChange={(e) =>
                        handleStatusChange(t.id, e.target.value as OrderStatus)
                      }
                      style={{
                        padding: "0.5rem",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                        fontWeight: "bold",
                        cursor: "pointer",
                        background: badgeBg,
                        color: badgeColor,
                      }}
                    >
                      <option value="Pendiente de Pago">Pendiente de Pago</option>
                      <option value="Procesando">Procesando</option>
                      <option value="Enviado">Enviado</option>
                      <option value="Entregado">Entregado</option>
                      <option value="Cancelado">
                        Cancelado (Devuelve Stock)
                      </option>
                    </select>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

interface DirectoryCustomerRow {
  firstName: string
  lastName: string
  email: string
  document: string
  phone: string
  address: string
  district: string
  isRegistered: boolean
  ordersCount: number
  totalSpent: number
}

function ManageCustomers() {
  const { users, transactions, deleteUser } = useStore()

  const directory = useMemo<DirectoryCustomerRow[]>(() => {
    const map = new Map<string, DirectoryCustomerRow>()

    users.forEach((u) => {
      const key = (u.email || "").toLowerCase()
      if (!key) return
      map.set(key, {
        firstName: u.firstName || "",
        lastName: u.lastName || "",
        email: u.email,
        document: u.document || "N/A",
        phone: u.phone || "N/A",
        address: u.address || "N/A",
        district: u.district || "N/A",
        isRegistered: true,
        ordersCount: 0,
        totalSpent: 0,
      })
    })

    transactions.forEach((t) => {
      const key = (t.email || "").toLowerCase()
      if (!key) return
      const existing = map.get(key)
      const isCancelled = t.status === "Cancelado"

      if (existing) {
        existing.ordersCount += 1
        if (!isCancelled) existing.totalSpent += t.total || 0
      } else {
        const parts = (t.customer || "Cliente Invitado").trim().split(" ")
        map.set(key, {
          firstName: parts[0] || "Cliente",
          lastName: parts.slice(1).join(" "),
          email: t.email,
          document: t.document || "N/A",
          phone: t.phone || "N/A",
          address: t.address || "N/A",
          district: t.districtName || "N/A",
          isRegistered: false,
          ordersCount: 1,
          totalSpent: isCancelled ? 0 : t.total || 0,
        })
      }
    })

    return Array.from(map.values())
  }, [users, transactions])

  const handleDeleteCustomer = (email: string) => {
    if (
      window.confirm(
        `¿Estás seguro de que deseas eliminar permanentemente al cliente con correo ${email}?`,
      )
    ) {
      deleteUser(email)
    }
  }

  if (directory.length === 0) {
    return (
      <div
        style={{
          padding: "3rem",
          textAlign: "center",
          background: "#fff",
          borderRadius: "8px",
          border: "1px solid #eee",
        }}
      >
        <h3>Aún no hay clientes registrados en el sistema.</h3>
        <p style={{ color: "#666" }}>
          Cuando un cliente cree su cuenta o realice un pedido, aparecerá en
          este directorio.
        </p>
      </div>
    )
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
      <div style={{ padding: "1.5rem", borderBottom: "2px solid #000" }}>
        <h2 style={{ margin: 0, fontSize: "1rem", textTransform: "uppercase" }}>
          Directorio de Clientes
        </h2>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
            fontSize: "0.85rem",
          }}
        >
          <thead style={{ background: "#0a0a0a", color: "#fff" }}>
            <tr>
              <th style={{ padding: "1rem" }}>NOMBRE COMPLETO</th>
              <th style={{ padding: "1rem" }}>DOCUMENTO</th>
              <th style={{ padding: "1rem" }}>CONTACTO</th>
              <th style={{ padding: "1rem" }}>DIRECCIÓN DE ENVÍO</th>
              <th style={{ padding: "1rem" }}>COMPRAS</th>
              <th style={{ padding: "1rem" }}></th>
            </tr>
          </thead>
          <tbody>
            {directory.map((u, i) => (
              <tr key={u.email || i} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "1rem" }}>
                  <strong style={{ display: "block" }}>
                    {u.firstName} {u.lastName}
                  </strong>
                  <span
                    style={{
                      fontSize: "0.68rem",
                      color: u.isRegistered ? "#2e7d32" : "#888",
                      fontWeight: "bold",
                    }}
                  >
                    {u.isRegistered ? "CUENTA REGISTRADA" : "INVITADO CHECKOUT"}
                  </span>
                </td>
                <td style={{ padding: "1rem" }}>DNI: {u.document || "N/A"}</td>
                <td style={{ padding: "1rem" }}>
                  <span
                    style={{
                      display: "block",
                      fontWeight: "bold",
                      color: "#0277bd",
                    }}
                  >
                    {u.email}
                  </span>
                  <span style={{ color: "#666", fontSize: "0.75rem" }}>
                    Tel: {u.phone || "N/A"}
                  </span>
                </td>
                <td style={{ padding: "1rem", maxWidth: "250px" }}>
                  <span style={{ display: "block" }}>{u.address || "N/A"}</span>
                  <span style={{ color: "#888", fontSize: "0.75rem" }}>
                    {u.district || "N/A"}
                  </span>
                </td>
                <td style={{ padding: "1rem" }}>
                  <strong style={{ display: "block" }}>
                    {money(u.totalSpent)}
                  </strong>
                  <span style={{ color: "#888", fontSize: "0.75rem" }}>
                    {u.ordersCount} {u.ordersCount === 1 ? "pedido" : "pedidos"}
                  </span>
                </td>
                <td style={{ padding: "1rem", textAlign: "right" }}>
                  {u.isRegistered && (
                    <button
                      onClick={() => handleDeleteCustomer(u.email)}
                      style={{
                        background: "transparent",
                        color: "#ff4d4d",
                        border: "1px solid #ff4d4d",
                        padding: "0.3rem 0.8rem",
                        borderRadius: "20px",
                        cursor: "pointer",
                        fontSize: "0.7rem",
                        fontWeight: "bold",
                      }}
                    >
                      ELIMINAR
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate()
  const { resetDemoData } = useStore()
  const [currentView, setCurrentView] =
    useState<"dashboard" | "orders" | "upload" | "collections" | "customers">(
      "dashboard",
    )

  useEffect(() => {
    api.orders
      .getAll()
      .then((liveOrders) => {
        if (Array.isArray(liveOrders) && liveOrders.length > 0) {
          try {
            localStorage.setItem(
              "gone_transactions",
              JSON.stringify(liveOrders),
            )
          } catch {}
        }
      })
      .catch((err) => {
        console.warn("[AdminDashboard] Error al precargar órdenes de API:", err)
      })
  }, [])

  const handleResetDemo = () => {
    if (
      window.confirm(
        "🚨 ¿Seguro que deseas BORRAR TODOS los pedidos, clientes y carritos de prueba para iniciar un demo limpio? (Tus productos no se borrarán)",
      )
    ) {
      resetDemoData()
    }
  }

  return (
    <main
      style={{
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
        padding: "3rem 5%",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: "0.75rem",
              fontWeight: "bold",
              color: "#666",
            }}
          >
            GONE SURFING / ADMIN
          </p>
        </div>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <button
            onClick={handleResetDemo}
            style={{
              background: "#ff4d4d",
              color: "#fff",
              border: "none",
              padding: "0.6rem 1.2rem",
              fontWeight: "bold",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            VACIAR DATOS DE PRUEBA
          </button>
          <button
            onClick={() => navigate("/shop")}
            style={{
              background: "#000",
              color: "#fff",
              border: "none",
              padding: "0.6rem 1.2rem",
              fontWeight: "bold",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            VER TIENDA PÚBLICA
          </button>
          <button
            onClick={onLogout}
            style={{
              background: "transparent",
              color: "#000",
              border: "1px solid #000",
              padding: "0.6rem 1.2rem",
              fontWeight: "bold",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            CERRAR SESIÓN
          </button>
        </div>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <nav
          style={{
            display: "flex",
            gap: "2rem",
            borderBottom: "2px solid #ddd",
            overflowX: "auto",
          }}
        >
          <button
            onClick={() => setCurrentView("dashboard")}
            style={{
              background: "transparent",
              border: "none",
              borderBottom:
                currentView === "dashboard"
                  ? "2px solid #000"
                  : "2px solid transparent",
              padding: "0 0 0.5rem 0",
              fontWeight: "bold",
              fontSize: "0.9rem",
              color: currentView === "dashboard" ? "#000" : "#888",
              cursor: "pointer",
              textTransform: "uppercase",
              marginBottom: "-2px",
            }}
          >
            Dashboard
          </button>
          <button
            onClick={() => setCurrentView("orders")}
            style={{
              background: "transparent",
              border: "none",
              borderBottom:
                currentView === "orders"
                  ? "2px solid #000"
                  : "2px solid transparent",
              padding: "0 0 0.5rem 0",
              fontWeight: "bold",
              fontSize: "0.9rem",
              color: currentView === "orders" ? "#000" : "#888",
              cursor: "pointer",
              textTransform: "uppercase",
              marginBottom: "-2px",
            }}
          >
            Gestión de Pedidos
          </button>
          <button
            onClick={() => setCurrentView("customers")}
            style={{
              background: "transparent",
              border: "none",
              borderBottom:
                currentView === "customers"
                  ? "2px solid #000"
                  : "2px solid transparent",
              padding: "0 0 0.5rem 0",
              fontWeight: "bold",
              fontSize: "0.9rem",
              color: currentView === "customers" ? "#000" : "#888",
              cursor: "pointer",
              textTransform: "uppercase",
              marginBottom: "-2px",
            }}
          >
            Gestión de Clientes
          </button>
          <button
            onClick={() => setCurrentView("upload")}
            style={{
              background: "transparent",
              border: "none",
              borderBottom:
                currentView === "upload"
                  ? "2px solid #000"
                  : "2px solid transparent",
              padding: "0 0 0.5rem 0",
              fontWeight: "bold",
              fontSize: "0.9rem",
              color: currentView === "upload" ? "#000" : "#888",
              cursor: "pointer",
              textTransform: "uppercase",
              marginBottom: "-2px",
            }}
          >
            Subir Catálogo
          </button>
          <button
            onClick={() => setCurrentView("collections")}
            style={{
              background: "transparent",
              border: "none",
              borderBottom:
                currentView === "collections"
                  ? "2px solid #000"
                  : "2px solid transparent",
              padding: "0 0 0.5rem 0",
              fontWeight: "bold",
              fontSize: "0.9rem",
              color: currentView === "collections" ? "#000" : "#888",
              cursor: "pointer",
              textTransform: "uppercase",
              marginBottom: "-2px",
            }}
          >
            Colecciones
          </button>
        </nav>
      </div>

      {currentView === "dashboard" && <MetricsDashboard />}
      {currentView === "orders" && <ManageOrders />}
      {currentView === "customers" && <ManageCustomers />}
      {currentView === "upload" && <UploadPrenda />}
      {currentView === "collections" && <ManageCollections />}
    </main>
  )
}

export default function Admin() {
  const [auth, setAuth] = useState(() => Boolean(api.auth.getAdminSession()))
  const [errorMessage, setErrorMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Verify periodic session expiration
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const session = api.auth.getAdminSession()
      if (!session && auth) {
        setAuth(false)
        setErrorMessage(
          "Tu sesión ha expirado por seguridad. Por favor, ingresa nuevamente.",
        )
      }
    }, 10000)

    return () => clearInterval(checkInterval)
  }, [auth])

  const login = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage("")

    const data = new FormData(e.currentTarget)
    const user = String(data.get("user") || "").trim()
    const password = String(data.get("password") || "")

    try {
      const res = await api.auth.loginAdmin(user, password)
      if (res.ok) {
        setAuth(true)
        setErrorMessage("")
      } else {
        setErrorMessage(res.error || "Credenciales incorrectas.")
      }
    } catch {
      setErrorMessage("Error de conexión al autenticar.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const logout = async () => {
    await api.auth.logoutAdmin()
    setAuth(false)
    setErrorMessage("")
  }

  if (auth) return <AdminDashboard onLogout={logout} />

  return (
    <main
      style={{
        backgroundColor: "#e5e5e5",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "3rem",
          width: "100%",
          maxWidth: "400px",
          borderTop: "5px solid #000",
          boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
        }}
      >
        <Logo dark />
        <p
          style={{
            margin: 0,
            fontSize: "0.75rem",
            fontWeight: "bold",
            color: "#666",
            textTransform: "uppercase",
          }}
        >
          Private Access
        </p>
        <h1
          style={{
            margin: "0.5rem 0 2rem 0",
            fontSize: "2.5rem",
            textTransform: "uppercase",
          }}
        >
          Admin Login
        </h1>

        <form
          onSubmit={login}
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.75rem",
                fontWeight: "bold",
                marginBottom: "0.5rem",
              }}
            >
              USUARIO
            </label>
            <input
              name="user"
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #ddd",
              }}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.75rem",
                fontWeight: "bold",
                marginBottom: "0.5rem",
              }}
            >
              CONTRASEÑA
            </label>
            <input
              name="password"
              type="password"
              required
              style={{
                width: "100%",
                padding: "0.75rem",
                border: "1px solid #ddd",
              }}
            />
          </div>
          {errorMessage && (
            <small style={{ color: "red", fontWeight: "bold" }}>
              {errorMessage}
            </small>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              background: "#000",
              color: "#fff",
              border: "none",
              padding: "1rem",
              fontWeight: "bold",
              textTransform: "uppercase",
              cursor: "pointer",
              marginTop: "1rem",
              opacity: isSubmitting ? 0.6 : 1,
            }}
          >
            {isSubmitting ? "Validando..." : "Enter Dashboard"}
          </button>
        </form>
      </div>
    </main>
  )
}
