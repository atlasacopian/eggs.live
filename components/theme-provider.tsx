"use client"

import type * as React from "react"

// Define our own ThemeProviderProps type instead of importing it
type ThemeProviderProps = {
  children: React.ReactNode
  attribute?: string
  defaultTheme?: string
  enableSystem?: boolean
}

export function ThemeProvider({
  children,
  // Provide default values for all props
  attribute = "class",
  defaultTheme = "system",
  enableSystem = true,
}: ThemeProviderProps) {
  // Just render children without any theming logic
  return <>{children}</>
}

