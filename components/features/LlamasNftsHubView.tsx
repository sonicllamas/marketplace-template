"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Card } from "../common/Card"
import { Button } from "../common/Button"
import { Input } from "../common/Input"
import { Modal } from "../common/Modal"
import { GasEstimateDisplay } from "../common/GasEstimateDisplay"
import type { ViewProps } from "../../types"
import {
  NFT_COLLECTION_LISTING_FEE_S,
  APP_PAYMENT_RECEIVER_ADDRESS,
  AVAILABLE_TOKENS,
  SONIC_LLAMAS_NFT_COLLECTION_ADDRESS,
  PAINT_SWAP_API_BASE_URL,
  MARKETPLACE_CONTRACT_ADDRESS,
} from "../../constants"
import {
  listNftCollectionOnPlatform,
  listNftForSale,
  delistNftFromSale,
  approveNftForAll,
  isNftApprovedForAll,
  estimateNftBuyGas,
  estimateNftListGas,
  estimateNftDelistGas,
  estimateNftTransferGas,
  type GasEstimate,
} from "../../services/blockchainService"
import { ethers } from "ethers"
import { NftCard } from "./NftCard"
import { truncateAddress, isValidHttpUrl } from "../../utils/formatting"
import { MARKETPLACE_ABI, ERC20_ABI, ERC721_ABI } from "../../services/contractAbis"

const NFTS_PER_PAGE = 12

interface PaintSwapApiTraitValueStatistic {
  average?: number
  trait: string
  type: string
  matches: number
  frequency: number
  [key: string]: any
}

interface PaintSwapApiTraitsResponse {
  traits: Record<string, PaintSwapApiTraitValueStatistic[]>
}

interface PaintSwapCollection {
  name: string
  owner: string
  description?: string
  banner?: string
  thumbnail?: string
  poster?: string
  stats?: {
    totalNFTs?: number
  }
}

interface PaintSwapNft {
  tokenId: string
  name: string
  description?: string
  image?: string
  external_url?: string
  animation_url?: string
  attributes?: Array<{
    trait_type: string
    value: string | number
  }>
}

interface PaintSwapTraitValueDetail {
  value: string | number
  count: number
  percentage?: number
}

interface PaintSwapTraitType {
  trait_type: string
  values: PaintSwapTraitValueDetail[]
}

interface NftCollectionListingConfig {
  contractAddress: string
  name?: string
  symbol?: string
  description?: string
  websiteLink?: string
}

