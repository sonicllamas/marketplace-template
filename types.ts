import type React from "react"
import type { ethers } from "ethers" // Import ethers for types

// Ethers specific types that might be used across the app
export type EthersProvider = ethers.BrowserProvider // Updated for ethers v6
export type EthersSigner = ethers.Signer
export type EthersContract = ethers.Contract
export type EthersBigNumber = string // Represent BigNumbers as strings for interchange, parse as needed
export type EthereumProvider = ethers.Eip1193Provider

export enum AppView {
  DASHBOARD = "dashboard",
  SWAP = "swap",
  FUNDS = "funds",
  NFT_STAKING = "nft-staking",
  LIQUIDITY_POOLS = "liquidity-pools",
  LLAMAS_NFTS_HUB = "llamas-nfts-hub",
}

export interface NavItem {
  id: AppView
  label: string
  icon?: React.FC<React.SVGProps<SVGSVGElement>>
}

// --- Token Types ---
export interface Token {
  id: string // Unique identifier (e.g., symbol or contract address)
  name: string
  symbol: string
  address: string // Contract address, or a placeholder like 'native'
  decimals: number
  iconUrl?: string
  balance?: string // User's balance of this token, fetched dynamically
}

// --- Component Prop Types ---
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: "primary" | "secondary" | "danger" | "outline" | "ghost"
  size?: "sm" | "md" | "lg"
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

// For Input component: Base props shared between input and textarea
interface BaseInputProps {
  label?: string
  id?: string
  error?: string // Error message string
  className?: string // Common className prop
  // Define common value/onChange; specific event types handled in derived types or implementation
  value?: string | number // Input can be number, textarea usually string
  onChange?: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

// Props for a regular <input> element
export interface RegularInputPropsType
  extends BaseInputProps,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "className" | "type"> {
  type?: Exclude<React.HTMLInputTypeAttribute, "textarea"> // All standard input types except 'textarea'
  icon?: React.ReactNode // Icon specific to input styling
  unit?: string // Unit specific to input styling
}

// Props for a <textarea> element
export interface TextAreaInputPropsType
  extends BaseInputProps,
    Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange" | "className"> {
  type: "textarea"
  // Ensure value is string for textarea, and onChange event is specific
  value?: string
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
  // icon and unit are typically not used for textarea but can be added if design requires
}

// Combined InputProps using a discriminated union on 'type'
export type InputProps = RegularInputPropsType | TextAreaInputPropsType

export interface SelectOption {
  value: string
  label: string
  iconUrl?: string
}

export interface SelectComponentProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  id?: string
  error?: string
  options?: SelectOption[]
  children?: React.ReactNode
}

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl" | "2xl" // Added 2xl
}

// --- App Feature View Props ---

// Base props that all views share
export interface ViewProps {
  walletAddress: string | null
  userBalances: Record<string, string>
  provider: EthersProvider | null
  signer: EthersSigner | null
  onConnectWallet: () => void
}

export interface DashboardViewProps extends ViewProps {
  changeView: (view: AppView) => void // For navigation from dashboard
}

export interface SwapTokensViewProps extends ViewProps {
  // Additional swap-specific props can be added here
}

export interface FundManagementViewProps extends ViewProps {
  // Additional fund management-specific props can be added here
}

export interface NFT {
  // Basic NFT structure for staking/display
  id: string // Typically "contractAddress-tokenId"
  contractAddress: string
  tokenId: string
  name: string
  imageUrl: string
  description?: string
  collectionName?: string
  owner?: string
  tokenUri?: string
  // other attributes as needed by staking view
}

export interface StakedNFT {
  nft: NFT
  stakedDate: string // ISO date string
  rewardsEarned: string // As a string, formatted BigNumber
  stakedForDays?: number // Optional: can be calculated
  stakingPoolAddress: string // Address of the pool it's staked in
}

export interface StakingPoolConfig {
  poolName?: string
  collectionAddress: string
  rewardTokenAddress: string
  rewardTokenSymbol: string
  rewardTokenDecimals?: number // Added for custom token support
  rewardRate: string // e.g., "10" for 10 tokens per NFT per day
  stakingDuration?: number // Optional, in days
}

export interface NftStakingViewProps extends ViewProps {
  // Additional NFT staking-specific props can be added here
}

export interface LiquidityPool {
  id: string // Typically pool address
  poolAddress: string
  name: string
  token1: Token
  token2: Token
  token1Address: string
  token2Address: string
  lpTokenAddress: string
  reserve1: string // Formatted string
  reserve2: string // Formatted string
  totalSupplyLP: string // Formatted string
  userLpBalance?: string // Formatted string
  userSharePercentage?: number
  apy?: number // Annual Percentage Yield (mock or calculated)
  totalLiquidityUSD?: number // Mock or calculated
}

export interface LiquidityPoolsViewProps extends ViewProps {
  // Additional liquidity pools-specific props can be added here
}

