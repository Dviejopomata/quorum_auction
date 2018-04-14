import config = require("config");
import test = require("tape");

const blockchainConfig = config.get<{ account: string; url: string }>(
  "blockchain",
)

const account = blockchainConfig.account
const httpUrl = blockchainConfig.url
const Web3 = require("web3")
const web3 = new Web3(new Web3.providers.HttpProvider(httpUrl))
const { abi, options: { address } } = require("../build/address/FactoryAuction")
const contract = new web3.eth.Contract(abi, address)
const { abi: simpleAuctionAbi } = require("../build/address/SimpleAuction")

test(async t => {
  const args = ["auction1", Date.now()]
  const c = await contract.methods.createAuction(...args).send({
    from: account,
    gas: "30000000",
  })
  console.log(c)
  const receipt = await web3.eth.getTransactionReceipt(c.transactionHash)
  console.log(JSON.stringify(receipt))
  const [addr] = await contract.methods.getAuctionAddress(account).call()

  if (addr !== "0x0000000000000000000000000000000000000000") {
    const blindAuctionContract = new web3.eth.Contract(simpleAuctionAbi, addr)
    const balance = await web3.eth.getBalance(account)
    console.log(balance)
    const bidValue = web3.utils.toWei("0.0001", "ether")
    const tx = await blindAuctionContract.methods.bid().send({
      from: account,
      gas: "3000000",
      gasPrice: 0,
      value: bidValue,
    })
    console.log(JSON.stringify(tx))
    const name = await blindAuctionContract.methods.name().call()
    console.log(name)
    const bidLength = await blindAuctionContract.methods.getBids().call()
    console.log(bidLength)
    const bid = await blindAuctionContract.methods.getBid(bidLength - 1).call()
    console.log(bid)
    t.equal(bid.deposit, bidValue, "Wrong bid")
  } else {
    t.fail("Contract not deployed")
  }

  t.end()
})
