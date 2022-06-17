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
  ABI
} from "./agent.config"

let findingsCount = 0;
let provider:ethers.providers.JsonRpcProvider;

const initialize = async () => {

  provider = new ethers.providers.JsonRpcProvider(getJsonRpcUrl());

}

const isFromUniswap = async (address: string) => {

  let isUniswap = false;
 
  try{

    const contractIface = new ethers.Contract(address, ABI, provider);

    let factory = await contractIface.factory();

    //check if the result form factory() is equal to the address of UniswapV3Factory contract
    if(factory === FACTORY_ADDRESS)
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
            amount0: amount0.toString(),
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
