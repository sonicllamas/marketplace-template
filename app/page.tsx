"use client"

import type React from "react"
import { useState, useCallback, useEffect } from "react"
import { ethers } from "ethers"
import { Navbar } from "../components/layout/Navbar"
import { DashboardView } from "../components/features/DashboardView"
import { SwapTokensView } from "../components/features/SwapTokensView"
import { FundManagementView } from "../components/features/FundManagementView"
import { NftStakingView } from "../components/features/NftStakingView"
import { LiquidityPoolsView } from "../components/features/LiquidityPoolsView"
import { LlamasNftsHubView } from "../components/features/LlamasNftsHubView"
import { MobileMenu } from "../components/layout/MobileMenu"
import { ToastProvider, useToast } from "../components/common/ToastProvider"
import { AppView, type EthersProvider, type EthersSigner } from "../types"
import { NAV_ITEMS, AVAILABLE_TOKENS, SONIC_MAINNET_INFO } from "../constants"
import {
  connectWallet as connectWalletService,
  fetchUserBalances as fetchUserBalancesService,
  ethereum,
} from "../services/blockchainService"

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const [provider, setProvider] = useState<EthersProvider | null>(null)
  const [signer, setSigner] = useState<EthersSigner | null>(null)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [userBalances, setUserBalances] = useState<Record<string, string>>({})
  const [isConnectingWallet, setIsConnectingWallet] = useState<boolean>(false)
  const [initialLoad, setInitialLoad] = useState<boolean>(true)
  const [chainError, setChainError] = useState<string | null>(null)

  const { addToast } = useToast()

  const changeView = useCallback((view: AppView) => {
    setCurrentView(view)
    setIsMobileMenuOpen(false)
  }, [])

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev)
  }, [])

  const setupProviderAndSigner = async () => {
    if (ethereum) {
      const web3Provider = new ethers.BrowserProvider(ethereum as any)
      setProvider(web3Provider)
      try {
        const currentSigner = await web3Provider.getSigner()
        setSigner(currentSigner)
        const address = await currentSigner.getAddress()
        setWalletAddress(address)
        return { provider: web3Provider, signer: currentSigner, address }
      } catch (e: any) {
        if (e.code === "ACTION_REJECTED") {
          addToast("Wallet connection rejected by user.", "error")
        } else {
          addToast("Error initializing wallet. Ensure it's unlocked and configured.", "error")
        }
        console.warn("Error getting address from signer or signer itself:", e)
        handleDisconnectWallet()
        return null
      }
    }
    return null
  }

  const handleConnectWallet = useCallback(async () => {
    setIsConnectingWallet(true)
    setChainError(null)
    try {
      const connectedAddress = await connectWalletService()
      if (connectedAddress) {
        const state = await setupProviderAndSigner()
        if (state) {
          const balances = await fetchUserBalancesService(state.address, AVAILABLE_TOKENS, state.provider)
          setUserBalances(balances)
          addToast("Wallet connected successfully!", "success")
        }
      } else {
        addToast("Wallet connection cancelled or failed.", "warning")
        handleDisconnectWallet()
      }
    } catch (error: any) {
      console.error("Error connecting wallet:", error)
      const errorMessage =
        error.message && error.message.includes("User rejected")
          ? "Wallet connection rejected by user."
          : error.message || "An unknown error occurred during connection."
      setChainError(errorMessage)
      addToast(errorMessage, "error")
      handleDisconnectWallet()
    } finally {
      setIsConnectingWallet(false)
      setInitialLoad(false)
    }
  }, [addToast])

  const handleDisconnectWallet = useCallback(() => {
    setProvider(null)
    setSigner(null)
    setWalletAddress(null)
    setUserBalances({})
    setChainError(null)
    addToast("Wallet disconnected.", "info")
  }, [addToast])

  useEffect(() => {
    const checkExistingConnection = async () => {
      if (ethereum && ((await (ethereum as any).request({ method: "eth_accounts" })) as string[]).length > 0) {
        setIsConnectingWallet(true)
        const state = await setupProviderAndSigner()
        if (state?.address) {
          const balances = await fetchUserBalancesService(state.address, AVAILABLE_TOKENS, state.provider)
          setUserBalances(balances)
          const network = await state.provider.getNetwork()
          if (Number(network.chainId) !== Number(SONIC_MAINNET_INFO.chainId)) {
            const networkErrorMsg = `Incorrect network. Please switch to ${SONIC_MAINNET_INFO.name}.`
            setChainError(networkErrorMsg)
            addToast(networkErrorMsg, "error")
          } else {
            setChainError(null)
          }
        }
        setIsConnectingWallet(false)
      }
      setInitialLoad(false)
    }
    checkExistingConnection()
  }, [addToast])

  useEffect(() => {
    if (ethereum && (ethereum as any).on) {
      const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length === 0) {
          addToast("Wallet disconnected or locked.", "info")
          handleDisconnectWallet()
        } else if (accounts[0] !== walletAddress) {
          addToast("Wallet account changed.", "info")
          const state = await setupProviderAndSigner()
          if (state?.address) {
            const balances = await fetchUserBalancesService(state.address, AVAILABLE_TOKENS, state.provider)
            setUserBalances(balances)
          }
        }
      }

      const handleChainChanged = (chainIdHex: string) => {
        const newChainId = Number(chainIdHex)
        if (newChainId !== Number(SONIC_MAINNET_INFO.chainId)) {
          const networkErrorMsg = `Switched to incorrect network. Please switch to ${SONIC_MAINNET_INFO.name}.`
          setChainError(networkErrorMsg)
          addToast(networkErrorMsg, "error")
        } else {
          setChainError(null)
          addToast(`Switched to ${SONIC_MAINNET_INFO.name}.`, "success")
          handleConnectWallet()
        }
      }
      ;(ethereum as any).on("accountsChanged", handleAccountsChanged)
      ;(ethereum as any).on("chainChanged", handleChainChanged)

      return () => {
        if ((ethereum as any).removeListener) {
          ;(ethereum as any).removeListener("accountsChanged", handleAccountsChanged)
          ;(ethereum as any).removeListener("chainChanged", handleChainChanged)
        }
      }
    }
  }, [walletAddress, handleDisconnectWallet, handleConnectWallet, addToast])

  const renderView = useCallback((): React.ReactNode => {
    const commonProps = {
      walletAddress,
      userBalances,
      provider,
      signer,
      onConnectWallet: handleConnectWallet,
    }

    switch (currentView) {
      case AppView.DASHBOARD:
        return <DashboardView {...commonProps} changeView={changeView} />
      case AppView.SWAP:
        return <SwapTokensView {...commonProps} />
      case AppView.FUNDS:
        return <FundManagementView {...commonProps} />
      case AppView.LLAMAS_NFTS_HUB:
        return <LlamasNftsHubView {...commonProps} />
      case AppView.NFT_STAKING:
        return <NftStakingView {...commonProps} />
      case AppView.LIQUIDITY_POOLS:
        return <LiquidityPoolsView {...commonProps} />
      default:
        return <DashboardView {...commonProps} changeView={changeView} />
    }
  }, [currentView, walletAddress, userBalances, provider, signer, handleConnectWallet, changeView])

  if (initialLoad && isConnectingWallet) {
    return (
      <div className="fixed inset-0 bg-brand-bg gradient-bg flex flex-col items-center justify-center z-[1000]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-primary mb-6"></div>
        <p className="text-xl text-brand-light-lime font-orbitron">Initializing Llamas Hub...</p>
        <p className="text-sm text-gray-400">Please wait while we connect to your wallet.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-bg gradient-bg text-gray-200 flex flex-col">
      <Navbar
        currentView={currentView}
        setCurrentView={changeView}
        walletAddress={walletAddress}
        onConnectWallet={handleConnectWallet}
        onDisconnectWallet={handleDisconnectWallet}
        isConnecting={isConnectingWallet && !initialLoad}
        onToggleMobileMenu={toggleMobileMenu}
      />
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={toggleMobileMenu}
        navItems={NAV_ITEMS}
        currentView={currentView}
        setCurrentView={changeView}
        walletAddress={walletAddress}
        onConnectWallet={handleConnectWallet}
        onDisconnectWallet={handleDisconnectWallet}
        isConnecting={isConnectingWallet}
      />
      <main className="flex-grow container mx-auto px-4 py-8">
        {chainError && (
          <div className="mb-4 p-3 bg-red-800/50 border border-red-700 text-red-300 rounded-md text-center text-sm">
            {chainError}
          </div>
        )}
        {renderView()}
      </main>
      <footer className="py-4 bg-brand-surface text-center text-sm text-gray-400 border-t border-brand-surface-alt">
        © {new Date().getFullYear()} Llamas Hub. All rights reserved. ({SONIC_MAINNET_INFO.name})
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  )
}
