"use client"

import React from "react"
import ReactDOM from "react-dom/client"
import App from "./app/page"

// Error boundary component for better error handling
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error?: Error }> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Llamas Hub Error Boundary caught an error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-brand-bg gradient-bg flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-6xl mb-4">🦙</div>
            <h1 className="text-2xl font-orbitron font-bold text-brand-primary mb-4">Oops! Something went wrong</h1>
            <p className="text-brand-light-lime mb-6">
              The Llamas encountered an unexpected error. Please refresh the page to try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-brand-primary hover:bg-brand-primary-hover text-brand-bg font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Refresh Page
            </button>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-brand-secondary cursor-pointer">Error Details</summary>
                <pre className="mt-2 text-xs text-red-400 bg-brand-surface p-2 rounded overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Initialize the application
const initializeApp = () => {
  const rootElement = document.getElementById("root")

  if (!rootElement) {
    console.error("Could not find root element to mount Llamas Hub")

    // Show error in the error fallback div if it exists
    const errorFallback = document.getElementById("error-fallback")
    if (errorFallback) {
      errorFallback.classList.remove("hidden")
    }

    throw new Error("Could not find root element to mount to")
  }

  // Hide loading screen
  const loadingScreen = document.getElementById("loading-screen")
  if (loadingScreen) {
    loadingScreen.classList.add("hidden")
  }

  // Show root element
  rootElement.classList.remove("hidden")

  // Create React root and render app
  const root = ReactDOM.createRoot(rootElement)

  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>,
  )

  // Log successful initialization
  console.log("🦙 Llamas Hub initialized successfully on Sonic Mainnet!")
}

// Handle different loading scenarios
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp)
} else {
  // DOM is already loaded
  initializeApp()
}

// Global error handlers for better debugging
window.addEventListener("error", (event) => {
  console.error("🦙 Llamas Hub - Global Error:", {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
  })
})

window.addEventListener("unhandledrejection", (event) => {
  console.error("🦙 Llamas Hub - Unhandled Promise Rejection:", event.reason)
})

// Development helpers
if (process.env.NODE_ENV === "development") {
  console.log("🦙 Llamas Hub running in development mode")

  // Add some helpful debugging info
  ;(window as any).llamasHub = {
    version: "1.0.0",
    network: "Sonic Mainnet",
    debug: true,
  }
}
