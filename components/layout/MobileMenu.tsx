"use client"

import type React from "react"
import { X, Wallet, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { AppView, NavItem } from "../../types"
import { formatAddress } from "../../services/blockchainService"

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  navItems: NavItem[]
  currentView: AppView
  setCurrentView: (view: AppView) => void
  walletAddress: string | null
  onConnectWallet: () => void
  onDisconnectWallet: () => void
  isConnecting: boolean
}

export const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  navItems,
  currentView,
  setCurrentView,
  walletAddress,
  onConnectWallet,
  onDisconnectWallet,
  isConnecting,
}) => {
  if (!isOpen) return null

  const handleNavClick = (view: AppView) => {
    setCurrentView(view)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-64 bg-gray-800 shadow-lg">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Menu</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        <div className="p-4 space-y-2">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant={currentView === item.id ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => handleNavClick(item.id)}
            >
              {item.label}
            </Button>
          ))}
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          {walletAddress ? (
            <div className="space-y-2">
              <div className="text-sm text-gray-300 text-center">{formatAddress(walletAddress)}</div>
              <Button
                variant="outline"
                className="w-full text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
                onClick={onDisconnectWallet}
              >
                <LogOut size={16} className="mr-2" />
                Disconnect
              </Button>
            </div>
          ) : (
            <Button onClick={onConnectWallet} disabled={isConnecting} className="w-full bg-blue-600 hover:bg-blue-700">
              <Wallet size={16} className="mr-2" />
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
