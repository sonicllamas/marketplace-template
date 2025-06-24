"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Card } from "../common/Card"
import { Button } from "../common/Button"
import { Input, Select } from "../common/Input"
import type { Token, SwapTokensViewProps } from "../../types"
import {
  AVAILABLE_TOKENS,
  DEFAULT_SLIPPAGE_TOLERANCE,
  DEFAULT_TRANSACTION_DEADLINE_MINUTES,
  SWAP_ROUTER_ADDRESS, // Changed from UNIVERSAL_ROUTER_ADDRESS
} from "../../constants"
import { Modal } from "../common/Modal"
import {
  approveTokenSpend,
  fetchTokenAllowance,
  fetchTokenDetailsFromAddress,
  getSwapQuoteV2,
  swapTokensEnhanced,
  estimateUniversalRouterSwapGas,
} from "../../services/blockchainService"
import { ethers } from "ethers"

const ArrowDownIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
  </svg>
)

const CogIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93s.844.273 1.25.273h.844c.72 0 1.316.36 1.697.948.382.587.312 1.365-.194 1.872l-.495.503c-.264.267-.422.633-.422 1.013v.844c0 .542-.398 1.02-.94 1.11l-.894.149c-.424.07-.764.384-.93.78s-.273.844-.273 1.25v.844c0 .72.36 1.316.948 1.697.587.382 1.365.312 1.872-.194l.503-.495c-.267-.264.633-.422 1.013-.422h.844c.542 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93s.844.273 1.25.273h.844c.72 0 1.316.36 1.697.948.382.587.312 1.365-.194 1.872l-.495.503c-.264.267-.422.633-.422 1.013v.844c0 .542-.398 1.02-.94 1.11l-.894.149c-.424.07-.764.384-.93.78s-.273.844-.273 1.25v.844c0 .72.36 1.316.948 1.697.587.382 1.365.312 1.872-.194l-.503.495c-.267-.264.633-.422 1.013-.422h-.844a1.125 1.125 0 0 1-1.11-.94l-.149-.894c-.07-.424-.384-.764-.78-.93s-.844-.273-1.25-.273h-.844a1.125 1.125 0 0 1-1.11-.94l-.149-.894c-.07-.424-.384-.764-.78-.93s-.844-.273-1.25-.273h-.844c-.72 0-1.316-.36-1.697-.948-.382-.587-.312-1.365.194-1.872l.495-.503c.264.267.422.633.422-1.013v-.844c0-.542.398-1.02.94-1.11l.894-.149c.424-.07.764-.384.93-.78s.273-.844.273-1.25v-.844c0-.72-.36-1.316-.948-1.697-.587-.382-1.365-.312-1.872-.194l-.503.495c.267.264.633.422 1.013.422h.844c.542 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93s.844.273 1.25.273h.844c.72 0 1.316.36 1.697.948.382.587.312 1.365-.194-1.872l-.495.503c-.264.267-.422-.633-.422-1.013ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z"
    />
  </svg>
)

interface ImportTokenModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (address: string) => Promise<Token | null>
  importLoading: boolean
  importError: string | null
}

