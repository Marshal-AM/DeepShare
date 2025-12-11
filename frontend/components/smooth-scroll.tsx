"use client"

import { ReactLenis, useLenis } from "lenis/react"
import type { ReactNode } from "react"
import { useEffect } from "react"

export function SmoothScroll({ children }: { children: ReactNode }) {
  const lenis = useLenis()

  useEffect(() => {
    if (lenis) {
      // Store Lenis instance globally for modal access
      ;(window as any).lenis = lenis
    }
  }, [lenis])

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.2, smoothWheel: true }}>
      {children}
    </ReactLenis>
  )
}
