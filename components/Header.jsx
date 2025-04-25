export default function Header() {
  const accent = 'var(--accent-color)';
  // Define base styles
  const baseHeaderStyle = { color: '#000', textAlign: 'center' };
  const baseH1Style = { fontWeight: 700, letterSpacing: 4, fontFamily: 'inherit' };
  const baseH3Style = { fontWeight: 400, letterSpacing: 2, fontFamily: 'inherit' };

  return (
    <header className="header" style={baseHeaderStyle}>
      {/* Apply responsive font size using CSS variables or inline conditional logic if simple */}
      {/* Using inline style for simplicity here, consider CSS Modules/classes for more complex scenarios */}
      <style jsx>{`
        h1 {
          font-size: 2.0rem; /* Default desktop size */
        }
        h3 {
          font-size: 0.7rem; /* Default desktop size */
        }
        @media (max-width: 768px) {
          h1 {
            font-size: 1.0rem; /* Even smaller mobile size */
            letter-spacing: 1.5px;
          }
          h3 {
            font-size: 0.4rem; /* Even smaller mobile size */
            letter-spacing: 0.8px;
          }
        }
      `}</style>
      <h1 style={baseH1Style}>
        eggs<span style={{ color: '#000' }}>.</span>live
      </h1>
      <h3 style={baseH3Style}>HOW MUCH IS A DOZEN TODAY?</h3>
    </header>
  )
} 