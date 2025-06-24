"use client"

import type React from "react"
import type { AppView, NavItem } from "../../types"
import { NAV_ITEMS } from "../../constants"
import { Button } from "@/components/ui/button"
import { Wallet, Menu } from "lucide-react"

interface NavbarProps {
  currentView: AppView
  setCurrentView: (view: AppView) => void
  walletAddress: string | null
  onConnectWallet: () => void
  onDisconnectWallet: () => void
  isConnecting: boolean
  onToggleMobileMenu: () => void
}

const Logo = () => (
  <img src="/images/logo-main.jpg" alt="Llamas Hub Logo" className="w-10 h-10 rounded-md object-cover" />
)

const truncateAddress = (address: string) => {
  if (!address) return ""
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  walletAddress,
  onConnectWallet,
  onDisconnectWallet,
  isConnecting,
  onToggleMobileMenu,
}) => {
  return (
    <header className="bg-green-900 shadow-lg sticky top-0 z-40 border-b border-green-700">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Logo />
            <div className="ml-3">
              <h1 className="text-xl font-bold font-mono text-gray-100 leading-tight">Llamas Hub</h1>
              <p className="text-xs text-blue-400 -mt-0.5">All In One Crypto Hub</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center space-x-2">
            {NAV_ITEMS.map((item: NavItem) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150
                  ${
                    currentView === item.id
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-gray-300 hover:bg-green-700 hover:text-white"
                  }`}
                aria-current={currentView === item.id ? "page" : undefined}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className="hidden md:block">
            {walletAddress ? (
              <div className="flex items-center space-x-2">
                <span
                  className="px-3 py-1.5 text-xs bg-green-700 text-blue-400 rounded-md font-mono"
                  title={walletAddress}
                >
                  {truncateAddress(walletAddress)}
                </span>
                <Button variant="outline" size="sm" onClick={onDisconnectWallet}>
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={onConnectWallet}
                disabled={isConnecting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isConnecting ? (
                  "Connecting..."
                ) : (
                  <>
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect Wallet
                  </>
                )}
              </Button>
            )}
          </div>
          <div className="md:hidden">
            <button
              onClick={onToggleMobileMenu}
              className="text-gray-300 hover:text-white focus:outline-none p-2 rounded-md hover:bg-green-700"
              aria-label="Open navigation menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
