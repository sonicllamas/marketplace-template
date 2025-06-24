// services/contractAbis.ts

// Standard ERC20 ABI (subset for balance, allowance, approve, transfer, name, symbol, decimals)
export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
]

// Standard ERC721 ABI (subset for NFTs)
export const ERC721_ABI = [
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function safeTransferFrom(address from, address to, uint256 tokenId) payable",
  "function transferFrom(address from, address to, uint256 tokenId) payable",
  "function approve(address to, uint256 tokenId) payable",
  "function getApproved(uint256 tokenId) view returns (address)",
  "function setApprovalForAll(address operator, bool approved)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address _owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
]

// AccessHub ABI - For swap functionality on Sonic Mainnet
export const ACCESS_HUB_ABI = [
  // Core swap functions
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) returns (uint[] memory amounts)",
  "function swapTokensForExactTokens(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline) returns (uint[] memory amounts)",
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) payable returns (uint[] memory amounts)",
  "function swapTokensForExactETH(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline) returns (uint[] memory amounts)",
  "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) returns (uint[] memory amounts)",
  "function swapETHForExactTokens(uint amountOut, address[] calldata path, address to, uint deadline) payable returns (uint[] memory amounts)",

  // Quote functions for price discovery
  "function getAmountsOut(uint amountIn, address[] calldata path) view returns (uint[] memory amounts)",
  "function getAmountsIn(uint amountOut, address[] calldata path) view returns (uint[] memory amounts)",

  // Liquidity functions
  "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) returns (uint amountA, uint amountB, uint liquidity)",
  "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) payable returns (uint amountToken, uint amountETH, uint liquidity)",
  "function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) returns (uint amountA, uint amountB)",
  "function removeLiquidityETH(address token, uint liquidity, uint amountTokenMin, uint amountETHMin, address to, uint deadline) returns (uint amountToken, uint amountETH)",

  // Utility functions
  "function WETH() view returns (address)",
  "function factory() view returns (address)",

  // Events
  "event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)",
]

// Placeholder for Liquidity Pool Factory ABI (e.g., UniswapV2Factory)
export const LP_FACTORY_ABI = [
  "function getPair(address tokenA, address tokenB) view returns (address pair)",
  "function allPairs(uint256 index) view returns (address pair)",
  "function allPairsLength() view returns (uint256)",
  "function feeTo() view returns (address)",
  "function feeToSetter() view returns (address)",
  "function createPair(address tokenA, address tokenB) returns (address pair)",
  "event PairCreated(address indexed token0, address indexed token1, address pair, uint allPairsLength)",
]

// Placeholder for Liquidity Pool (Pair) ABI (e.g., UniswapV2Pair)
export const LP_POOL_ABI = [
  "function token0() view returns (address)",
  "function token1() view returns (address)",
  "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 value) returns (bool)",
  "function transferFrom(address from, address to, uint256 value) returns (bool)",
  "function kLast() view returns (uint256)",
]

// Updated Router ABI (e.g., UniswapV2Router02)
export const ROUTER_ABI = [
  "function factory() view returns (address)",
  "function WETH() view returns (address)",
  "function addLiquidity(address tokenA, address tokenB, uint amountADesired, uint amountBDesired, uint amountAMin, uint amountBMin, address to, uint deadline) returns (uint amountA, uint amountB, uint liquidity)",
  "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) payable returns (uint amountToken, uint amountETH, uint liquidity)",
  "function removeLiquidity(address tokenA, address tokenB, uint liquidity, uint amountAMin, uint amountBMin, address to, uint deadline) returns (uint amountA, uint amountB)",
  "function removeLiquidityETH(address token, uint liquidity, uint amountTokenMin, uint amountETHMin, address to, uint deadline) payable returns (uint amountToken, uint amountETH)",
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) returns (uint[] memory amounts)",
  "function swapTokensForExactTokens(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline) returns (uint[] memory amounts)",
  "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) payable returns (uint[] memory amounts)",
  "function swapTokensForExactETH(uint amountOut, uint amountInMax, address[] calldata path, address to, uint deadline) returns (uint[] memory amounts)",
  "function getAmountsOut(uint amountIn, address[] calldata path) view returns (uint[] memory amounts)",
  "function getAmountsIn(uint amountOut, address[] calldata path) view returns (uint[] memory amounts)",
]

// Universal Router ABI (Uniswap V3 style)
export const UNIVERSAL_ROUTER_ABI = [
  "function execute(bytes calldata commands, bytes[] calldata inputs, uint256 deadline) payable",
  "function execute(bytes calldata commands, bytes[] calldata inputs) payable",
]

