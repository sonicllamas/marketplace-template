"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Card } from "../common/Card"
import { Button } from "../common/Button"
import { Input, Select } from "../common/Input"
import { Modal } from "../common/Modal"
import type { LiquidityPool, Token, ViewProps } from "../../types"
import { AVAILABLE_TOKENS, SONIC_MAINNET_INFO } from "../../constants"
import {
  fetchLiquidityPools,
  addLiquidity,
  removeLiquidity,
  createLiquidityPool,
  approveTokenSpend,
  fetchTokenAllowance,
} from "../../services/blockchainService"

interface ClipboardIconProps extends React.SVGProps<SVGSVGElement> {}
const ClipboardIcon: React.FC<ClipboardIconProps> = (props) => (
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
      d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"
    />
  </svg>
)
interface CheckIconProps extends React.SVGProps<SVGSVGElement> {}
const CheckIcon: React.FC<CheckIconProps> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
)

const formatBigNumberForDisplay = (valueStr: string | undefined, decimals = 18, displayDecimals = 4): string => {
  if (!valueStr) return "0.0000"
  try {
    // Assuming valueStr is a BigNumber-like string (e.g., from ethers.formatUnits)
    // For simplicity, directly parse as float if it's already somewhat formatted, or use BigInt logic for wei
    const num = Number.parseFloat(valueStr) // This is a simplification. Real BigNumber parsing needed.
    return num.toFixed(displayDecimals)
  } catch (e) {
    return "0.0000"
  }
}

