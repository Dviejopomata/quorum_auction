import bodyParser = require("body-parser")
import express = require("express")

const account = "0xed9d02e382b34818e88B88a309c7fe71E65f419d"
const httpUrl = "https://blockchain.nextagilesoft.com/"
const Web3 = require("web3")
const web3 = new Web3(new Web3.providers.HttpProvider(httpUrl))
const { abi } = require("../build/contracts/HelloWorld")
const { options: { address } } = require("../build/address")
const contract = new web3.eth.Contract(abi, address)

const app = express()

app.use(bodyParser.json())
app.get("/message", async (_req, res) => {
  const msg = await contract.methods.getMessage().call()
  res.send({ msg })
})

app.post("/message", async (req, res) => {
  const { msg } = req.body
  if (!!msg) {
    await contract.methods.setMessage(msg).send({ from: account })
    res.sendStatus(204)
  } else {
    res.sendStatus(400)
  }
})

app.get("/ping", async (req, res) => {
  res.send({ msg: "OK", date: new Date() })
})

export = app