// Swap Router ABI (Uniswap V3 SwapRouter)
export const SWAP_ROUTER_ABI = [
  // SwapRouter interface for exactInputSingle
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "tokenIn", type: "address" },
          { internalType: "address", name: "tokenOut", type: "address" },
          { internalType: "uint24", name: "fee", type: "uint24" },
          { internalType: "address", name: "recipient", type: "address" },
          { internalType: "uint256", name: "deadline", type: "uint256" },
          { internalType: "uint256", name: "amountIn", type: "uint256" },
          { internalType: "uint256", name: "amountOutMinimum", type: "uint256" },
          { internalType: "uint160", name: "sqrtPriceLimitX96", type: "uint160" },
        ],
        internalType: "struct ISwapRouter.ExactInputSingleParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "exactInputSingle",
    outputs: [{ internalType: "uint256", name: "amountOut", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  // SwapRouter interface for exactInput (multi-hop)
  {
    inputs: [
      {
        components: [
          { internalType: "bytes", name: "path", type: "bytes" },
          { internalType: "address", name: "recipient", type: "address" },
          { internalType: "uint256", name: "deadline", type: "uint256" },
          { internalType: "uint256", name: "amountIn", type: "uint256" },
          { internalType: "uint256", name: "amountOutMinimum", type: "uint256" },
        ],
        internalType: "struct ISwapRouter.ExactInputParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "exactInput",
    outputs: [{ internalType: "uint256", name: "amountOut", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  // Multicall for batch operations
  {
    inputs: [{ internalType: "bytes[]", name: "data", type: "bytes[]" }],
    name: "multicall",
    outputs: [{ internalType: "bytes[]", name: "results", type: "bytes[]" }],
    stateMutability: "payable",
    type: "function",
  },
  // Unwrap WETH
  {
    inputs: [
      { internalType: "uint256", name: "amountMinimum", type: "uint256" },
      { internalType: "address", name: "recipient", type: "address" },
    ],
    name: "unwrapWETH9",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  // Refund ETH
  {
    inputs: [],
    name: "refundETH",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
] as const

// QuoterV2 ABI (Uniswap V3 Quoter)
export const QUOTER_V2_ABI = [
  "function quoteExactInputSingle((address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96)) view returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)",
  "function quoteExactOutputSingle((address tokenIn, address tokenOut, uint256 amountOut, uint24 fee, uint160 sqrtPriceLimitX96)) view returns (uint256 amountIn, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)",
  "function quoteExactInput(bytes memory path, uint256 amountIn) view returns (uint256 amountOut, uint160[] memory sqrtPriceX96AfterList, uint32[] memory initializedTicksCrossedList, uint256 gasEstimate)",
  "function quoteExactOutput(bytes memory path, uint256 amountOut) view returns (uint256 amountIn, uint160[] memory sqrtPriceX96AfterList, uint32[] memory initializedTicksCrossedList, uint256 gasEstimate)",
]

// QuoterV1 ABI (Legacy Quoter)
export const QUOTER_V1_ABI = [
  "function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) view returns (uint256 amountOut)",
  "function quoteExactOutputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountOut, uint160 sqrtPriceLimitX96) view returns (uint256 amountIn)",
  "function quoteExactInput(bytes memory path, uint256 amountIn) view returns (uint256 amountOut)",
  "function quoteExactOutput(bytes memory path, uint256 amountOut) view returns (uint256 amountIn)",
]

// TickLens ABI
export const TICK_LENS_ABI = [
  "function getPopulatedTicksInWord(address pool, int16 tickBitmapIndex) view returns ((int24 tick, int128 liquidityNet, uint128 liquidityGross)[] memory populatedTicks)",
]

// Placeholder for Staking Pool Factory ABI (if you use one to deploy staking pools)
export const STAKING_POOL_FACTORY_ABI = [
  "function deployStakingPool(address _nftCollection, address _rewardToken, uint256 _rewardRatePerNftPerDay, uint256 _stakingDurationDays) returns (address newStakingPoolAddress)",
  "function getDeployedPools() view returns (address[])",
  "event StakingPoolCreated(address newPoolAddress, address indexed nftCollection, address indexed rewardToken, uint256 rewardRate, uint256 duration)",
]

// Placeholder for individual Staking Pool contract
export const STAKING_POOL_ABI = [
  "function stake(uint256[] calldata tokenIds)",
  "function unstake(uint256[] calldata tokenIds)",
  "function claimRewards()",
  "function getStakedTokenIds(address user) view returns (uint256[])",
  "function getRewardsEarned(address user) view returns (uint256)",
  "function nftCollection() view returns (address)",
  "function rewardToken() view returns (address)",
  "function rewardRatePerNftPerDay() view returns (uint256)",
  "function totalStaked() view returns (uint256)",
]

// Placeholder for Marketplace ABI
export const MARKETPLACE_ABI = [
  // List an NFT for sale with a price in a specific ERC20 token (e.g., S token)
  "function listNft(address nftContractAddress, uint256 tokenId, uint256 price, address paymentTokenAddress)",
  // Delist an NFT from sale
  "function delistNft(address nftContractAddress, uint256 tokenId)",
  // Buy an NFT (requires payment in the specified ERC20 token)
  "function buyNft(address nftContractAddress, uint256 tokenId)", // Assumes payment is handled with approve + transferFrom in buyNft
  // Get listing details for an NFT
  "function getListing(address nftContractAddress, uint256 tokenId) view returns (address seller, uint256 price, address paymentTokenAddress, bool active)",
  // Event emitted when an item is listed
  "event ItemListed(address indexed seller, address indexed nftContractAddress, uint256 indexed tokenId, uint256 price, address paymentTokenAddress)",
  // Event emitted when an item is sold
  "event ItemSold(address indexed buyer, address indexed seller, address indexed nftContractAddress, uint256 indexed tokenId, uint256 price, address paymentTokenAddress)",
  // Event emitted when an item is delisted
  "event ItemDelisted(address indexed seller, address indexed nftContractAddress, uint256 indexed tokenId)",
]

// NOTE: These ABIs are very basic placeholders.
// You MUST replace them with the actual ABIs of your deployed smart contracts.
