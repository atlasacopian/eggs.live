"use client"

export function useToast() {
  return {
    toast: (props: { title: string; description?: string }) => {
      console.log('Toast:', props)
    },
    dismiss: () => {},
  }
}
