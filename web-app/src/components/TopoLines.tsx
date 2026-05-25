/** Decorative topo contour lines (design system `shell.jsx`). */
export function TopoLines() {
  return (
    <svg className="topo" viewBox="0 0 200 120" preserveAspectRatio="none" aria-hidden>
      <g fill="none" stroke="#fff" strokeWidth="0.6">
        <path d="M-10 100 C 40 86, 70 92, 110 78 S 180 64, 220 70" />
        <path d="M-10 80  C 40 66, 70 72, 110 58 S 180 44, 220 50" />
        <path d="M-10 60  C 40 46, 70 52, 110 38 S 180 24, 220 30" />
        <path d="M-10 40  C 40 26, 70 32, 110 18 S 180 4,  220 10" />
      </g>
    </svg>
  )
}