export const LlamasNftsHubView: React.FC<ViewProps> = ({
  walletAddress,
  userBalances,
  provider,
  signer,
  onConnectWallet,
}) => {
  const [isListCollectionModalOpen, setIsListCollectionModalOpen] = useState(false)
  const [collectionToListAddress, setCollectionToListAddress] = useState("")
  const [collectionToListName, setCollectionToListName] = useState("")
  const [collectionToListSymbol, setCollectionToListSymbol] = useState("")
  const [collectionToListDescription, setCollectionToListDescription] = useState("")
  const [collectionToListWebsite, setCollectionToListWebsite] = useState("")
  const [listingError, setListingError] = useState<string | null>(null)
  const [listingSuccessMessage, setListingSuccessMessage] = useState<string | null>(null)
  const [isListingCollection, setIsListingCollection] = useState(false)

  const [collectionMetadata, setCollectionMetadata] = useState<PaintSwapCollection | null>(null)
  const [allNftsData, setAllNftsData] = useState<PaintSwapNft[]>([])
  const [nfts, setNfts] = useState<PaintSwapNft[]>([])
  const [isLoadingCollection, setIsLoadingCollection] = useState<boolean>(true)
  const [isLoadingNfts, setIsLoadingNfts] = useState<boolean>(false)
  const [collectionError, setCollectionError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)

  const [selectedNftForDetail, setSelectedNftForDetail] = useState<PaintSwapNft | null>(null)
  const [isNftDetailModalOpen, setIsNftDetailModalOpen] = useState(false)

  const [collectionTraits, setCollectionTraits] = useState<PaintSwapTraitType[] | null>(null)
  const [isLoadingTraits, setIsLoadingTraits] = useState<boolean>(false)
  const [traitsError, setTraitsError] = useState<string | null>(null)

  // State for Bulk Actions Modal
  const [isBulkActionModalOpen, setIsBulkActionModalOpen] = useState(false)
  const [bulkActionTokenIds, setBulkActionTokenIds] = useState("")
  const [bulkActionPrice, setBulkActionPrice] = useState("") // For bulk listing
  const [bulkActionStatus, setBulkActionStatus] = useState<string | null>(null)
  const [isBulkProcessing, setIsBulkProcessing] = useState<boolean>(false)
  const [isCheckingBulkApproval, setIsCheckingBulkApproval] = useState(false)
  const [bulkMarketplaceApprovalNeeded, setBulkMarketplaceApprovalNeeded] = useState(false)

  // Gas estimation states
  const [buyGasEstimate, setBuyGasEstimate] = useState<GasEstimate | null>(null)
  const [listGasEstimate, setListGasEstimate] = useState<GasEstimate | null>(null)
  const [delistGasEstimate, setDelistGasEstimate] = useState<GasEstimate | null>(null)
  const [sendGasEstimate, setSendGasEstimate] = useState<GasEstimate | null>(null)
  const [approvalGasEstimate, setApprovalGasEstimate] = useState<GasEstimate | null>(null)
  const [isEstimatingGas, setIsEstimatingGas] = useState<boolean>(false)
  const [gasEstimationError, setGasEstimationError] = useState<string | null>(null)

  const sTokenInfo = AVAILABLE_TOKENS.find((t) => t.symbol === "S")
  const userSTokenBalance = sTokenInfo ? Number.parseFloat(userBalances[sTokenInfo.id] || "0") : 0
  const listingFee = Number.parseFloat(NFT_COLLECTION_LISTING_FEE_S)

  useEffect(() => {
    const fetchCollectionMetadata = async () => {
      if (!SONIC_LLAMAS_NFT_COLLECTION_ADDRESS) {
        setCollectionError("Sonic Llamas collection address not configured.")
        setIsLoadingCollection(false)
        return
      }
      setIsLoadingCollection(true)
      setCollectionError(null)
      try {
        const response = await fetch(`${PAINT_SWAP_API_BASE_URL}/collections/${SONIC_LLAMAS_NFT_COLLECTION_ADDRESS}`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} for collection metadata`)
        }
        const data = await response.json()
        if (data && data.collection) {
          setCollectionMetadata(data.collection)
        } else {
          throw new Error("Collection metadata not found in API response.")
        }
      } catch (error: any) {
        console.error("Failed to fetch collection metadata:", error)
        setCollectionError(error.message || "Could not load Sonic Llamas collection details.")
      } finally {
        setIsLoadingCollection(false)
      }
    }
    fetchCollectionMetadata()
  }, [])

  const fetchAllCollectionNfts = useCallback(async () => {
    if (!SONIC_LLAMAS_NFT_COLLECTION_ADDRESS) return
    setIsLoadingNfts(true)
    try {
      const response = await fetch(`${PAINT_SWAP_API_BASE_URL}/metadata/${SONIC_LLAMAS_NFT_COLLECTION_ADDRESS}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} for fetching all NFTs`)
      }
      const data = await response.json()
      if (data && Array.isArray(data.nfts)) {
        setAllNftsData(data.nfts)
        setNfts(data.nfts.slice(0, NFTS_PER_PAGE))
        setCurrentPage(1)
        if (collectionError && collectionError.includes("NFTs")) setCollectionError(null)
      } else {
        throw new Error("NFT data not found or in unexpected format in API response.")
      }
    } catch (error: any) {
      console.error("Failed to fetch all NFTs:", error)
      setCollectionError(error.message || "Could not load Sonic Llamas NFTs.")
      setAllNftsData([])
      setNfts([])
    } finally {
      setIsLoadingNfts(false)
    }
  }, [collectionError])

  useEffect(() => {
    fetchAllCollectionNfts()
  }, [fetchAllCollectionNfts])

  const fetchCollectionTraits = useCallback(async () => {
    if (!SONIC_LLAMAS_NFT_COLLECTION_ADDRESS) {
      setTraitsError("Collection address not configured for traits.")
      return
    }

    setIsLoadingTraits(true)
    setTraitsError(null)
    try {
      const response = await fetch(`${PAINT_SWAP_API_BASE_URL}/traits/${SONIC_LLAMAS_NFT_COLLECTION_ADDRESS}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} for fetching traits`)
      }
      const apiResponse: PaintSwapApiTraitsResponse = await response.json()

      if (!apiResponse || !apiResponse.traits || typeof apiResponse.traits !== "object") {
        throw new Error("Traits data not found or in unexpected format in API response.")
      }

      const traitsData = apiResponse.traits
      const transformedTraits: PaintSwapTraitType[] = Object.entries(traitsData)
        .map(([apiTraitTypeName, traitValuesArray]) => {
          const valueDetails: PaintSwapTraitValueDetail[] = traitValuesArray
            .map((valueStat) => ({
              value: valueStat.trait,
              count: valueStat.matches,
              percentage: valueStat.frequency,
            }))
            .sort((a, b) => b.count - a.count)

          return {
            trait_type: traitValuesArray.length > 0 ? traitValuesArray[0].type : apiTraitTypeName,
            values: valueDetails,
          }
        })
        .sort((a, b) => a.trait_type.localeCompare(b.trait_type))

      setCollectionTraits(transformedTraits)
    } catch (error: any) {
      console.error("Failed to fetch collection traits:", error)
      setTraitsError(error.message || "Could not load collection traits.")
    } finally {
      setIsLoadingTraits(false)
    }
  }, [collectionMetadata])

  useEffect(() => {
    if (SONIC_LLAMAS_NFT_COLLECTION_ADDRESS && collectionMetadata) {
      fetchCollectionTraits()
    }
  }, [collectionMetadata, fetchCollectionTraits])

  const handleLoadMoreNfts = () => {
    if (isLoadingNfts || nfts.length >= allNftsData.length) return
    const nextPageToLoad = currentPage + 1
    const nextBatch = allNftsData.slice(nfts.length, nfts.length + NFTS_PER_PAGE)
    setNfts((prevNfts) => [...prevNfts, ...nextBatch])
    setCurrentPage(nextPageToLoad)
  }

  const hasMoreNfts = nfts.length < allNftsData.length

  const handleOpenListCollectionModal = () => {
    if (!walletAddress) {
      onConnectWallet()
      return
    }
    setListingError(null)
    setListingSuccessMessage(null)
    setIsListCollectionModalOpen(true)
  }

  const handleConfirmListCollection = async () => {
    if (!walletAddress || !signer) {
      setListingError("Please ensure your wallet is connected and properly initialized.")
      return
    }
    if (!collectionToListAddress.trim()) {
      setListingError("NFT Collection Address is required.")
      return
    }
    if (!ethers.isAddress(collectionToListAddress.trim())) {
      setListingError("Invalid NFT Collection Address format.")
      return
    }
    if (userSTokenBalance < listingFee) {
      setListingError(
        `Insufficient S token balance for listing fee. Required: ${listingFee} S, You have: ${userSTokenBalance.toFixed(4)} S.`,
      )
      return
    }
    const config: NftCollectionListingConfig = {
      contractAddress: collectionToListAddress.trim(),
      name: collectionToListName.trim() || undefined,
      symbol: collectionToListSymbol.trim() || undefined,
      description: collectionToListDescription.trim() || undefined,
      websiteLink: collectionToListWebsite.trim() || undefined,
    }
    setIsListingCollection(true)
    setListingError(null)
    setListingSuccessMessage(null)
    try {
      const result = await listNftCollectionOnPlatform(
        config,
        walletAddress,
        signer,
        provider,
        listingFee.toString(),
        "S",
        APP_PAYMENT_RECEIVER_ADDRESS,
      )
      setListingSuccessMessage(
        `Collection "${config.name || truncateAddress(config.contractAddress)}" listing submitted! (Mock Tx: ${truncateAddress(result.transactionHash)}). Fee of ${listingFee} S notionally sent.`,
      )
      setCollectionToListAddress("")
      setCollectionToListName("")
      setCollectionToListSymbol("")
      setCollectionToListDescription("")
      setCollectionToListWebsite("")
      setTimeout(() => setIsListCollectionModalOpen(false), 3000)
    } catch (e: any) {
      setListingError(e.message || "Failed to submit collection for listing.")
    } finally {
      setIsListingCollection(false)
    }
  }

  const [isBuyingNft, setIsBuyingNft] = useState<boolean>(false)
  const [buyTxHash, setBuyTxHash] = useState<string | null>(null)
  const [buyError, setBuyError] = useState<string | null>(null)

  const estimateBuyGas = async (nft: PaintSwapNft) => {
    if (!walletAddress || !SONIC_LLAMAS_NFT_COLLECTION_ADDRESS) return

    setIsEstimatingGas(true)
    setGasEstimationError(null)
    try {
      const estimate = await estimateNftBuyGas(
        SONIC_LLAMAS_NFT_COLLECTION_ADDRESS,
        nft.tokenId,
        walletAddress,
        provider,
      )
      setBuyGasEstimate(estimate)
    } catch (error: any) {
      setGasEstimationError(error.message || "Failed to estimate gas")
    } finally {
      setIsEstimatingGas(false)
    }
  }

  const handleBuyNft = async (nft: PaintSwapNft) => {
    if (!walletAddress || !signer || !MARKETPLACE_CONTRACT_ADDRESS || !SONIC_LLAMAS_NFT_COLLECTION_ADDRESS) {
      setBuyError("Wallet not connected or contract addresses missing")
      return
    }

    // Estimate gas first
    await estimateBuyGas(nft)

    setIsBuyingNft(true)
    setBuyError(null)
    setBuyTxHash(null)

    try {
      // Verify we're on the correct network first
      const network = await provider?.getNetwork()
      if (network && Number(network.chainId) !== 146) {
        throw new Error("Please switch to Sonic Mainnet (Chain ID: 146) to perform NFT transactions")
      }

      // Get the listing details from the marketplace contract
      const marketplaceContract = new ethers.Contract(MARKETPLACE_CONTRACT_ADDRESS, MARKETPLACE_ABI, provider)

      // Use a try-catch specifically for contract calls that might trigger ENS
      let listing
      try {
        listing = await marketplaceContract.getListing(SONIC_LLAMAS_NFT_COLLECTION_ADDRESS, nft.tokenId)
      } catch (contractError: any) {
        if (contractError.code === "UNSUPPORTED_OPERATION" && contractError.operation === "getEnsAddress") {
          throw new Error(
            "ENS is not supported on Sonic Mainnet. Please ensure your wallet is properly connected to Sonic network.",
          )
        }
        throw contractError
      }

      if (!listing || !listing.isActive) {
        throw new Error(`NFT ${nft.name} (ID: ${nft.tokenId}) is not currently listed for sale`)
      }

      const price = listing.price
      const paymentToken = listing.paymentToken

      // Get the payment token contract
      const paymentTokenContract = new ethers.Contract(paymentToken, ERC20_ABI, signer)

      // Check if user has enough balance
      let userBalance
      try {
        userBalance = await paymentTokenContract.balanceOf(walletAddress)
      } catch (balanceError: any) {
        if (balanceError.code === "UNSUPPORTED_OPERATION") {
          throw new Error("Unable to check token balance. Please ensure you're connected to Sonic Mainnet.")
        }
        throw balanceError
      }

      if (userBalance < price) {
        throw new Error(`Insufficient balance to purchase this NFT. Required: ${ethers.formatUnits(price, 18)} tokens`)
      }

      // Check if marketplace is approved to spend tokens
      let allowance
      try {
        allowance = await paymentTokenContract.allowance(walletAddress, MARKETPLACE_CONTRACT_ADDRESS)
      } catch (allowanceError: any) {
        if (allowanceError.code === "UNSUPPORTED_OPERATION") {
          throw new Error("Unable to check token allowance. Please ensure you're connected to Sonic Mainnet.")
        }
        throw allowanceError
      }

      if (allowance < price) {
        // Approve marketplace to spend tokens
        try {
          const approveTx = await paymentTokenContract.approve(MARKETPLACE_CONTRACT_ADDRESS, price)
          await approveTx.wait()
        } catch (approveError: any) {
          if (approveError.code === "UNSUPPORTED_OPERATION") {
            throw new Error("Unable to approve token spending. Please ensure you're connected to Sonic Mainnet.")
          }
          throw approveError
        }
      }

      // Execute the purchase
      const marketplaceWithSigner = marketplaceContract.connect(signer)
      let tx
      try {
        tx = await marketplaceWithSigner.buyNft(SONIC_LLAMAS_NFT_COLLECTION_ADDRESS, nft.tokenId)
        await tx.wait()
      } catch (buyError: any) {
        if (buyError.code === "UNSUPPORTED_OPERATION") {
          throw new Error("Unable to complete purchase. Please ensure you're connected to Sonic Mainnet.")
        }
        throw buyError
      }

      setBuyTxHash(tx.hash)
      console.log(`Successfully purchased NFT ${nft.name} (ID: ${nft.tokenId}). Transaction: ${tx.hash}`)

      // Refresh NFT data after successful purchase
      fetchAllCollectionNfts()
    } catch (error: any) {
      console.error("NFT purchase failed:", error)
      setBuyError(error.message || "Failed to purchase NFT. Please try again.")
    } finally {
      setIsBuyingNft(false)
    }
  }

  const [isListingNft, setIsListingNft] = useState<boolean>(false)
  const [listingPrice, setListingPrice] = useState<string>("")
  const [isListNftModalOpen, setIsListNftModalOpen] = useState<boolean>(false)
  const [selectedNftToList, setSelectedNftToList] = useState<PaintSwapNft | null>(null)
  const [listTxHash, setListTxHash] = useState<string | null>(null)
  const [listError, setListError] = useState<string | null>(null)

  const estimateListGas = async (nft: PaintSwapNft, price: string) => {
    if (!walletAddress || !SONIC_LLAMAS_NFT_COLLECTION_ADDRESS || !price || Number(price) <= 0) return

    setIsEstimatingGas(true)
    setGasEstimationError(null)
    try {
      const estimate = await estimateNftListGas(
        SONIC_LLAMAS_NFT_COLLECTION_ADDRESS,
        nft.tokenId,
        price,
        walletAddress,
        provider,
      )
      setListGasEstimate(estimate)
    } catch (error: any) {
      setGasEstimationError(error.message || "Failed to estimate gas")
    } finally {
      setIsEstimatingGas(false)
    }
  }

  const handleListNft = (nft: PaintSwapNft) => {
    setSelectedNftToList(nft)
    setListingPrice("")
    setListError(null)
    setListTxHash(null)
    setListGasEstimate(null)
    setIsListNftModalOpen(true)
  }

  // Estimate gas when price changes
  useEffect(() => {
    if (selectedNftToList && listingPrice && Number(listingPrice) > 0) {
      const timeoutId = setTimeout(() => {
        estimateListGas(selectedNftToList, listingPrice)
      }, 500) // Debounce gas estimation

      return () => clearTimeout(timeoutId)
    } else {
      setListGasEstimate(null)
    }
  }, [selectedNftToList, listingPrice, walletAddress])

  const confirmListNft = async () => {
    if (
      !selectedNftToList ||
      !walletAddress ||
      !signer ||
      !MARKETPLACE_CONTRACT_ADDRESS ||
      !SONIC_LLAMAS_NFT_COLLECTION_ADDRESS
    ) {
      setListError("Missing required information to list NFT")
      return
    }

    if (!listingPrice || Number(listingPrice) <= 0) {
      setListError("Please enter a valid price greater than 0")
      return
    }

    setIsListingNft(true)
    setListError(null)
    setListTxHash(null)

    try {
      // Verify we're on the correct network first
      const network = await provider?.getNetwork()
      if (network && Number(network.chainId) !== 146) {
        throw new Error("Please switch to Sonic Mainnet (Chain ID: 146) to perform NFT transactions")
      }

      // Check if marketplace is approved to transfer NFTs
      let isApproved
      try {
        isApproved = await isNftApprovedForAll(
          SONIC_LLAMAS_NFT_COLLECTION_ADDRESS,
          walletAddress,
          MARKETPLACE_CONTRACT_ADDRESS,
          provider,
        )
      } catch (approvalCheckError: any) {
        if (approvalCheckError.code === "UNSUPPORTED_OPERATION") {
          throw new Error("Unable to check NFT approval status. Please ensure you're connected to Sonic Mainnet.")
        }
        throw approvalCheckError
      }

      if (!isApproved) {
        // Approve marketplace to transfer NFTs
        try {
          const approveTx = await approveNftForAll(
            SONIC_LLAMAS_NFT_COLLECTION_ADDRESS,
            MARKETPLACE_CONTRACT_ADDRESS,
            true,
            signer,
          )
          console.log(`Approved marketplace to transfer NFTs. Transaction: ${approveTx}`)
        } catch (approveError: any) {
          if (approveError.code === "UNSUPPORTED_OPERATION") {
            throw new Error("Unable to approve NFT transfers. Please ensure you're connected to Sonic Mainnet.")
          }
          throw approveError
        }
      }

      // List the NFT for sale
      let txHash
      try {
        txHash = await listNftForSale(
          SONIC_LLAMAS_NFT_COLLECTION_ADDRESS,
          selectedNftToList.tokenId,
          listingPrice,
          signer,
        )
      } catch (listError: any) {
        if (listError.code === "UNSUPPORTED_OPERATION") {
          throw new Error("Unable to list NFT for sale. Please ensure you're connected to Sonic Mainnet.")
        }
        throw listError
      }

      setListTxHash(txHash)
      console.log(
        `Successfully listed NFT ${selectedNftToList.name} (ID: ${selectedNftToList.tokenId}) for ${listingPrice} S. Transaction: ${txHash}`,
      )

      // Close modal after successful listing
      setTimeout(() => {
        setIsListNftModalOpen(false)
        fetchAllCollectionNfts() // Refresh NFT data
      }, 3000)
    } catch (error: any) {
      console.error("NFT listing failed:", error)
      setListError(error.message || "Failed to list NFT. Please try again.")
    } finally {
      setIsListingNft(false)
    }
  }

  const [isDelistingNft, setIsDelistingNft] = useState<boolean>(false)
  const [delistTxHash, setDelistTxHash] = useState<string | null>(null)
  const [delistError, setDelistError] = useState<string | null>(null)

  const estimateDelistGas = async (nft: PaintSwapNft) => {
    if (!walletAddress || !SONIC_LLAMAS_NFT_COLLECTION_ADDRESS) return

    setIsEstimatingGas(true)
    setGasEstimationError(null)
    try {
      const estimate = await estimateNftDelistGas(
        SONIC_LLAMAS_NFT_COLLECTION_ADDRESS,
        nft.tokenId,
        walletAddress,
        provider,
      )
      setDelistGasEstimate(estimate)
    } catch (error: any) {
      setGasEstimationError(error.message || "Failed to estimate gas")
    } finally {
      setIsEstimatingGas(false)
    }
  }

  const handleDelistNft = async (nft: PaintSwapNft) => {
    if (!walletAddress || !signer || !MARKETPLACE_CONTRACT_ADDRESS || !SONIC_LLAMAS_NFT_COLLECTION_ADDRESS) {
      setDelistError("Wallet not connected or contract addresses missing")
      return
    }

    // Estimate gas first
    await estimateDelistGas(nft)

    if (!window.confirm(`Are you sure you want to delist NFT: ${nft.name} (ID: ${nft.tokenId}) from sale?`)) {
      return
    }

    setIsDelistingNft(true)
    setDelistError(null)
    setDelistTxHash(null)

    try {
      // Delist the NFT from sale
      const txHash = await delistNftFromSale(SONIC_LLAMAS_NFT_COLLECTION_ADDRESS, nft.tokenId, signer)

      setDelistTxHash(txHash)
      console.log(`Successfully delisted NFT ${nft.name} (ID: ${nft.tokenId}). Transaction: ${txHash}`)

      // Refresh NFT data after successful delisting
      fetchAllCollectionNfts()
    } catch (error: any) {
      console.error("NFT delisting failed:", error)
      setDelistError(error.message || "Failed to delist NFT. Please try again.")
    } finally {
      setIsDelistingNft(false)
    }
  }

  const [isSendingNft, setIsSendingNft] = useState<boolean>(false)
  const [recipientAddress, setRecipientAddress] = useState<string>("")
  const [isSendNftModalOpen, setIsSendNftModalOpen] = useState<boolean>(false)
  const [selectedNftToSend, setSelectedNftToSend] = useState<PaintSwapNft | null>(null)
  const [sendTxHash, setSendTxHash] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)

  const estimateSendGas = async (nft: PaintSwapNft, toAddress: string) => {
    if (!walletAddress || !SONIC_LLAMAS_NFT_COLLECTION_ADDRESS || !ethers.isAddress(toAddress)) return

    setIsEstimatingGas(true)
    setGasEstimationError(null)
    try {
      const estimate = await estimateNftTransferGas(
        SONIC_LLAMAS_NFT_COLLECTION_ADDRESS,
        nft.tokenId,
        walletAddress,
        toAddress,
        provider,
      )
      setSendGasEstimate(estimate)
    } catch (error: any) {
      setGasEstimationError(error.message || "Failed to estimate gas")
    } finally {
      setIsEstimatingGas(false)
    }
  }

  const handleSendNft = (nft: PaintSwapNft) => {
    setSelectedNftToSend(nft)
    setRecipientAddress("")
    setSendError(null)
    setSendTxHash(null)
    setSendGasEstimate(null)
    setIsSendNftModalOpen(true)
  }

  // Estimate gas when recipient address changes
  useEffect(() => {
    if (selectedNftToSend && recipientAddress && ethers.isAddress(recipientAddress)) {
      const timeoutId = setTimeout(() => {
        estimateSendGas(selectedNftToSend, recipientAddress)
      }, 500) // Debounce gas estimation

      return () => clearTimeout(timeoutId)
    } else {
      setSendGasEstimate(null)
    }
  }, [selectedNftToSend, recipientAddress, walletAddress])

  const confirmSendNft = async () => {
    if (!selectedNftToSend || !walletAddress || !signer || !SONIC_LLAMAS_NFT_COLLECTION_ADDRESS) {
      setSendError("Missing required information to send NFT")
      return
    }

    if (!recipientAddress.trim() || !ethers.isAddress(recipientAddress.trim())) {
      setSendError("Please enter a valid recipient address")
      return
    }

    setIsSendingNft(true)
    setSendError(null)
    setSendTxHash(null)

    try {
      // Create NFT contract instance
      const nftContract = new ethers.Contract(SONIC_LLAMAS_NFT_COLLECTION_ADDRESS, ERC721_ABI, signer)

      // Check if sender is the owner of the NFT
      const owner = await nftContract.ownerOf(selectedNftToSend.tokenId)
      if (owner.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new Error("You are not the owner of this NFT")
      }

      // Transfer the NFT
      const tx = await nftContract.transferFrom(walletAddress, recipientAddress.trim(), selectedNftToSend.tokenId)
      const receipt = await tx.wait()

      setSendTxHash(tx.hash)
      console.log(
        `Successfully sent NFT ${selectedNftToSend.name} (ID: ${selectedNftToSend.tokenId}) to ${recipientAddress}. Transaction: ${tx.hash}`,
      )

      // Close modal after successful transfer
      setTimeout(() => {
        setIsSendNftModalOpen(false)
        fetchAllCollectionNfts() // Refresh NFT data
      }, 3000)
    } catch (error: any) {
      console.error("NFT transfer failed:", error)
      setSendError(error.message || "Failed to send NFT. Please try again.")
    } finally {
      setIsSendingNft(false)
    }
  }

  const [isBurningNft, setIsBurningNft] = useState<boolean>(false)
  const [burnTxHash, setBurnTxHash] = useState<string | null>(null)
  const [burnError, setBurnError] = useState<string | null>(null)
  const [isBurnNftModalOpen, setIsBurnNftModalOpen] = useState<boolean>(false)
  const [selectedNftToBurn, setSelectedNftToBurn] = useState<PaintSwapNft | null>(null)

  const handleBurnNft = (nft: PaintSwapNft) => {
    setSelectedNftToBurn(nft)
    setBurnError(null)
    setBurnTxHash(null)
    setIsBurnNftModalOpen(true)
  }

  const confirmBurnNft = async () => {
    if (!selectedNftToBurn || !walletAddress || !signer || !SONIC_LLAMAS_NFT_COLLECTION_ADDRESS) {
      setBurnError("Missing required information to burn NFT")
      return
    }

    setIsBurningNft(true)
    setBurnError(null)
    setBurnTxHash(null)

    try {
      // Create NFT contract instance
      const nftContract = new ethers.Contract(SONIC_LLAMAS_NFT_COLLECTION_ADDRESS, ERC721_ABI, signer)

      // Check if sender is the owner of the NFT
      const owner = await nftContract.ownerOf(selectedNftToBurn.tokenId)
      if (owner.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new Error("You are not the owner of this NFT")
      }

      // Burn the NFT - using the burn function if it exists, otherwise send to dead address
      let tx
      if (nftContract.burn) {
        tx = await nftContract.burn(selectedNftToBurn.tokenId)
      } else {
        // Send to dead address if no burn function
        const deadAddress = "0x000000000000000000000000000000000000dEaD"
        tx = await nftContract.transferFrom(walletAddress, deadAddress, selectedNftToBurn.tokenId)
      }

      const receipt = await tx.wait()

      setBurnTxHash(tx.hash)
      console.log(
        `Successfully burned NFT ${selectedNftToBurn.name} (ID: ${selectedNftToBurn.tokenId}). Transaction: ${tx.hash}`,
      )

      // Close modal after successful burn
      setTimeout(() => {
        setIsBurnNftModalOpen(false)
        fetchAllCollectionNfts() // Refresh NFT data
      }, 3000)
    } catch (error: any) {
      console.error("NFT burn failed:", error)
      setBurnError(error.message || "Failed to burn NFT. Please try again.")
    } finally {
      setIsBurningNft(false)
    }
  }

  const handleOpenBulkActionModal = () => {
    setIsBulkActionModalOpen(true)
  }

  const handleNftCardClick = (nft: PaintSwapNft) => {
    setSelectedNftForDetail(nft)
    setIsNftDetailModalOpen(true)
  }

  const handleCloseNftDetailModal = () => {
    setIsNftDetailModalOpen(false)
    setSelectedNftForDetail(null)
  }

  const handleApproveCollectionForMarketplace = async () => {
    if (!signer || !SONIC_LLAMAS_NFT_COLLECTION_ADDRESS || !MARKETPLACE_CONTRACT_ADDRESS) {
      setBulkActionStatus("Error: Missing signer or contract addresses.")
      return
    }

    setIsBulkProcessing(true)
    setBulkActionStatus("Approving collection for marketplace...")

    try {
      const approveTx = await approveNftForAll(
        SONIC_LLAMAS_NFT_COLLECTION_ADDRESS,
        MARKETPLACE_CONTRACT_ADDRESS,
        true,
        signer,
      )
      await approveTx.wait()
      setBulkActionStatus("Collection approved for marketplace. You can now list NFTs.")
      setBulkMarketplaceApprovalNeeded(false)
    } catch (error: any) {
      console.error("Approval failed:", error)
      setBulkActionStatus(`Error approving collection: ${error.message || "Unknown error"}`)
    } finally {
      setIsBulkProcessing(false)
    }
  }

  const handleBulkListFromModal = async () => {
    if (!signer || !SONIC_LLAMAS_NFT_COLLECTION_ADDRESS || !MARKETPLACE_CONTRACT_ADDRESS) {
      setBulkActionStatus("Error: Missing signer or contract addresses.")
      return
    }

    const tokenIds = bulkActionTokenIds.split(",").map((id) => id.trim())
    const price = bulkActionPrice

    if (!tokenIds.every((id) => /^\d+$/.test(id))) {
      setBulkActionStatus("Error: Please enter valid numeric Token IDs separated by commas.")
      return
    }

    if (!price || Number(price) <= 0) {
      setBulkActionStatus("Error: Please enter a valid price greater than 0.")
      return
    }

    setIsBulkProcessing(true)
    setBulkActionStatus("Listing NFTs...")

    try {
      for (const tokenId of tokenIds) {
        await listNftForSale(SONIC_LLAMAS_NFT_COLLECTION_ADDRESS, tokenId, price, signer)
      }
      setBulkActionStatus("NFTs listed successfully.")
      fetchAllCollectionNfts() // Refresh NFT data
    } catch (error: any) {
      console.error("Bulk listing failed:", error)
      setBulkActionStatus(`Error listing NFTs: ${error.message || "Unknown error"}`)
    } finally {
      setIsBulkProcessing(false)
    }
  }

  const handleBulkDelistFromModal = async () => {
    if (!signer || !SONIC_LLAMAS_NFT_COLLECTION_ADDRESS || !MARKETPLACE_CONTRACT_ADDRESS) {
      setBulkActionStatus("Error: Missing signer or contract addresses.")
      return
    }

    const tokenIds = bulkActionTokenIds.split(",").map((id) => id.trim())

    if (!tokenIds.every((id) => /^\d+$/.test(id))) {
      setBulkActionStatus("Error: Please enter valid numeric Token IDs separated by commas.")
      return
    }

    setIsBulkProcessing(true)
    setBulkActionStatus("Delisting NFTs...")

    try {
      for (const tokenId of tokenIds) {
        await delistNftFromSale(SONIC_LLAMAS_NFT_COLLECTION_ADDRESS, tokenId, signer)
      }
      setBulkActionStatus("NFTs delisted successfully.")
      fetchAllCollectionNfts() // Refresh NFT data
    } catch (error: any) {
      console.error("Bulk delisting failed:", error)
      setBulkActionStatus(`Error delisting NFTs: ${error.message || "Unknown error"}`)
    } finally {
      setIsBulkProcessing(false)
    }
  }

  return (
    <div className="space-y-12">
      <Card title="List Your NFT Collection" titleClassName="text-2xl font-mono">
        <div className="space-y-6 p-2 md:p-4">
          <p className="text-gray-300 text-center">
            Got an amazing NFT collection on the Sonic network? List it on Llamas Hub to gain visibility!
          </p>
          <div className="text-sm text-yellow-300 bg-yellow-900/40 p-4 rounded-lg border border-yellow-700/60 shadow-md">
            <p className="font-semibold mb-1">Platform Listing Fee:</p>
            <p>
              A one-time fee of{" "}
              <strong>
                {NFT_COLLECTION_LISTING_FEE_S} {sTokenInfo?.symbol || "S"}
              </strong>{" "}
              is required to list your collection. This fee will be notionally sent to the Llamas Hub treasury address:{" "}
              <br />
              <span className="font-mono text-xs break-all">{APP_PAYMENT_RECEIVER_ADDRESS}</span>.
            </p>
            {walletAddress && sTokenInfo && (
              <p className="mt-2">
                Your current {sTokenInfo.symbol} balance:{" "}
                <strong className="text-green-400">
                  {userSTokenBalance.toFixed(Math.min(4, sTokenInfo.decimals || 4))} {sTokenInfo.symbol}
                </strong>
              </p>
            )}
            {!walletAddress && (
              <p className="mt-2 text-yellow-400">Connect your wallet to see your balance and proceed with listing.</p>
            )}
          </div>
          <div className="text-center mt-6">
            <Button
              onClick={handleOpenListCollectionModal}
              variant="primary"
              size="lg"
              disabled={!walletAddress || (sTokenInfo && userSTokenBalance < listingFee)}
              className="w-full sm:w-auto"
            >
              {walletAddress
                ? sTokenInfo && userSTokenBalance < listingFee
                  ? `Insufficient ${sTokenInfo.symbol} Balance`
                  : "Proceed to List Collection"
                : "Connect Wallet to List"}
            </Button>
          </div>
          {walletAddress && sTokenInfo && userSTokenBalance < listingFee && (
            <p className="text-xs text-red-400 text-center mt-2">
              You need at least {listingFee} {sTokenInfo.symbol} to list a collection.
            </p>
          )}
        </div>
      </Card>

      <Card titleClassName="text-3xl font-mono">
        {isLoadingCollection && (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-300">Loading Sonic Llamas Collection...</p>
          </div>
        )}
        {collectionError && !isLoadingCollection && !collectionMetadata && (
          <div className="text-center py-10 px-4">
            <p className="text-red-400 text-lg mb-2">Error Loading Collection</p>
            <p className="text-sm text-gray-400 mb-4">{collectionError}</p>
            <Button
              onClick={() => {
                alert("Retry logic not implemented yet.")
              }}
              variant="secondary"
            >
              Retry
            </Button>
          </div>
        )}
        {collectionMetadata && !isLoadingCollection && (
          <>
            {collectionMetadata.banner && isValidHttpUrl(collectionMetadata.banner) && (
              <div className="h-48 md:h-64 lg:h-80 w-full mb-6 rounded-t-xl overflow-hidden shadow-lg">
                <img
                  src={collectionMetadata.banner || "/placeholder.svg"}
                  alt={`${collectionMetadata.name} Banner`}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6 mb-6 px-4 md:px-0">
              {(collectionMetadata.thumbnail || collectionMetadata.poster) &&
                isValidHttpUrl(collectionMetadata.thumbnail || collectionMetadata.poster) && (
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-gray-700 shadow-xl flex-shrink-0 bg-gray-700">
                    <img
                      src={collectionMetadata.thumbnail || collectionMetadata.poster || ""}
                      alt={`${collectionMetadata.name} Logo`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              <div className="flex-grow">
                <h2 className="text-3xl font-bold font-mono text-gray-100">{collectionMetadata.name}</h2>
                <p className="text-sm text-gray-400">
                  By: <span className="font-mono text-green-400">{truncateAddress(collectionMetadata.owner)}</span>
                </p>
                {collectionMetadata.description && (
                  <p className="text-gray-300 mt-2 text-sm">{collectionMetadata.description}</p>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center mb-6 px-4 md:px-0">
              <h3 className="text-2xl font-semibold text-gray-100">
                NFTs in this Collection ({collectionMetadata.stats?.totalNFTs || allNftsData.length})
              </h3>
              <Button onClick={handleOpenBulkActionModal} variant="outline" size="sm" disabled={!walletAddress}>
                Bulk Manage NFTs
              </Button>
            </div>

            {isLoadingNfts && nfts.length === 0 && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-500 mx-auto mb-3"></div>
                <p className="text-gray-400">Loading NFTs...</p>
              </div>
            )}
            {collectionError && nfts.length === 0 && !isLoadingNfts && collectionError.includes("NFTs") && (
              <div className="text-center py-8 px-4">
                <p className="text-red-400 text-lg mb-2">Error Loading NFTs</p>
                <p className="text-sm text-gray-400 mb-4">{collectionError}</p>
                <Button onClick={fetchAllCollectionNfts} variant="secondary">
                  Retry Fetching NFTs
                </Button>
              </div>
            )}

            {nfts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {nfts.map((nft) => (
                  <NftCard
                    key={`${SONIC_LLAMAS_NFT_COLLECTION_ADDRESS}-${nft.tokenId}`}
                    nft={nft}
                    onClick={handleNftCardClick}
                    onBuy={handleBuyNft}
                    onList={handleListNft}
                    onDelist={handleDelistNft}
                    onSend={handleSendNft}
                    onBurn={handleBurnNft}
                  />
                ))}
              </div>
            ) : (
              !isLoadingNfts &&
              !collectionError &&
              allNftsData.length === 0 && (
                <p className="text-center text-gray-400 py-8">No NFTs found in this collection (yet!).</p>
              )
            )}
            {isLoadingNfts && nfts.length > 0 && (
              <div className="text-center mt-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            )}
            {!isLoadingNfts && hasMoreNfts && nfts.length > 0 && (
              <div className="text-center mt-8">
                <Button onClick={handleLoadMoreNfts} variant="secondary" size="lg">
                  Load More NFTs
                </Button>
              </div>
            )}
            {!isLoadingNfts && !hasMoreNfts && allNftsData.length > 0 && nfts.length === allNftsData.length && (
              <p className="text-center text-gray-500 mt-8 text-sm">All NFTs loaded.</p>
            )}
          </>
        )}
      </Card>

      {collectionMetadata && collectionTraits && collectionTraits.length > 0 && !isLoadingTraits && (
        <Card title="Collection Trait Rarity" titleClassName="text-2xl font-mono">
          <div className="space-y-6">
            {collectionTraits.map((traitType) => (
              <div key={traitType.trait_type}>
                <h4 className="text-lg font-semibold text-gray-200 mb-2 capitalize">
                  {traitType.trait_type.replace(/_/g, " ")}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {traitType.values.slice(0, 8).map((valueDetail) => (
                    <div key={valueDetail.value} className="bg-gray-700 p-2 rounded-md shadow text-xs">
                      <p className="font-medium text-gray-300 truncate" title={String(valueDetail.value)}>
                        {String(valueDetail.value)}
                      </p>
                      <p className="text-gray-400">
                        Count: {valueDetail.count}
                        {valueDetail.percentage !== undefined && collectionMetadata.stats?.totalNFTs && (
                          <span className="text-green-400 ml-1">({valueDetail.percentage.toFixed(2)}%)</span>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      {isLoadingTraits && (
        <Card title="Collection Trait Rarity" titleClassName="text-2xl font-mono">
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-500 mx-auto mb-2"></div>
            <p className="text-gray-400">Loading trait information...</p>
          </div>
        </Card>
      )}
      {traitsError && !isLoadingTraits && (
        <Card title="Collection Trait Rarity" titleClassName="text-2xl font-mono">
          <p className="text-red-400 text-center py-4">Error loading traits: {traitsError}</p>
        </Card>
      )}

      {/* List Collection Modal */}
      {isListCollectionModalOpen && (
        <Modal
          isOpen={isListCollectionModalOpen}
          onClose={() => setIsListCollectionModalOpen(false)}
          title="Submit Your NFT Collection for Listing"
          size="lg"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-400 mb-1">
              Please provide the following details for your NFT collection. All fields marked with * are required.
            </p>
            <Input
              label="NFT Collection Contract Address*"
              id="collectionToListAddress"
              value={collectionToListAddress}
              onChange={(e) => {
                setCollectionToListAddress(e.target.value)
                setListingError(null)
              }}
              placeholder="0x123abc..."
              error={
                listingError && (!collectionToListAddress.trim() || !ethers.isAddress(collectionToListAddress.trim()))
                  ? !collectionToListAddress.trim()
                    ? "Collection address is required."
                    : "Invalid address format."
                  : undefined
              }
              disabled={isListingCollection}
            />
            <Input
              label="Collection Name (Optional)"
              id="collectionToListName"
              value={collectionToListName}
              onChange={(e) => setCollectionToListName(e.target.value)}
              placeholder="e.g., Awesome Llamas"
              disabled={isListingCollection}
            />
            <Input
              label="Collection Symbol (Optional)"
              id="collectionToListSymbol"
              value={collectionToListSymbol}
              onChange={(e) => setCollectionToListSymbol(e.target.value)}
              placeholder="e.g., AWL"
              disabled={isListingCollection}
            />
            <Input
              label="Collection Description (Optional)"
              id="collectionToListDescription"
              type="textarea"
              value={collectionToListDescription}
              onChange={(e) => setCollectionToListDescription(e.target.value)}
              placeholder="Tell us about your cool collection..."
              className="min-h-[100px]"
              disabled={isListingCollection}
            />
            <Input
              label="Official Website Link (Optional, must be http/https)"
              id="collectionToListWebsite"
              value={collectionToListWebsite}
              onChange={(e) => {
                setCollectionToListWebsite(e.target.value)
                if (e.target.value.trim() && !isValidHttpUrl(e.target.value.trim())) {
                  setListingError("Website link must be a valid http or https URL.")
                } else if (listingError === "Website link must be a valid http or https URL.") {
                  setListingError(null)
                }
              }}
              placeholder="https://yourcollection.com"
              error={listingError === "Website link must be a valid http or https URL." ? listingError : undefined}
              disabled={isListingCollection}
            />

            <div className="mt-4 text-xs text-yellow-300 bg-yellow-900/30 p-3 rounded-md border border-yellow-700/50">
              <p>
                Platform Fee:{" "}
                <strong>
                  {NFT_COLLECTION_LISTING_FEE_S} {sTokenInfo?.symbol || "S"}
                </strong>{" "}
                will be (notionally) transferred from your wallet.
              </p>
              {walletAddress && sTokenInfo && (
                <p>
                  Your current {sTokenInfo.symbol} balance:{" "}
                  <strong>
                    {userSTokenBalance.toFixed(Math.min(4, sTokenInfo.decimals || 4))} {sTokenInfo.symbol}
                  </strong>
                </p>
              )}
            </div>

            {listingError && <p className="text-sm text-red-400 text-center py-2">{listingError}</p>}
            {listingSuccessMessage && (
              <p className="text-sm text-green-400 text-center py-2">{listingSuccessMessage}</p>
            )}

            <Button
              onClick={handleConfirmListCollection}
              isLoading={isListingCollection}
              className="w-full"
              size="lg"
              disabled={
                isListingCollection ||
                !collectionToListAddress.trim() ||
                !ethers.isAddress(collectionToListAddress.trim()) ||
                (collectionToListWebsite.trim() !== "" && !isValidHttpUrl(collectionToListWebsite.trim())) ||
                (sTokenInfo ? userSTokenBalance < listingFee : true)
              }
            >
              {isListingCollection
                ? "Submitting..."
                : `Submit Collection & Pay ${NFT_COLLECTION_LISTING_FEE_S} ${sTokenInfo?.symbol || "S"} (Mock)`}
            </Button>
          </div>
        </Modal>
      )}

      {/* NFT Detail Modal */}
      {selectedNftForDetail && (
        <Modal
          isOpen={isNftDetailModalOpen}
          onClose={handleCloseNftDetailModal}
          title={selectedNftForDetail.name || "NFT Details"}
          size="2xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="aspect-square w-full bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                <img
                  src={selectedNftForDetail.image || "https://via.placeholder.com/400?text=No+Image"}
                  alt={selectedNftForDetail.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = "https://via.placeholder.com/400?text=Image+Error"
                  }}
                />
              </div>
              <div className="space-y-2">
                {selectedNftForDetail.external_url && isValidHttpUrl(selectedNftForDetail.external_url) && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(selectedNftForDetail.external_url, "_blank")}
                  >
                    View on External Site
                  </Button>
                )}
                {selectedNftForDetail.animation_url && isValidHttpUrl(selectedNftForDetail.animation_url) && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(selectedNftForDetail.animation_url, "_blank")}
                  >
                    View Animation
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-4 flex flex-col">
              <div>
                <h3 className="text-2xl font-semibold text-gray-100 font-mono">{selectedNftForDetail.name}</h3>
                <p className="text-sm text-gray-400">
                  Token ID: <span className="font-mono text-green-400">{selectedNftForDetail.tokenId}</span>
                </p>
              </div>
              {selectedNftForDetail.description && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-200 mb-1">Description:</h4>
                  <p className="text-xs text-gray-300 bg-gray-700 p-2 rounded-md max-h-24 overflow-y-auto custom-scrollbar">
                    {selectedNftForDetail.description}
                  </p>
                </div>
              )}
              {selectedNftForDetail.attributes && selectedNftForDetail.attributes.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-200 mb-2">Attributes:</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                    {selectedNftForDetail.attributes.map((attr, index) => (
                      <div key={index} className="bg-gray-700 p-2 rounded-md text-xs shadow">
                        <p className="font-semibold text-green-400 capitalize">{attr.trait_type.replace(/_/g, " ")}:</p>
                        <p className="text-gray-300 truncate" title={String(attr.value)}>
                          {String(attr.value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gas Estimate Display */}
              {buyGasEstimate && (
                <GasEstimateDisplay
                  gasEstimate={buyGasEstimate}
                  isLoading={isEstimatingGas}
                  error={gasEstimationError}
                  className="mt-4"
                />
              )}

              <div className="pt-4 mt-auto border-t border-gray-700/50 grid grid-cols-2 lg:grid-cols-3 gap-2">
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleBuyNft(selectedNftForDetail)
                  }}
                  variant="primary"
                  size="sm"
                  className="w-full"
                  isLoading={isBuyingNft}
                  disabled={isBuyingNft}
                >
                  {isBuyingNft ? "Buying..." : "Buy"}
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleListNft(selectedNftForDetail)
                  }}
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  disabled={isListingNft}
                >
                  List
                </Button>

                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelistNft(selectedNftForDetail)
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full border-yellow-500 text-yellow-400 hover:bg-yellow-700 hover:text-white"
                  isLoading={isDelistingNft}
                  disabled={isDelistingNft}
                >
                  {isDelistingNft ? "Delisting..." : "Delist"}
                </Button>

                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSendNft(selectedNftForDetail)
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={isSendingNft}
                >
                  Send
                </Button>

                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleBurnNft(selectedNftForDetail)
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full border-red-500 text-red-400 hover:bg-red-700 hover:text-white"
                  disabled={isBurningNft}
                >
                  Burn
                </Button>
              </div>
              {(buyError || delistError) && (
                <p className="text-red-400 text-xs mt-2 p-2 bg-red-900/30 rounded-md">{buyError || delistError}</p>
              )}
              {(buyTxHash || delistTxHash) && (
                <p className="text-green-400 text-xs mt-2 p-2 bg-green-900/30 rounded-md">
                  Transaction successful: {truncateAddress(buyTxHash || delistTxHash || "")}
                </p>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Bulk Actions Modal */}
      {isBulkActionModalOpen && (
        <Modal
          isOpen={isBulkActionModalOpen}
          onClose={() => setIsBulkActionModalOpen(false)}
          title="Bulk Manage Collection NFTs"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-300">
              Manage your NFTs from the '{collectionMetadata?.name || "Current"}' collection. Ensure you own these Token
              IDs.
            </p>
            <Input
              label="Token IDs (comma-separated)"
              id="bulkActionTokenIds"
              type="textarea"
              value={bulkActionTokenIds}
              onChange={(e) => setBulkActionTokenIds(e.target.value)}
              placeholder="e.g., 101, 2035, 80"
              className="min-h-[80px]"
              disabled={isBulkProcessing || isCheckingBulkApproval}
            />
            <Input
              label="Price per NFT (in S token, for listing)"
              id="bulkActionPrice"
              type="number"
              value={bulkActionPrice}
              onChange={(e) => setBulkActionPrice(e.target.value)}
              placeholder="e.g., 100"
              unit="S"
              disabled={isBulkProcessing || isCheckingBulkApproval}
            />

            {bulkMarketplaceApprovalNeeded && walletAddress && (
              <Button
                onClick={handleApproveCollectionForMarketplace}
                variant="outline"
                className="w-full border-yellow-500 text-yellow-400 hover:bg-yellow-700 hover:text-white"
                isLoading={isBulkProcessing && bulkActionStatus?.toLowerCase().includes("approving")}
                disabled={isBulkProcessing || isCheckingBulkApproval}
              >
                Approve Collection for Marketplace
              </Button>
            )}

            {bulkActionStatus && (
              <p
                className={`text-sm text-center p-3 rounded-md whitespace-pre-wrap ${
                  bulkActionStatus.includes("Error") ||
                  bulkActionStatus.includes("Please enter") ||
                  bulkActionStatus.includes("failed") ||
                  bulkActionStatus.includes("failed")
                    ? "bg-red-900/50 text-red-300"
                    : isBulkProcessing || isCheckingBulkApproval
                      ? "bg-blue-900/50 text-blue-300"
                      : "bg-green-900/50 text-green-300"
                }`}
              >
                {bulkActionStatus}
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                onClick={handleBulkListFromModal}
                variant="primary"
                className="flex-1"
                isLoading={isBulkProcessing && bulkActionStatus?.toLowerCase().includes("listing")}
                disabled={isBulkProcessing || isCheckingBulkApproval || bulkMarketplaceApprovalNeeded}
                title={bulkMarketplaceApprovalNeeded ? "Approve collection first to enable listing" : ""}
              >
                {isBulkProcessing && bulkActionStatus?.toLowerCase().includes("listing")
                  ? "Processing List..."
                  : "Bulk List IDs"}
              </Button>
              <Button
                onClick={handleBulkDelistFromModal}
                variant="secondary"
                className="flex-1"
                isLoading={isBulkProcessing && bulkActionStatus?.toLowerCase().includes("delisting")}
                disabled={isBulkProcessing || isCheckingBulkApproval}
              >
                {isBulkProcessing && bulkActionStatus?.toLowerCase().includes("delisting")
                  ? "Processing Delist..."
                  : "Bulk Delist IDs"}
              </Button>
            </div>
            <p className="text-xs text-gray-500 text-center">
              Transactions are sent to the blockchain. Ensure you have enough gas.
            </p>
          </div>
        </Modal>
      )}

      {/* List NFT Modal */}
      {isListNftModalOpen && selectedNftToList && (
        <Modal
          isOpen={isListNftModalOpen}
          onClose={() => setIsListNftModalOpen(false)}
          title={`List ${selectedNftToList.name} for Sale`}
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-md overflow-hidden bg-gray-700">
                <img
                  src={selectedNftToList.image || "/placeholder.svg"}
                  alt={selectedNftToList.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{selectedNftToList.name}</h3>
                <p className="text-sm text-gray-400">ID: {selectedNftToList.tokenId}</p>
              </div>
            </div>

            <Input
              label="Price in S token"
              id="listingPrice"
              type="number"
              value={listingPrice}
              onChange={(e) => setListingPrice(e.target.value)}
              placeholder="e.g., 100"
              unit="S"
              disabled={isListingNft}
            />

            {/* Gas Estimate Display */}
            <GasEstimateDisplay gasEstimate={listGasEstimate} isLoading={isEstimatingGas} error={gasEstimationError} />

            {listError && <p className="text-red-400 text-sm p-2 bg-red-900/30 rounded-md">{listError}</p>}

            {listTxHash && (
              <p className="text-green-400 text-sm p-2 bg-green-900/30 rounded-md">
                NFT listed successfully! Transaction: {truncateAddress(listTxHash)}
              </p>
            )}

            <Button
              onClick={confirmListNft}
              isLoading={isListingNft}
              disabled={isListingNft || !listingPrice || Number(listingPrice) <= 0}
              className="w-full"
            >
              {isListingNft ? "Listing..." : "List NFT for Sale"}
            </Button>
          </div>
        </Modal>
      )}

      {/* Send NFT Modal */}
      {isSendNftModalOpen && selectedNftToSend && (
        <Modal
          isOpen={isSendNftModalOpen}
          onClose={() => setIsSendNftModalOpen(false)}
          title={`Send ${selectedNftToSend.name} to Another Wallet`}
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-md overflow-hidden bg-gray-700">
                <img
                  src={selectedNftToSend.image || "/placeholder.svg"}
                  alt={selectedNftToSend.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{selectedNftToSend.name}</h3>
                <p className="text-sm text-gray-400">ID: {selectedNftToSend.tokenId}</p>
              </div>
            </div>

            <Input
              label="Recipient Address"
              id="recipientAddress"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              placeholder="0x..."
              disabled={isSendingNft}
            />

            {/* Gas Estimate Display */}
            <GasEstimateDisplay gasEstimate={sendGasEstimate} isLoading={isEstimatingGas} error={gasEstimationError} />

            {sendError && <p className="text-red-400 text-sm p-2 bg-red-900/30 rounded-md">{sendError}</p>}

            {sendTxHash && (
              <p className="text-green-400 text-sm p-2 bg-green-900/30 rounded-md">
                NFT sent successfully! Transaction: {truncateAddress(sendTxHash)}
              </p>
            )}

            <Button
              onClick={confirmSendNft}
              isLoading={isSendingNft}
              disabled={isSendingNft || !recipientAddress.trim() || !ethers.isAddress(recipientAddress.trim())}
              className="w-full"
            >
              {isSendingNft ? "Sending..." : "Send NFT"}
            </Button>
          </div>
        </Modal>
      )}

      {/* Burn NFT Modal */}
      {isBurnNftModalOpen && selectedNftToBurn && (
        <Modal
          isOpen={isBurnNftModalOpen}
          onClose={() => setIsBurnNftModalOpen(false)}
          title={`Burn ${selectedNftToBurn.name}`}
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-md overflow-hidden bg-gray-700">
                <img
                  src={selectedNftToBurn.image || "/placeholder.svg"}
                  alt={selectedNftToBurn.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{selectedNftToBurn.name}</h3>
                <p className="text-sm text-gray-400">ID: {selectedNftToBurn.tokenId}</p>
              </div>
            </div>

            <div className="bg-red-900/30 border border-red-700/50 rounded-md p-4">
              <p className="text-red-300 text-sm font-semibold mb-2">⚠️ Warning: This action is irreversible!</p>
              <p className="text-red-400 text-sm">
                Burning this NFT will permanently destroy it. This action cannot be undone. Make sure you really want to
                burn this NFT.
              </p>
            </div>

            {burnError && <p className="text-red-400 text-sm p-2 bg-red-900/30 rounded-md">{burnError}</p>}

            {burnTxHash && (
              <p className="text-green-400 text-sm p-2 bg-green-900/30 rounded-md">
                NFT burned successfully! Transaction: {truncateAddress(burnTxHash)}
              </p>
            )}

            <div className="flex space-x-2">
              <Button
                onClick={() => setIsBurnNftModalOpen(false)}
                variant="secondary"
                className="flex-1"
                disabled={isBurningNft}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmBurnNft}
                isLoading={isBurningNft}
                disabled={isBurningNft}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {isBurningNft ? "Burning..." : "Confirm Burn"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
