"use client"

import type React from "react"
import { Card } from "../common/Card"
import { Button } from "../common/Button"
import type { DashboardViewProps, AppView, Token } from "../../types"
import {
  AVAILABLE_TOKENS,
  APP_PAYMENT_RECEIVER_ADDRESS,
  NFT_COLLECTION_LISTING_FEE_S,
  PLATFORM_STAKING_POOL_DEPLOYMENT_FEE_S,
} from "../../constants"
import { truncateAddress, formatTokenBalance } from "../../utils/formatting"

// Icons for cards (can be replaced with more specific icons)
const WalletSummaryIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
      d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0H3m16.5-9L12 3m0 0L7.5 3m4.5 0V1.5M12 9v3.75m-3.75-3.75V9m7.5-3.75V9"
    />
  </svg>
)
const TokenBalanceIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
      d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6A2.25 2.25 0 00.75 8.25v7.5A2.25 2.25 0 003 18h13.5m-13.5-9h9.75M12 15V9"
    />
  </svg>
)
const NftStakingIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
      d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 11.21 12.77 10.5 12 10.5s-1.536.71-2.121 1.256c-1.172.879-1.172 2.303 0 3.182Z"
    />
  </svg>
)
const LiquidityPoolIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
      d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.353-.026.692-.026 1.038 0 1.13.094 1.976 1.057 1.976 2.192V7.5M8.25 7.5h7.5M8.25 7.5V9c0 .606-.486 1.095-1.08 1.124a12.06 12.06 0 00-.62 0A12.06 12.06 0 005.25 9V7.5m3 0v3m15.75 7.5V9c0 .606.486 1.095 1.08 1.124a12.06 12.06 0 01.62 0 12.06 12.06 0 011.299-.124V7.5m-3 0v3m0 0c0 .24-.018.476-.053.712A12.059 12.059 0 0112 15c-2.029 0-3.91-.628-5.447-1.745A12.059 12.059 0 016 10.712V9m6 1.712V9"
    />
  </svg>
)
const QuickActionsIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
      d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
    />
  </svg>
)
const InfoIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
      d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
    />
  </svg>
)

const keyTokensToDisplay: string[] = ["s", "sll", "ws", "usdc_sonic"] // IDs of tokens
const sllTokenDetails = AVAILABLE_TOKENS.find((t) => t.id === "sll")
const sTokenDetails = AVAILABLE_TOKENS.find((t) => t.id === "s")

