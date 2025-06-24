// services/blockchainService.ts
import { ethers } from "ethers"
import type {
  LiquidityPool,
  Token,
  EthereumProvider,
  StakingPoolConfig,
  NFT,
  StakingPoolInfo,
  EthersProvider,
  EthersSigner,
  NftCollectionListingConfig,
  GasEstimate,
  SwapQuote,
} from "../types"
import {
  AVAILABLE_TOKENS,
  SWAP_ROUTER_ADDRESS,
  QUOTER_V2_ADDRESS,
  QUOTER_V1_ADDRESS,
  DEFAULT_TRANSACTION_DEADLINE_MINUTES,
  SLL_WS_POOL_ADDRESS,
  SONIC_MAINNET_INFO,
  MARKETPLACE_CONTRACT_ADDRESS,
} from "../constants"
import { LP_POOL_ABI, SWAP_ROUTER_ABI, ERC20_ABI, MARKETPLACE_ABI } from "./contractAbis"

// Augment the Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: EthereumProvider
  }
}

export const ethereum = window.ethereum

// --- Helper: Get Provider and Signer ---
const getProvider = (p?: EthersProvider): EthersProvider => {
  if (p) return p
  if (!ethereum) throw new Error("Wallet not connected or ethereum provider not available.")
  return new ethers.BrowserProvider(ethereum as any)
}

const getSigner = async (s?: EthersSigner, p?: EthersProvider): Promise<EthersSigner> => {
  if (s) return s
  const provider = getProvider(p)
  return provider.getSigner()
}

// Helper function to check if an address is a placeholder
const isPlaceholderAddress = (address: string): boolean => {
  return address.includes("PLACEHOLDER") || address.length < 20
}

// Helper function to get the correct token address for pool interactions
const getPoolTokenAddress = (token: Token): string => {
  // For native S token, use wS address for pool interactions
  if (token.symbol === "S" || token.address === "native") {
    const wsToken = AVAILABLE_TOKENS.find((t) => t.symbol === "wS")
    return wsToken?.address || token.address
  }
  return token.address
}

// Helper function to validate pool contract
const validatePoolContract = async (poolAddress: string, provider: EthersProvider): Promise<boolean> => {
  try {
    // Skip validation for placeholder addresses
    if (isPlaceholderAddress(poolAddress)) {
      console.log(`Skipping validation for placeholder pool address: ${poolAddress}`)
      return false
    }

    // Check if contract exists
    const code = await provider.getCode(poolAddress)
    if (code === "0x") {
      console.log(`No contract found at pool address: ${poolAddress}`)
      return false
    }

    // Try to create contract instance and call a simple function
    const poolContract = new ethers.Contract(poolAddress, LP_POOL_ABI, provider)

    // Test if the contract has the expected interface by calling a read-only function
    try {
      await poolContract.getReserves.staticCall()
      console.log(`Pool contract validated: ${poolAddress}`)
      return true
    } catch (interfaceError) {
      console.log(`Pool contract interface validation failed: ${poolAddress}`, interfaceError)
      return false
    }
  } catch (error) {
    console.log(`Pool contract validation error: ${poolAddress}`, error)
    return false
  }
}

// Helper function to validate SwapRouter contract
const validateSwapRouterContract = async (provider: EthersProvider): Promise<boolean> => {
  try {
    console.log(`Validating SwapRouter contract at: ${SWAP_ROUTER_ADDRESS}`)

    // Skip validation for placeholder addresses
    if (isPlaceholderAddress(SWAP_ROUTER_ADDRESS)) {
      console.log(`Skipping validation for placeholder SwapRouter address: ${SWAP_ROUTER_ADDRESS}`)
      return false
    }

    // Check if contract exists
    const code = await provider.getCode(SWAP_ROUTER_ADDRESS)
    if (code === "0x") {
      console.log(`No contract found at SwapRouter address: ${SWAP_ROUTER_ADDRESS}`)
      return false
    }

    console.log(`Contract code found at SwapRouter address, length: ${code.length}`)
    console.log(`SwapRouter contract validated successfully: ${SWAP_ROUTER_ADDRESS}`)
    return true
  } catch (error: any) {
    console.log(`SwapRouter contract validation error:`, error.message)
    return false
  }
}

// Helper function to validate QuoterV2 contract
const validateQuoterV2Contract = async (provider: EthersProvider): Promise<boolean> => {
  try {
    console.log(`Validating QuoterV2 contract at: ${QUOTER_V2_ADDRESS}`)

    // This is a real QuoterV2 address, so validate it properly
    const code = await provider.getCode(QUOTER_V2_ADDRESS)
    if (code === "0x") {
      console.log(`No contract found at QuoterV2 address: ${QUOTER_V2_ADDRESS}`)
      return false
    }

    console.log(`Contract code found at QuoterV2 address, length: ${code.length}`)
    console.log(`QuoterV2 contract validated successfully: ${QUOTER_V2_ADDRESS}`)
    return true
  } catch (error: any) {
    console.log(`QuoterV2 contract validation error:`, error.message)
    return false
  }
}

// Helper function to validate QuoterV1 contract
const validateQuoterV1Contract = async (provider: EthersProvider): Promise<boolean> => {
  try {
    console.log(`Validating QuoterV1 contract at: ${QUOTER_V1_ADDRESS}`)

    // Skip validation for placeholder addresses
    if (isPlaceholderAddress(QUOTER_V1_ADDRESS)) {
      console.log(`Skipping validation for placeholder QuoterV1 address: ${QUOTER_V1_ADDRESS}`)
      return false
    }

    // Check if contract exists
    const code = await provider.getCode(QUOTER_V1_ADDRESS)
    if (code === "0x") {
      console.log(`No contract found at QuoterV1 address: ${QUOTER_V1_ADDRESS}`)
      return false
    }

    console.log(`Contract code found at QuoterV1 address, length: ${code.length}`)
    console.log(`QuoterV1 contract validated successfully: ${QUOTER_V1_ADDRESS}`)
    return true
  } catch (error: any) {
    console.log(`QuoterV1 contract validation error:`, error.message)
    return false
  }
}

// Helper function to get the appropriate token address for swaps
const getSwapTokenAddress = (token: Token): string => {
  // For native S token, we need to use wS address in swaps
  if (token.symbol === "S" || token.address === "native") {
    const wsToken = AVAILABLE_TOKENS.find((t) => t.symbol === "wS")
    if (!wsToken) {
      throw new Error("Wrapped Sonic (wS) token not found in available tokens")
    }
    return wsToken.address
  }
  return token.address
}

// Generate mock swap quote as fallback
const generateMockSwapQuote = (tokenInSymbol: string, tokenOutSymbol: string, amountIn: string): string => {
  // Mock price data for demonstration purposes
  const MOCK_TOKEN_PRICES: Record<string, number> = {
    s: 1.0, // Native token baseline
    sll: 1.0, // SLL token (similar value to S for demo)
    ws: 1.0, // Wrapped Sonic (same as S)
    usdc: 1.0, // Stablecoin
    usdt: 1.0, // Stablecoin
    weth: 2500.0, // Mock ETH price
    wbtc: 45000.0, // Mock BTC price
    dai: 1.0, // Stablecoin
  }

  const priceIn = MOCK_TOKEN_PRICES[tokenInSymbol.toLowerCase()] || 1.0
  const priceOut = MOCK_TOKEN_PRICES[tokenOutSymbol.toLowerCase()] || 1.0

  const amountInNum = Number.parseFloat(amountIn)
  if (amountInNum <= 0) return "0"

  const exchangeRate = priceIn / priceOut

  // Add some mock slippage (0.3% fee + 0.1% slippage)
  const slippageMultiplier = 0.996
  const amountOut = amountInNum * exchangeRate * slippageMultiplier

  return amountOut.toFixed(6)
}

