"use client"

// This is a simplified version that doesn't depend on any toast libraries
export function useToast() {
  const toast = (props: { title: string; description?: string; variant?: "default" | "destructive" }) => {
    // For now, just log to console since we removed the toast component
    console.log("Toast:", props.title, props.description)
  }

  return {
    toast,
    dismiss: (toastId?: string) => {},
    toasts: [], // Empty array to satisfy any existing code that might expect this property
  }
}

