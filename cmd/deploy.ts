import { web3 } from "common/web3"
import path = require("path")
import { buildContract, deployContract } from "pkg/deploy"

const destDir = path.join(__dirname, "..", "build", "address")

async function main() {
  const account = "0xed9d02e382b34818e88B88a309c7fe71E65f419d"
  await deployContract(web3, destDir, "FactoryAuction", account, [
    Date.now(),
    Date.now() + 1000 * 60 * 60 * 10, // 10 horas
    account,
  ])
  await buildContract(destDir, "SimpleAuction")
}

main()
