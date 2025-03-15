"use client"

// Minimal implementation without any dependencies
export function useToast() {
  return {
    toast: (props: { title: string; description?: string }) => {
      console.log("Toast:", props)
    },
    dismiss: () => {},
  }
}

