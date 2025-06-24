"use client"

import type React from "react"

interface CardProps {
  children: React.ReactNode
  className?: string
  title?: string
  titleClassName?: string
  onClick?: () => void
  role?: string
  tabIndex?: number
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  title,
  titleClassName = "",
  onClick,
  role,
  tabIndex,
  onKeyDown,
}) => {
  const cardClasses = `bg-brand-surface shadow-xl rounded-xl p-4 md:p-6 ${onClick ? "cursor-pointer hover:shadow-2xl transition-shadow duration-300" : ""} ${className}`

  return (
    <div className={cardClasses} onClick={onClick} role={role} tabIndex={tabIndex} onKeyDown={onKeyDown}>
      {title && (
        <h3 className={`text-xl font-semibold mb-4 text-gray-100 border-b border-gray-700 pb-2 ${titleClassName}`}>
          {title}
        </h3>
      )}
      {children}
    </div>
  )
}
