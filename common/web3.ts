import config = require("config")

const blockchainConfig = config.get<{
  account: string
  http: string
  ws: string
}>("blockchain")
const { http: httpUrl, ws: wsUrl } = blockchainConfig

const Web3 = require("web3")

export const web3 = new Web3(new Web3.providers.HttpProvider(httpUrl))
export const web3WS = new Web3(new Web3.providers.WebsocketProvider(wsUrl))
