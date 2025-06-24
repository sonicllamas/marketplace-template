"use client"

import type React from "react"
import type { InputProps, RegularInputPropsType, TextAreaInputPropsType, SelectComponentProps } from "../../types"

export const Input: React.FC<InputProps> = (allProps) => {
  // Destructure common props from BaseInputProps
  const { label, id, error, className, value, onChange } = allProps

  if (allProps.type === "textarea") {
    // Props specific to TextAreaInputPropsType
    const { rows = 3, ...textAreaSpecificProps } = allProps as TextAreaInputPropsType
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">
            {label}
          </label>
        )}
        <textarea
          id={id}
          className={`
            block w-full 
            bg-brand-surface border-gray-600 
            text-gray-100 placeholder-gray-500 
            focus:ring-brand-primary focus:border-brand-primary 
            rounded-md py-2 px-3
            ${error ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-700"}
            ${className || ""}
          `}
          value={value || ""} // Textarea value is always string
          onChange={onChange as (event: React.ChangeEvent<HTMLTextAreaElement>) => void} // Cast onChange for textarea
          rows={rows}
          {...textAreaSpecificProps} // Spread remaining textarea-specific HTML attributes
        />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    )
  }

  // Props specific to RegularInputPropsType (default case)
  const { icon, unit, type = "text", ...inputSpecificProps } = allProps as RegularInputPropsType
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">
          {label}
        </label>
      )}
      <div className="relative rounded-md shadow-sm">
        {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{icon}</div>}
        <input
          id={id}
          type={type} // Defaulted to "text" if not provided
          className={`
            block w-full 
            bg-brand-surface border-gray-600 
            text-gray-100 placeholder-gray-500 
            focus:ring-brand-primary focus:border-brand-primary 
            rounded-md py-2 px-3
            ${icon ? "pl-10" : ""}
            ${unit ? "pr-12 sm:pr-16" : ""} 
            ${error ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-700"}
            ${className || ""}
          `}
          value={value || ""} // Input value can be string or number, default to empty string if undefined
          onChange={onChange as (event: React.ChangeEvent<HTMLInputElement>) => void} // Cast onChange for input
          {...inputSpecificProps} // Spread remaining input-specific HTML attributes
        />
        {unit && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-400 sm:text-sm">{unit}</span>
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

export const Select: React.FC<SelectComponentProps> = ({
  label,
  id,
  error,
  options = [], // Add default empty array
  className,
  children, // Add children prop for custom options
  ...restSelectProps
}) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`
          block w-full 
          bg-brand-surface border-gray-600 
          text-gray-100 placeholder-gray-500 
          focus:ring-brand-primary focus:border-brand-primary 
          rounded-md py-2 px-3 appearance-none
          ${error ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-700"}
          ${className || ""}
        `}
        {...restSelectProps}
      >
        {children ||
          (options && options.length > 0
            ? options.map((option) => (
                <option key={option.value} value={option.value} className="bg-brand-surface text-gray-100">
                  {option.label}
                </option>
              ))
            : null)}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
