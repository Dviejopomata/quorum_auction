import fs = require("fs-extra-promise");
import path = require("path");
const Web3 = require("web3");
const httpUrl = "https://blockchain.nextagilesoft.com/";
const web3 = new Web3(new Web3.providers.HttpProvider(httpUrl));
const { abi, bytecode } = require("../build/contracts/HelloWorld");

const contract = new web3.eth.Contract(abi);

async function main() {
  const account = "0xed9d02e382b34818e88B88a309c7fe71E65f419d";
  const result = await contract
    .deploy({ data: bytecode })
    .send({ from: account, gas: "3000000" });
  console.log(`Address is ${result.options.address}`);
  const addressPath = path.resolve(__dirname, "..", "build", "address.json");
  await fs.mkdirpAsync(path.dirname(addressPath));
  await fs.writeJSONAsync(addressPath, result);
}

main();
