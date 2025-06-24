// constants.ts

// Main Navigation Items
// These define the structure and icons for the application's main navigation.
import { AppView } from "./types"
import { HomeIcon, SwapIcon, WalletIcon, LlamaIcon, StakeIcon, LiquidityIcon } from "./icons"
import type { NavItem, Token } from "./types"

export const NAV_ITEMS: NavItem[] = [
  { id: AppView.DASHBOARD, label: "Dashboard", icon: HomeIcon },
  { id: AppView.SWAP, label: "Swap Tokens", icon: SwapIcon },
  { id: AppView.FUNDS, label: "Manage Funds", icon: WalletIcon },
  { id: AppView.LLAMAS_NFTS_HUB, label: "Llamas NFTs Hub", icon: LlamaIcon },
  { id: AppView.NFT_STAKING, label: "NFT Staking", icon: StakeIcon },
  { id: AppView.LIQUIDITY_POOLS, label: "Liquidity Pools", icon: LiquidityIcon },
] as const // Ensures the array and its contents are read-only for better type safety

// API and Collection Constants
// These are external API endpoints or specific collection addresses.
export const PAINT_SWAP_API_BASE_URL = "https://api.paintswap.finance"
export const SONIC_LLAMAS_NFT_COLLECTION_ADDRESS = "0x0dcbf9741bbc21b7696ca73f5f87731c9a3d303e"

// Pool Addresses
// IMPORTANT: These addresses represent specific liquidity pools.
// For custom tokens like SLL and wS on the Sonic network, these
// addresses MUST be retrieved from the actual deployed contracts on the Sonic blockchain.
// The current value is a placeholder that needs to be updated.
export const SLL_WS_POOL_ADDRESS = "0xPLACEHOLDERSLLwSPoolAddress" // Placeholder: Get actual SLL/wS pool address from Sonic chain

export const KNOWN_POOLS: Record<string, string> = {
  "SLL/wS": SLL_WS_POOL_ADDRESS,
  "wS/SLL": SLL_WS_POOL_ADDRESS,
  "S/SLL": SLL_WS_POOL_ADDRESS, // S (native) swaps through wS to SLL
  "SLL/S": SLL_WS_POOL_ADDRESS, // SLL swaps through wS to S
} as const // Ensures the object and its contents are read-only

// Token Definitions
// Defines known tokens, including their addresses, decimals, and symbols.
// The 'address' for the native currency ("S") is set to 'native' as it's not an ERC20 contract.
export const AVAILABLE_TOKENS: Token[] = [
  {
    id: "s",
    name: "Sonic",
    symbol: "S",
    address: "native", // Represents the native currency of the Sonic blockchain
    decimals: 18, // Standard for native currencies like ETH/FTM
    balance: "0",
    iconUrl: "/placeholder.svg?height=32&width=32", // Placeholder icon
  },
  {
    id: "sll",
    name: "Sonic Llamas", // Changed from "Sonic Llama Labs"
    symbol: "SLL",
    address: "0x3F78599a7C0fb772591540225d3C6a7831547a12",
    decimals: 18,
    balance: "0",
    iconUrl: "/placeholder.svg?height=32&width=32",
  },
  {
    id: "ws",
    name: "Wrapped Sonic",
    symbol: "wS",
    address: "0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38", // Assumed correct for Sonic
    decimals: 18,
    balance: "0",
    iconUrl: "/placeholder.svg?height=32&width=32", // Placeholder icon
  },
  {
    id: "usdc",
    name: "USD Coin",
    symbol: "USDC",
    address: "0x29219dd400f2Bf60E5a23d13Be72B486D4038894", // Assumed correct for Sonic blockchain's USDC
    decimals: 6,
    balance: "0",
    iconUrl: "/placeholder.svg?height=32&width=32", // Placeholder icon
  },
  {
    id: "usdt",
    name: "Tether USD",
    symbol: "USDT",
    address: "0x50c42dEAcD8Fc9773493ED674b675bE577f2634b", // Assumed correct for Sonic blockchain's USDT
    decimals: 6,
    balance: "0",
    iconUrl: "/placeholder.svg?height=32&width=32", // Placeholder icon
  },
] as const

