"use client"

import type * as React from "react"

type ThemeProviderProps = {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return <>{children}</>
}

