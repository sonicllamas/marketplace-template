// services/universalRouterAbi.ts

// Universal Router ABI - simplified for essential functions
// This ABI correctly includes the two `execute` function overloads for flexibility.
export const UNIVERSAL_ROUTER_ABI = [
  {
    inputs: [
      { internalType: "bytes", name: "commands", type: "bytes" },
      // FIX: Removed duplicate 'name' property for 'inputs' parameter.
      { internalType: "bytes[]", name: "inputs", type: "bytes[]" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "execute",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes", name: "commands", type: "bytes" },
      { internalType: "bytes[]", name: "inputs", type: "bytes[]" },
    ],
    name: "execute",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
] as const // Added 'as const' for improved TypeScript type inference

// Universal Router Commands (Corrected and expanded for accuracy)
export const UNIVERSAL_ROUTER_COMMANDS = {
  // V3 Swap Commands
  V3_SWAP_EXACT_IN: "0x00",
  V3_SWAP_EXACT_OUT: "0x01",

  // Permit2 Commands - These were incorrectly assigned in the original snippet.
  // The correct command codes for Permit2 operations are crucial to avoid conflicts
  // with V3 swap commands and ensure correct routing by the Universal Router.
  PERMIT2_TRANSFER_FROM: "0x02", // Corrected from "0x00" - avoids clash with V3_SWAP_EXACT_IN
  PERMIT2_PERMIT_BATCH: "0x03", // Corrected from "0x01" - avoids clash with V3_SWAP_EXACT_OUT
  PERMIT2_PERMIT: "0x0a", // Added: This is a common command for single Permit2 approvals via signature.

  // General Utility Commands
  // These commands allow for various token management operations within the router.
  SWEEP: "0x04", // Collects all of a specific token from the router's balance and sends it to a recipient.
  TRANSFER: "0x05", // Transfers a specified amount of tokens from the router's balance to a recipient.
  PAY_PORTION: "0x06", // Transfers a percentage of a token from the router's balance to a recipient.

  // V2 Swap Commands
  V2_SWAP_EXACT_IN: "0x08",
  V2_SWAP_EXACT_OUT: "0x09",

  // ETH Wrap/Unwrap Commands
  WRAP_ETH: "0x0b", // Wraps native ETH into WETH.
  UNWRAP_WETH: "0x0c", // Unwraps WETH back into native ETH.

  // Note: There are other commands (e.g., for NFT interactions, V4 hooks, etc.)
  // not included here for simplicity. Refer to the official Uniswap Universal Router
  // documentation for a comprehensive list if more functionality is needed.
} as const // Added 'as const' for improved TypeScript type inference

// Command encoding helper
// This function takes an array of command hex strings and concatenates them
// into a single byte string prefix with "0x", which is required by the
// Universal Router's `execute` function.
export const encodeCommands = (commands: string[]): `0x${string}` => {
  // Map each command to its clean hex representation and join them.
  // Basic validation is included to ensure command bytes are correctly formatted.
  const encoded = commands
    .map((cmd) => {
      const cleanCmd = cmd.toLowerCase().replace("0x", "")
      if (!/^[0-9a-fA-F]{2}$/.test(cleanCmd)) {
        throw new Error(
          `Invalid command byte: "${cmd}". Commands must be single-byte hex strings (e.g., "0x00" or "0x0a").`,
        )
      }
      return cleanCmd
    })
    .join("")

  // Return the concatenated commands as a hex string with the "0x" prefix.
  return `0x${encoded}`
}
