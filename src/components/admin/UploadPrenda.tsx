import { type FormEvent, useEffect, useRef, useState } from "react"
import { api } from "../../services/api"
import { useStore, type Product, type Size } from "../../store"
import { formatPEN } from "../../utils/accounting"
import {
  sanitizeString,
  validateImageFile,
  validatePrice,
  validateStock,
} from "../../utils/security"

const SIZES: Size[] = ["S", "M", "L", "XL"]
const money = (value: number) => formatPEN(value)

export function UploadPrenda() {
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const previewUrlRef = useRef<string | null>(null)
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
  const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null)
  const editPreviewUrlRef = useRef<string | null>(null)
  const [editStocks, setEditStocks] = useState<Record<string, number>>({})
  const [editUploading, setEditUploading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const editFileInputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<number | null>(null)
  const isUnique = category === "Accesorios"

  useEffect(() => {
    return () => {
      if (previewUrlRef.current && previewUrlRef.current.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrlRef.current)
        previewUrlRef.current = null
      }
      if (
        editPreviewUrlRef.current &&
        editPreviewUrlRef.current.startsWith("blob:")
      ) {
        URL.revokeObjectURL(editPreviewUrlRef.current)
        editPreviewUrlRef.current = null
      }
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    }
  }, [])

  // Client-side Canvas Image compression y previsualización local reactiva
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validation = validateImageFile(file)
    if (!validation.ok) {
      setUploadError(validation.error || "Archivo no permitido.")
      return
    }

    if (previewUrlRef.current && previewUrlRef.current.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }

    const localBlobUrl = URL.createObjectURL(file)
    previewUrlRef.current = localBlobUrl
    setPreviewUrl(localBlobUrl)
    setUploadError("")

    try {
      setUploading(true)
      const res = await api.media.uploadImage(file)

      const cfBase = (
        import.meta.env.VITE_AWS_CLOUDFRONT_URL ||
        "https://d1137rlqok2t6n.cloudfront.net"
      ).replace(/\/$/, "")

      let finalUrl = res.url
      if (res.key && !finalUrl.startsWith("http")) {
        finalUrl = `${cfBase}/${res.key.replace(/^\//, "")}`
      }
      setImage(finalUrl)
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

    if (
      editPreviewUrlRef.current &&
      editPreviewUrlRef.current.startsWith("blob:")
    ) {
      URL.revokeObjectURL(editPreviewUrlRef.current)
      editPreviewUrlRef.current = null
    }

    const localBlobUrl = URL.createObjectURL(file)
    editPreviewUrlRef.current = localBlobUrl
    setEditPreviewUrl(localBlobUrl)

    try {
      setEditUploading(true)
      const res = await api.media.uploadImage(file)

      const cfBase = (
        import.meta.env.VITE_AWS_CLOUDFRONT_URL ||
        "https://d1137rlqok2t6n.cloudfront.net"
      ).replace(/\/$/, "")

      let finalUrl = res.url
      if (res.key && !finalUrl.startsWith("http")) {
        finalUrl = `${cfBase}/${res.key.replace(/^\//, "")}`
      }
      setEditImage(finalUrl)
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

    const cfBase = (
      import.meta.env.VITE_AWS_CLOUDFRONT_URL ||
      "https://d1137rlqok2t6n.cloudfront.net"
    ).replace(/\/$/, "")

    if (uploading) {
      alert(
        "La imagen aún se está subiendo al servidor. Por favor espera unos segundos.",
      )
      return
    }

    let finalPublicUrl = (image || "").trim()
    if (!cleanName || !finalPublicUrl || !validPrice.valid) {
      alert(
        "Por favor completa el nombre, un precio mayor a 0 y sube una imagen válida.",
      )
      return
    }

    if (
      finalPublicUrl.includes("fakepath") ||
      finalPublicUrl.startsWith("blob:")
    ) {
      alert(
        "La imagen aún se está subiendo al servidor. Por favor espera unos segundos.",
      )
      return
    }

    if (
      !finalPublicUrl.startsWith("http://") &&
      !finalPublicUrl.startsWith("https://") &&
      !finalPublicUrl.startsWith("data:")
    ) {
      finalPublicUrl = `${cfBase}/${finalPublicUrl.replace(/^\//, "")}`
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
      image: finalPublicUrl,
      imageUrl: finalPublicUrl,
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
        const token =
          api.auth.getAdminToken?.() ||
          api.auth.getAdminSession()?.token ||
          (typeof localStorage !== "undefined"
            ? localStorage.getItem("token") ||
              localStorage.getItem("admin_token") ||
              (() => {
                try {
                  const r = localStorage.getItem("gone_admin_session")
                  return r ? JSON.parse(r)?.token : null
                } catch {
                  return null
                }
              })()
            : null) ||
          "dev-admin-token"

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        }

        const res = await fetch(`${apiUrl}/products`, {
          method: "POST",
          headers,
          body: JSON.stringify(productPayload),
        })

        if (res.status !== 200 && res.status !== 201) {
          const errData = await res.json().catch(() => ({}))
          console.error(
            `[Admin] Error HTTP ${res.status} al crear producto:`,
            errData,
          )
          throw new Error(errData.message || `Error HTTP ${res.status}`)
        }

        const savedProduct: Product = await res.json()
        if (!savedProduct || !savedProduct.id) {
          throw new Error(
            "La base de datos no confirmó la persistencia del producto.",
          )
        }

        await addProduct(savedProduct)
      } else {
        throw new Error(
          "Error de configuración: VITE_API_URL no está configurada.",
        )
      }

      if (previewUrlRef.current && previewUrlRef.current.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrlRef.current)
        previewUrlRef.current = null
      }
      setPreviewUrl(null)
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

  const openEditModal = (p: Product) => {
    if (
      editPreviewUrlRef.current &&
      editPreviewUrlRef.current.startsWith("blob:")
    ) {
      URL.revokeObjectURL(editPreviewUrlRef.current)
      editPreviewUrlRef.current = null
    }
    setEditPreviewUrl(null)
    setEditingProduct(p)
    setEditName(p.name)
    setEditPrice(String(p.price))
    setEditCategory(p.category)
    setEditCollection(p.collectionName || "Catálogo General")
    setEditImage(p.imageUrl || p.image)
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

    let finalEditImageUrl = (editImage || "").trim()
    if (
      finalEditImageUrl &&
      !finalEditImageUrl.startsWith("http://") &&
      !finalEditImageUrl.startsWith("https://") &&
      !finalEditImageUrl.startsWith("data:")
    ) {
      const cfBase = (
        import.meta.env.VITE_AWS_CLOUDFRONT_URL ||
        "https://d1137rlqok2t6n.cloudfront.net"
      ).replace(/\/$/, "")
      finalEditImageUrl = `${cfBase}/${finalEditImageUrl.replace(/^\//, "")}`
    }

    updateProduct(editingProduct.id, {
      name: cleanName,
      price: validPrice.value,
      category: editCategory,
      collectionName: editCollection,
      image: finalEditImageUrl,
      imageUrl: finalEditImageUrl,
      stocks: cleanedStocks,
    })

    if (
      editPreviewUrlRef.current &&
      editPreviewUrlRef.current.startsWith("blob:")
    ) {
      URL.revokeObjectURL(editPreviewUrlRef.current)
      editPreviewUrlRef.current = null
    }
    setEditPreviewUrl(null)
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
            {previewUrl || image ? (
              <img
                src={previewUrl || image!}
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
              onClick={() => {
                if (
                  editPreviewUrlRef.current &&
                  editPreviewUrlRef.current.startsWith("blob:")
                ) {
                  URL.revokeObjectURL(editPreviewUrlRef.current)
                  editPreviewUrlRef.current = null
                }
                setEditPreviewUrl(null)
                setEditingProduct(null)
              }}
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
                src={editPreviewUrl || editImage || "/assets/hero-surf.jpg"}
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
                  const activeSizes: Size[] = isAcc ? (["Única"] as Size[]) : SIZES

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
                          src={p.imageUrl || p.image}
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
                                updateProductCollection(
                                  p.id,
                                  "Catálogo General",
                                )
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
                                    (p.stocks[s] || 0) === 0
                                      ? "#ff4d4d"
                                      : "#000",
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

export default UploadPrenda
