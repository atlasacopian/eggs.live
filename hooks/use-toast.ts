"use client"

// Simplified toast implementation without dependencies
export function useToast() {
  const toast = (props: {
    title: string
    description?: string
    variant?: "default" | "destructive"
  }) => {
    // For development, just log to console
    console.log("Toast:", props)
  }

  return {
    toast,
    dismiss: () => {},
  }
}

