import type React from "react"
import type { ButtonProps } from "../../types"

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  className = "",
  leftIcon,
  rightIcon,
  ...props
}) => {
  const baseStyle =
    "inline-flex items-center justify-center font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-bg transition-colors duration-150 ease-in-out"

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  }

  const variantStyles = {
    primary: "bg-brand-primary text-white hover:bg-brand-primary-hover focus:ring-brand-primary",
    secondary: "bg-brand-secondary text-white hover:bg-gray-600 focus:ring-brand-secondary",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    outline:
      "bg-transparent border border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white focus:ring-brand-primary",
  }

  const loadingStyle = isLoading ? "opacity-75 cursor-not-allowed" : ""
  const disabledStyle = disabled ? "opacity-50 cursor-not-allowed" : ""

  return (
    <button
      type="button"
      className={`${baseStyle} ${sizeStyles[size]} ${variantStyles[variant]} ${loadingStyle} ${disabledStyle} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {leftIcon && !isLoading && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && !isLoading && <span className="ml-2">{rightIcon}</span>}
    </button>
  )
}
