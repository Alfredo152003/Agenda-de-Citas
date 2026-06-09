interface LogoProps {
  /** "light" pinta el logo en blanco (fondos mocha); "dark" en mocha (fondos claros). */
  tone?: "light" | "dark"
  className?: string
}

/**
 * Marca LUMÉA BEAUTY. Reutiliza /logo.svg (blanco) y lo recolorea con `mask`,
 * de modo que el color se controla con la clase de texto (currentColor).
 */
function Logo({ tone = "dark", className = "" }: LogoProps) {
  return (
    <span
      role="img"
      aria-label="Luméa Beauty"
      className={`inline-block ${tone === "light" ? "text-white" : "text-mocha"} ${className}`}
      style={{
        aspectRatio: "265.5 / 201",
        backgroundColor: "currentColor",
        WebkitMaskImage: "url(/logo.svg)",
        maskImage: "url(/logo.svg)",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  )
}

export default Logo