// NFT Collections
// Defines known NFT collections that the application interacts with.
export const KNOWN_NFT_COLLECTIONS: { name: string; address: string; symbol?: string; iconUrl?: string }[] = [
  {
    name: "Sonic Llamas",
    address: SONIC_LLAMAS_NFT_COLLECTION_ADDRESS,
    symbol: "SLLAMA",
    iconUrl: "https://i.imgur.com/JAN65Kz.png", // Example image URL
  },
] as const

// Core Contract Addresses
// These are essential contract addresses for the DEX and related functionalities.
// Verification against the actual Sonic blockchain deployments is highly recommended.
export const ACCESS_HUB_ADDRESS = "0x5e7A9eea6988063A4dBb9CcDDB3E04C923E8E37f" // Legacy/Specific to your protocol
export const LIQUIDITY_POOL_FACTORY_ADDRESS = "0x2dA25E7446A70D7be65fd4c053948BEcAA6374c8" // ShadowV3Factory
export const SWAP_ROUTER_ADDRESS = "0x5543c6176feb9b4b179078205d7c29eea2e2d695" // Main swap router (likely SwapRouter02 compatible)
export const ROUTER_ADDRESS = SWAP_ROUTER_ADDRESS // Alias for consistency, uses the same main router
export const UNIVERSAL_ROUTER_ADDRESS = "0x92643Dc4F75C374b689774160CDea09A0704a9c2" // Uniswap Universal Router (for advanced/multi-protocol swaps)
export const QUOTER_V2_ADDRESS = "0x219b7ADebc0935a3eC889a148c6924D51A07535A" // Uniswap V3 QuoterV2 (primary quoter) - REAL ADDRESS
export const QUOTER_V1_ADDRESS = "0x3003B4FeAFF95e09683FEB7fc5d11b330cd79Dc7" // Uniswap V3 QuoterV1 (fallback)
export const TICK_LENS_ADDRESS = "0x095bBC37f439EEf5dcF733205B51447d03202E14" // Uniswap V3 TickLens (for tick data)
export const NONFUNGIBLE_TOKEN_POSITION_DESCRIPTOR_ADDRESS = "0xdaA4B06A6710576441367aB90b31689a562C4607" // For handling V3 LP NFTs

// IMPORTANT: These staking and marketplace addresses are placeholders.
// They MUST be replaced with actual deployed contract addresses from the Sonic ecosystem.
export const STAKING_POOL_FACTORY_ADDRESS = "0xPLACEHOLDERStakingPoolFactoryAddress" // Placeholder: Needs real address
export const MARKETPLACE_CONTRACT_ADDRESS = "0xPLACEHOLDERMarketplaceAddress" // Placeholder: Needs real address

// Application Constants
// General configuration parameters for the dApp.
export const APP_PAYMENT_RECEIVER_ADDRESS = "0x1e9f317cb3a0c3b23c9d82daec5a18d7895639f0" // Address for receiving fees/payments
export const PLATFORM_STAKING_POOL_DEPLOYMENT_FEE_S = "100" // Fee in "S" (Sonic native token) to deploy a staking pool
export const NFT_COLLECTION_LISTING_FEE_S = "100" // Fee in "S" to list an NFT collection

// Default Transaction Parameters
export const DEFAULT_SLIPPAGE_TOLERANCE = 0.5 // Default slippage tolerance for swaps (0.5% = 0.5)
export const DEFAULT_TRANSACTION_DEADLINE_MINUTES = 20 // Default transaction deadline in minutes

// Other Constants
export const UNLIMITED_MAX_MINTS_STRING = "340282366920938463463374607431768211455" // Represents max uint256

// Sonic Blockchain Information
// This defines the network configuration for the Sonic blockchain.
export const SONIC_MAINNET_INFO = {
  chainId: "146", // Example Chain ID for Sonic
  name: "Sonic",
  rpcUrl: "https://sonic-mainnet.g.alchemy.com/v2/2GzGjM9B-NezoBY9rxhk6jxnCjTJrmBR", // Real Alchemy RPC URL for Sonic
  explorerUrl: "https://explorer.soniclabs.com", // Example Explorer URL for Sonic
  currencySymbol: "S", // Native currency symbol
} as const