// Defined truncateAddress here
const truncateAddress = (address: string | undefined | null, startChars = 6, endChars = 4): string => {
  if (!address) return "N/A"
  if (address.length <= startChars + endChars + 2) return address // +2 for "..."
  return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`
}

interface PoolCardDisplayProps {
  pool: LiquidityPool
  onAddLiquidity: (pool: LiquidityPool) => void
  onRemoveLiquidity: (pool: LiquidityPool) => void
  walletAddress: string | null
  userBalances: Record<string, string>
}

const PoolCardDisplay: React.FC<PoolCardDisplayProps> = ({
  pool,
  onAddLiquidity,
  onRemoveLiquidity,
  walletAddress,
  userBalances,
}) => {
  const [copied, setCopied] = useState(false)

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address).then(
      () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      },
      (err) => {
        console.error("Failed to copy address: ", err)
        alert("Failed to copy address.")
      },
    )
  }

  const token1UserBalance = userBalances[pool.token1.id] || "0"
  const token2UserBalance = userBalances[pool.token2.id] || "0"

  return (
    <Card>
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-xl font-semibold text-gray-100">{pool.name}</h4>
        <div className="flex -space-x-2">
          <img
            src={pool.token1.iconUrl || `https://picsum.photos/seed/${pool.token1.symbol}/32/32`}
            alt={pool.token1.symbol}
            className="w-8 h-8 rounded-full border-2 border-gray-700 bg-gray-600"
          />
          <img
            src={pool.token2.iconUrl || `https://picsum.photos/seed/${pool.token2.symbol}/32/32`}
            alt={pool.token2.symbol}
            className="w-8 h-8 rounded-full border-2 border-gray-700 bg-gray-600"
          />
        </div>
      </div>
      <div className="space-y-2 text-sm text-gray-300">
        <p>
          APY (Mock): <span className="font-semibold text-green-400">{pool.apy?.toFixed(2) || "N/A"}%</span>
        </p>
        <p>
          Total Liquidity (Mock USD):{" "}
          <span className="font-semibold">${pool.totalLiquidityUSD?.toLocaleString() || "N/A"}</span>
        </p>
        <p>
          Reserves: {formatBigNumberForDisplay(pool.reserve1, pool.token1.decimals)} {pool.token1.symbol} /{" "}
          {formatBigNumberForDisplay(pool.reserve2, pool.token2.decimals)} {pool.token2.symbol}
        </p>

        {walletAddress && (
          <>
            <p>
              Your LP Tokens:{" "}
              <span className="font-semibold text-green-400">
                {formatBigNumberForDisplay(pool.userLpBalance, 18, 6)}
              </span>
            </p>
            <p>
              Your Share:{" "}
              <span className="font-semibold text-green-400">{pool.userSharePercentage?.toFixed(2) || "0.00"}%</span>
            </p>
            <p className="text-xs text-gray-400">
              Your {pool.token1.symbol} Balance: {formatBigNumberForDisplay(token1UserBalance, pool.token1.decimals)}
            </p>
            <p className="text-xs text-gray-400">
              Your {pool.token2.symbol} Balance: {formatBigNumberForDisplay(token2UserBalance, pool.token2.decimals)}
            </p>
          </>
        )}
        {pool.poolAddress && (
          <div className="mt-2 pt-2 border-t border-gray-700">
            <p className="text-xs text-gray-400">Pool Address:</p>
            <div className="flex items-center space-x-2">
              <a
                href={`${SONIC_MAINNET_INFO.explorerUrl}/address/${pool.poolAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:text-blue-400 hover:underline font-mono break-all"
                title={`View on ${SONIC_MAINNET_INFO.name} Explorer`}
              >
                {truncateAddress(pool.poolAddress)}
              </a>
              <button
                type="button"
                onClick={() => handleCopyAddress(pool.poolAddress!)}
                title="Copy address"
                className="text-gray-400 hover:text-green-400 p-1 rounded-md hover:bg-gray-700"
              >
                {copied ? <CheckIcon className="w-3 h-3 text-green-400" /> : <ClipboardIcon className="w-3 h-3" />}
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <Button
          onClick={() => onAddLiquidity(pool)}
          className="flex-1"
          variant="primary"
          size="sm"
          disabled={!walletAddress}
        >
          Add Liquidity
        </Button>
        {walletAddress && pool.userLpBalance && Number.parseFloat(pool.userLpBalance) > 0 && (
          <Button onClick={() => onRemoveLiquidity(pool)} className="flex-1" variant="outline" size="sm">
            Remove Liquidity
          </Button>
        )}
      </div>
    </Card>
  )
}

export const LiquidityPoolsView: React.FC<ViewProps> = ({
  walletAddress,
  userBalances,
  provider, // from props
  signer, // from props
  onConnectWallet,
}) => {
  const [pools, setPools] = useState<LiquidityPool[]>([])
  const [tokens] = useState<Token[]>(AVAILABLE_TOKENS) // For token selection UI
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [modalAction, setModalAction] = useState<"add" | "remove" | "create">("add")
  const [selectedPool, setSelectedPool] = useState<LiquidityPool | null>(null)

  const [token1Amount, setToken1Amount] = useState("")
  const [token2Amount, setToken2Amount] = useState("")
  const [lpAmountToRemove, setLpAmountToRemove] = useState("") // For removing liquidity

  // For creating a new pool
  const [newToken1Id, setNewToken1Id] = useState<string>(tokens[0]?.id || "")
  const [newToken2Id, setNewToken2Id] = useState<string>(tokens[1]?.id || "")

  const [isLoadingPools, setIsLoadingPools] = useState<boolean>(true)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [txMessage, setTxMessage] = useState<string | null>(null)

  // Approval states
  const [isToken1Approved, setIsToken1Approved] = useState(false)
  const [isToken2Approved, setIsToken2Approved] = useState(false)
  const [isCheckingApproval, setIsCheckingApproval] = useState(false)
  const [isApproving, setIsApproving] = useState<"token1" | "token2" | null>(null)

  const ROUTER_ADDRESS = "0x1234567890123456789012345678901234567890" // Mock router address

  const fetchAndSetPools = useCallback(async () => {
    setIsLoadingPools(true)
    setError(null)
    try {
      const fetchedPools = await fetchLiquidityPools(walletAddress, provider || undefined)
      setPools(fetchedPools)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load pools.")
      setPools([])
    } finally {
      setIsLoadingPools(false)
    }
  }, [walletAddress, provider])

  useEffect(() => {
    fetchAndSetPools()
  }, [fetchAndSetPools])

  // Check token allowances when modal opens for 'add' or 'create'
  useEffect(() => {
    const checkAllowances = async () => {
      if (!walletAddress || !provider || (!selectedPool && modalAction !== "create")) return
      setIsCheckingApproval(true)

      let token1Addr: string | undefined
      let token2Addr: string | undefined
      const spenderAddr: string | undefined = ROUTER_ADDRESS // Approvals are generally for the Router

      if (modalAction === "add" && selectedPool) {
        token1Addr = selectedPool.token1.address
        token2Addr = selectedPool.token2.address
      } else if (modalAction === "create") {
        token1Addr = tokens.find((t) => t.id === newToken1Id)?.address
        token2Addr = tokens.find((t) => t.id === newToken2Id)?.address
      }

      if (token1Addr && spenderAddr && token1Amount && Number.parseFloat(token1Amount) > 0) {
        const allowance1 = await fetchTokenAllowance(token1Addr, walletAddress, spenderAddr, provider)
        setIsToken1Approved(Number.parseFloat(allowance1) >= Number.parseFloat(token1Amount))
      } else {
        setIsToken1Approved(false)
      }
      if (token2Addr && spenderAddr && token2Amount && Number.parseFloat(token2Amount) > 0) {
        const allowance2 = await fetchTokenAllowance(token2Addr, walletAddress, spenderAddr, provider)
        setIsToken2Approved(Number.parseFloat(allowance2) >= Number.parseFloat(token2Amount))
      } else {
        setIsToken2Approved(false)
      }
      setIsCheckingApproval(false)
    }

    if (isModalOpen && (modalAction === "add" || modalAction === "create") && walletAddress) {
      checkAllowances()
    } else if (!isModalOpen) {
      setIsToken1Approved(false)
      setIsToken2Approved(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isModalOpen,
    modalAction,
    selectedPool,
    newToken1Id,
    newToken2Id,
    walletAddress,
    token1Amount,
    token2Amount,
    provider,
  ])

  const handleApprove = async (tokenSymbol: "token1" | "token2") => {
    if (!walletAddress || !signer) return // Ensure signer is available
    setIsApproving(tokenSymbol)

    let tokenToApprove: Token | undefined
    const spenderAddress: string | undefined = ROUTER_ADDRESS // Usually router
    let amountToApproveStr: string | undefined

    if (modalAction === "add" && selectedPool) {
      tokenToApprove = tokenSymbol === "token1" ? selectedPool.token1 : selectedPool.token2
      amountToApproveStr = tokenSymbol === "token1" ? token1Amount : token2Amount
    } else if (modalAction === "create") {
      tokenToApprove =
        tokenSymbol === "token1" ? tokens.find((t) => t.id === newToken1Id) : tokens.find((t) => t.id === newToken2Id)
      amountToApproveStr = tokenSymbol === "token1" ? token1Amount : token2Amount
    }

    if (!tokenToApprove || !spenderAddress || !amountToApproveStr || Number.parseFloat(amountToApproveStr) <= 0) {
      setTxMessage("Error: Token, spender, or amount invalid for approval.")
      setIsApproving(null)
      return
    }
    setTxMessage(`Approving ${tokenToApprove.symbol}...`)

    try {
      await approveTokenSpend(tokenToApprove.address, spenderAddress, amountToApproveStr, walletAddress, signer)
      setTxMessage(`${tokenToApprove.symbol} approved successfully!`)
      if (tokenSymbol === "token1") setIsToken1Approved(true)
      if (tokenSymbol === "token2") setIsToken2Approved(true)
    } catch (e) {
      console.error("Approval failed", e)
      setTxMessage(`Approval failed: ${e instanceof Error ? e.message : "Unknown error"}`)
    } finally {
      setIsApproving(null)
    }
  }

  const openModal = (action: "add" | "remove" | "create", pool?: LiquidityPool) => {
    setModalAction(action)
    setSelectedPool(pool || null)
    setToken1Amount("")
    setToken2Amount("")
    setLpAmountToRemove("")
    setTxMessage(null)
    setError(null)
    setIsToken1Approved(false)
    setIsToken2Approved(false)
    setIsModalOpen(true)
  }

  const handleModalSubmit = async () => {
    if (!walletAddress || !signer) {
      // Check for signer
      setError("Please connect your wallet and ensure it's properly initialized.")
      onConnectWallet()
      return
    }
    setIsSubmitting(true)
    setTxMessage("Processing transaction...")
    setError(null)

    try {
      let txHash: string | undefined
      if (modalAction === "add" && selectedPool && token1Amount && token2Amount) {
        txHash = await addLiquidity(
          selectedPool.token1.address,
          selectedPool.token2.address,
          token1Amount,
          token2Amount,
          walletAddress,
          signer,
        )
        setTxMessage(`Successfully added liquidity! Tx: ${truncateAddress(txHash)}`)
      } else if (modalAction === "remove" && selectedPool && lpAmountToRemove) {
        txHash = await removeLiquidity(
          selectedPool.token1.address,
          selectedPool.token2.address,
          lpAmountToRemove,
          walletAddress,
          signer,
        )
        setTxMessage(`Successfully removed liquidity! Tx: ${truncateAddress(txHash)}`)
      } else if (modalAction === "create") {
        const token1 = tokens.find((t) => t.id === newToken1Id)
        const token2 = tokens.find((t) => t.id === newToken2Id)
        if (token1 && token2 && token1Amount && token2Amount) {
          txHash = await createLiquidityPool(
            token1.address,
            token2.address,
            token1Amount,
            token2Amount,
            walletAddress,
            signer,
          )
          setTxMessage(`Successfully created pool! Tx: ${truncateAddress(txHash)}`)
        } else {
          throw new Error("Invalid token selection or amounts for creating pool.")
        }
      }
      await fetchAndSetPools() // Refresh pools list
      // Consider fetching updated user balances too
      setIsModalOpen(false)
    } catch (e) {
      console.error(`${modalAction} failed`, e)
      setError(`Transaction failed: ${e instanceof Error ? e.message : "Unknown error"}`)
      setTxMessage(null)
    } finally {
      setIsSubmitting(false)
      if (!error && txMessage?.startsWith("Successfully")) {
        setTimeout(() => {
          setIsModalOpen(false)
          setTxMessage(null)
        }, 3000)
      } else {
        setTimeout(() => setTxMessage(null), 5000)
      }
    }
  }

  const tokenOptions = tokens.map((t) => ({ value: t.id, label: `${t.name} (${t.symbol})`, iconUrl: t.iconUrl }))

  const currentToken1 = modalAction === "create" ? tokens.find((t) => t.id === newToken1Id) : selectedPool?.token1
  const currentToken2 = modalAction === "create" ? tokens.find((t) => t.id === newToken2Id) : selectedPool?.token2

  const getModalTitle = () => {
    if (modalAction === "add" && selectedPool) return `Add Liquidity to ${selectedPool.name}`
    if (modalAction === "remove" && selectedPool) return `Remove Liquidity from ${selectedPool.name}`
    if (modalAction === "create") return "Create New Liquidity Pool"
    return "Manage Liquidity"
  }

  if (!walletAddress) {
    return (
      <div className="text-center py-10">
        <h2 className="text-3xl font-bold text-gray-100 font-mono mb-4">Liquidity Pools</h2>
        <p className="text-gray-400 mb-6">Connect your wallet to view and manage liquidity pools.</p>
        <Button onClick={onConnectWallet} variant="primary" size="lg">
          Connect Wallet
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-3xl font-bold text-gray-100 font-mono">Liquidity Pools</h2>
        <Button onClick={() => openModal("create")} variant="primary" disabled={!walletAddress}>
          Create Pool
        </Button>
      </div>

      {isLoadingPools ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-8 bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-5/6 mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-1/3 mb-4"></div>
              <div className="flex gap-2">
                <div className="h-10 bg-blue-500 opacity-50 rounded w-1/2"></div>
                <div className="h-10 bg-gray-600 rounded w-1/2"></div>
              </div>
            </Card>
          ))}
        </div>
      ) : error && pools.length === 0 ? (
        <Card className="text-center">
          <p className="text-red-400 text-lg">{error}</p>
          <Button onClick={fetchAndSetPools} variant="secondary" className="mt-4">
            Retry
          </Button>
        </Card>
      ) : pools.length === 0 ? (
        <Card className="text-center">
          <p className="text-gray-400 text-lg">No liquidity pools found.</p>
          <p className="text-gray-500 text-sm">Be the first to create one!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pools.map((pool) => (
            <PoolCardDisplay
              key={pool.id}
              pool={pool}
              onAddLiquidity={() => openModal("add", pool)}
              onRemoveLiquidity={() => openModal("remove", pool)}
              walletAddress={walletAddress}
              userBalances={userBalances}
            />
          ))}
        </div>
      )}

      {(selectedPool || modalAction === "create") && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={getModalTitle()}>
          <div className="space-y-4">
            {modalAction === "add" || modalAction === "create" ? (
              <>
                <div>
                  {modalAction === "create" ? (
                    <Select
                      label="Token 1"
                      options={tokenOptions.filter((opt) => opt.value !== newToken2Id)}
                      value={newToken1Id}
                      onChange={(e) => {
                        setNewToken1Id(e.target.value)
                        setIsToken1Approved(false)
                      }}
                    />
                  ) : (
                    <p className="text-sm text-gray-300">Token 1: {selectedPool?.token1.symbol}</p>
                  )}
                  <Input
                    label={`Amount of ${currentToken1?.symbol || "Token 1"}`}
                    type="number"
                    value={token1Amount}
                    onChange={(e) => {
                      setToken1Amount(e.target.value)
                      setIsToken1Approved(false)
                    }}
                    placeholder="0.0"
                    unit={currentToken1?.symbol}
                    disabled={isSubmitting || isApproving === "token1"}
                  />
                  {walletAddress && currentToken1 && (
                    <p className="text-xs text-gray-400 mt-1">
                      Balance: {formatBigNumberForDisplay(userBalances[currentToken1.id], currentToken1.decimals)}
                    </p>
                  )}
                  {!isToken1Approved && Number.parseFloat(token1Amount) > 0 && (
                    <Button
                      onClick={() => handleApprove("token1")}
                      isLoading={isApproving === "token1"}
                      disabled={isCheckingApproval || isSubmitting || !Number.parseFloat(token1Amount)}
                      className="w-full mt-2"
                      variant="outline"
                      size="sm"
                    >
                      Approve {currentToken1?.symbol}
                    </Button>
                  )}
                </div>
                <div>
                  {modalAction === "create" ? (
                    <Select
                      label="Token 2"
                      options={tokenOptions.filter((opt) => opt.value !== newToken1Id)}
                      value={newToken2Id}
                      onChange={(e) => {
                        setNewToken2Id(e.target.value)
                        setIsToken2Approved(false)
                      }}
                    />
                  ) : (
                    <p className="text-sm text-gray-300">Token 2: {selectedPool?.token2.symbol}</p>
                  )}
                  <Input
                    label={`Amount of ${currentToken2?.symbol || "Token 2"}`}
                    type="number"
                    value={token2Amount}
                    onChange={(e) => {
                      setToken2Amount(e.target.value)
                      setIsToken2Approved(false)
                    }}
                    placeholder="0.0"
                    unit={currentToken2?.symbol}
                    disabled={isSubmitting || isApproving === "token2"}
                  />
                  {walletAddress && currentToken2 && (
                    <p className="text-xs text-gray-400 mt-1">
                      Balance: {formatBigNumberForDisplay(userBalances[currentToken2.id], currentToken2.decimals)}
                    </p>
                  )}
                  {!isToken2Approved && Number.parseFloat(token2Amount) > 0 && (
                    <Button
                      onClick={() => handleApprove("token2")}
                      isLoading={isApproving === "token2"}
                      disabled={isCheckingApproval || isSubmitting || !Number.parseFloat(token2Amount)}
                      className="w-full mt-2"
                      variant="outline"
                      size="sm"
                    >
                      Approve {currentToken2?.symbol}
                    </Button>
                  )}
                </div>
              </>
            ) : null}

            {modalAction === "remove" && selectedPool && (
              <>
                <Input
                  label={`Amount of LP Tokens to Remove`}
                  type="number"
                  value={lpAmountToRemove}
                  onChange={(e) => setLpAmountToRemove(e.target.value)}
                  placeholder="0.0"
                  unit="LP"
                  disabled={isSubmitting}
                />
                {walletAddress && (
                  <p className="text-xs text-gray-400 mt-1">
                    Your LP Balance: {formatBigNumberForDisplay(selectedPool.userLpBalance, 18, 6)}
                  </p>
                )}
              </>
            )}

            {txMessage && (
              <p
                className={`text-sm text-center ${
                  txMessage.includes("failed") || txMessage.includes("Error") ? "text-red-400" : "text-green-400"
                }`}
              >
                {txMessage}
              </p>
            )}
            {error && !txMessage && <p className="text-sm text-center text-red-500">{error}</p>}

            <Button
              onClick={handleModalSubmit}
              className="w-full"
              variant="primary"
              isLoading={isSubmitting}
              disabled={
                isSubmitting ||
                isCheckingApproval ||
                isApproving !== null ||
                (modalAction !== "remove" &&
                  (!isToken1Approved ||
                    !isToken2Approved ||
                    !Number.parseFloat(token1Amount) ||
                    !Number.parseFloat(token2Amount) ||
                    Number.parseFloat(token1Amount) <= 0 ||
                    Number.parseFloat(token2Amount) <= 0)) ||
                (modalAction === "remove" && (!lpAmountToRemove || Number.parseFloat(lpAmountToRemove) <= 0))
              }
            >
              {modalAction === "add" ? "Add Liquidity" : modalAction === "remove" ? "Remove Liquidity" : "Create Pool"}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
