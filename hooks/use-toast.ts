"use client"

// This is a simplified version that doesn't depend on @radix-ui/react-toast
export function useToast() {
  // Mock implementation
  const toasts = [] as Array<{
    id: string
    title: string
    description?: string
    variant?: "default" | "destructive"
  }>

  const toast = (props: { title: string; description?: string; variant?: "default" | "destructive" }) => {
    // For now, just log to console since we removed the toast component
    console.log("Toast:", props.title, props.description)

    // In a real implementation, you might want to use a different toast library
    // or implement a custom solution
  }

  return {
    toast,
    dismiss: (toastId?: string) => {},
    toasts, // Add this property to match the expected interface
  }
}

