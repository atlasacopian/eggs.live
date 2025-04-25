export default function Header() {
  const accent = 'var(--accent-color)';
  return (
    <header className="header" style={{ color: '#000', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2.4rem', fontWeight: 700, letterSpacing: 4, fontFamily: 'inherit' }}>
        eggs<span style={{ color: '#000' }}>.</span>live
      </h1>
      <h3 style={{ fontSize: '0.8rem', fontWeight: 400, letterSpacing: 2, fontFamily: 'inherit' }}>HOW MUCH IS A DOZEN TODAY?</h3>
    </header>
  )
} 