"use client"

import type React from "react"
import type { GasEstimate } from "../../services/blockchainService"

interface GasEstimateDisplayProps {
  gasEstimate: GasEstimate | null
  isLoading: boolean
  error?: string | null
  className?: string
}

export const GasEstimateDisplay: React.FC<GasEstimateDisplayProps> = ({
  gasEstimate,
  isLoading,
  error,
  className = "",
}) => {
  if (isLoading) {
    return (
      <div className={`bg-blue-900/30 border border-blue-700/50 rounded-md p-3 ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-400"></div>
          <p className="text-blue-300 text-sm">Estimating gas costs...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-yellow-900/30 border border-yellow-700/50 rounded-md p-3 ${className}`}>
        <p className="text-yellow-300 text-sm">
          <span className="font-semibold">Gas estimation unavailable:</span> {error}
        </p>
        <p className="text-yellow-400 text-xs mt-1">Transaction will proceed with wallet's gas estimation.</p>
      </div>
    )
  }

  if (!gasEstimate) {
    return null
  }

  return (
    <div className={`bg-gray-800/50 border border-gray-600/50 rounded-md p-3 ${className}`}>
      <h4 className="text-gray-200 text-sm font-semibold mb-2">Estimated Transaction Cost</h4>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-gray-400">Gas Limit:</span>
          <p className="text-gray-200 font-mono">{Number(gasEstimate.gasLimit).toLocaleString()}</p>
        </div>
        <div>
          <span className="text-gray-400">Gas Price:</span>
          <p className="text-gray-200 font-mono">{Number(gasEstimate.gasPrice).toFixed(2)} gwei</p>
        </div>
        <div className="col-span-2">
          <span className="text-gray-400">Total Cost:</span>
          <p className="text-green-400 font-mono font-semibold">
            {Number(gasEstimate.gasCostInEth).toFixed(6)} S
            {gasEstimate.gasCostInUsd && (
              <span className="text-gray-400 ml-1">(~${Number(gasEstimate.gasCostInUsd).toFixed(2)})</span>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
