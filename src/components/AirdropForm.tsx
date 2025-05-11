"use client";

import InputField from "@/components/ui/InputField";
import { useState, useMemo, useEffect } from "react";
import { chainsToTSender, tsenderAbi, erc20Abi } from "@/constants";
import { useChainId, useConfig, useAccount, useWriteContract } from "wagmi";
import { readContract, waitForTransactionReceipt } from "@wagmi/core";
import { calculateTotal } from "@/utils/calculateTotal/calculateTotal";

export default function AirdropForm() {
  const [tokenAddress, setTokenAddress] = useState("");
  const [recipients, setRecipients] = useState("");
  const [amounts, setAmounts] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const chainId = useChainId();
  const config = useConfig();
  const account = useAccount();
  const total: number = useMemo(() => calculateTotal(amounts), [amounts]);
  const { writeContractAsync } = useWriteContract();
  const [tokenInfo, setTokenInfo] = useState<{
    name?: string;
    symbol?: string;
    decimals?: number;
  } | null>(null)

  const isValidAddress = (address: string) =>
    address.startsWith("0x") && address.length === 42;

  async function getApprovedAmount(tSenderAddress: string): Promise<bigint> {
    if (!isValidAddress(tokenAddress)) {
      alert("Invalid token address.");
      return BigInt(0);
    }

    return (await readContract(config, {
      abi: erc20Abi,
      address: tokenAddress as `0x${string}`,
      functionName: "allowance",
      args: [account.address as `0x${string}`, tSenderAddress as `0x${string}`],
    })) as bigint;
  }

  async function handleSubmit() {
    const tSenderAddress = chainsToTSender[chainId]?.tsender;
    if (!tSenderAddress) {
      alert("TSender address is not available.");
      return;
    }

    setIsLoading(true);

    try {
      const approvedAmount = await getApprovedAmount(tSenderAddress);

      if (approvedAmount < BigInt(total)) {
        const approvalHash = await writeContractAsync({
          abi: erc20Abi,
          address: tokenAddress as `0x${string}`,
          functionName: "approve",
          args: [tSenderAddress as `0x${string}`, BigInt(total)],
        });

        const approvalReceipt = await waitForTransactionReceipt(config, {
          hash: approvalHash,
        });

        console.log("Approval confirmed:", approvalReceipt);
      }

      // Выполняем airdrop после approve
      const recipientsArray = recipients
        .split(/[,\n]+/)
        .map((addr) => addr.trim())
        .filter((addr) => addr);

      const amountsArray = amounts
        .split(/[,\n]+/)
        .map((amt) => amt.trim())
        .filter((amt) => amt);

      const airdropHash = await writeContractAsync({
        abi: tsenderAbi,
        address: tSenderAddress as `0x${string}`,
        functionName: "airdropERC20",
        args: [tokenAddress, recipientsArray, amountsArray, BigInt(total)],
      });

      const airdropReceipt = await waitForTransactionReceipt(config, {
        hash: airdropHash,
      });

      console.log("Airdrop completed:", airdropReceipt);
    } catch (e) {
      console.error("Error during transaction:", e);
      alert("Ошибка при отправке транзакции. Проверь консоль.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const savedToken = localStorage.getItem("tokenAddress")
    const savedRecipients = localStorage.getItem("recipients")
    const savedAmounts = localStorage.getItem("amounts")

    if (savedToken) setTokenAddress(savedToken)
    if (savedRecipients) setRecipients(savedRecipients)
    if (savedAmounts) setAmounts(savedAmounts)
  }, [])

  useEffect(() => {
    localStorage.setItem("tokenAddress", tokenAddress)
  }, [tokenAddress])

  useEffect(() => {
    localStorage.setItem("recipients", recipients)
  }, [recipients])

    useEffect(() => {
        localStorage.setItem("amounts", amounts)
    }, [amounts])

    useEffect(() => {
        async function fetchTokenInfo() {
            if (!tokenAddress || tokenAddress.length !== 42) return

            try {
                const name = await readContract(config, {
                    abi: erc20Abi,
                    address: tokenAddress as `0x${string}`,
                    functionName: "name",
                }) as string;

                const symbol = await readContract(config, {
                    abi: erc20Abi,
                    address: tokenAddress as `0x${string}`,
                    functionName: "symbol"
                }) as string;

                const decimals = await readContract(config, {
                    abi: erc20Abi,
                    address: tokenAddress as `0x${string}`,
                    functionName: "decimals"
                }) as number;

                setTokenInfo({ name, symbol, decimals })
            } catch (err) {
                setTokenInfo(null)
                console.error("Error fetching token info:", err)
            }
        }
        fetchTokenInfo()
    }, [tokenAddress])

  return (
    <div>
      <InputField
        label="Token Address"
        placeholder="0x..."
        value={tokenAddress}
        onChange={(e) => setTokenAddress(e.target.value)}
      />
      <InputField
        label="Recipients"
        placeholder="0x123...,0x456..."
        value={recipients}
        onChange={(e) => setRecipients(e.target.value)}
        large
      />
      <InputField
        label="Amounts"
        placeholder="100,200,300..."
        value={amounts}
        onChange={(e) => setAmounts(e.target.value)}
        large
      />
         {tokenInfo && (
      <div className="mt-4 p-2 border rounded bg-gray-50 text-sm">
        <p><strong>Название:</strong> {tokenInfo.name}</p>
        <p><strong>Символ:</strong> {tokenInfo.symbol}</p>
        <p><strong>Знаков после запятой:</strong> {tokenInfo.decimals}</p>
      </div>
    )}
      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Sending..." : "Send tokens"}
      </button>
    </div>
  );
}