const ImportTokenModal: React.FC<ImportTokenModalProps> = ({
  isOpen,
  onClose,
  onImport,
  importLoading,
  importError,
}) => {
  const [address, setAddress] = useState("")

  const handleSubmit = async () => {
    const importedToken = await onImport(address)
    if (importedToken) {
      setAddress("")
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Token">
      <div className="space-y-4">
        <Input
          label="Token Contract Address"
          id="importTokenAddress"
          placeholder="0x..."
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          disabled={importLoading}
        />
        <div className="bg-yellow-900/30 border border-yellow-700/50 text-yellow-300 text-xs p-3 rounded-md">
          <p className="font-semibold">Warning:</p>
          <p>Ensure you trust this token and have verified the contract address. Anyone can create a token.</p>
        </div>
        {importError && <p className="text-sm text-red-400 text-center">{importError}</p>}
        <Button
          onClick={handleSubmit}
          isLoading={importLoading}
          className="w-full"
          disabled={!address.trim() || importLoading || !ethers.isAddress(address.trim())}
        >
          {importLoading ? "Importing..." : "Import"}
        </Button>
      </div>
    </Modal>
  )
}

export const SwapTokensView: React.FC<SwapTokensViewProps> = ({
  walletAddress,
  userBalances,
  provider,
  signer,
  onConnectWallet,
}) => {
  const [displayTokens, setDisplayTokens] = useState<Token[]>(AVAILABLE_TOKENS)

  const [fromToken, setFromToken] = useState<Token | undefined>(() =>
    displayTokens.length > 0 ? displayTokens[0] : undefined,
  )
  const [toToken, setToToken] = useState<Token | undefined>(() =>
    displayTokens.length > 1
      ? displayTokens[1]
      : displayTokens.length > 0 && displayTokens[0] !== fromToken
        ? displayTokens[0]
        : undefined,
  )

  const [fromAmount, setFromAmount] = useState<string>("")
  const [toAmount, setToAmount] = useState<string>("")
  const [slippage, setSlippage] = useState<number>(DEFAULT_SLIPPAGE_TOLERANCE)
  const [deadlineMinutes, setDeadlineMinutes] = useState<number>(DEFAULT_TRANSACTION_DEADLINE_MINUTES)
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false)

  const [isGettingQuote, setIsGettingQuote] = useState<boolean>(false)
  const [isApproving, setIsApproving] = useState<boolean>(false)
  const [isSwapping, setIsSwapping] = useState<boolean>(false)
  const [needsApproval, setNeedsApproval] = useState<boolean>(false)
  const [txMessage, setTxMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false)
  const [importLoading, setImportLoading] = useState<boolean>(false)
  const [importError, setImportError] = useState<string | null>(null)

  // Add new state for gas estimation
  const [gasEstimate, setGasEstimate] = useState<string | null>(null)
  const [isEstimatingGas, setIsEstimatingGas] = useState<boolean>(false)

  const tokenOptions = useMemo(
    () => displayTokens.map((t) => ({ value: t.id, label: `${t.name} (${t.symbol})`, iconUrl: t.iconUrl })),
    [displayTokens],
  )

  const fromTokenBalance = useMemo(() => {
    if (!walletAddress || !fromToken) return "0"
    return userBalances[fromToken.id] || "0"
  }, [walletAddress, fromToken, userBalances])

  const toTokenBalance = useMemo(() => {
    if (!walletAddress || !toToken) return "0"
    return userBalances[toToken.id] || "0"
  }, [walletAddress, toToken, userBalances])

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (fromToken && toToken && fromAmount && Number.parseFloat(fromAmount) > 0 && provider) {
        setIsGettingQuote(true)
        setError(null)
        try {
          const quote = await getSwapQuoteV2(fromToken.address, toToken.address, fromAmount, 3000, provider)
          setToAmount(quote.amountOut)
          setError(null)
        } catch (e: any) {
          console.error("Error getting quote:", e)
          if (e.message?.includes("No trading pair available")) {
            setError(
              `No trading pair exists for ${fromToken.symbol}/${toToken.symbol}. This pair may not be supported yet.`,
            )
          } else if (e.message?.includes("No liquidity pool")) {
            setError(
              `Insufficient liquidity for ${fromToken.symbol}/${toToken.symbol} pair. Try a smaller amount or different tokens.`,
            )
          } else if (e.message?.includes("Router contract not found")) {
            setError("DEX router not available. Please check your network connection.")
          } else {
            setError(`Unable to get price quote: ${e.message || "Unknown error"}`)
          }
          setToAmount("")
        } finally {
          setIsGettingQuote(false)
        }
      } else {
        setToAmount("")
        setError(null)
      }
    }, 500)
    return () => clearTimeout(handler)
  }, [fromAmount, fromToken, toToken, provider])

  useEffect(() => {
    const checkAllowance = async () => {
      if (walletAddress && fromToken && fromAmount && Number.parseFloat(fromAmount) > 0 && provider) {
        try {
          if (fromToken.address === "native_currency_placeholder" || fromToken.symbol === "S") {
            setNeedsApproval(false)
            return
          }

          const allowanceStr = await fetchTokenAllowance(
            fromToken.address,
            walletAddress,
            SWAP_ROUTER_ADDRESS, // Changed from UNIVERSAL_ROUTER_ADDRESS
            provider,
          )
          const allowance = ethers.parseUnits(allowanceStr, fromToken.decimals)
          const required = ethers.parseUnits(fromAmount, fromToken.decimals)
          setNeedsApproval(allowance < required)
        } catch (e) {
          console.error("Error checking allowance:", e)
          setNeedsApproval(true)
        }
      } else {
        setNeedsApproval(false)
      }
    }
    checkAllowance()
  }, [walletAddress, fromToken, fromAmount, provider])

  // Add gas estimation effect
  useEffect(() => {
    const estimateSwapGas = async () => {
      if (
        fromToken &&
        toToken &&
        fromAmount &&
        toAmount &&
        Number.parseFloat(fromAmount) > 0 &&
        Number.parseFloat(toAmount) > 0 &&
        provider &&
        walletAddress
      ) {
        setIsEstimatingGas(true)
        try {
          const estimate = await estimateUniversalRouterSwapGas(
            fromToken,
            toToken,
            fromAmount,
            toAmount,
            walletAddress,
            provider,
          )
          setGasEstimate(estimate.gasCostInEth)
        } catch (error: any) {
          console.warn("Gas estimation failed:", error.message)
          // Don't show gas estimate if it fails
          setGasEstimate(null)
        } finally {
          setIsEstimatingGas(false)
        }
      } else {
        setGasEstimate(null)
      }
    }

    const handler = setTimeout(estimateSwapGas, 1000) // Delay to avoid too many calls
    return () => clearTimeout(handler)
  }, [fromToken, toToken, fromAmount, toAmount, provider, walletAddress])

  const handleApprove = async () => {
    if (!walletAddress || !signer || !fromToken || !fromAmount || Number.parseFloat(fromAmount) <= 0) {
      setError("Cannot approve. Check inputs or wallet connection.")
      return
    }

    if (fromToken.address === "native_currency_placeholder" || fromToken.symbol === "S") {
      setError("Native token does not require approval.")
      return
    }

    setIsApproving(true)
    setTxMessage("Approving token spend...")
    setError(null)
    try {
      const txHash = await approveTokenSpend(
        fromToken.address,
        SWAP_ROUTER_ADDRESS, // Changed from UNIVERSAL_ROUTER_ADDRESS
        fromAmount,
        walletAddress,
        signer,
      )
      setTxMessage(`Approval successful! Tx: ${txHash.slice(0, 10)}...`)
      setNeedsApproval(false)
    } catch (e: any) {
      setError(e.message || "Approval failed.")
      setTxMessage(null)
    } finally {
      setIsApproving(false)
    }
  }

  const handleSwap = async () => {
    if (
      !walletAddress ||
      !signer ||
      !fromToken ||
      !toToken ||
      !fromAmount ||
      !toAmount ||
      Number.parseFloat(fromAmount) <= 0
    ) {
      setError("Please select tokens, enter a valid amount, and ensure wallet is connected.")
      return
    }
    if (needsApproval) {
      setError("Token approval required before swapping.")
      return
    }

    setIsSwapping(true)
    setTxMessage("Processing swap...")
    setError(null)
    try {
      const amountOutBN = ethers.parseUnits(toAmount, toToken.decimals)
      const slippageTolerance = BigInt(Math.round(slippage * 100))
      const amountOutMinBN = amountOutBN - (amountOutBN * slippageTolerance) / 10000n
      const amountOutMinStr = ethers.formatUnits(amountOutMinBN, toToken.decimals)

      const txHash = await swapTokensEnhanced(
        fromToken.address,
        toToken.address,
        fromAmount,
        amountOutMinStr,
        walletAddress,
        "v3",
        signer,
        provider,
      )

      setTxMessage(`Swap successful! Tx: ${txHash.slice(0, 10)}...`)
      setFromAmount("")
      setToAmount("")
    } catch (e: any) {
      setError(e.message || "Swap transaction failed.")
      setTxMessage(null)
    } finally {
      setIsSwapping(false)
    }
  }

  const handleFromTokenChange = (tokenId: string) => {
    const selected = displayTokens.find((t) => t.id === tokenId)
    if (selected?.id === toToken?.id) {
      const newToToken =
        displayTokens.find((t) => t.id !== tokenId && t.id !== fromToken?.id) ||
        displayTokens.find((t) => t.id !== tokenId)
      setToToken(newToToken)
    }
    setFromToken(selected)
  }

  const handleToTokenChange = (tokenId: string) => {
    const selected = displayTokens.find((t) => t.id === tokenId)
    if (selected?.id === fromToken?.id) {
      const newFromToken =
        displayTokens.find((t) => t.id !== tokenId && t.id !== toToken?.id) ||
        displayTokens.find((t) => t.id !== tokenId)
      setFromToken(newFromToken)
    }
    setToToken(selected)
  }

  const handleAttemptImportToken = async (address: string): Promise<Token | null> => {
    if (!provider) {
      setImportError("Wallet not connected or provider not available.")
      return null
    }
    setImportLoading(true)
    setImportError(null)

    const cleanAddress = address.trim().toLowerCase()
    if (!ethers.isAddress(cleanAddress)) {
      setImportError("Invalid contract address format.")
      setImportLoading(false)
      return null
    }
    if (displayTokens.some((token) => token.address.toLowerCase() === cleanAddress)) {
      setImportError("Token already exists in the list.")
      setImportLoading(false)
      return null
    }

    try {
      const newToken = await fetchTokenDetailsFromAddress(cleanAddress, provider)
      if (newToken) {
        setDisplayTokens((prevTokens) => [...prevTokens, newToken])
        setImportLoading(false)
        setIsImportModalOpen(false)
        return newToken
      } else {
        throw new Error("Could not fetch token details.")
      }
    } catch (e: any) {
      console.error("Error importing token:", e)
      setImportError(e.message || "Failed to import token. Ensure it's a valid ERC20 on the connected network.")
      setImportLoading(false)
      return null
    }
  }

  const rate = useMemo(() => {
    if (
      fromToken &&
      toToken &&
      fromAmount &&
      Number.parseFloat(fromAmount) > 0 &&
      toAmount &&
      Number.parseFloat(toAmount) > 0
    ) {
      try {
        return (Number.parseFloat(toAmount) / Number.parseFloat(fromAmount)).toFixed(Math.min(6, toToken.decimals))
      } catch {
        return "N/A"
      }
    }
    return "N/A"
  }, [fromToken, toToken, fromAmount, toAmount])

  if (!walletAddress) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <h1 className="text-3xl font-bold text-white">Token Swap</h1>
        <p className="text-gray-400 text-center max-w-md">
          Connect your wallet to start swapping tokens on Sonic Network.
        </p>
        <Button onClick={onConnectWallet} size="lg" className="bg-blue-600 hover:bg-blue-700">
          Connect Wallet
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto">
      <Card title="Swap Tokens" className="relative">
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="absolute top-4 right-4 text-gray-400 hover:text-brand-light-lime transition-colors"
          title="Swap Settings"
        >
          <CogIcon className="w-6 h-6" />
        </button>

        {/* DEX Status Banner */}
        <div className="mb-6 p-4 bg-green-900/30 border border-green-700/50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <h3 className="text-green-300 font-semibold text-sm">✅ Real Swaps Active</h3>
          </div>
          <p className="text-green-200 text-xs leading-relaxed">
            Swap functionality is now live on Sonic Network. All swaps use real liquidity pools and execute actual
            transactions on-chain. Please ensure you have sufficient balance and gas fees before proceeding.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <Select
              label="From"
              id="fromToken"
              options={tokenOptions}
              value={fromToken?.id || ""}
              onChange={(e) => handleFromTokenChange(e.target.value)}
            />
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="text-xs text-brand-light-lime hover:text-brand-secondary underline mt-1 float-right"
            >
              Import Token
            </button>
            <Input
              type="number"
              id="fromAmount"
              placeholder="0.0"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              className="mt-2"
              unit={fromToken?.symbol || ""}
              disabled={!fromToken}
            />
            {walletAddress && fromToken && (
              <p className="text-xs text-gray-400 mt-1">
                Balance: {Number.parseFloat(fromTokenBalance).toFixed(4)} {fromToken.symbol}
              </p>
            )}
          </div>

          <div className="flex justify-center my-2">
            <button
              onClick={() => {
                const tempToken = fromToken
                setFromToken(toToken)
                setToToken(tempToken)
                const tempAmount = fromAmount
                setFromAmount(toAmount)
                setToAmount(tempAmount)
              }}
              className="p-2 rounded-full bg-gray-700 hover:bg-brand-primary text-gray-300 hover:text-white transition-colors"
              aria-label="Swap from and to tokens"
              disabled={!fromToken || !toToken}
            >
              <ArrowDownIcon className="w-5 h-5 transform rotate-90" />
            </button>
          </div>

          <div>
            <Select
              label="To (Estimated)"
              id="toToken"
              options={tokenOptions}
              value={toToken?.id || ""}
              onChange={(e) => handleToTokenChange(e.target.value)}
            />
            <Input
              type="number"
              id="toAmount"
              placeholder="0.0"
              value={isGettingQuote ? "Fetching..." : toAmount}
              readOnly
              className="mt-2 bg-gray-800 cursor-not-allowed"
              unit={toToken?.symbol || ""}
              disabled={!toToken}
            />
            {walletAddress && toToken && (
              <p className="text-xs text-gray-400 mt-1">
                Balance: {Number.parseFloat(toTokenBalance).toFixed(4)} {toToken.symbol}
              </p>
            )}
          </div>

          {txMessage && (
            <p
              className={`text-sm text-center ${
                txMessage.includes("failed") || txMessage.includes("Error") ? "text-red-400" : "text-brand-light-lime"
              }`}
            >
              {txMessage}
            </p>
          )}
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <div className="space-y-2">
            {needsApproval ? (
              <Button
                onClick={handleApprove}
                isLoading={isApproving}
                className="w-full"
                size="lg"
                disabled={!fromToken || !fromAmount || Number.parseFloat(fromAmount) <= 0}
              >
                {isApproving ? "Approving..." : `Approve ${fromToken?.symbol || "Token"}`}
              </Button>
            ) : (
              <Button
                onClick={handleSwap}
                isLoading={isSwapping}
                className="w-full"
                size="lg"
                disabled={
                  !fromToken ||
                  !toToken ||
                  !fromAmount ||
                  !toAmount ||
                  Number.parseFloat(fromAmount) <= 0 ||
                  isGettingQuote
                }
              >
                {isSwapping ? "Swapping..." : "Swap Tokens"}
              </Button>
            )}
          </div>

          <div className="text-xs text-gray-400 space-y-1">
            {rate !== "N/A" && fromToken && toToken && (
              <div className="flex justify-between">
                <span>Exchange Rate:</span>
                <span>
                  1 {fromToken.symbol} ≈ {rate} {toToken.symbol}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Slippage Tolerance:</span>
              <span className="text-brand-light-lime">{slippage}%</span>
            </div>
            {gasEstimate && (
              <div className="flex justify-between">
                <span>Estimated Gas:</span>
                <span className="text-blue-400">{isEstimatingGas ? "Calculating..." : `~${gasEstimate} S`}</span>
              </div>
            )}
          </div>
        </div>
      </Card>
      {isSettingsOpen && (
        <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Swap Settings">
          <div className="space-y-4">
            <div>
              <Input
                label="Slippage Tolerance (%)"
                type="number"
                value={slippage}
                onChange={(e) => setSlippage(Number.parseFloat(e.target.value))}
                step="0.1"
                min="0.1"
                max="50"
              />
            </div>
            <div>
              <Input
                label="Transaction Deadline (minutes)"
                type="number"
                value={deadlineMinutes}
                onChange={(e) => setDeadlineMinutes(Number.parseInt(e.target.value))}
                step="1"
                min="1"
              />
            </div>
            <Button onClick={() => setIsSettingsOpen(false)} className="w-full">
              Save Settings
            </Button>
          </div>
        </Modal>
      )}
      <ImportTokenModal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false)
          setImportError(null)
        }}
        onImport={handleAttemptImportToken}
        importLoading={importLoading}
        importError={importError}
      />
    </div>
  )
}
