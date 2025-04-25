import Link from 'next/link'

export default function BackButton() {
  return (
    <Link href="/" className="back-button" style={{margin:20, display:'inline-block'}}>
      ← BACK
    </Link>
  )
} 