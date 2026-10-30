import { useStore } from "../store"

export function useCart() {
  const {
    cart,
    addToCart,
    changeQuantity,
    removeFromCart,
    clearCart,
    products,
  } = useStore()

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0)

  const cartTotal = cart.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId)
    return sum + (product ? product.price * item.quantity : 0)
  }, 0)

  return {
    cart,
    addToCart,
    changeQuantity,
    removeFromCart,
    clearCart,
    cartCount,
    cartTotal,
  }
}

export default useCart

