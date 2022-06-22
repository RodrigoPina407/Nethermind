import {
  Finding,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  ethers,
  getJsonRpcUrl
} from "forta-agent";

import {
  FACTORY_ADDRESS,
  SWAP_EVENT,
  ABI,
  FACTORY_ABI,
  TOKEN_ABI
} from "./agent.config"

let findingsCount = 0;
let provider:ethers.providers.JsonRpcProvider;

let token0_name: string;
let token1_name: string;

const initialize = async () => {

  provider = new ethers.providers.JsonRpcProvider(getJsonRpcUrl());

}

const isFromUniswap = async (address: string) => {

  let isUniswap = false;
 
  try{

    const contractIface = new ethers.Contract(address, ABI, provider);
    const factoryIface = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);

    const token0 = await contractIface.token0();
    const token1 = await contractIface.token1();
    const fee = await contractIface.fee();

    const token0Iface = new ethers.Contract(token0, TOKEN_ABI, provider);
    const token1Iface = new ethers.Contract(token1, TOKEN_ABI, provider);

    token0_name = await token0Iface.name();
    token1_name = await token1Iface.name();

    let poolAddress = await factoryIface.getPool(token0, token1, fee);

    //check if the pool address exists in the factory contract getPool mapping
    if(address.toLowerCase() === poolAddress.toLowerCase())
      isUniswap = true;

  } catch(e){
    isUniswap = false;
    console.error(e);
  }

  return isUniswap;

}

const handleTransaction: HandleTransaction = async (
  txEvent: TransactionEvent
) => {
  const findings: Finding[] = [];

  // filter the transaction logs for Tether transfer events
  const swapEvents = txEvent.filterLog(SWAP_EVENT);
  

  for(const swapEvent of swapEvents ){
    
    // extract swap event arguments
    const {sender, recipient, amount0, amount1} = swapEvent.args;

    if(findingsCount >= 5) return findings;
    
    if(await isFromUniswap(swapEvent.address)){

      findings.push
      (
        Finding.fromObject({
          name: "Swap event",
          description: `Swap event from Uniswap on pool: ${swapEvent.address}`,
          alertId: "FORTA-1",
          severity: FindingSeverity.Low,
          type: FindingType.Info,
          protocol: "UniswapV3",
          metadata: {
            sender,
            recipient,
            token0: token0_name,
            amount0: amount0.toString(),
            token1: token1_name,
            amount1: amount1.toString()
          },
        })
      );

      findingsCount++;
    }
      
  }

  return findings;
};

export default {
  handleTransaction,
  initialize
};