export const DashboardView: React.FC<DashboardViewProps> = ({
  walletAddress,
  userBalances,
  onConnectWallet,
  changeView,
}) => {
  const totalPortfolioValue = "0.00" // Mocked
  const stakedNftsCount = 0 // No mock data available
  // Calculate total pending SLL rewards - no mock data available
  const totalPendingSllRewards = "0.00"

  const lpPoolsCount = 0
  const totalLpValue = "0.00"

  const displayedBalances = keyTokensToDisplay
    .map((tokenId) => {
      const tokenInfo = AVAILABLE_TOKENS.find((t) => t.id === tokenId)
      if (!tokenInfo) {
        console.warn(`[DashboardView] Token info not found for ID: ${tokenId}`)
        return null
      }
      const balance = userBalances?.[tokenId] || "0"
      return {
        ...tokenInfo,
        balance: formatTokenBalance(balance, tokenInfo.decimals, 4),
      } as Token & { balance: string }
    })
    .filter((token): token is Token & { balance: string } => token !== null && typeof token.id === "string")

  return (
    <div className="space-y-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold font-mono text-gray-100">Welcome to Llamas Hub</h1>
        <p className="text-lg text-gray-400">Your central command for all things crypto on Sonic.</p>
      </header>

      {!walletAddress && (
        <Card className="text-center py-10 bg-gray-800">
          <WalletSummaryIcon className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-100 mb-3">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-6">Connect your wallet to access all features of the Llamas Hub.</p>
          <Button onClick={onConnectWallet} variant="primary" size="lg">
            Connect Wallet
          </Button>
        </Card>
      )}

      {walletAddress && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="md:col-span-2 lg:col-span-1">
            <div className="flex items-center mb-4">
              <WalletSummaryIcon className="w-8 h-8 text-blue-500 mr-3" />
              <h3 className="text-xl font-semibold text-gray-100">Wallet Overview</h3>
            </div>
            <p className="text-sm text-gray-400">Connected Address:</p>
            <p className="text-md font-mono text-blue-400 break-all mb-3" title={walletAddress}>
              {truncateAddress(walletAddress)}
            </p>
            <p className="text-sm text-gray-400">Total Portfolio Value (Est.):</p>
            <p className="text-2xl font-bold text-blue-500 mb-4">${totalPortfolioValue}</p>
            <div className="flex space-x-2">
              <Button onClick={() => changeView("funds" as AppView)} variant="secondary" size="sm" className="flex-1">
                Manage Funds
              </Button>
              <Button onClick={() => changeView("swap" as AppView)} variant="outline" size="sm" className="flex-1">
                Swap Tokens
              </Button>
            </div>
          </Card>

          <Card>
            <div className="flex items-center mb-4">
              <TokenBalanceIcon className="w-8 h-8 text-blue-500 mr-3" />
              <h3 className="text-xl font-semibold text-gray-100">Token Balances</h3>
            </div>
            <div className="space-y-3 mb-4 max-h-48 custom-scrollbar overflow-y-auto">
              {displayedBalances.length > 0 ? (
                displayedBalances.map(
                  (token) =>
                    token &&
                    token.id && ( // Extra check though filter should handle it
                      <div
                        key={token.id}
                        className="flex justify-between items-center text-sm p-2 bg-gray-700 rounded-md"
                      >
                        <div className="flex items-center">
                          {token.iconUrl && (
                            <img
                              src={token.iconUrl || "/placeholder.svg"}
                              alt={token.symbol}
                              className="w-6 h-6 mr-2 rounded-full"
                            />
                          )}
                          <span className="text-gray-300">{token.symbol}</span>
                        </div>
                        <span className="font-medium text-gray-100">{token.balance}</span>
                      </div>
                    ),
                )
              ) : (
                <p className="text-xs text-gray-500 text-center">No key token balances to display.</p>
              )}
            </div>
            <Button onClick={() => changeView("funds" as AppView)} variant="outline" size="sm" className="w-full">
              View All Funds
            </Button>
          </Card>

          <Card>
            <div className="flex items-center mb-4">
              <QuickActionsIcon className="w-8 h-8 text-blue-500 mr-3" />
              <h3 className="text-xl font-semibold text-gray-100">Quick Actions</h3>
            </div>
            <div className="space-y-2">
              <Button onClick={() => changeView("llamas-nfts-hub" as AppView)} variant="primary" className="w-full">
                List NFT Collection
              </Button>
              <Button onClick={() => changeView("nft-staking" as AppView)} variant="primary" className="w-full">
                Create Staking Pool
              </Button>
              <Button onClick={() => changeView("liquidity-pools" as AppView)} variant="primary" className="w-full">
                Create Liquidity Pool
              </Button>
            </div>
          </Card>

          <Card>
            <div className="flex items-center mb-4">
              <NftStakingIcon className="w-8 h-8 text-blue-500 mr-3" />
              <h3 className="text-xl font-semibold text-gray-100">NFT Staking</h3>
            </div>
            <p className="text-sm text-gray-400">Staked Sonic Llamas NFTs:</p>
            <p className="text-2xl font-bold text-blue-500 mb-1">{stakedNftsCount}</p>
            <p className="text-sm text-gray-400">Pending Rewards (Est.):</p>
            <p className="text-lg font-semibold text-green-400 mb-4">
              {totalPendingSllRewards} {sllTokenDetails?.symbol || "SLL"}
            </p>
            <Button
              onClick={() => changeView("nft-staking" as AppView)}
              variant="secondary"
              size="sm"
              className="w-full"
            >
              Go to Staking
            </Button>
          </Card>

          <Card>
            <div className="flex items-center mb-4">
              <LiquidityPoolIcon className="w-8 h-8 text-blue-500 mr-3" />
              <h3 className="text-xl font-semibold text-gray-100">Liquidity Pools</h3>
            </div>
            <p className="text-sm text-gray-400">Active LP Positions:</p>
            <p className="text-2xl font-bold text-blue-500 mb-1">{lpPoolsCount}</p>
            <p className="text-sm text-gray-400">Total LP Value (Est.):</p>
            <p className="text-lg font-semibold text-green-400 mb-4">${totalLpValue}</p>
            <Button
              onClick={() => changeView("liquidity-pools" as AppView)}
              variant="secondary"
              size="sm"
              className="w-full"
            >
              Manage Liquidity
            </Button>
          </Card>
        </div>
      )}

      {/* Documentation Card */}
      <Card className="mt-12">
        <div className="flex items-center mb-6">
          <InfoIcon className="w-10 h-10 text-blue-500 mr-4 flex-shrink-0" />
          <h2 className="text-2xl md:text-3xl font-bold font-mono text-gray-100">About Llamas Hub & The SLL Token</h2>
        </div>

        <div className="prose prose-sm md:prose-base prose-invert max-w-none text-gray-300 space-y-6 custom-scrollbar pr-2 overflow-y-auto max-h-[500px]">
          <section>
            <h3 className="text-xl font-semibold text-green-400 font-mono">Introduction to Llamas Hub</h3>
            <p>
              Llamas Hub is envisioned as your premier, all-in-one decentralized finance (DeFi) and NFT interaction
              platform, built natively on the <strong className="text-blue-500">Sonic network</strong>. Our core mission
              is to simplify and enhance your engagement with the crypto world by providing a seamless, intuitive, and
              feature-rich environment.
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-green-400 font-mono">Key Features</h3>
            <ul className="list-disc list-outside space-y-2 pl-5">
              <li>
                <strong>Token Swapping:</strong> Effortlessly swap between various tokens available on the Sonic
                network. Our platform integrates with decentralized exchange (DEX) protocols for on-chain swaps and
                includes a conceptual (mock) interface for interacting with centralized exchange (CEX) liquidity via a
                secure backend.
              </li>
              <li>
                <strong>Fund Management:</strong> View your token balances at a glance. The platform provides tools to
                (conceptually) manage deposits and withdrawals for your connected wallet.
              </li>
              <li>
                <strong>Llamas NFTs Hub:</strong> Explore the official{" "}
                <strong className="text-blue-500">Sonic Llamas NFT collection</strong>, view detailed trait information,
                and rarity statistics. Additionally, platform users can list their own NFT collections (subject to a
                platform fee) to gain visibility within the Hub.
              </li>
              <li>
                <strong>NFT Staking:</strong>
                <ul className="list-['-_'] list-outside space-y-1 pl-5 mt-1">
                  <li>Stake your NFTs, particularly Sonic Llamas, to earn rewards in our utility token, SLL.</li>
                  <li>
                    Create your own custom staking pools for any NFT collection you own, defining your own reward terms
                    and tokens.
                  </li>
                </ul>
              </li>
              <li>
                <strong>Liquidity Provision:</strong> Participate in DeFi by providing liquidity to available pools.
                (Conceptually) earn trading fees from swaps occurring in those pools.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-green-400 font-mono">The SLL Token - Utility of Llamas Hub</h3>
            <p>
              The <strong className="text-blue-500">Sonic Llamas Token (SLL)</strong> is the official utility token of
              the Llamas Hub ecosystem, operating as an ERC20 standard token on the Sonic network.
            </p>
            <h4 className="text-lg font-semibold text-gray-200 mt-3">
              Primary Utility: Rewarding Sonic Llamas NFT Holders
            </h4>
            <p>
              The cornerstone utility of SLL is to reward holders and stakers of the official Sonic Llamas NFT
              collection. By staking your Sonic Llamas NFTs in designated staking pools within the Llamas Hub, you
              directly earn SLL tokens. This mechanism is designed to:
            </p>
            <ul className="list-disc list-outside space-y-1 pl-5 mt-1">
              <li>Incentivize long-term holding of Sonic Llamas NFTs.</li>
              <li>Encourage active participation within the Llamas Hub ecosystem.</li>
              <li>Provide tangible value back to the community supporting the Sonic Llamas collection.</li>
            </ul>
            <h4 className="text-lg font-semibold text-gray-200 mt-3">Acquiring SLL</h4>
            <p>SLL tokens can be acquired primarily in two ways:</p>
            <ul className="list-disc list-outside space-y-1 pl-5 mt-1">
              <li>
                <strong>Earning via Staking:</strong> Stake your Sonic Llamas NFTs in the Hub's staking pools.
              </li>
              <li>
                <strong>Swapping:</strong> Utilize the "Swap Tokens" feature within Llamas Hub to trade other tokens for
                SLL.
              </li>
            </ul>
            <h4 className="text-lg font-semibold text-gray-200 mt-3">Future Utilities (Conceptual)</h4>
            <p>
              While the primary focus is rewarding NFT holders, future developments may expand SLL's utility to include:
            </p>
            <ul className="list-disc list-outside space-y-1 pl-5 mt-1">
              <li>Governance rights over certain platform parameters.</li>
              <li>Access to exclusive features or early releases.</li>
              <li>Potential for reduced platform fees when paid in SLL.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-green-400 font-mono">Platform Fees</h3>
            <p>Llamas Hub aims for transparency regarding its fees:</p>
            <ul className="list-disc list-outside space-y-1 pl-5 mt-1">
              <li>
                <strong>NFT Collection Listing Fee:</strong> A one-time fee of{" "}
                <strong className="text-blue-500">
                  {NFT_COLLECTION_LISTING_FEE_S} {sTokenDetails?.symbol || "S"}
                </strong>{" "}
                is required to list an external NFT collection on the Hub.
              </li>
              <li>
                <strong>Staking Pool Creation Fee:</strong> A fee of{" "}
                <strong className="text-blue-500">
                  {PLATFORM_STAKING_POOL_DEPLOYMENT_FEE_S} {sTokenDetails?.symbol || "S"}
                </strong>{" "}
                is applied for creating a custom NFT staking pool.
              </li>
            </ul>
            <p className="mt-2">
              All platform fees are (conceptually, for this demo) directed to the Llamas Hub treasury address: <br />
              <span className="font-mono text-xs break-all" title={APP_PAYMENT_RECEIVER_ADDRESS}>
                {APP_PAYMENT_RECEIVER_ADDRESS}
              </span>
              .
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-green-400 font-mono">Getting Started</h3>
            <ol className="list-decimal list-outside space-y-1 pl-5">
              <li>
                <strong>Connect Your Wallet:</strong> Use a compatible Web3 wallet (like MetaMask) configured for the
                Sonic network. Click the "Connect Wallet" button.
              </li>
              <li>
                <strong>Explore:</strong> Navigate through the various sections like Swap, Funds, NFTs Hub, Staking, and
                Liquidity Pools using the main navigation bar.
              </li>
              <li>
                <strong>Engage:</strong> Swap tokens, stake your Sonic Llamas NFTs to earn SLL, or explore other
                features.
              </li>
            </ol>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-green-400 font-mono">Disclaimer</h3>
            <p>
              Llamas Hub is a demonstration application. While it aims to showcase a rich set of features, many on-chain
              interactions and integrations with external services (like CEX APIs) are simulated or mocked for
              illustrative purposes. Always exercise caution and do your own research (DYOR) when interacting with any
              DeFi platform or smart contract. The value of digital assets can be volatile.
            </p>
          </section>
        </div>
      </Card>
    </div>
  )
}
