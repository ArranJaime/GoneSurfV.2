/**
 * Gone Surfing - Accounting Integrity (SUNAT Perú Compliance)
 * Computes all cart, checkout and cashier amounts strictly in integer céntimos to avoid
 * IEEE 754 floating point precision errors.
 *
 * In Peru, retail prices include 18% IGV (Impuesto General a las Ventas).
 * Base Imponible = Total Items / 1.18
 * IGV = Total Items - Base Imponible
 */

export interface OrderItemCalculation {
  productId: string
  name: string
  size: string
  unitPrice: number
  unitPriceCents: number
  quantity: number
  totalCents: number
}

export interface AccountingBreakdown {
  items: OrderItemCalculation[]
  itemsTotalCents: number
  shippingCents: number
  subtotalCents: number // Base imponible
  igvCents: number // 18% IGV
  totalCents: number // Final payable amount
  itemsTotal: number
  shipping: number
  subtotal: number
  igv: number
  total: number
}

export interface CartItemLike {
  productId: string
  size: string
  quantity: number
}

export interface CatalogProductLike {
  id: string
  name: string
  price: number
}

/**
 * Recalculates order amounts strictly from official catalog products and quantities.
 * Prevents client-side manipulation of prices or taxes.
 */
export function calculateOrderAmounts(
  cartItems: CartItemLike[],
  catalogProducts: CatalogProductLike[],
  shippingMethod: "standard" | "express" = "standard",
  freeShippingThresholdCents = 30000,
): AccountingBreakdown {
  const items: OrderItemCalculation[] = []
  let itemsTotalCents = 0

  for (const item of cartItems) {
    const product = catalogProducts.find((p) => p.id === item.productId)
    if (!product) continue

    const validQty = Math.max(0, Math.floor(item.quantity))
    if (validQty <= 0) continue

    const unitPriceCents = Math.round(product.price * 100)
    const lineTotalCents = unitPriceCents * validQty

    itemsTotalCents += lineTotalCents
    items.push({
      productId: item.productId,
      name: product.name,
      size: item.size,
      unitPrice: product.price,
      unitPriceCents,
      quantity: validQty,
      totalCents: lineTotalCents,
    })
  }

  let shippingCents = 0
  if (shippingMethod === "express") {
    shippingCents = 3000 // S/. 30.00
  } else {
    shippingCents = itemsTotalCents >= freeShippingThresholdCents ? 0 : 1500 // S/. 15.00
  }

  const subtotalCents = Math.round(itemsTotalCents / 1.18)
  const igvCents = itemsTotalCents - subtotalCents
  const totalCents = itemsTotalCents + shippingCents

  return {
    items,
    itemsTotalCents,
    shippingCents,
    subtotalCents,
    igvCents,
    totalCents,
    itemsTotal: Number((itemsTotalCents / 100).toFixed(2)),
    shipping: Number((shippingCents / 100).toFixed(2)),
    subtotal: Number((subtotalCents / 100).toFixed(2)),
    igv: Number((igvCents / 100).toFixed(2)),
    total: Number((totalCents / 100).toFixed(2)),
  }
}

/**
 * Formats monetary amounts in Peruvian Soles (S/.)
 */
export function formatPEN(amountInSoles: number): string {
  const safeNum = Number.isFinite(amountInSoles) ? amountInSoles : 0
  return `S/. ${safeNum.toFixed(2)}`
}
