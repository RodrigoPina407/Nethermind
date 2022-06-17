import {
  BlockEvent,
  Finding,
  HandleBlock,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  ethers,
  getEthersProvider,
  getJsonRpcUrl
} from "forta-agent";

import {
  FACTORY_ADDRESS,
  SWAP_EVENT,
  ABI
} from "./agent.config"

let findingsCount = 0;

const initialize = async () => {

  let provider = getEthersProvider();



}

const isFromUniswap = async (address: string) => {

  let isUniswap = false;

  try{

    const provider = new ethers.providers.JsonRpcProvider(getJsonRpcUrl());

    const contractIface = new ethers.Contract(address, ABI, provider);

    let factory = await contractIface.factory();

    if(factory === FACTORY_ADDRESS)
      isUniswap = true;

  } catch(e){
    isUniswap = false;
    console.log(e);
  }

  return isUniswap;

}

const handleTransaction: HandleTransaction = async (
  txEvent: TransactionEvent
) => {
  const findings: Finding[] = [];

  // filter the transaction logs for Tether transfer events
  const swapEvents = txEvent.filterLog(
    SWAP_EVENT
  );

  swapEvents.forEach(async (swapEvent) => {
    // extract transfer event arguments
    const { sender, recipient, amount0, amount1 } = swapEvent.args;

    let valid = await isFromUniswap(swapEvent.address);
    
    if(valid){
      findings.push(
        Finding.fromObject({
          name: "Swap event",
          description: `Swap event from Uniswap on pool: ${swapEvent.address}`,
          alertId: "FORTA-1",
          severity: FindingSeverity.Low,
          type: FindingType.Info,
          metadata: {
            sender,
            recipient,
            amount0,
            amount1
          },
        })
      );
      console.log(findings);
      findingsCount++;
    }
      
  });

  return findings;
};

// const handleBlock: HandleBlock = async (blockEvent: BlockEvent) => {
//   const findings: Finding[] = [];
//   // detect some block condition
//   return findings;
// }

export default {
  handleTransaction,
  // handleBlock
};
