import bodyParser = require("body-parser")
import { web3, web3WS } from "common/web3"
import config = require("config")
import express = require("express")

const blockchainConfig = config.get<{
  account: string
  http: string
  ws: string
}>("blockchain")
const { account } = blockchainConfig
console.log(`Blockchainconfig`, blockchainConfig);

const { abi, options: { address } } = require("../build/address/FactoryAuction")
const contract = new web3.eth.Contract(abi, address)
const wsContract = new web3WS.eth.Contract(abi, address)
const app = express()
const { abi: simpleAuctionAbi } = require("../build/address/SimpleAuction")

app.use(bodyParser.json())

const getAuctionContract = auctionAddress => {
  return new web3.eth.Contract(simpleAuctionAbi, auctionAddress)
}

const getAuctions = async () => {
  const auctionsDeployed: string[] = await contract.methods
    .getAuctionAddress(account)
    .call()
  const auctions = await Promise.all(
    auctionsDeployed.map(async addr => {
      const _auctionContract = getAuctionContract(addr)
      const name = await _auctionContract.methods.name().call()

      return {
        addr,
        name,
      }
    }),
  )
  return auctions
}
const wait = (ms = 500) => new Promise(r => setTimeout(r, ms))
wsContract.events.NewAuction({}, async (err, data) => {
  if (err) {
    return console.error(`Error while listening ot newAuction : ${err.message}`)
  }
  const { returnValues } = data
  if (returnValues) {
    console.log(`Got new auction`, data)
    await wait(4000)
    const { name, newAuction, biddingTime } = returnValues
    watchAuction({ name, addr: newAuction })
  } else {
    console.error(`Data doesn't contain new return vaues `, data)
  }
})
const watchAuction = ({ addr, name }) => {
  console.log(`Watching for auction ${addr} with name ${name}`)
  const auctionContract = new web3WS.eth.Contract(simpleAuctionAbi, addr)
  auctionContract.events.HighestBidIncreased({}, (err, data) => {
    if (err) {
      return console.error(
        `Error while listening to event HighestBidIncreased in auction  with address ${addr} named ${name}: ${
          err.message
        }`,
      )
    }
    console.log(`Got new highest bid`, data)
  })
}
getAuctions()
  .then(auctions => {
    for (const { addr, name } of auctions) {
      watchAuction({ addr, name })
    }
  })
  .catch(err => {
    console.error(`Error while getting the auction contracts `, err)
  })

app.get("/auction", async (_req, res) => {
  try {
    const auctions = await getAuctions()
    res.json(auctions)
  } catch (error) {
    res.status(500)
    res.json({ message: error.message })
  }
})
app.post("/auction", async (req, res) => {
  try {
    const { name = "new Auction", biddingTime = Date.now() } = req.body
    const receipt = await createAuction({ name, biddingTime })
    res.json(receipt)
  } catch (error) {
    res.status(500)
    res.json({ message: error.message })
  }
})

const createAuction = async ({ name, biddingTime }) => {
  const c = await contract.methods.createAuction(...[name, biddingTime]).send({
    from: account,
    gas: "30000000",
  })
  const receipt = await web3.eth.getTransactionReceipt(c.transactionHash)
  return receipt
}
app.get("/auction/:auctionAddress/bid/new", async (req, res) => {
  try {
    const { auctionAddress } = req.params
    const { value = 10 } = req.query
    const _auctionContract = getAuctionContract(auctionAddress)
    const c = await _auctionContract.methods.bid().send({
      from: account,
      gas: "300000000",
      value,
    })
    const receipt = await web3.eth.getTransactionReceipt(c.transactionHash)
    res.json(receipt)
  } catch (error) {
    res.status(500)
    res.json({ message: error.message })
  }
})
app.get("/auction/:auctionAddress/bid", async (req, res) => {
  try {
    const { auctionAddress } = req.params
    const _auctionContract = getAuctionContract(auctionAddress)
    const totalBids = await _auctionContract.methods.getBids().call()
    const bids: any[] = []
    for (let index = 0; index < totalBids; index++) {
      bids.push(await _auctionContract.methods.getBid(index).call())
    }
    res.json(bids)
  } catch (error) {
    res.status(500)
    res.json({ message: error.message })
  }
})

app.get("/ping", async (req, res) => {
  res.send({ msg: "OK", date: new Date() })
})

export = app
