// Reusable SideHustle logo mark — gradient circle with bold $ glyph.
// size: pixel dimension (the SVG is square, default 44)
function LogoMark({ size = 44 }) {
  const id = `logo-grad-${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4ecdc4" />
          <stop offset="100%" stopColor="#7B8FC8" />
        </linearGradient>
      </defs>
      <circle cx="22" cy="22" r="22" fill={`url(#${id})`} />
      <text
        x="22" y="30"
        textAnchor="middle"
        fontFamily="Outfit, sans-serif"
        fontWeight="900"
        fontSize="26"
        fill="white"
      >$</text>
    </svg>
  );
}

export default LogoMark;