// Props for the new LlamasNftsHubView
export interface LlamasNftsHubViewProps extends ViewProps {
  // Additional NFT hub-specific props can be added here
}

// Configuration for listing an NFT collection on the platform
export interface NftCollectionListingConfig {
  contractAddress: string // The NFT collection's smart contract address
  name?: string // Optional: Name of the collection (e.g., "CryptoPunks")
  symbol?: string // Optional: Symbol of the collection (e.g., "PUNK")
  description?: string // Optional: A brief description of the collection
  websiteLink?: string // Optional: Link to the official website or marketplace page
  // Add other relevant fields like iconUrl, bannerUrl, social links etc. as needed
}

// Network Info structure for constants
export interface NetworkInfo {
  name: string
  rpcUrl: string
  explorerUrl: string
  chainId: number
  currencySymbol: string
  routerAddress?: string // Optional: Router address for this network
  nativeCurrencyAddress?: string // Optional: Native currency (e.g., ETH) address or placeholder
}

// Staking Pool Info for constants or display
export interface StakingPoolInfo {
  address: string
  name: string
  rewardTokenAddress: string
  rewardTokenSymbol: string
  nftCollectionAddress: string
  totalStaked: number
  rewardRatePerNftPerDay: string // Formatted string
}

// For NftCollection in blockchainService (basic structure)
export interface NftCollection {
  address: string
  name?: string
  symbol?: string
  nfts: NFT[]
}

// --- PaintSwap API Types for Llamas NFT Hub ---
export interface PaintSwapNftAttribute {
  trait_type: string
  value: string | number
  display_type?: string
}

export interface PaintSwapNft {
  tokenId: string
  name: string
  description: string
  image: string // URL to the image
  imageVersion?: number // PaintSwap specific
  animation_url?: string
  external_url?: string
  attributes: PaintSwapNftAttribute[]
  // Other fields from PaintSwap API as needed
  // e.g., owner, priceInfo, marketplaceId
}

export interface PaintSwapCollectionStats {
  id: string
  name: string
  symbol: string
  collectionCreationOrder?: number // Made optional as not in all contexts
  startBlock: string
  isWhitelisted: boolean
  numTradesLast7Days: string
  numTradesLast24Hours: string
  createdTimestamp: string
  totalMinted: string
  floor: string
  floorCap: string
  lowestPrice: string
  highestPrice: string
  numOwners: string
  totalTrades: string
  lastSellPrice: string
  totalNFTs: string // Important for trait percentage calculation
  highestSale: string
  totalVolumeTraded: string
  volumeLast24Hours: string
  volumeLast7Days: string
  activeSales: string
  activeSalesNonAuction: string
  timestampLastSale: string
  timestampLastTrim: string
  floorSaleTVL: string
  lowestTokenAmount: string
  highestTokenAmount: string
  lowestLockedExpiry: string
  highestLockedExpiry: string
}

export interface PaintSwapCollection {
  id: string
  createdAt: string
  updatedAt: string
  address: string
  owner: string
  name: string
  description: string
  nsfw: boolean
  mintPriceLow?: number // Optional as can be 0 or null
  mintPriceHigh?: number // Optional
  verified: boolean
  startBlock: number
  path: string
  website?: string | null
  twitter?: string | null
  discord?: string | null
  medium?: string | null
  telegram?: string | null
  reddit?: string | null
  poster?: string | null // URL for main collection image/logo
  banner?: string | null // URL for banner image
  thumbnail?: string | null // URL for thumbnail image
  marketing?: string | null
  standard: string
  featured: boolean
  displayed: boolean
  imageStyle: string
  customMetadata: any | null
  isFnft: boolean
  isInFnftMarketplace: boolean
  isReveal: boolean
  isSkipRank: boolean
  isDynamicMetadata: boolean
  isDynamicMedia: boolean
  chainId: number
  stats: PaintSwapCollectionStats
  tracked: boolean
  meta: boolean
  isWhitelisted: boolean
}

export interface NftCardProps {
  nft: PaintSwapNft
  onClick?: (nft: PaintSwapNft) => void // For showing details
  onBuy?: (nft: PaintSwapNft) => void
  onList?: (nft: PaintSwapNft) => void // Renamed from onSell
  onDelist?: (nft: PaintSwapNft) => void // New prop
  onSend?: (nft: PaintSwapNft) => void
  onBurn?: (nft: PaintSwapNft) => void
}

// Types for Collection Trait Statistics
export interface PaintSwapTraitValueDetail {
  value: string // e.g., "Blue" for Background trait type
  count: number // Number of NFTs with this trait value
  percentage?: number // Percentage of NFTs in collection with this trait value
}

export interface PaintSwapTraitType {
  trait_type: string // e.g., "Background"
  values: PaintSwapTraitValueDetail[] // Array of values for this trait type
}

// Define other specific API response structures as needed
// ...
interface BlockchainServiceError extends Error {
  code?: number // e.g., 4001 for user rejected transaction
  data?: { message?: string } // Provider specific error data
}
