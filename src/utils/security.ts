/**
 * Gone Surfing - Security & OWASP Defense Utilities
 * Provides input sanitization, strict validations, and session token management.
 */

export interface SessionData {
  user: string
  token: string
  role: "admin" | "customer"
  loginTime: number
  expiresAt: number
}

export interface DocumentValidation {
  valid: boolean
  error?: string
}

export interface PriceValidation {
  valid: boolean
  value: number
}

export interface ImageValidation {
  ok: boolean
  error?: string
}

/**
 * Sanitizes generic string inputs to neutralize XSS and script injections.
 * Strips HTML tags, JavaScript event handlers, and normalizes whitespaces.
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== "string") return ""
  return input
    .replace(/<[^>]*>?/gm, "") // Strip HTML tags
    .replace(/javascript:/gi, "") // Neutralize javascript: pseudo-protocols
    .replace(/on\w+\s*=/gi, "") // Neutralize inline event handlers like onclick=
    .trim()
}

/**
 * Sanitizes URL query parameters safely.
 */
export function sanitizeUrlParam(param: string | null): string {
  if (!param) return ""
  return sanitizeString(decodeURIComponent(param)).slice(0, 80)
}

/**
 * Validates Peruvian DNI (exactly 8 digits) or Carné de Extranjería (9 to 12 alphanumeric characters).
 */
export function validateDocument(type: "DNI" | "CE", docNumber: string): DocumentValidation {
  const clean = docNumber.trim()
  if (type === "DNI") {
    const is8Digits = /^\d{8}$/.test(clean)
    if (!is8Digits) {
      return { valid: false, error: "El DNI debe contener exactamente 8 dígitos numéricos." }
    }
  } else if (type === "CE") {
    const isCeValid = /^[a-zA-Z0-9]{9,12}$/.test(clean)
    if (!isCeValid) {
      return { valid: false, error: "El Carné de Extranjería debe tener entre 9 y 12 caracteres alfanuméricos." }
    }
  }
  return { valid: true }
}

/**
 * Validates Email addresses against standard RFC 5322 compliant regex.
 */
export function validateEmail(email: string): boolean {
  if (!email || email.length > 254) return false
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/
  return emailRegex.test(email.trim())
}

/**
 * Validates phone numbers (standard Peruvian 9 digits or standard surf mobile formats).
 */
export function validatePhone(phone: string): boolean {
  const clean = phone.replace(/[\s\-\(\)\+]/g, "")
  return /^\d{7,15}$/.test(clean)
}

/**
 * Validates that price is a strictly positive finite number.
 */
export function validatePrice(price: unknown): PriceValidation {
  const num = typeof price === "number" ? price : parseFloat(String(price))
  if (Number.isFinite(num) && num > 0) {
    return { valid: true, value: Number(num.toFixed(2)) }
  }
  return { valid: false, value: 0 }
}

/**
 * Validates that stock is a non-negative integer.
 */
export function validateStock(stock: unknown): number {
  const num = typeof stock === "number" ? stock : parseInt(String(stock), 10)
  if (Number.isFinite(num) && num >= 0) {
    return Math.floor(num)
  }
  return 0
}

/**
 * Validates uploaded image file against allowed MIME types and max payload size.
 */
export function validateImageFile(file: File, maxSizeBytes = 10 * 1024 * 1024): ImageValidation {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]
  if (!file) {
    return { ok: false, error: "No se seleccionó ningún archivo de imagen." }
  }
  if (!allowedMimeTypes.includes(file.type.toLowerCase())) {
    return { ok: false, error: `Tipo de archivo no permitido (${file.type}). Sube JPEG, PNG, WebP o AVIF.` }
  }
  if (file.size > maxSizeBytes) {
    const maxMb = Math.round(maxSizeBytes / (1024 * 1024))
    return { ok: false, error: `La imagen excede el límite permitido de ${maxMb}MB.` }
  }
  return { ok: true }
}

/* =============================================================================
   ADMIN SESSION & TOKEN HELPERS
   ============================================================================= */

const ADMIN_SESSION_KEY = "gone_admin_session"

export function createAdminSession(user: string, hours = 4): SessionData {
  const now = Date.now()
  const expiresAt = now + hours * 3600 * 1000
  const array = new Uint8Array(24)
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(array)
  }
  const token = Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")

  const session: SessionData = {
    user,
    token,
    role: "admin",
    loginTime: now,
    expiresAt,
  }

  sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session))
  sessionStorage.setItem("gone_admin", "true")
  return session
}

export function getAdminSession(): SessionData | null {
  try {
    const raw = sessionStorage.getItem(ADMIN_SESSION_KEY)
    if (!raw) return null
    const parsed: SessionData = JSON.parse(raw)
    if (!parsed || !parsed.expiresAt || !parsed.token) {
      clearAdminSession()
      return null
    }
    if (Date.now() > parsed.expiresAt) {
      clearAdminSession()
      return null
    }
    return parsed
  } catch {
    clearAdminSession()
    return null
  }
}

export function clearAdminSession(): void {
  sessionStorage.removeItem(ADMIN_SESSION_KEY)
  sessionStorage.removeItem("gone_admin")
}

export function isSessionExpired(session: SessionData | null): boolean {
  if (!session) return true
  return Date.now() > session.expiresAt
}

