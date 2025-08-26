"use client"

import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"

export function SessionRedirect() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === "authenticated" && session && pathname === "/") {
      router.push("/home")
    }
  }, [session, status, pathname, router])

  return null
}
