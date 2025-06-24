"use client"

import type React from "react"
import { useState } from "react"
import { Card } from "../common/Card"
import { Button } from "../common/Button"
import { Input, Select } from "../common/Input"
import type { Token, ViewProps } from "../../types"
import { AVAILABLE_TOKENS, SONIC_MAINNET_INFO } from "../../constants"
import { ethers } from "ethers"

type FundAction = "deposit" | "withdraw"

export const FundManagementView: React.FC<ViewProps> = ({
  walletAddress,
  userBalances,
  provider,
  signer,
  onConnectWallet,
}) => {
  const [tokens] = useState<Token[]>(AVAILABLE_TOKENS)
  const [selectedToken, setSelectedToken] = useState<Token | undefined>(tokens[0])
  const [amount, setAmount] = useState<string>("")
  const [withdrawToAddress, setWithdrawToAddress] = useState<string>("")
  const [action, setAction] = useState<FundAction>("deposit")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [message, setMessage] = useState<string>("")
  const [error, setError] = useState<string>("")

  const tokenOptions = tokens.map((t) => ({ value: t.id, label: `${t.name} (${t.symbol})` }))

  const currentTokenBalance = selectedToken ? userBalances[selectedToken.id] || "0" : "0"

  const handleSubmit = async () => {
    setError("")
    setMessage("")

    if (!walletAddress || !signer) {
      onConnectWallet()
      return
    }
    if (!selectedToken || !amount) {
      setError("Please select a token and enter an amount.")
      return
    }
    if (action === "withdraw" && (!withdrawToAddress || !ethers.isAddress(withdrawToAddress))) {
      setError("Please enter a valid withdrawal address.")
      return
    }

    setIsLoading(true)

    // Simulate blockchain interaction
    try {
      // Placeholder for actual blockchainService calls
      // e.g., await blockchainService.withdrawToken(selectedToken.address, withdrawToAddress, amount, signer);
      await new Promise((resolve) => setTimeout(resolve, 1500))

      if (action === "deposit") {
        // Deposit is informational, showing user's address. No on-chain tx from here.
        setMessage(`To deposit ${selectedToken.symbol}, send funds to your address: ${walletAddress}`)
      } else if (action === "withdraw") {
        // Mock withdrawal success
        console.log(`Withdrawing ${amount} ${selectedToken.symbol} to ${withdrawToAddress}`)
        setMessage(
          `Successfully initiated withdrawal of ${amount} ${selectedToken.symbol} to ${withdrawToAddress}. (Mock Tx)`,
        )
      }
    } catch (e: any) {
      setError(`Transaction failed: ${e.message || "Unknown error"}`)
    } finally {
      setIsLoading(false)
      setAmount("")
      if (action === "withdraw") setWithdrawToAddress("")
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <Card title="Manage Your Funds">
        <div className="mb-6 flex border-b border-gray-700">
          <button
            type="button"
            onClick={() => {
              setAction("deposit")
              setError("")
              setMessage("")
            }}
            className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
              action === "deposit" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Receive (Deposit)
          </button>
          <button
            type="button"
            onClick={() => {
              setAction("withdraw")
              setError("")
              setMessage("")
            }}
            className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${
              action === "withdraw" ? "text-blue-500 border-b-2 border-blue-500" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Send (Withdraw)
          </button>
        </div>

        <div className="space-y-6">
          <Select
            label="Select Token"
            id="fundToken"
            options={tokenOptions}
            value={selectedToken?.id || ""}
            onChange={(e) => setSelectedToken(tokens.find((t) => t.id === e.target.value))}
          />

          {action === "deposit" && (
            <div>
              {walletAddress && selectedToken ? (
                <div className="p-4 bg-gray-800 rounded-lg text-center">
                  <p className="text-sm text-gray-300 mb-2">
                    To receive {selectedToken.symbol}, send to your connected wallet address:
                  </p>
                  <p className="text-lg font-mono text-green-400 break-all mb-3" title={walletAddress}>
                    {walletAddress}
                  </p>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${walletAddress}`}
                    alt={`${walletAddress} QR Code`}
                    className="mx-auto my-4 rounded-md border-4 border-gray-700 shadow-lg"
                  />
                  <p className="text-xs text-gray-500">
                    Ensure you are sending {selectedToken.symbol} on the {SONIC_MAINNET_INFO.name}.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-gray-800 rounded-lg text-center">
                  <p className="text-sm text-gray-300 mb-2">Connect your wallet to see your deposit address.</p>
                  <Button onClick={onConnectWallet} variant="secondary">
                    Connect Wallet
                  </Button>
                </div>
              )}
            </div>
          )}

          {action === "withdraw" && (
            <>
              <Input
                label="Amount to Send"
                type="number"
                id="fundAmount"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                unit={selectedToken?.symbol}
              />
              {walletAddress && selectedToken && (
                <p className="text-xs text-gray-400 mt-1">
                  Your Balance: {Number.parseFloat(currentTokenBalance).toFixed(4)} {selectedToken.symbol}
                </p>
              )}
              <Input
                label="Recipient Address"
                type="text"
                id="withdrawAddress"
                placeholder={`Enter ${selectedToken?.symbol || "token"} recipient address on ${SONIC_MAINNET_INFO.name}`}
                value={withdrawToAddress}
                onChange={(e) => setWithdrawToAddress(e.target.value)}
              />
            </>
          )}

          {message && <p className="text-sm text-center text-green-400 p-2 bg-green-900/30 rounded-md">{message}</p>}
          {error && <p className="text-sm text-center text-red-400 p-2 bg-red-900/30 rounded-md">{error}</p>}

          {walletAddress && action === "withdraw" && (
            <Button
              onClick={handleSubmit}
              isLoading={isLoading}
              className="w-full"
              size="lg"
              disabled={isLoading || !amount || Number.parseFloat(amount) <= 0 || !withdrawToAddress.trim()}
            >
              {isLoading ? "Processing..." : "Send Funds"}
            </Button>
          )}
          {!walletAddress && action === "withdraw" && (
            <Button onClick={onConnectWallet} className="w-full" size="lg" variant="secondary">
              Connect Wallet to Send
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