// QuoterV2 ABI - Updated with proper struct parameters
export const QUOTER_V2_ABI = [
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "tokenIn", type: "address" },
          { internalType: "address", name: "tokenOut", type: "address" },
          { internalType: "uint24", name: "fee", type: "uint24" },
          { internalType: "uint256", name: "amountIn", type: "uint256" },
          { internalType: "uint160", name: "sqrtPriceLimitX96", type: "uint160" },
        ],
        internalType: "struct IQuoterV2.QuoteExactInputSingleParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "quoteExactInputSingle",
    outputs: [
      { internalType: "uint256", name: "amountOut", type: "uint256" },
      { internalType: "uint160", name: "sqrtPriceX96After", type: "uint160" },
      { internalType: "uint32", name: "initializedTicksCrossed", type: "uint32" },
      { internalType: "uint256", name: "gasEstimate", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes", name: "path", type: "bytes" },
      { internalType: "uint256", name: "amountIn", type: "uint256" },
    ],
    name: "quoteExactInput",
    outputs: [
      { internalType: "uint256", name: "amountOut", type: "uint256" },
      { internalType: "uint160[]", name: "sqrtPriceX96AfterList", type: "uint160[]" },
      { internalType: "uint32[]", name: "initializedTicksCrossedList", type: "uint32[]" },
      { internalType: "uint256", name: "gasEstimate", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const

// Replace the existing QUOTER_V1_ABI import with this complete definition
export const QUOTER_V1_ABI = [
  {
    inputs: [
      { internalType: "address", name: "tokenIn", type: "address" },
      { internalType: "address", name: "tokenOut", type: "address" },
      { internalType: "uint24", name: "fee", type: "uint24" },
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "uint160", name: "sqrtPriceLimitX96", type: "uint160" },
    ],
    name: "quoteExactInputSingle",
    outputs: [{ internalType: "uint256", name: "amountOut", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes", name: "path", type: "bytes" },
      { internalType: "uint256", name: "amountIn", type: "uint256" },
    ],
    name: "quoteExactInput",
    outputs: [{ internalType: "uint256", name: "amountOut", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const

// Enhanced QuoterV2 quote function with struct parameters
const getQuoterV2Quote = async (
  tokenIn: string,
  tokenOut: string,
  amountIn: string,
  fee: number,
  provider: EthersProvider,
): Promise<string> => {
  try {
    console.log(`Getting QuoterV2 quote: ${tokenIn} -> ${tokenOut}, amount: ${amountIn}, fee: ${fee}`)

    // Validate QuoterV2 contract first
    const isValidQuoter = await validateQuoterV2Contract(provider)
    if (!isValidQuoter) {
      throw new Error("QuoterV2 contract validation failed")
    }

    const quoterContract = new ethers.Contract(QUOTER_V2_ADDRESS, QUOTER_V2_ABI, provider)

    // Parse amount to BigInt with proper decimals
    const tokenInInfo = AVAILABLE_TOKENS.find((t) => t.address.toLowerCase() === tokenIn.toLowerCase())
    if (!tokenInInfo) {
      throw new Error(`Token info not found for input token: ${tokenIn}`)
    }

    const amountInBN = ethers.parseUnits(amountIn, tokenInInfo.decimals)

    console.log(`Calling QuoterV2.quoteExactInputSingle with struct params:`, {
      tokenIn,
      tokenOut,
      fee,
      amountIn: amountInBN.toString(),
      sqrtPriceLimitX96: 0,
    })

    // Use the struct-based parameter format
    const quoteParams = {
      tokenIn: tokenIn,
      tokenOut: tokenOut,
      fee: fee,
      amountIn: amountInBN,
      sqrtPriceLimitX96: 0n, // No price limit
    }

    let result: any

    try {
      // QuoterV2 returns multiple values: [amountOut, sqrtPriceX96After, initializedTicksCrossed, gasEstimate]
      result = await quoterContract.quoteExactInputSingle.staticCall(quoteParams)
    } catch (staticError: any) {
      console.log("QuoterV2 static call failed:", staticError.message)

      // Handle the specific "missing revert data" error
      if (staticError.data === "0x" || staticError.message.includes("missing revert data")) {
        throw new Error("Pool might not exist, no active liquidity, or amount is too low for this trading pair")
      }

      // Check for specific pool-related errors
      if (staticError.message.includes("Pool does not exist")) {
        throw new Error(`No liquidity pool exists for ${tokenIn}/${tokenOut} with ${fee} fee tier`)
      }

      throw new Error(`QuoterV2 quote failed: ${staticError.reason || staticError.message}`)
    }

    // Extract amountOut from the result (first element)
    const amountOut = result[0] || result.amountOut

    if (!amountOut || amountOut === 0n) {
      throw new Error("QuoterV2 returned zero or invalid result")
    }

    // Format the output amount
    const tokenOutInfo = AVAILABLE_TOKENS.find((t) => t.address.toLowerCase() === tokenOut.toLowerCase())
    if (!tokenOutInfo) {
      throw new Error(`Token info not found for output token: ${tokenOut}`)
    }

    const formattedAmountOut = ethers.formatUnits(amountOut, tokenOutInfo.decimals)
    console.log(`QuoterV2 quote result: ${formattedAmountOut} ${tokenOutInfo.symbol} (fee: ${fee})`)

    return formattedAmountOut
  } catch (error: any) {
    console.warn("QuoterV2 quote failed:", error.message)
    throw error
  }
}

// Enhanced QuoterV1 quote function with better error handling
const getQuoterV1Quote = async (
  tokenIn: string,
  tokenOut: string,
  amountIn: string,
  fee: number,
  provider: EthersProvider,
): Promise<string> => {
  try {
    console.log(`Getting QuoterV1 quote: ${tokenIn} -> ${tokenOut}, amount: ${amountIn}, fee: ${fee}`)

    // Validate QuoterV1 contract first
    const isValidQuoter = await validateQuoterV1Contract(provider)
    if (!isValidQuoter) {
      throw new Error("QuoterV1 contract validation failed - using placeholder or invalid address")
    }

    const quoterContract = new ethers.Contract(QUOTER_V1_ADDRESS, QUOTER_V1_ABI, provider)

    // Parse amount to BigInt with proper decimals
    const tokenInInfo = AVAILABLE_TOKENS.find((t) => t.address.toLowerCase() === tokenIn.toLowerCase())
    if (!tokenInInfo) {
      throw new Error(`Token info not found for input token: ${tokenIn}`)
    }

    const amountInBN = ethers.parseUnits(amountIn, tokenInInfo.decimals)

    console.log(`Calling quoteExactInputSingle with:`, {
      tokenIn,
      tokenOut,
      fee,
      amountIn: amountInBN.toString(),
      sqrtPriceLimitX96: 0,
    })

    // Use callStatic to handle the revert-with-data mechanism properly
    let amountOut: bigint

    try {
      // Method 1: Try callStatic for proper revert-with-data handling
      amountOut = await quoterContract.quoteExactInputSingle.staticCall(
        tokenIn,
        tokenOut,
        fee,
        amountInBN,
        0, // sqrtPriceLimitX96 = 0 (no price limit)
      )
    } catch (staticError: any) {
      console.log("Static call failed:", staticError.message)

      // Handle the specific "missing revert data" error
      if (staticError.data && staticError.data !== "0x") {
        try {
          // Attempt to decode the revert data as uint256 (amountOut)
          const decoded = ethers.AbiCoder.defaultAbiCoder().decode(["uint256"], staticError.data)
          amountOut = decoded[0]
          console.log("Successfully decoded amountOut from revert data:", amountOut.toString())
        } catch (decodeError) {
          console.log("Could not decode revert data as amountOut:", decodeError)
          throw new Error(`QuoterV1 quote failed: ${staticError.reason || staticError.message}`)
        }
      } else {
        throw new Error(`QuoterV1 quote failed: ${staticError.reason || staticError.message}`)
      }
    }

    // Format the output amount
    const tokenOutInfo = AVAILABLE_TOKENS.find((t) => t.address.toLowerCase() === tokenOut.toLowerCase())
    if (!tokenOutInfo) {
      throw new Error(`Token info not found for output token: ${tokenOut}`)
    }

    const formattedAmountOut = ethers.formatUnits(amountOut, tokenOutInfo.decimals)
    console.log(`QuoterV1 quote result: ${formattedAmountOut} ${tokenOutInfo.symbol}`)

    return formattedAmountOut
  } catch (error: any) {
    console.warn("QuoterV1 quote failed:", error.message)
    throw error
  }
}

// Multi-fee-tier quote function with better error handling
const getMultiFeeQuote = async (
  tokenIn: string,
  tokenOut: string,
  amountIn: string,
  provider: EthersProvider,
): Promise<string> => {
  const feeTiers = [500, 3000, 10000] // 0.05%, 0.3%, 1%
  let bestAmountOut = "0"
  let bestFeeTier: number | null = null
  let lastError: string | null = null

  for (const fee of feeTiers) {
    try {
      const currentAmountOut = await getQuoterV2Quote(tokenIn, tokenOut, amountIn, fee, provider)
      if (Number.parseFloat(currentAmountOut) > Number.parseFloat(bestAmountOut)) {
        bestAmountOut = currentAmountOut
        bestFeeTier = fee
      }
    } catch (error: any) {
      lastError = error.message
      console.warn(`Could not get quote for fee tier ${fee}:`, error.message)
      continue
    }
  }

  if (Number.parseFloat(bestAmountOut) === 0) {
    throw new Error(lastError || "Could not get a successful quote for any fee tier")
  }

  console.log(`Best quote found: ${bestAmountOut} (Fee Tier: ${bestFeeTier} BPS)`)
  return bestAmountOut
}

// Mock implementation for getPoolBasedQuote
const getPoolBasedQuote = async (
  tokenInAddress: string,
  tokenOutAddress: string,
  amountIn: string,
  provider: EthersProvider,
): Promise<string> => {
  console.log("Using mock pool-based quote since real pools are not available")
  return generateMockSwapQuote(
    AVAILABLE_TOKENS.find((t) => t.address.toLowerCase() === tokenInAddress.toLowerCase())?.symbol || "unknown",
    AVAILABLE_TOKENS.find((t) => t.address.toLowerCase() === tokenOutAddress.toLowerCase())?.symbol || "unknown",
    amountIn,
  )
}

// Update the main quote function with better fallback logic
export const getSwapAmountOut = async (
  tokenInAddress: string,
  tokenOutAddress: string,
  amountIn: string,
  p?: EthersProvider,
): Promise<string> => {
  const provider = getProvider(p)
  const tokenIn = AVAILABLE_TOKENS.find((t) => t.address.toLowerCase() === tokenInAddress.toLowerCase())
  const tokenOut = AVAILABLE_TOKENS.find((t) => t.address.toLowerCase() === tokenOutAddress.toLowerCase())

  if (!tokenIn || !tokenOut) throw new Error("Invalid token for swap.")

  console.log(`Getting swap quote: ${tokenIn.symbol} → ${tokenOut.symbol}`)

  // Get the actual token addresses for the swap (handle native tokens)
  const tokenInSwapAddress = getSwapTokenAddress(tokenIn)
  const tokenOutSwapAddress = getSwapTokenAddress(tokenOut)

  // Check if we're using placeholder token addresses (but QuoterV2 is real)
  const hasPlaceholderTokens = isPlaceholderAddress(tokenInSwapAddress) || isPlaceholderAddress(tokenOutSwapAddress)

  if (hasPlaceholderTokens) {
    console.log("Using mock quote due to placeholder token addresses")
    return generateMockSwapQuote(tokenIn.symbol, tokenOut.symbol, amountIn)
  }

  // Try quote methods in order of preference - QuoterV2 first since it's a real address
  const quoteMethods = [
    {
      name: "Multi-Fee QuoterV2",
      method: () => getMultiFeeQuote(tokenInSwapAddress, tokenOutSwapAddress, amountIn, provider),
    },
    {
      name: "QuoterV2 (3000 fee)",
      method: () => getQuoterV2Quote(tokenInSwapAddress, tokenOutSwapAddress, amountIn, 3000, provider),
    },
    {
      name: "QuoterV2 (500 fee)",
      method: () => getQuoterV2Quote(tokenInSwapAddress, tokenOutSwapAddress, amountIn, 500, provider),
    },
    {
      name: "QuoterV2 (10000 fee)",
      method: () => getQuoterV2Quote(tokenInSwapAddress, tokenOutSwapAddress, amountIn, 10000, provider),
    },
    {
      name: "Pool-based",
      method: () => getPoolBasedQuote(tokenInSwapAddress, tokenOutSwapAddress, amountIn, provider),
    },
    {
      name: "Mock",
      method: () => Promise.resolve(generateMockSwapQuote(tokenIn.symbol, tokenOut.symbol, amountIn)),
    },
  ]

  for (const quoteMethod of quoteMethods) {
    try {
      console.log(`Trying ${quoteMethod.name} quote method...`)
      const result = await quoteMethod.method()
      console.log(`${quoteMethod.name} quote successful: ${result}`)
      return result
    } catch (error: any) {
      console.warn(`${quoteMethod.name} quote failed:`, error.message)
      continue
    }
  }

  // If all methods fail, return a basic mock quote
  console.warn("All quote methods failed, using basic fallback")
  return generateMockSwapQuote(tokenIn.symbol, tokenOut.symbol, amountIn)
}

// Function to estimate gas for SwapRouter swap
const estimateSwapRouterGas = async (
  tokenIn: Token,
  tokenOut: Token,
  amountIn: string,
  amountOutMin: string,
  userAddress: string,
  provider: EthersProvider,
): Promise<GasEstimate> => {
  try {
    // Skip gas estimation for placeholder addresses
    if (isPlaceholderAddress(SWAP_ROUTER_ADDRESS)) {
      console.log("Using mock gas estimate due to placeholder SwapRouter address")
      return {
        gasLimit: "300000",
        gasPrice: "20000000000", // 20 gwei
        gasCostInWei: ethers.parseUnits("0.006", "ether").toString(),
        gasCostInEth: "0.006",
      }
    }

    // Check if we're dealing with placeholder token addresses
    const tokenInSwapAddress = getSwapTokenAddress(tokenIn)
    const tokenOutSwapAddress = getSwapTokenAddress(tokenOut)

    if (isPlaceholderAddress(tokenInSwapAddress) || isPlaceholderAddress(tokenOutSwapAddress)) {
      console.log("Using mock gas estimate due to placeholder token addresses")
      return {
        gasLimit: "300000",
        gasPrice: "20000000000", // 20 gwei
        gasCostInWei: ethers.parseUnits("0.006", "ether").toString(),
        gasCostInEth: "0.006",
      }
    }

    const swapRouterContract = new ethers.Contract(SWAP_ROUTER_ADDRESS, SWAP_ROUTER_ABI, provider)

    const rawAmountIn = ethers.parseUnits(amountIn, tokenIn.decimals)
    const rawAmountOutMin = ethers.parseUnits(amountOutMin, tokenOut.decimals)
    const deadline = Math.floor(Date.now() / 1000) + DEFAULT_TRANSACTION_DEADLINE_MINUTES * 60

    const isNativeTokenIn = tokenIn.symbol === "S" || tokenIn.address === "native"

    const swapParams = {
      tokenIn: tokenInSwapAddress,
      tokenOut: tokenOutSwapAddress,
      fee: 3000,
      recipient: userAddress,
      deadline: deadline,
      amountIn: rawAmountIn,
      amountOutMinimum: rawAmountOutMin,
      sqrtPriceLimitX96: 0,
    }

    const overrides: any = {}
    if (isNativeTokenIn) {
      overrides.value = rawAmountIn
    }

    // Try to estimate gas, but catch specific errors
    let gasEstimate: bigint
    let gasPrice: bigint

    try {
      gasEstimate = await swapRouterContract.exactInputSingle.estimateGas(swapParams, overrides)

      // Safely get gas price with fallback
      try {
        gasPrice = await provider.getGasPrice()
      } catch (gasPriceError) {
        console.warn("Could not fetch gas price, using fallback:", gasPriceError)
        gasPrice = ethers.parseUnits("20", "gwei") // 20 gwei fallback
      }
    } catch (estimateError: any) {
      console.warn("Gas estimation failed, using fallback:", estimateError.message)

      // Check for specific error types that indicate the swap would fail
      if (
        estimateError.message.includes("missing revert data") ||
        estimateError.message.includes("CALL_EXCEPTION") ||
        estimateError.message.includes("execution reverted") ||
        estimateError.code === "CALL_EXCEPTION"
      ) {
        // This likely means the pool doesn't exist or has no liquidity
        console.log("Swap would likely fail - pool may not exist or have insufficient liquidity")

        // Return a conservative estimate for display purposes
        let fallbackGasPrice: bigint
        try {
          fallbackGasPrice = await provider.getGasPrice()
        } catch (gasPriceError) {
          console.warn("Could not fetch gas price for fallback, using default:", gasPriceError)
          fallbackGasPrice = ethers.parseUnits("20", "gwei")
        }

        return {
          gasLimit: "350000", // Higher estimate for failed swaps
          gasPrice: fallbackGasPrice.toString(),
          gasCostInWei: (BigInt(350000) * fallbackGasPrice).toString(),
          gasCostInEth: ethers.formatEther(BigInt(350000) * fallbackGasPrice),
        }
      }

      // For other errors, throw to be caught by outer catch
      throw estimateError
    }

    const gasLimit = gasEstimate.toString()
    const gasCostInWei = gasEstimate * gasPrice
    const gasCostInEth = ethers.formatEther(gasCostInWei)

    return {
      gasLimit,
      gasPrice: gasPrice.toString(),
      gasCostInWei: gasCostInWei.toString(),
      gasCostInEth,
    }
  } catch (error: any) {
    console.error("Gas estimation failed:", error)

    // Return mock gas estimate as final fallback
    let fallbackGasPrice: bigint
    try {
      fallbackGasPrice = await provider.getGasPrice()
    } catch (gasPriceError) {
      console.warn("Could not fetch gas price for final fallback, using default:", gasPriceError)
      fallbackGasPrice = ethers.parseUnits("20", "gwei")
    }

    return {
      gasLimit: "300000",
      gasPrice: fallbackGasPrice.toString(),
      gasCostInWei: (BigInt(300000) * fallbackGasPrice).toString(),
      gasCostInEth: ethers.formatEther(BigInt(300000) * fallbackGasPrice),
    }
  }
}

export const getSwapQuoteV2 = async (
  tokenInAddress: string,
  tokenOutAddress: string,
  amountIn: string,
  fee = 3000,
  p?: EthersProvider,
): Promise<SwapQuote> => {
  const provider = getProvider(p)
  const tokenIn = AVAILABLE_TOKENS.find((t) => t.address.toLowerCase() === tokenInAddress.toLowerCase())
  const tokenOut = AVAILABLE_TOKENS.find((t) => t.address.toLowerCase() === tokenOutAddress.toLowerCase())

  if (!tokenIn || !tokenOut) throw new Error("Invalid token for swap.")

  try {
    const amountOut = await getSwapAmountOut(tokenInAddress, tokenOutAddress, amountIn, provider)
    return {
      amountOut,
      gasEstimate: "300000", // Conservative estimate
      route: [tokenIn.symbol, tokenOut.symbol],
    }
  } catch (error) {
    console.warn("Swap quote failed, using mock quote:", error)
    // Fallback to mock quote
    const amountOut = generateMockSwapQuote(tokenIn.symbol, tokenOut.symbol, amountIn)
    return {
      amountOut,
      gasEstimate: "250000", // Mock gas estimate
      route: [tokenIn.symbol, tokenOut.symbol],
    }
  }
}

export const swapTokensEnhanced = async (
  tokenInAddress: string,
  tokenOutAddress: string,
  amountIn: string,
  amountOutMin: string,
  userAddress: string,
  slippageTolerance = 0.5,
  s?: EthersSigner,
  p?: EthersProvider,
): Promise<string> => {
  const signer = await getSigner(s, p)
  const provider = signer.provider as EthersProvider

  // Validate inputs
  if (!amountIn || Number.parseFloat(amountIn) <= 0) {
    throw new Error("Invalid input amount")
  }

  if (!ethers.isAddress(userAddress)) {
    throw new Error("Invalid user address")
  }

  const tokenIn = AVAILABLE_TOKENS.find((t) => t.address.toLowerCase() === tokenInAddress.toLowerCase())
  const tokenOut = AVAILABLE_TOKENS.find((t) => t.address.toLowerCase() === tokenOutAddress.toLowerCase())

  if (!tokenIn || !tokenOut) {
    throw new Error("Token configuration not found")
  }

  // Check for placeholder addresses early
  if (isPlaceholderAddress(SWAP_ROUTER_ADDRESS)) {
    console.log("SwapRouter address is placeholder, simulating swap transaction...")

    // Simulate a successful swap for development/demo purposes
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`
    console.log("Mock swap transaction:", mockTxHash)

    return mockTxHash
  }

  // Additional validation for token addresses
  const tokenInSwapAddress = getSwapTokenAddress(tokenIn)
  const tokenOutSwapAddress = getSwapTokenAddress(tokenOut)

  if (isPlaceholderAddress(tokenInSwapAddress) || isPlaceholderAddress(tokenOutSwapAddress)) {
    console.log("Token addresses contain placeholders, simulating swap transaction...")

    // Simulate a successful swap for development/demo purposes
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`
    console.log("Mock swap transaction:", mockTxHash)

    return mockTxHash
  }

  // Check for placeholder addresses
  if (isPlaceholderAddress(SWAP_ROUTER_ADDRESS)) {
    throw new Error("SwapRouter contract address is a placeholder. Please update with real contract address.")
  }

  console.log(`Executing swap via SwapRouter: ${amountIn} ${tokenIn.symbol} → ${tokenOut.symbol}`)

  try {
    // Create SwapRouter contract instance
    console.log("Creating SwapRouter contract instance...")
    const swapRouterContract = new ethers.Contract(SWAP_ROUTER_ADDRESS, SWAP_ROUTER_ABI, signer)

    const rawAmountIn = ethers.parseUnits(amountIn, tokenIn.decimals)
    const rawAmountOutMin = ethers.parseUnits(amountOutMin, tokenOut.decimals)
    const deadline = Math.floor(Date.now() / 1000) + DEFAULT_TRANSACTION_DEADLINE_MINUTES * 60

    // Determine if this is a native token swap
    const isNativeTokenIn = tokenIn.symbol === "S" || tokenIn.address === "native"
    const isNativeTokenOut = tokenOut.symbol === "S" || tokenOut.address === "native"

    // Get the actual token addresses for the swap
    const tokenInSwapAddress = getSwapTokenAddress(tokenIn)
    const tokenOutSwapAddress = getSwapTokenAddress(tokenOut)

    // Prepare swap parameters
    const swapParams = {
      tokenIn: tokenInSwapAddress,
      tokenOut: tokenOutSwapAddress,
      fee: 3000, // 0.3% fee tier
      recipient: userAddress,
      deadline: deadline,
      amountIn: rawAmountIn,
      amountOutMinimum: rawAmountOutMin,
      sqrtPriceLimitX96: 0, // No price limit
    }

    console.log("SwapRouter swap parameters:", {
      ...swapParams,
      isNativeTokenIn,
      isNativeTokenOut,
      tokenInSymbol: tokenIn.symbol,
      tokenOutSymbol: tokenOut.symbol,
    })

    // Get conservative gas estimate
    const gasEstimate = await estimateSwapRouterGas(tokenIn, tokenOut, amountIn, amountOutMin, userAddress, provider)

    console.log("Gas estimate:", gasEstimate)

    // Execute the swap with conservative gas limit
    const gasLimit = Math.floor(Number(gasEstimate.gasLimit) * 1.2) // 20% buffer
    const overrides: any = {
      gasLimit: ethers.toBigInt(gasLimit),
    }

    // For native token swaps, include the value
    if (isNativeTokenIn) {
      overrides.value = rawAmountIn
    }

    console.log("Executing SwapRouter swap with overrides:", overrides)

    // Handle native token output with multicall if needed
    if (isNativeTokenOut) {
      // For swaps that output native tokens, we need to unwrap WETH
      const swapCalldata = swapRouterContract.interface.encodeFunctionData("exactInputSingle", [swapParams])
      const unwrapCalldata = swapRouterContract.interface.encodeFunctionData("unwrapWETH9", [
        rawAmountOutMin,
        userAddress,
      ])
      const refundCalldata = swapRouterContract.interface.encodeFunctionData("refundETH", [])

      const tx = await swapRouterContract.multicall([swapCalldata, unwrapCalldata, refundCalldata], overrides)
      console.log("SwapRouter multicall transaction submitted:", tx.hash)
      const receipt = await tx.wait()
      console.log("SwapRouter multicall transaction confirmed:", receipt.hash)
      return receipt.hash
    } else {
      // Standard ERC20 to ERC20 swap
      const tx = await swapRouterContract.exactInputSingle(swapParams, overrides)
      console.log("SwapRouter swap transaction submitted:", tx.hash)
      const receipt = await tx.wait()
      console.log("SwapRouter swap transaction confirmed:", receipt.hash)
      return receipt.hash
    }
  } catch (error: any) {
    console.error("SwapRouter swap failed:", error)

    // Enhanced error handling
    const errorMessage = error.message || ""
    const errorCode = error.code || ""

    if (errorMessage.includes("Too little received") || errorMessage.includes("INSUFFICIENT_OUTPUT_AMOUNT")) {
      throw new Error("Insufficient output amount. Try increasing slippage tolerance or reducing swap amount.")
    }

    if (errorMessage.includes("STF") || errorMessage.includes("INSUFFICIENT_LIQUIDITY")) {
      throw new Error(
        "Insufficient liquidity for this trading pair. This pair may not have active liquidity pools yet.",
      )
    }

    if (errorMessage.includes("Transaction too old") || errorMessage.includes("EXPIRED")) {
      throw new Error("Transaction deadline exceeded. Please try again with a longer deadline.")
    }

    if (errorMessage.includes("transfer amount exceeds allowance") || errorMessage.includes("TRANSFER_FROM_FAILED")) {
      throw new Error("Token transfer failed. Please check your token allowance and balance.")
    }

    if (errorMessage.includes("execution reverted") || errorMessage.includes("CALL_EXCEPTION")) {
      throw new Error(
        "Swap execution failed. This trading pair may not have sufficient liquidity or may not exist yet. Please try a different token pair or check if the pools are active.",
      )
    }

    if (errorCode === "INSUFFICIENT_FUNDS") {
      throw new Error("Insufficient funds for gas fees. Please ensure you have enough native tokens.")
    }

    if (errorCode === "UNPREDICTABLE_GAS_LIMIT" || errorMessage.includes("cannot estimate gas")) {
      throw new Error(
        "Cannot estimate gas for this swap. The trading pair may not exist or have insufficient liquidity. Please try a different token pair.",
      )
    }

    if (errorMessage.includes("nonce too low")) {
      throw new Error("Transaction nonce error. Please try again or reset your wallet.")
    }

    if (errorMessage.includes("replacement transaction underpriced")) {
      throw new Error("Transaction replacement failed. Please wait for the previous transaction to complete.")
    }

    // Generic error fallback with more context
    throw new Error(
      `Swap failed: This trading pair may not be available yet or may lack sufficient liquidity. Please try different tokens or check if the liquidity pools are active. Error: ${errorMessage || "Unknown error"}`,
    )
  }
}

// --- Liquidity Pool Functions ---
export const fetchLiquidityPools = async (
  walletAddress: string | null,
  provider?: EthersProvider,
): Promise<LiquidityPool[]> => {
  const web3Provider = getProvider(provider)
  const pools: LiquidityPool[] = []

  // Skip pool fetching if using placeholder addresses
  if (isPlaceholderAddress(SLL_WS_POOL_ADDRESS)) {
    console.log("Skipping pool fetching due to placeholder pool address")
    return pools
  }

  // First, add the known SLL/wS pool
  try {
    const sllToken = AVAILABLE_TOKENS.find((t) => t.symbol === "SLL")
    const wsToken = AVAILABLE_TOKENS.find((t) => t.symbol === "wS")

    if (sllToken && wsToken) {
      // Validate pool contract first
      const isValidPool = await validatePoolContract(SLL_WS_POOL_ADDRESS, web3Provider)
      if (!isValidPool) {
        console.warn("SLL/wS pool contract validation failed, skipping")
        return pools
      }

      const poolContract = new ethers.Contract(SLL_WS_POOL_ADDRESS, LP_POOL_ABI, web3Provider)

      try {
        const reserves = await poolContract.getReserves()
        const token0Address = await poolContract.token0()
        const token1Address = await poolContract.token1()

        // Determine which token is token0 and token1
        const isSLL0 = sllToken.address.toLowerCase() === token0Address.toLowerCase()
        const token0 = isSLL0 ? sllToken : wsToken
        const token1 = isSLL0 ? wsToken : sllToken

        const reserve0Str = ethers.formatUnits(reserves._reserve0, token0.decimals)
        const reserve1Str = ethers.formatUnits(reserves._reserve1, token1.decimals)
        const totalSupplyLP = await poolContract.totalSupply()
        const totalSupplyLPStr = ethers.formatUnits(totalSupplyLP, 18)

        let userLpBalanceStr = "0"
        let userSharePercentage = 0

        if (walletAddress) {
          try {
            const lpBalance = await poolContract.balanceOf(walletAddress)
            userLpBalanceStr = ethers.formatUnits(lpBalance, 18)
            if (totalSupplyLP > 0n) {
              userSharePercentage = (Number.parseFloat(userLpBalanceStr) / Number.parseFloat(totalSupplyLPStr)) * 100
            }
          } catch (balanceError) {
            console.warn("Error fetching user LP balance:", balanceError)
          }
        }

        // Calculate TVL in USD (using mock prices for now)
        const reserve0Value = Number.parseFloat(reserve0Str) * 1 // Assume $1 per token for demo
        const reserve1Value = Number.parseFloat(reserve1Str) * 1
        const totalLiquidityUSD = reserve0Value + reserve1Value

        pools.push({
          id: SLL_WS_POOL_ADDRESS,
          poolAddress: SLL_WS_POOL_ADDRESS,
          name: `${token0.symbol}/${token1.symbol}`,
          token1: token0,
          token2: token1,
          token1Address: token0.address,
          token2Address: token1.address,
          lpTokenAddress: SLL_WS_POOL_ADDRESS,
          reserve1: reserve0Str,
          reserve2: reserve1Str,
          totalSupplyLP: totalSupplyLPStr,
          userLpBalance: userLpBalanceStr,
          userSharePercentage: userSharePercentage,
          apy: 15.8, // Mock APY for SLL/wS pool
          totalLiquidityUSD: totalLiquidityUSD,
        })

        console.log("Successfully loaded SLL/wS pool:", SLL_WS_POOL_ADDRESS)
        console.log(`Pool reserves: ${reserve0Str} ${token0.symbol}, ${reserve1Str} ${token1.symbol}`)
      } catch (poolError) {
        console.warn("Error loading SLL/wS pool details:", poolError)
      }
    }
  } catch (error) {
    console.warn("Error setting up known pools:", error)
  }

  return pools
}

export const addLiquidity = async (
  token1Address: string,
  token2Address: string,
  amount1Desired: string,
  amount2Desired: string,
  userAddress: string,
  s?: EthersSigner,
  p?: EthersProvider,
): Promise<string> => {
  const signerInstance = await getSigner(s, p)

  const token1 = AVAILABLE_TOKENS.find((t) => t.address.toLowerCase() === token1Address.toLowerCase())
  const token2 = AVAILABLE_TOKENS.find((t) => t.address.toLowerCase() === token2Address.toLowerCase())
  if (!token1 || !token2) throw new Error("Invalid token addresses for adding liquidity.")

  console.log(`Adding liquidity: ${amount1Desired} ${token1.symbol} + ${amount2Desired} ${token2.symbol}`)

  // For now, simulate liquidity addition since it requires NonfungiblePositionManager
  await new Promise((resolve) => setTimeout(resolve, 2000))

  const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`
  console.log("Mock add liquidity transaction:", mockTxHash)

  return mockTxHash
}

export const removeLiquidity = async (
  token1Address: string,
  token2Address: string,
  lpTokenAmount: string,
  userAddress: string,
  s?: EthersSigner,
  p?: EthersProvider,
): Promise<string> => {
  const signerInstance = await getSigner(s, p)

  const token1 = AVAILABLE_TOKENS.find((t) => t.address.toLowerCase() === token1Address.toLowerCase())
  const token2 = AVAILABLE_TOKENS.find((t) => t.address.toLowerCase() === token2Address.toLowerCase())
  if (!token1 || !token2) throw new Error("Invalid token addresses for removing liquidity.")

  console.log(`Removing liquidity: ${lpTokenAmount} LP tokens from ${token1.symbol}/${token2.symbol} pool`)

  // For now, simulate liquidity removal since it requires NonfungiblePositionManager
  await new Promise((resolve) => setTimeout(resolve, 2000))

  const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`
  console.log("Mock remove liquidity transaction:", mockTxHash)

  return mockTxHash
}

export const createLiquidityPool = async (
  tokenAAddress: string,
  tokenBAddress: string,
  initialAmountA: string,
  initialAmountB: string,
  userAddress: string,
  s?: EthersSigner,
  p?: EthersProvider,
): Promise<string> => {
  console.log("Creating new liquidity pool...")
  console.log(`Tokens: ${tokenAAddress} / ${tokenBAddress}`)
  console.log(`Initial amounts: ${initialAmountA} / ${initialAmountB}`)

  // For now, simulate pool creation since it requires factory contract
  await new Promise((resolve) => setTimeout(resolve, 2000))

  const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`
  console.log("Mock pool creation transaction:", mockTxHash)

  return mockTxHash
}

// --- NFT Functions ---
export const fetchUserNfts = async (userAddress: string, p?: EthersProvider): Promise<NFT[]> => {
  const provider = getProvider(p)
  const nfts: NFT[] = []

  // This is a placeholder implementation
  // In a real app, you'd query NFT contracts or use an NFT API service
  console.log(`Fetching NFTs for user: ${userAddress}`)

  // Mock NFT data for demonstration
  return [
    {
      id: "sonic-llama-1",
      contractAddress: "0x0dcbf9741bbc21b7696ca73f5f87731c9a3d303e",
      tokenId: "1",
      name: "Sonic Llama #1",
      imageUrl: "https://i.imgur.com/oPyO7V2.png",
      collectionName: "Sonic Llamas",
    },
    {
      id: "sonic-llama-2",
      contractAddress: "0x0dcbf9741bbc21b7696ca73f5f87731c9a3d303e",
      tokenId: "2",
      name: "Sonic Llama #2",
      imageUrl: "https://i.imgur.com/JAN65Kz.png",
      collectionName: "Sonic Llamas",
    },
  ]
}

// --- Staking Pool Functions ---
export const deployStakingPool = async (
  config: StakingPoolConfig,
  userAddress: string,
  s?: EthersSigner,
): Promise<string> => {
  console.log("Deploying staking pool with config:", config)
  // This is a placeholder - you'd implement actual staking pool deployment
  return "0xMockStakingPoolAddress"
}

export const fetchStakingPools = async (p?: EthersProvider): Promise<StakingPoolInfo[]> => {
  console.log("Fetching staking pools...")
  // This is a placeholder - you'd implement actual staking pool fetching
  return [
    {
      address: "0xMockStakingPoolForSonicLlamas",
      name: "Official Sonic Llamas SLL Pool",
      rewardTokenAddress: "0x3F78599a7C0fb772591540225d3C6a7831547a12",
      rewardTokenSymbol: "SLL",
      nftCollectionAddress: "0x0dcbf9741bbc21b7696ca73f5f87731c9a3d303e",
      totalStaked: 25,
      rewardRatePerNftPerDay: "10.0",
    },
  ]
}

// --- NFT Collection Listing ---
export const submitNftCollectionForListing = async (
  config: NftCollectionListingConfig,
  userAddress: string,
  s?: EthersSigner,
): Promise<string> => {
  console.log("Submitting NFT collection for listing:", config)
  // This is a placeholder - you'd implement actual NFT collection listing submission
  return "mock-submission-id"
}

// --- Utility Functions ---
export const formatTokenAmount = (amount: string, decimals: number): string => {
  try {
    const num = Number.parseFloat(amount)
    if (num === 0) return "0"
    if (num < 0.000001) return "< 0.000001"
    if (num < 1) return num.toFixed(6)
    if (num < 1000) return num.toFixed(4)
    if (num < 1000000) return `${(num / 1000).toFixed(2)}K`
    return `${(num / 1000000).toFixed(2)}M`
  } catch {
    return "0"
  }
}

export const isValidAddress = (address: string): boolean => {
  return ethers.isAddress(address)
}

export const shortenAddress = (address: string): string => {
  if (!address || address.length < 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export const deployStakingPoolContract = async (
  config: StakingPoolConfig,
  deployerAddress: string,
  s?: EthersSigner,
  p?: EthersProvider,
  paymentReceiverAddress?: string,
  platformFeeAmount?: string,
): Promise<{ contractAddress: string; transactionHash: string }> => {
  console.log("Deploying staking pool contract with config:", config)
  console.log("Deployer address:", deployerAddress)
  console.log("Payment receiver:", paymentReceiverAddress)
  console.log("Platform fee:", platformFeeAmount)

  // Simulate deployment process
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Generate mock contract address and transaction hash
  const mockContractAddress = `0x${Math.random().toString(16).substr(2, 40)}`
  const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`

  console.log("Mock staking pool deployed:", {
    contractAddress: mockContractAddress,
    transactionHash: mockTxHash,
    config,
  })

  return {
    contractAddress: mockContractAddress,
    transactionHash: mockTxHash,
  }
}

export const fetchUserNftsForStaking = async (
  collectionAddress: string,
  userAddress: string,
  p?: EthersProvider,
): Promise<NFT[]> => {
  console.log(`Fetching NFTs for staking from collection: ${collectionAddress}`)
  console.log(`User address: ${userAddress}`)

  // Mock NFT data for staking
  return [
    {
      id: "sonic-llama-1",
      contractAddress: collectionAddress,
      tokenId: "1",
      name: "Sonic Llama #1",
      imageUrl: "https://i.imgur.com/oPyO7V2.png",
      collectionName: "Sonic Llamas",
    },
    {
      id: "sonic-llama-2",
      contractAddress: collectionAddress,
      tokenId: "2",
      name: "Sonic Llama #2",
      imageUrl: "https://i.imgur.com/JAN65Kz.png",
      collectionName: "Sonic Llamas",
    },
  ]
}

export const stakeNfts = async (
  stakingPoolAddress: string,
  tokenIds: string[],
  s?: EthersSigner,
  p?: EthersProvider,
): Promise<string> => {
  console.log("Staking NFTs:", { stakingPoolAddress, tokenIds })

  // Simulate staking transaction
  await new Promise((resolve) => setTimeout(resolve, 1500))

  const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`
  console.log("Mock staking transaction:", mockTxHash)

  return mockTxHash
}

export const unstakeNfts = async (
  stakingPoolAddress: string,
  tokenIds: string[],
  s?: EthersSigner,
  p?: EthersProvider,
): Promise<string> => {
  console.log("Unstaking NFTs:", { stakingPoolAddress, tokenIds })

  // Simulate unstaking transaction
  await new Promise((resolve) => setTimeout(resolve, 1500))

  const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`
  console.log("Mock unstaking transaction:", mockTxHash)

  return mockTxHash
}

export const claimStakingRewards = async (
  stakingPoolAddress: string,
  s?: EthersSigner,
  p?: EthersProvider,
): Promise<string> => {
  console.log("Claiming staking rewards from pool:", stakingPoolAddress)

  // Simulate claim transaction
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`
  console.log("Mock claim transaction:", mockTxHash)

  return mockTxHash
}

export const fetchStakingPoolsInfo = async (p?: EthersProvider): Promise<StakingPoolInfo[]> => {
  console.log("Fetching staking pools info...")

  return [
    {
      address: "0xMockStakingPoolForSonicLlamas",
      name: "Official Sonic Llamas SLL Pool",
      rewardTokenAddress: "0x3F78599a7C0fb772591540225d3C6a7831547a12",
      rewardTokenSymbol: "SLL",
      nftCollectionAddress: "0x0dcbf9741bbc21b7696ca73f5f87731c9a3d303e",
      totalStaked: 25,
      rewardRatePerNftPerDay: "10.0",
    },
  ]
}

export const fetchUserStakedNftsInPool = async (
  stakingPoolAddress: string,
  userAddress: string,
  p?: EthersProvider,
): Promise<NFT[]> => {
  console.log("Fetching user staked NFTs:", { stakingPoolAddress, userAddress })

  return []
}

export const fetchUserRewardsInPool = async (
  stakingPoolAddress: string,
  userAddress: string,
  p?: EthersProvider,
): Promise<string> => {
  console.log("Fetching user rewards:", { stakingPoolAddress, userAddress })

  return "0"
}

export const listNftCollectionOnPlatform = async (
  collectionConfig: NftCollectionListingConfig,
  listerAddress: string,
  s?: EthersSigner,
  p?: EthersProvider,
  listingFeeAmount?: string,
  feeTokenSymbol?: string,
  feeReceiverAddress?: string,
): Promise<{ transactionHash: string; listedCollectionAddress: string }> => {
  console.log("Listing NFT collection on platform:", collectionConfig)

  // Simulate listing process
  await new Promise((resolve) => setTimeout(resolve, 2000))

  const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`

  return {
    transactionHash: mockTxHash,
    listedCollectionAddress: collectionConfig.contractAddress,
  }
}

export const approveNftForAll = async (
  nftContractAddress: string,
  operatorAddress: string,
  approved: boolean,
  s?: EthersSigner,
  p?: EthersProvider,
): Promise<string> => {
  console.log("Approving NFT for all:", { nftContractAddress, operatorAddress, approved })

  // Simulate approval transaction
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`
  console.log("Mock NFT approval transaction:", mockTxHash)

  return mockTxHash
}

export const isNftApprovedForAll = async (
  nftContractAddress: string,
  ownerAddress: string,
  operatorAddress: string,
  p?: EthersProvider,
): Promise<boolean> => {
  console.log("Checking NFT approval for all:", { nftContractAddress, ownerAddress, operatorAddress })

  // Mock approval status
  return false
}

export const listNftForSale = async (
  nftContractAddress: string,
  tokenId: string,
  price: string,
  s?: EthersSigner,
  p?: EthersProvider,
): Promise<string> => {
  console.log("Listing NFT for sale:", { nftContractAddress, tokenId, price })

  // Simulate listing transaction
  await new Promise((resolve) => setTimeout(resolve, 1500))

  const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`
  console.log("Mock NFT listing transaction:", mockTxHash)

  return mockTxHash
}

export const delistNftFromSale = async (
  nftContractAddress: string,
  tokenId: string,
  s?: EthersSigner,
  p?: EthersProvider,
): Promise<string> => {
  console.log("Delisting NFT from sale:", { nftContractAddress, tokenId })

  // Simulate delisting transaction
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`
  console.log("Mock NFT delisting transaction:", mockTxHash)

  return mockTxHash
}

// Helper functions for address formatting
export const formatAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export const formatBalance = (balance: string, decimals = 4): string => {
  const num = Number.parseFloat(balance)
  if (num === 0) return "0"
  if (num < 0.0001) return "< 0.0001"
  return num.toFixed(decimals)
}

// --- Token Allowance and Approval ---
export const fetchTokenAllowance = async (
  tokenAddress: string,
  ownerAddress: string,
  spenderAddress: string,
  p?: EthersProvider,
): Promise<string> => {
  const providerInstance = getProvider(p)

  // Validate all addresses are proper hex addresses (not ENS names)
  if (!ethers.isAddress(tokenAddress)) {
    console.warn(`Invalid token address format: ${tokenAddress}`)
    return "0"
  }

  if (!ethers.isAddress(ownerAddress)) {
    console.warn(`Invalid owner address format: ${ownerAddress}`)
    return "0"
  }

  if (!ethers.isAddress(spenderAddress)) {
    console.warn(`Invalid spender address format: ${spenderAddress}`)
    return "0"
  }

  const tokenInfo = AVAILABLE_TOKENS.find((t) => t.address.toLowerCase() === tokenAddress.toLowerCase())
  if (!tokenInfo) {
    console.warn(`Token info not found for allowance check: ${tokenAddress}`)
    return "0"
  }

  // Skip allowance check for native tokens
  if (tokenAddress === "native" || tokenInfo.symbol === "S") {
    return "0"
  }

  try {
    const code = await providerInstance.getCode(tokenAddress)
    if (code === "0x") {
      console.warn(`No contract found at address ${tokenAddress}`)
      return "0"
    }

    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, providerInstance)

    // Use getAddress to ensure addresses are properly checksummed and prevent ENS resolution
    const checksummedOwner = ethers.getAddress(ownerAddress)
    const checksummedSpender = ethers.getAddress(spenderAddress)

    const allowanceRaw = await tokenContract.allowance(checksummedOwner, checksummedSpender)

    if (allowanceRaw === undefined || allowanceRaw === null) {
      console.warn(`Allowance returned null/undefined for ${tokenAddress}`)
      return "0"
    }

    return ethers.formatUnits(allowanceRaw, tokenInfo.decimals)
  } catch (error: any) {
    console.error("Fetch allowance failed:", error)

    // Handle ENS-related errors specifically
    if (error.code === "UNSUPPORTED_OPERATION" && error.operation === "getEnsAddress") {
      console.warn(`ENS resolution attempted on non-ENS network for token ${tokenInfo.symbol}, returning 0 allowance`)
      return "0"
    }

    if (error.code === "BAD_DATA" || error.reason?.includes("could not decode result data")) {
      console.warn(`Token ${tokenInfo.symbol} may not properly implement allowance function, assuming 0 allowance`)
      return "0"
    }

    if (error.code === "CALL_EXCEPTION") {
      console.warn(`Contract call failed for ${tokenInfo.symbol}, assuming 0 allowance`)
      return "0"
    }

    console.warn(`Allowance check failed for ${tokenInfo.symbol}, defaulting to 0`)
    return "0"
  }
}

export const approveTokenSpend = async (
  tokenAddress: string,
  spenderAddress: string,
  amount: string,
  userAddress: string,
  s?: EthersSigner,
  p?: EthersProvider,
): Promise<string> => {
  // Validate addresses are proper hex addresses (not ENS names)
  if (!ethers.isAddress(tokenAddress)) {
    throw new Error(`Invalid token address format: ${tokenAddress}`)
  }

  if (!ethers.isAddress(spenderAddress)) {
    throw new Error(`Invalid spender address format: ${spenderAddress}`)
  }

  if (!ethers.isAddress(userAddress)) {
    throw new Error(`Invalid user address format: ${userAddress}`)
  }

  const signerInstance = await getSigner(s, p)
  const tokenInfo = AVAILABLE_TOKENS.find((t) => t.address.toLowerCase() === tokenAddress.toLowerCase())
  if (!tokenInfo) throw new Error(`Token info not found for address ${tokenAddress}`)

  if (tokenAddress === "native" || tokenInfo.symbol === "S") {
    throw new Error("Native token does not require approval")
  }

  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signerInstance)
  const rawAmount = ethers.parseUnits(amount, tokenInfo.decimals)

  try {
    const provider = signerInstance.provider
    if (provider) {
      const code = await provider.getCode(tokenAddress)
      if (code === "0x") {
        throw new Error(`No contract found at address ${tokenAddress}`)
      }
    }

    // Use getAddress to ensure addresses are properly checksummed
    const checksummedSpender = ethers.getAddress(spenderAddress)

    const tx = await tokenContract.approve(checksummedSpender, rawAmount)
    await tx.wait()
    return tx.hash
  } catch (error: any) {
    console.error("Approval transaction failed:", error)

    // Handle ENS-related errors specifically
    if (error.code === "UNSUPPORTED_OPERATION" && error.operation === "getEnsAddress") {
      throw new Error(
        `ENS resolution attempted on non-ENS network. Please ensure all addresses are valid hex addresses.`,
      )
    }

    if (error.code === "BAD_DATA") {
      throw new Error(`Token ${tokenAddress} does not properly implement the approve function`)
    }

    throw new Error(error?.data?.message || error.message || "Token approval failed.")
  }
}

// --- Wallet Connection & Network ---
export const connectWallet = async (): Promise<string | null> => {
  if (!ethereum) {
    throw new Error("Web3 wallet not found. Please install a wallet like MetaMask.")
  }
  try {
    const accounts = (await ethereum.request({ method: "eth_requestAccounts" })) as string[]
    if (Array.isArray(accounts) && accounts.length > 0) {
      const provider = getProvider()
      const network = await provider.getNetwork()

      const currentChainId = Number(network.chainId)
      const targetChainId = Number(SONIC_MAINNET_INFO.chainId)

      if (currentChainId !== targetChainId) {
        try {
          await ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: ethers.toBeHex(targetChainId) }],
          })
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            try {
              await ethereum.request({
                method: "wallet_addEthereumChain",
                params: [
                  {
                    chainId: ethers.toBeHex(targetChainId),
                    chainName: SONIC_MAINNET_INFO.name,
                    rpcUrls: [SONIC_MAINNET_INFO.rpcUrl],
                    nativeCurrency: {
                      name: SONIC_MAINNET_INFO.currencySymbol,
                      symbol: SONIC_MAINNET_INFO.currencySymbol,
                      decimals: 18,
                    },
                    blockExplorerUrls: [SONIC_MAINNET_INFO.explorerUrl],
                  },
                ],
              })
            } catch (addError: any) {
              throw new Error(`Failed to add ${SONIC_MAINNET_INFO.name} to wallet: ${addError.message}`)
            }
          } else {
            throw new Error(`Failed to switch to ${SONIC_MAINNET_INFO.name}: ${switchError.message}`)
          }
        }
      }
      return accounts[0]
    }
    return null
  } catch (error: any) {
    console.error("Error connecting to wallet:", error)
    throw new Error(error.message || "Wallet connection failed.")
  }
}

// --- Token Data Fetching ---
export const fetchUserBalances = async (
  userAddress: string,
  tokens: Token[],
  provider?: EthersProvider,
): Promise<Record<string, string>> => {
  const web3Provider = getProvider(provider)
  const balances: Record<string, string> = {}

  try {
    const nativeBalance = await web3Provider.getBalance(userAddress)
    const nativeTokenInfo = tokens.find(
      (t) => t.symbol === SONIC_MAINNET_INFO.currencySymbol || t.address === "native" || t.id === "s",
    )
    if (nativeTokenInfo) {
      balances[nativeTokenInfo.id] = ethers.formatEther(nativeBalance)
    } else {
      balances["native"] = ethers.formatEther(nativeBalance)
    }
  } catch (error) {
    console.error(`Error fetching native balance for ${userAddress}:`, error)
    const nativeTokenInfo = tokens.find(
      (t) => t.symbol === SONIC_MAINNET_INFO.currencySymbol || t.address === "native" || t.id === "s",
    )
    if (nativeTokenInfo) balances[nativeTokenInfo.id] = "0"
    else balances["native"] = "0"
  }

  for (const token of tokens) {
    if (token.address && token.address !== "native" && !ethers.isAddress(token.address)) {
      console.warn(`Invalid address for token ${token.symbol}: ${token.address}. Skipping balance check.`)
      balances[token.id] = "0"
      continue
    }
    if (token.address && token.address !== "native" && token.id !== "s") {
      try {
        const tokenContract = new ethers.Contract(token.address, ERC20_ABI, web3Provider)
        const balance = await tokenContract.balanceOf(userAddress)
        balances[token.id] = ethers.formatUnits(balance, token.decimals)
      } catch (error) {
        console.error(`Error fetching balance for ${token.name} (${token.address}):`, error)
        balances[token.id] = "0"
      }
    }
  }
  return balances
}

export const fetchTokenDetailsFromAddress = async (
  tokenAddress: string,
  provider?: EthersProvider,
): Promise<Token | null> => {
  const web3Provider = getProvider(provider)
  if (!ethers.isAddress(tokenAddress)) {
    throw new Error("Invalid token contract address.")
  }
  try {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, web3Provider)
    const name = await tokenContract.name()
    const symbol = await tokenContract.symbol()
    const decimals = await tokenContract.decimals()
    return {
      id: tokenAddress.toLowerCase(),
      address: tokenAddress,
      name,
      symbol,
      decimals: Number(decimals),
      balance: "0",
    }
  } catch (error) {
    console.error(`Error fetching token details for ${tokenAddress}:`, error)
    throw new Error(
      `Could not fetch details for token at ${tokenAddress}. Make sure it's a valid ERC20 contract on ${SONIC_MAINNET_INFO.name}.`,
    )
  }
}

// Add missing gas estimation functions
export const estimateUniversalRouterSwapGas = estimateSwapRouterGas

export const estimateNftBuyGas = async (
  nftContractAddress: string,
  tokenId: string,
  userAddress: string,
  provider?: EthersProvider,
): Promise<GasEstimate> => {
  const web3Provider = getProvider(provider)

  try {
    // Skip gas estimation for placeholder addresses
    if (isPlaceholderAddress(MARKETPLACE_CONTRACT_ADDRESS)) {
      console.log("Using mock gas estimate due to placeholder marketplace address")
      return {
        gasLimit: "150000",
        gasPrice: "20000000000", // 20 gwei
        gasCostInWei: ethers.parseUnits("0.003", "ether").toString(),
        gasCostInEth: "0.003",
      }
    }

    // Check if marketplace contract exists
    const code = await web3Provider.getCode(MARKETPLACE_CONTRACT_ADDRESS)
    if (code === "0x") {
      throw new Error("Marketplace contract not found")
    }

    const marketplaceContract = new ethers.Contract(MARKETPLACE_CONTRACT_ADDRESS, MARKETPLACE_ABI, web3Provider)

    const gasLimit = await marketplaceContract.buyNft.estimateGas(nftContractAddress, BigInt(tokenId), {
      from: userAddress,
    })

    let gasPrice: bigint
    try {
      gasPrice = await web3Provider.getGasPrice()
    } catch (gasPriceError) {
      console.warn("Could not fetch gas price, using fallback:", gasPriceError)
      gasPrice = ethers.parseUnits("20", "gwei")
    }

    const gasCostInWei = gasLimit * gasPrice
    const gasCostInEth = ethers.formatEther(gasCostInWei)

    return {
      gasLimit: gasLimit.toString(),
      gasPrice: gasPrice.toString(),
      gasCostInWei: gasCostInWei.toString(),
      gasCostInEth,
    }
  } catch (error) {
    console.error("NFT buy gas estimation failed:", error)
    return {
      gasLimit: "150000",
      gasPrice: ethers.parseUnits("20", "gwei").toString(),
      gasCostInWei: ethers.parseUnits("0.003", "ether").toString(),
      gasCostInEth: "0.003",
    }
  }
}

export const estimateNftListGas = async (
  nftContractAddress: string,
  tokenId: string,
  price: string,
  userAddress: string,
  provider?: EthersProvider,
): Promise<GasEstimate> => {
  const web3Provider = getProvider(provider)

  try {
    // Skip gas estimation for placeholder addresses
    if (isPlaceholderAddress(MARKETPLACE_CONTRACT_ADDRESS)) {
      console.log("Using mock gas estimate due to placeholder marketplace address")
      return {
        gasLimit: "120000",
        gasPrice: "20000000000", // 20 gwei
        gasCostInWei: ethers.parseUnits("0.0024", "ether").toString(),
        gasCostInEth: "0.0024",
      }
    }

    // Check if marketplace contract exists
    const code = await web3Provider.getCode(MARKETPLACE_CONTRACT_ADDRESS)
    if (code === "0x") {
      throw new Error("Marketplace contract not found")
    }

    const marketplaceContract = new ethers.Contract(MARKETPLACE_CONTRACT_ADDRESS, MARKETPLACE_ABI, web3Provider)

    const sToken = AVAILABLE_TOKENS.find((t) => t.symbol === "S")
    if (!sToken) throw new Error("S token configuration not found")

    const rawPrice = ethers.parseUnits(price, sToken.decimals)

    const gasLimit = await marketplaceContract.listNft.estimateGas(
      nftContractAddress,
      BigInt(tokenId),
      rawPrice,
      sToken.address,
      { from: userAddress },
    )

    let gasPrice: bigint
    try {
      gasPrice = await web3Provider.getGasPrice()
    } catch (gasPriceError) {
      console.warn("Could not fetch gas price, using fallback:", gasPriceError)
      gasPrice = ethers.parseUnits("20", "gwei")
    }

    const gasCostInWei = gasLimit * gasPrice
    const gasCostInEth = ethers.formatEther(gasCostInWei)

    return {
      gasLimit: gasLimit.toString(),
      gasPrice: gasPrice.toString(),
      gasCostInWei: gasCostInWei.toString(),
      gasCostInEth,
    }
  } catch (error) {
    console.error("NFT list gas estimation failed:", error)
    return {
      gasLimit: "120000",
      gasPrice: ethers.parseUnits("20", "gwei").toString(),
      gasCostInWei: ethers.parseUnits("0.0024", "ether").toString(),
      gasCostInEth: "0.0024",
    }
  }
}

export const estimateNftDelistGas = async (
  nftContractAddress: string,
  tokenId: string,
  userAddress: string,
  provider?: EthersProvider,
): Promise<GasEstimate> => {
  const web3Provider = getProvider(provider)

  try {
    // Skip gas estimation for placeholder addresses
    if (isPlaceholderAddress(MARKETPLACE_CONTRACT_ADDRESS)) {
      console.log("Using mock gas estimate due to placeholder marketplace address")
      return {
        gasLimit: "80000",
        gasPrice: "20000000000", // 20 gwei
        gasCostInWei: ethers.parseUnits("0.0016", "ether").toString(),
        gasCostInEth: "0.0016",
      }
    }

    // Check if marketplace contract exists
    const code = await web3Provider.getCode(MARKETPLACE_CONTRACT_ADDRESS)
    if (code === "0x") {
      throw new Error("Marketplace contract not found")
    }

    const marketplaceContract = new ethers.Contract(MARKETPLACE_CONTRACT_ADDRESS, MARKETPLACE_ABI, web3Provider)

    const gasLimit = await marketplaceContract.delistNft.estimateGas(nftContractAddress, BigInt(tokenId), {
      from: userAddress,
    })

    let gasPrice: bigint
    try {
      gasPrice = await web3Provider.getGasPrice()
    } catch (gasPriceError) {
      console.warn("Could not fetch gas price, using fallback:", gasPriceError)
      gasPrice = ethers.parseUnits("20", "gwei")
    }

    const gasCostInWei = gasLimit * gasPrice
    const gasCostInEth = ethers.formatEther(gasCostInWei)

    return {
      gasLimit: gasLimit.toString(),
      gasPrice: gasPrice.toString(),
      gasCostInWei: gasCostInWei.toString(),
      gasCostInEth,
    }
  } catch (error) {
    console.error("NFT delist gas estimation failed:", error)
    return {
      gasLimit: "80000",
      gasPrice: ethers.parseUnits("20", "gwei").toString(),
      gasCostInWei: ethers.parseUnits("0.0016", "ether").toString(),
      gasCostInEth: "0.0016",
    }
  }
}

export const estimateNftTransferGas = async (
  nftContractAddress: string,
  tokenId: string,
  fromAddress: string,
  toAddress: string,
  provider?: EthersProvider,
): Promise<GasEstimate> => {
  const web3Provider = getProvider(provider)

  try {
    // Check if NFT contract exists
    const code = await web3Provider.getCode(nftContractAddress)
    if (code === "0x") {
      throw new Error("NFT contract not found")
    }

    const ERC721_ABI = [
      "function transferFrom(address from, address to, uint256 tokenId) external",
      "function ownerOf(uint256 tokenId) external view returns (address)",
    ]

    const nftContract = new ethers.Contract(nftContractAddress, ERC721_ABI, web3Provider)

    const gasLimit = await nftContract.transferFrom.estimateGas(fromAddress, toAddress, BigInt(tokenId), {
      from: fromAddress,
    })

    let gasPrice: bigint
    try {
      gasPrice = await web3Provider.getGasPrice()
    } catch (gasPriceError) {
      console.warn("Could not fetch gas price, using fallback:", gasPriceError)
      gasPrice = ethers.parseUnits("20", "gwei")
    }

    const gasCostInWei = gasLimit * gasPrice
    const gasCostInEth = ethers.formatEther(gasCostInWei)

    return {
      gasLimit: gasLimit.toString(),
      gasPrice: gasPrice.toString(),
      gasCostInWei: gasCostInWei.toString(),
      gasCostInEth,
    }
  } catch (error) {
    console.error("NFT transfer gas estimation failed:", error)
    return {
      gasLimit: "100000",
      gasPrice: ethers.parseUnits("20", "gwei").toString(),
      gasCostInWei: ethers.parseUnits("0.002", "ether").toString(),
      gasCostInEth: "0.002",
    }
  }
}

export const estimateNftApprovalGas = async (
  nftContractAddress: string,
  operatorAddress: string,
  userAddress: string,
  provider?: EthersProvider,
): Promise<GasEstimate> => {
  const web3Provider = getProvider(provider)

  try {
    // Check if NFT contract exists
    const code = await web3Provider.getCode(nftContractAddress)
    if (code === "0x") {
      throw new Error("NFT contract not found")
    }

    const ERC721_ABI = [
      "function setApprovalForAll(address operator, bool approved) external",
      "function isApprovedForAll(address owner, address operator) external view returns (bool)",
    ]

    const nftContract = new ethers.Contract(nftContractAddress, ERC721_ABI, web3Provider)

    const gasLimit = await nftContract.setApprovalForAll.estimateGas(operatorAddress, true, { from: userAddress })

    let gasPrice: bigint
    try {
      gasPrice = await web3Provider.getGasPrice()
    } catch (gasPriceError) {
      console.warn("Could not fetch gas price, using fallback:", gasPriceError)
      gasPrice = ethers.parseUnits("20", "gwei")
    }

    const gasCostInWei = gasLimit * gasPrice
    const gasCostInEth = ethers.formatEther(gasCostInWei)

    return {
      gasLimit: gasLimit.toString(),
      gasPrice: gasPrice.toString(),
      gasCostInWei: gasCostInWei.toString(),
      gasCostInEth,
    }
  } catch (error) {
    console.error("NFT approval gas estimation failed:", error)
    return {
      gasLimit: "50000",
      gasPrice: ethers.parseUnits("20", "gwei").toString(),
      gasCostInWei: ethers.parseUnits("0.001", "ether").toString(),
      gasCostInEth: "0.001",
    }
  }
}

export const estimateTokenApprovalGas = async (
  tokenAddress: string,
  spenderAddress: string,
  amount: string,
  userAddress: string,
  provider?: EthersProvider,
): Promise<GasEstimate> => {
  const web3Provider = getProvider(provider)

  try {
    // Check if token contract exists
    const code = await web3Provider.getCode(tokenAddress)
    if (code === "0x") {
      throw new Error("Token contract not found")
    }

    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, web3Provider)

    const tokenInfo = AVAILABLE_TOKENS.find((t) => t.address.toLowerCase() === tokenAddress.toLowerCase())
    if (!tokenInfo) throw new Error(`Token info not found for address ${tokenAddress}`)

    const rawAmount = ethers.parseUnits(amount, tokenInfo.decimals)

    const gasLimit = await tokenContract.approve.estimateGas(spenderAddress, rawAmount, { from: userAddress })

    let gasPrice: bigint
    try {
      gasPrice = await web3Provider.getGasPrice()
    } catch (gasPriceError) {
      console.warn("Could not fetch gas price, using fallback:", gasPriceError)
      gasPrice = ethers.parseUnits("20", "gwei")
    }

    const gasCostInWei = gasLimit * gasPrice
    const gasCostInEth = ethers.formatEther(gasCostInWei)

    return {
      gasLimit: gasLimit.toString(),
      gasPrice: gasPrice.toString(),
      gasCostInWei: gasCostInWei.toString(),
      gasCostInEth,
    }
  } catch (error) {
    console.error("Token approval gas estimation failed:", error)
    return {
      gasLimit: "60000",
      gasPrice: ethers.parseUnits("20", "gwei").toString(),
      gasCostInWei: ethers.parseUnits("0.0012", "ether").toString(),
      gasCostInEth: "0.0012",
    }
  }
}
