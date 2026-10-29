/**
 * Gone Surfing - Shared Type Definitions
 */
export type Size = "S" | "M" | "L" | "XL" | "Única"
export type OrderStatus =
  | "Pendiente de Pago"
  | "Procesando"
  | "Enviado"
  | "Entregado"
  | "Cancelado"
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
  district?: string
  password?: string
}

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
  shippingMethod?: "standard" | "express"
  shipping: number
  paymentMethod: OrderPaymentMethod
  total?: number
  subtotal?: number
  items: CartItem[]
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
}

export type Order = OrderTransaction
