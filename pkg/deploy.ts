import fs = require("fs-extra-promise")
import path = require("path")
const Web3 = require("web3")
export const getAbiBin = async (contractName: string) => {
  const distDir = path.join(__dirname, "..", "dist")
  const abi = await fs.readJsonAsync(path.join(distDir, `${contractName}.abi`))
  const bytecode = (await fs.readFileAsync(
    path.join(distDir, `${contractName}.bin`),
  )).toString()
  return { abi, bytecode }
}

export const buildContract = async (
  destDir: string,
  contractName: string,
) => {
  const { abi, bytecode } = await getAbiBin(contractName)
  const addressPath = path.join(destDir, `${contractName}.json`)
  await fs.mkdirpAsync(path.dirname(addressPath))
  await fs.writeFileAsync(addressPath, JSON.stringify({ abi, bytecode }))
  return { abi, bytecode }
}
export const deployContract = async (
  web3: any,
  destDir: string,
  contractName: string,
  account: string,
  args: any[] = [],
) => {
  const { abi, bytecode } = await getAbiBin(contractName)
  const contract = new web3.eth.Contract(abi)
  const result = await contract
    .deploy({ data: `0x${bytecode}`, arguments: args })
    .send({ from: account, gas: "3000000" })
  const addressPath = path.join(destDir, `${contractName}.json`)
  await fs.mkdirpAsync(path.dirname(addressPath))
  await fs.writeFileAsync(
    addressPath,
    JSON.stringify({ ...result, abi, bytecode }),
  )
  const address = result.options.address
  console.log(`Contract address for ${contractName} is ${address}`)

  return address
}
