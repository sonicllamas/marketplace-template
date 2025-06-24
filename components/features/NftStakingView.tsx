"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card } from "../common/Card"
import { Button } from "../common/Button"
import { Input, Select } from "../common/Input"
import type { NFT, StakedNFT, Token, StakingPoolConfig, NftStakingViewProps } from "../../types"
import {
  AVAILABLE_TOKENS,
  APP_PAYMENT_RECEIVER_ADDRESS,
  PLATFORM_STAKING_POOL_DEPLOYMENT_FEE_S,
  SONIC_LLAMAS_NFT_COLLECTION_ADDRESS,
} from "../../constants"
import { deployStakingPoolContract, fetchTokenDetailsFromAddress } from "../../services/blockchainService"
import { ethers } from "ethers"
import { formatTokenBalance } from "../../utils/formatting"

interface NftStakingCardProps {
  nft: NFT
  onStake: (nft: NFT) => void
  actionText?: string
}

// Helper to truncate address
const truncateAddress = (address: string | undefined | null, startChars = 6, endChars = 4): string => {
  if (!address) return "N/A"
  if (address.length <= startChars + endChars + 2) return address
  return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`
}

const NftToStakeCard: React.FC<NftStakingCardProps> = ({ nft, onStake, actionText = "Stake NFT" }) => {
  return (
    <Card className="flex flex-col">
      <img src={nft.imageUrl || "/placeholder.svg"} alt={nft.name} className="w-full h-40 object-cover rounded-t-xl" />
      <div className="p-3">
        <h4 className="text-md font-semibold text-gray-100 truncate">{nft.name}</h4>
        <p className="text-xs text-gray-400 truncate mb-2">{nft.collectionName || "N/A"}</p>
        <Button onClick={() => onStake(nft)} className="w-full mt-2" variant="primary" size="sm">
          {actionText}
        </Button>
      </div>
    </Card>
  )
}

interface StakedNftDisplayCardProps {
  stakedNft: StakedNFT
  onUnstake: (stakedNft: StakedNFT) => void
  onClaim: (stakedNft: StakedNFT) => void
  rewardTokenSymbol?: string
}

const StakedNftItemCard: React.FC<StakedNftDisplayCardProps> = ({
  stakedNft,
  onUnstake,
  onClaim,
  rewardTokenSymbol = "SLL",
}) => {
  return (
    <Card className="flex flex-col sm:flex-row items-center gap-4">
      <img
        src={stakedNft.nft.imageUrl || "/placeholder.svg"}
        alt={stakedNft.nft.name}
        className="w-full sm:w-24 h-24 object-cover rounded-lg"
      />
      <div className="flex-grow">
        <h4 className="text-lg font-semibold text-gray-100">{stakedNft.nft.name}</h4>
        <p className="text-sm text-gray-400">
          Staked for:{" "}
          {stakedNft.stakedForDays ||
            Math.floor((Date.now() - new Date(stakedNft.stakedDate).getTime()) / (1000 * 3600 * 24))}{" "}
          days
        </p>
        <p className="text-md text-brand-light-lime font-semibold">
          Rewards: {formatTokenBalance(stakedNft.rewardsEarned, 18, 4)} {rewardTokenSymbol}
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <Button onClick={() => onUnstake(stakedNft)} variant="outline" size="sm" className="w-full sm:w-auto">
          Unstake
        </Button>
        <Button onClick={() => onClaim(stakedNft)} variant="primary" size="sm" className="w-full sm:w-auto">
          Claim Rewards
        </Button>
      </div>
    </Card>
  )
}

export const NftStakingView: React.FC<NftStakingViewProps> = ({
  walletAddress,
  userBalances,
  provider,
  signer,
  onConnectWallet,
}) => {
  const [userNfts, setUserNfts] = useState<NFT[]>([])
  const [stakedNfts, setStakedNfts] = useState<StakedNFT[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const [poolName, setPoolName] = useState("")
  const [collectionAddress, setCollectionAddress] = useState("")

  const sllToken = AVAILABLE_TOKENS.find((t) => t.id === "sll")
  const [rewardChoice, setRewardChoice] = useState<"select" | "custom">("select")
  const [rewardTokenId, setRewardTokenId] = useState<string>(sllToken?.id || AVAILABLE_TOKENS[0]?.id || "")
  const [customRewardTokenAddress, setCustomRewardTokenAddress] = useState("")
  const [customRewardTokenDetails, setCustomRewardTokenDetails] = useState<Token | null>(null)
  const [isFetchingCustomToken, setIsFetchingCustomToken] = useState(false)
  const [customTokenFetchError, setCustomTokenFetchError] = useState<string | null>(null)

  const [rewardRate, setRewardRate] = useState<string>("")
  const [stakingDuration, setStakingDuration] = useState<string>("")

  const [isDeploying, setIsDeploying] = useState<boolean>(false)
  const [deployError, setDeployError] = useState<string | null>(null)
  const [deploySuccessMessage, setDeploySuccessMessage] = useState<string | null>(null)

  const rewardTokenOptions = AVAILABLE_TOKENS.map((t) => ({
    value: t.id,
    label: `${t.name} (${t.symbol})`,
    iconUrl: t.iconUrl,
  }))

  const sToken = AVAILABLE_TOKENS.find((t) => t.symbol === "S") // For fee calculation

  useEffect(() => {
    // Mock reward accumulation
    const interval = setInterval(() => {
      setStakedNfts((prevStaked) =>
        prevStaked.map((sn) => ({
          ...sn,
          // Assuming rewards are in SLL and SLL has 18 decimals for this mock update
          rewardsEarned: (
            Number.parseFloat(sn.rewardsEarned) +
            0.001 * (sllToken?.decimals === 18 ? 1 : 10 ** (18 - (sllToken?.decimals || 18)))
          ).toString(),
        })),
      )
    }, 5000)
    return () => clearInterval(interval)
  }, [sllToken?.decimals])

  const handleStakeNft = (nftToStake: NFT) => {
    setIsLoading(true)
    console.log("Staking NFT:", nftToStake)
    setTimeout(() => {
      setUserNfts((prev) => prev.filter((n) => n.id !== nftToStake.id))
      const newStakedNft: StakedNFT = {
        nft: nftToStake,
        stakedDate: new Date().toISOString(),
        rewardsEarned: "0",
        stakedForDays: 0,
        stakingPoolAddress: "0xMockStakingPoolAddress",
      }
      setStakedNfts((prev) => [newStakedNft, ...prev])
      setIsLoading(false)
      alert(`${nftToStake.name} staked successfully! (Mock)`)
    }, 1000)
  }

  const handleUnstakeNft = (stakedNftToUnstake: StakedNFT) => {
    setIsLoading(true)
    console.log("Unstaking NFT:", stakedNftToUnstake)
    setTimeout(() => {
      setStakedNfts((prev) => prev.filter((sn) => sn.nft.id !== stakedNftToUnstake.nft.id))
      setUserNfts((prev) => [stakedNftToUnstake.nft, ...prev])
      setIsLoading(false)
      alert(
        `${stakedNftToUnstake.nft.name} unstaked! Rewards (if any) should be claimed separately or are auto-claimed. (Mock)`,
      )
    }, 1000)
  }

  const handleClaimRewards = (stakedNftToClaim: StakedNFT) => {
    setIsLoading(true)
    console.log("Claiming rewards for:", stakedNftToClaim)
    const rewardSymbol = sllTokenDetails?.symbol || "SLL"
    setTimeout(() => {
      setStakedNfts((prevStaked) =>
        prevStaked.map((sn) => (sn.nft.id === stakedNftToClaim.nft.id ? { ...sn, rewardsEarned: "0" } : sn)),
      )
      alert(
        `Claimed ${formatTokenBalance(stakedNftToClaim.rewardsEarned, sllTokenDetails?.decimals || 18, 4)} ${rewardSymbol} for ${stakedNftToClaim.nft.name}! (Mock)`,
      )
      setIsLoading(false)
    }, 1000)
  }

  const sllTokenDetails = AVAILABLE_TOKENS.find((token) => token.id === "sll")

  useEffect(() => {
    if (collectionAddress.toLowerCase() === SONIC_LLAMAS_NFT_COLLECTION_ADDRESS.toLowerCase() && sllTokenDetails) {
      setRewardChoice("select")
      setRewardTokenId(sllTokenDetails.id)
    }
  }, [collectionAddress, sllTokenDetails])

  const handleFetchCustomTokenDetails = async () => {
    if (!customRewardTokenAddress.trim() || !provider) {
      setCustomTokenFetchError("Please enter a valid token address and ensure your wallet is connected.")
      return
    }
    if (!ethers.isAddress(customRewardTokenAddress.trim())) {
      setCustomTokenFetchError("Invalid token address format.")
      return
    }

    setIsFetchingCustomToken(true)
    setCustomTokenFetchError(null)
    setCustomRewardTokenDetails(null)
    try {
      const tokenDetails = await fetchTokenDetailsFromAddress(customRewardTokenAddress.trim(), provider)
      if (tokenDetails) {
        setCustomRewardTokenDetails(tokenDetails)
      } else {
        setCustomTokenFetchError("Could not fetch details for the provided token address.")
      }
    } catch (e: any) {
      setCustomTokenFetchError(e.message || "Failed to fetch custom token details.")
    } finally {
      setIsFetchingCustomToken(false)
    }
  }

  const handleDeployStakingPool = async () => {
    if (!walletAddress || !signer) {
      setDeployError("Please connect your wallet to deploy a staking pool.")
      onConnectWallet()
      return
    }

    let actualRewardTokenAddress: string | undefined
    let actualRewardTokenSymbol: string | undefined
    let actualRewardTokenDecimals: number | undefined

    if (rewardChoice === "select") {
      const selectedTokenFromList = AVAILABLE_TOKENS.find((t) => t.id === rewardTokenId)
      if (!selectedTokenFromList) {
        setDeployError("Selected reward token from list is invalid.")
        return
      }
      actualRewardTokenAddress = selectedTokenFromList.address
      actualRewardTokenSymbol = selectedTokenFromList.symbol
      actualRewardTokenDecimals = selectedTokenFromList.decimals
    } else {
      // custom
      if (!customRewardTokenDetails || !customRewardTokenDetails.address) {
        setDeployError("Custom reward token details not fetched or invalid. Please fetch details first.")
        return
      }
      actualRewardTokenAddress = customRewardTokenDetails.address
      actualRewardTokenSymbol = customRewardTokenDetails.symbol
      actualRewardTokenDecimals = customRewardTokenDetails.decimals
    }

    if (!collectionAddress.trim() || !actualRewardTokenAddress || !rewardRate.trim()) {
      setDeployError("Please fill in all required fields: Collection Address, Reward Token, and Reward Rate.")
      return
    }

    if (!sToken) {
      setDeployError("S token configuration not found. Cannot verify fee balance.")
      return
    }
    const feeAmount = Number.parseFloat(PLATFORM_STAKING_POOL_DEPLOYMENT_FEE_S)
    const userSTokenBalance = Number.parseFloat(userBalances[sToken.id] || "0")

    if (userSTokenBalance < feeAmount) {
      setDeployError(
        `Insufficient ${sToken.symbol} token balance for platform fee. Required: ${feeAmount} ${sToken.symbol}, You have: ${userSTokenBalance.toFixed(4)} ${sToken.symbol}.`,
      )
      return
    }

    const config: StakingPoolConfig = {
      poolName: poolName.trim() || undefined,
      collectionAddress: collectionAddress.trim(),
      rewardTokenAddress: actualRewardTokenAddress,
      rewardTokenSymbol: actualRewardTokenSymbol || "CUST",
      rewardTokenDecimals: actualRewardTokenDecimals,
      rewardRate: rewardRate,
      stakingDuration: stakingDuration ? Number.parseInt(stakingDuration) : undefined,
    }

    setIsDeploying(true)
    setDeployError(null)
    setDeploySuccessMessage(null)

    try {
      const result = await deployStakingPoolContract(
        config,
        walletAddress,
        signer,
        provider || undefined,
        APP_PAYMENT_RECEIVER_ADDRESS,
        PLATFORM_STAKING_POOL_DEPLOYMENT_FEE_S,
      )
      setDeploySuccessMessage(
        `Staking pool "${config.poolName || "Unnamed Pool"}" (mock) deployment initiated! Pool Address: ${truncateAddress(result.contractAddress)} Tx: ${truncateAddress(result.transactionHash)}. Fee of ${PLATFORM_STAKING_POOL_DEPLOYMENT_FEE_S} ${sToken.symbol} notionally sent to platform.`,
      )
      setPoolName("")
      setCollectionAddress("")
      setRewardChoice("select")
      setRewardTokenId(sllToken?.id || AVAILABLE_TOKENS[0]?.id || "")
      setCustomRewardTokenAddress("")
      setCustomRewardTokenDetails(null)
      setCustomTokenFetchError(null)
      setRewardRate("")
      setStakingDuration("")
    } catch (e) {
      const error = e as Error
      setDeployError(`Deployment failed: ${error.message}`)
      console.error("Staking pool deployment failed:", error)
    } finally {
      setIsDeploying(false)
    }
  }

  const currentRewardTokenSymbolForRateUnit =
    rewardChoice === "custom"
      ? customRewardTokenDetails?.symbol || "Custom Token"
      : AVAILABLE_TOKENS.find((t) => t.id === rewardTokenId)?.symbol || "Token"

  const isDeployDisabled =
    isDeploying ||
    !collectionAddress.trim() ||
    !rewardRate.trim() ||
    (rewardChoice === "select" && !rewardTokenId) ||
    (rewardChoice === "custom" && (!customRewardTokenDetails || !!customTokenFetchError))

  if (!walletAddress) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <h1 className="text-3xl font-bold text-white">NFT Staking</h1>
        <p className="text-gray-400 text-center max-w-md">
          Connect your wallet to stake your NFTs and earn rewards, or create your own staking pools.
        </p>
        <Button onClick={onConnectWallet} size="lg" className="bg-blue-600 hover:bg-blue-700">
          Connect Wallet
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-3xl font-bold text-gray-100 mb-6 font-orbitron">Your Available NFTs for Staking</h2>
        {userNfts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {userNfts.map((nft) => (
              <NftToStakeCard key={nft.id} nft={nft} onStake={handleStakeNft} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 py-6">You have no NFTs available to stake.</p>
        )}
      </div>

      <div>
        <h2 className="text-3xl font-bold text-gray-100 mb-6 font-orbitron">Your Staked NFTs</h2>
        {stakedNfts.length > 0 ? (
          <div className="space-y-6">
            {stakedNfts.map((stakedNft) => (
              <StakedNftItemCard
                key={stakedNft.nft.id}
                stakedNft={stakedNft}
                onUnstake={handleUnstakeNft}
                onClaim={handleClaimRewards}
                rewardTokenSymbol={sllTokenDetails?.symbol || "SLL"} // Pass SLL symbol
              />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 py-6">You have no NFTs currently staked.</p>
        )}
      </div>
      {isLoading && <p className="text-center text-brand-light-lime mt-4">Processing transaction...</p>}

      <Card title="Create Your Own NFT Staking Pool" titleClassName="text-2xl font-orbitron">
        <div className="space-y-6">
          <Input
            label="Staking Pool Name (Optional)"
            id="poolName"
            value={poolName}
            onChange={(e) => setPoolName(e.target.value)}
            placeholder="e.g., My Awesome Llama Staking"
          />
          <Input
            label="NFT Collection Address (Required)"
            id="collectionAddress"
            value={collectionAddress}
            onChange={(e) => setCollectionAddress(e.target.value)}
            placeholder="0x123..."
            error={deployError && !collectionAddress.trim() ? "Collection address is required." : undefined}
          />

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Reward Token (Required)</label>
            <div className="flex items-center space-x-4 mb-2">
              <label className="flex items-center space-x-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="radio"
                  name="rewardChoice"
                  value="select"
                  checked={rewardChoice === "select"}
                  onChange={() => {
                    setRewardChoice("select")
                    setCustomTokenFetchError(null)
                    setCustomRewardTokenDetails(null)
                  }}
                  className="form-radio h-4 w-4 text-brand-primary bg-brand-surface border-gray-600 focus:ring-brand-primary"
                />
                <span>Select from list</span>
              </label>
              <label className="flex items-center space-x-2 text-sm text-gray-300 cursor-pointer">
                <input
                  type="radio"
                  name="rewardChoice"
                  value="custom"
                  checked={rewardChoice === "custom"}
                  onChange={() => setRewardChoice("custom")}
                  className="form-radio h-4 w-4 text-brand-primary bg-brand-surface border-gray-600 focus:ring-brand-primary"
                />
                <span>Use custom token address</span>
              </label>
            </div>

            {rewardChoice === "select" ? (
              <Select
                id="rewardToken"
                options={rewardTokenOptions}
                value={rewardTokenId}
                onChange={(e) => setRewardTokenId(e.target.value)}
                error={
                  deployError && rewardChoice === "select" && !rewardTokenId ? "Reward token is required." : undefined
                }
              />
            ) : (
              <div className="space-y-2">
                <div className="flex items-end space-x-2">
                  <Input
                    label="Custom Token Contract Address"
                    id="customRewardTokenAddress"
                    value={customRewardTokenAddress}
                    onChange={(e) => {
                      setCustomRewardTokenAddress(e.target.value)
                      setCustomRewardTokenDetails(null)
                      setCustomTokenFetchError(null)
                    }}
                    placeholder="0xabc..."
                    className="flex-grow"
                    disabled={isFetchingCustomToken}
                  />
                  <Button
                    onClick={handleFetchCustomTokenDetails}
                    isLoading={isFetchingCustomToken}
                    disabled={
                      !customRewardTokenAddress.trim() ||
                      isFetchingCustomToken ||
                      !ethers.isAddress(customRewardTokenAddress.trim())
                    }
                    size="md"
                    variant="secondary"
                    className="h-10"
                  >
                    Fetch Details
                  </Button>
                </div>
                {customTokenFetchError && <p className="text-xs text-red-400">{customTokenFetchError}</p>}
                {customRewardTokenDetails && (
                  <div className="text-xs text-green-400 bg-green-900/30 p-2 rounded-md">
                    Fetched: {customRewardTokenDetails.name} ({customRewardTokenDetails.symbol}), Decimals:{" "}
                    {customRewardTokenDetails.decimals}
                  </div>
                )}
                {deployError && rewardChoice === "custom" && (!customRewardTokenDetails || customTokenFetchError) && (
                  <p className="text-xs text-red-400 mt-1">
                    {customTokenFetchError || "Please fetch and verify custom token details."}
                  </p>
                )}
              </div>
            )}
          </div>

          <Input
            label="Reward Rate (Required)"
            id="rewardRate"
            type="number"
            value={rewardRate}
            onChange={(e) => setRewardRate(e.target.value)}
            placeholder="e.g., 10"
            unit={`${currentRewardTokenSymbolForRateUnit}/Day`}
            error={deployError && !rewardRate.trim() ? "Reward rate is required." : undefined}
          />
          <Input
            label="Staking Duration (Optional, in days)"
            id="stakingDuration"
            type="number"
            value={stakingDuration}
            onChange={(e) => setStakingDuration(e.target.value)}
            placeholder="e.g., 30 (for a 30-day lock)"
            unit="Days"
          />

          <div className="text-xs text-yellow-300 bg-yellow-900/30 p-3 rounded-md border border-yellow-700/50">
            <p>
              A platform fee of{" "}
              <strong>
                {PLATFORM_STAKING_POOL_DEPLOYMENT_FEE_S} {sToken?.symbol || "S"}
              </strong>{" "}
              will be (notionally) sent to the Llamas Hub treasury (
              <span className="font-mono">{truncateAddress(APP_PAYMENT_RECEIVER_ADDRESS)}</span>) for this service.
            </p>
            {sToken && <p>Please ensure you have sufficient {sToken.symbol} token balance.</p>}
          </div>

          {deployError && <p className="text-sm text-red-500 text-center">{deployError}</p>}
          {deploySuccessMessage && <p className="text-sm text-green-400 text-center">{deploySuccessMessage}</p>}

          <Button
            onClick={handleDeployStakingPool}
            isLoading={isDeploying}
            className="w-full"
            size="lg"
            disabled={isDeployDisabled}
          >
            {isDeploying ? "Deploying Staking Contract..." : "Deploy Staking Contract (Mock)"}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-4 text-center">
          Note: This is a simulated deployment. No real contract will be created on the blockchain. The platform fee is
          also part of this simulation.
        </p>
      </Card>
    </div>
  )
}
