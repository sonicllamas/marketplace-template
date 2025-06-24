export const truncateAddress = (address: string): string => {
  if (!address) return ""
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export const formatTokenBalance = (balance: string, decimals = 18, displayDecimals = 4): string => {
  const num = Number.parseFloat(balance)
  if (num === 0) return "0"
  if (num < 0.0001) return "< 0.0001"
  return num.toFixed(displayDecimals)
}

export const isValidHttpUrl = (string: string): boolean => {
  let url: URL
  try {
    url = new URL(string)
  } catch (_) {
    return false
  }
  return url.protocol === "http:" || url.protocol === "https:"
}
