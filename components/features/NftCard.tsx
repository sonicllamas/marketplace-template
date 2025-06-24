"use client"

import type React from "react"
import { Card } from "../common/Card"
import { Button } from "../common/Button"
import type { NftCardProps } from "../../types"

// Helper to truncate text (can be moved to utils if used elsewhere)
const truncateText = (text: string | undefined | null, maxLength: number): string => {
  if (!text) return "N/A"
  if (text.length <= maxLength) return text
  return `${text.substring(0, maxLength)}...`
}

export const NftCard: React.FC<NftCardProps> = ({
  nft,
  onClick,
  onBuy,
  onList, // Renamed from onSell
  onDelist, // New prop
  onSend,
  onBurn,
}) => {
  const displayImage = nft.image || "https://via.placeholder.com/300?text=No+Image"
  const displayName = nft.name || `Token #${nft.tokenId}`

  const handleCardClick = () => {
    if (onClick) {
      onClick(nft)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if ((event.key === "Enter" || event.key === " ") && onClick) {
      event.preventDefault()
      onClick(nft)
    }
  }

  return (
    <Card
      className="flex flex-col h-full overflow-hidden group transition-all duration-300 ease-in-out hover:shadow-brand-primary/50 hover:border-brand-primary border border-transparent"
      onClick={onClick ? handleCardClick : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
      aria-label={`View details for ${displayName}`}
    >
      <div className="aspect-square w-full overflow-hidden">
        <img
          src={displayImage || "/placeholder.svg"}
          alt={displayName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-in-out"
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = "https://via.placeholder.com/300?text=Image+Error"
          }}
        />
      </div>
      <div className="p-3 flex-grow flex flex-col justify-between">
        <div>
          <h4 className="text-sm font-semibold text-gray-100 truncate" title={displayName}>
            {truncateText(displayName, 25)}
          </h4>
          <p className="text-xs text-gray-400 mb-2" title={`Token ID: ${nft.tokenId}`}>
            ID: {truncateText(nft.tokenId, 15)}
          </p>
        </div>

        {(onBuy || onList || onDelist || onSend || onBurn) && (
          <div className="mt-2 space-y-1">
            <div className="grid grid-cols-2 gap-1">
              {onBuy && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    onBuy(nft)
                  }}
                  variant="primary"
                  size="sm"
                  className="w-full text-xs"
                >
                  Buy
                </Button>
              )}
              {onList && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    onList(nft)
                  }}
                  variant="secondary"
                  size="sm"
                  className="w-full text-xs"
                >
                  List
                </Button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-1">
              {onDelist && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelist(nft)
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs border-yellow-500 text-yellow-400 hover:bg-yellow-700 hover:text-white"
                >
                  Delist
                </Button>
              )}
              {onSend && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    onSend(nft)
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                >
                  Send
                </Button>
              )}
              {onBurn && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    onBurn(nft)
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs border-red-500 text-red-400 hover:bg-red-700 hover:text-white"
                >
                  Burn
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
