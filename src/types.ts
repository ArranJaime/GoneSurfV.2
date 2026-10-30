/**
 * Gone Surfing - Shared Type Definitions
 */
export type Size = "S" | "M" | "L" | "XL" | "Única"
export type OrderStatus = "Pendiente de Pago" | "Procesando" | "Enviado" | "Entregado" | "Cancelado"
export type OrderPaymentMethod = "tarjeta" | "yape_plin" | "efectivo"
export type PaymentMethod = OrderPaymentMethod

export interface CartItem {
  productId: string
  size: Size
  quantity: number
}

export interface Product {
  id: string
  name: string
  price: number
  category: string
  collectionName?: string
  image: string
  imageUrl?: string
  stocks: Record<string, number>
  salesCount?: number
}

export interface CollectionData {
  id: string
  category: string
  subtitle: string
  title: string
  image: string
  active: boolean
}

export interface CustomerUser {
  firstName: string
  lastName: string
  email: string
  documentType?: "DNI" | "CE"
  document?: string
  phone?: string
  address?: string
  reference?: string
  district?: string
  password?: string
  createdAt?: string
  updatedAt?: string
  isGuest?: boolean
  status?: string
  cognitoId?: string
}

export type User = CustomerUser
export type UserProfile = CustomerUser

export interface OrderDetailsInput {
  customer: string
  documentType?: "DNI" | "CE"
  document: string
  email: string
  phone: string
  districtCode: string
  districtName: string
  districtX: number
  districtY: number
  address: string
  reference?: string
  shippingMethod?: "standard" | "express"
  shipping: number
  paymentMethod: OrderPaymentMethod
  total?: number
  subtotal?: number
  items: CartItem[]
  isGuest?: boolean
}

export interface OrderTransaction extends OrderDetailsInput {
  id: string
  total: number
  subtotal: number
  igv: number
  date: string
  detail: string
  status: OrderStatus
  paymentMethod: OrderPaymentMethod
  reference?: string
  isGuest?: boolean
  userStatus?: string
  cognitoId?: string
}

export type Order = OrderTransaction

export interface ComplaintInput {
  consumerName: string
  documentType: "DNI" | "CE" | "Pasaporte"
  documentNumber: string
  address: string
  phone: string
  email: string
  isMinor?: boolean
  parentName?: string
  parentDocument?: string
  goodType: "producto" | "servicio"
  claimedAmount?: number
  goodDescription: string
  claimType: "reclamo" | "queja"
  detail: string
  consumerRequest: string
}

export type ComplaintStatus = "Pendiente" | "En Revisión" | "En Proceso" | "Atendido" | "Cerrado" | "Resuelto"

export interface ComplaintRecord extends ComplaintInput {
  id: string
  year: number
  status: ComplaintStatus
  maxResponseDays: number
  createdAt: string
  resolution?: string
  adminNotes?: string
  resolvedAt?: string
  updatedAt?: string
}

export interface ComplaintStatusUpdateOptions {
  resolution?: string
  adminNotes?: string
}

export interface ComplaintUpdateResult {
  ok: boolean
  complaint?: ComplaintRecord
  error?: string
}
