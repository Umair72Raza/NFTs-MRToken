import { marketplaceAbi } from "./marketPlaceABI.js";
import { mrTokenABI } from "./mrTokenABI.js";
import { toast } from "https://cdn.jsdelivr.net/npm/react-toastify@latest/dist/react-toastify.esm.js";

// Constants
const mrTokenAddress = "0xdaBD71a708a26Eb7a50f27765d6d30A4038c5EA8";
const buyNFTAddress = "0x694cEDFFaf41E8a6e3590e6C1c2D47e762f97ab3";

let web3, mrTokenContract, buyNFTContract, account, balance, allowance;

// Initialize Web3 and Contracts
async function loadWeb3AndContracts() {
  try {
    if (window.ethereum) {
      web3 = new Web3(window.ethereum);

      mrTokenContract = new web3.eth.Contract(mrTokenABI, mrTokenAddress);
      buyNFTContract = new web3.eth.Contract(marketplaceAbi, buyNFTAddress);

      const accounts = await web3.eth.requestAccounts();
      account = accounts[0];

      const tokenBalance = await mrTokenContract.methods
        .balanceOf(account)
        .call();
      const tokenAllowance = await mrTokenContract.methods
        .allowance(account, buyNFTAddress)
        .call();

      balance = web3.utils.fromWei(tokenBalance, "ether");
      allowance = web3.utils.fromWei(tokenAllowance, "ether");

      document.getElementById("account").textContent = account;
      document.getElementById("balance").textContent = balance;
      document.getElementById("allowance").textContent = allowance;
    } else {
      throw new Error(
        "No Ethereum-compatible browser wallet detected. Please install MetaMask."
      );
    }
  } catch (error) {
    toast.error(error.message);
  }
}

// Approve Tokens Function
async function approveTokens(amountToApproveInWei) {
  try {
    const gasPrice = await web3.eth.getGasPrice();
    const adjustedGasPrice = (parseFloat(gasPrice) * 1.2).toFixed(0);

    await mrTokenContract.methods
      .approve(buyNFTAddress, amountToApproveInWei)
      .send({
        from: account,
        gasLimit: web3.utils.toHex(1500000),
        gasPrice: adjustedGasPrice.toString(),
      });

    toast.success("Approval successful!");
  } catch (error) {
    toast.error(`Approval failed: ${error.message}`);
  }
}

// Buy NFT Function
async function buyNFT() {
  const nftId = document.getElementById("nftId").value;
  const amount = document.getElementById("amount").value;
  const costInMR = document.getElementById("costInMR").value;

  if (!account || !nftId || !amount || !costInMR) {
    toast.error("Please fill all fields and connect your wallet.");
    return;
  }

  try {
    const totalCostInMRWei = web3.utils.toWei(
      (Number(amount) * Number(costInMR)).toString(),
      "ether"
    );

    if (
      Number(balance) < Number(web3.utils.fromWei(totalCostInMRWei, "ether"))
    ) {
      toast.error(
        "You do not have enough MR Tokens to complete this purchase."
      );
      return;
    }

    if (
      Number(allowance) < Number(web3.utils.fromWei(totalCostInMRWei, "ether"))
    ) {
      await approveTokens(totalCostInMRWei);
    }

    const estimatedGas = await buyNFTContract.methods
      .BuyNFTs(account, nftId, amount, totalCostInMRWei)
      .estimateGas({
        from: account,
      });

    const gasPrice = await web3.eth.getGasPrice();
    const adjustedGasPrice = Math.floor(parseFloat(gasPrice) * 1.2);

    await buyNFTContract.methods
      .BuyNFTs(account, nftId, amount, totalCostInMRWei)
      .send({
        from: account,
        gas: estimatedGas,
        gasPrice: adjustedGasPrice.toString(),
      });

    toast.success("NFT purchased successfully!");
  } catch (error) {
    toast.error(`Purchase failed: ${error.message}`);
  }
}

// Add Event Listeners
document.getElementById("buyButton").addEventListener("click", buyNFT);

// Load Web3 and Contracts on page load
window.onload = loadWeb3AndContracts;
