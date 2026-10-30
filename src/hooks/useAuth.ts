import { useCallback, useEffect, useState } from "react"
import { api } from "../services/api"
import { getCurrentSessionUser, useStore } from "../store"
import type { CustomerUser } from "../types"

export function useAuth() {
  const { registerUser, authenticateUser, updateUserProfile } = useStore()

  const [currentUser, setCurrentUser] = useState<CustomerUser | null>(() =>
    getCurrentSessionUser(),
  )
  const [isAuth, setIsAuth] = useState(
    () =>
      sessionStorage.getItem("gone_customer") === "true" &&
      Boolean(getCurrentSessionUser()),
  )

  const syncSession = useCallback(() => {
    const user = getCurrentSessionUser()
    setCurrentUser(user)
    setIsAuth(
      sessionStorage.getItem("gone_customer") === "true" && Boolean(user),
    )
  }, [])

  useEffect(() => {
    const handleSync = (e: any) => {
      if (!e?.detail?.channel || e.detail.channel === "users") {
        syncSession()
      }
    }
    window.addEventListener("gonesurf:sync", handleSync)
    window.addEventListener("storage", syncSession)
    return () => {
      window.removeEventListener("gonesurf:sync", handleSync)
      window.removeEventListener("storage", syncSession)
    }
  }, [syncSession])

  const login = useCallback(
    async (email: string, pass: string): Promise<{
      ok: boolean
      user?: CustomerUser
      error?: string
    }> => {
      // 1. Intentar autenticación con AWS primero
      const customerRes = await api.auth.loginCustomer(email, pass)
      if (customerRes) {
        setCurrentUser(customerRes)
        setIsAuth(true)
        return { ok: true, user: customerRes }
      }

      // 2. Fallback a autenticación local
      const authenticated = authenticateUser(email, pass)
      if (authenticated) {
        setCurrentUser(authenticated)
        setIsAuth(true)
        return { ok: true, user: authenticated }
      }

      return {
        ok: false,
        error: "El correo o la contraseña son incorrectos.",
      }
    },
    [authenticateUser],
  )

  const register = useCallback(
    async (newUser: CustomerUser): Promise<{
      ok: boolean
      user?: CustomerUser
      error?: string
    }> => {
      const res = await api.auth.registerCustomer(newUser)
      if (!res.ok) {
        return {
          ok: false,
          error: res.error || "No se pudo completar el registro.",
        }
      }

      const registeredUser = res.user || newUser
      registerUser(registeredUser)
      setCurrentUser(registeredUser)
      setIsAuth(true)
      return { ok: true, user: registeredUser }
    },
    [registerUser],
  )

  const updateCustomerProfile = useCallback(
    async (profileData: Partial<CustomerUser>): Promise<{
      ok: boolean
      user?: CustomerUser
      error?: string
    }> => {
      const res = await updateUserProfile(profileData)
      if (res.ok && res.user) {
        setCurrentUser(res.user)
      }
      return res
    },
    [updateUserProfile],
  )

  const logout = useCallback(() => {
    sessionStorage.removeItem("gone_customer")
    sessionStorage.removeItem("gone_current_user")
    sessionStorage.removeItem("customer_token")
    setCurrentUser(null)
    setIsAuth(false)
  }, [])

  return {
    currentUser,
    isAuth,
    login,
    register,
    logout,
    updateProfile: updateCustomerProfile,
    refreshSession: syncSession,
  }
}

export default useAuth
