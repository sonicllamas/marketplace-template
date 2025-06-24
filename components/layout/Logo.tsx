import type React from "react"

export const Logo: React.FC = () => {
  return (
    <div className="flex items-center">
      {" "}
      {/* Container to help with alignment */}
      <iframe
        src="https://drive.google.com/file/d/1045-0oCz7CPX1JBtpVYlk6jYEGQVtTve/preview"
        width="60" // Adjusted for better content fit
        height="50" // Adjusted for better content fit
        allow="autoplay"
        title="Llamas DeFi Hub Logo"
        style={{ border: "none", display: "block", pointerEvents: "none" }} // Remove border, ensure block display, and disable interactions
      ></iframe>
    </div>
  )
}

// Developer Note:
// The original SVG logo and text have been replaced with an iframe as per the request.
// The iframe's content and behavior are determined by the external source.
// Dimensions have been adjusted to be more suitable for a navbar logo.
// pointer-events: none has been added to prevent interaction with the iframe content,
// effectively making it behave like a static image/logo.
