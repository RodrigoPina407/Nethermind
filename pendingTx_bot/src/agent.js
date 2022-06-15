const { Finding, FindingSeverity, FindingType, getJsonRpcUrl, ethers} = require("forta-agent");
const config = require("./agent.config.json");

let findingsCount = 0;
let teste;

const pendingTx = [];

function getSelector(sig)
{
    let selector = ethers.utils.id(sig);

    return ethers.utils.hexDataSlice(selector, 0, 4);
}

function filter(_tx)
{
  let isValidTx;

  config.filters.forEach((filter) => {
    isValidTx = true;

    Object.keys(filter).forEach((key) => {

        if(filter[key] != null ){

            switch(key){
                
                case "to":
                    if(filter[key] !== null && filter[key] !== _tx.to )
                        isValidTx = false;
                    break;
                case "from":
                    if(filter[key] !== null && filter[key] !== _tx.from )
                        isValidTx = false;
                    break;
                case "value":
                    if(filter[key] !== null && filter[key] > _tx.value )
                        isValidTx = false;
                    break;
                case "signature":
                    if(filter[key] !== null && getSelector(filter[key]) !== ethers.utils.hexDataSlice(_tx.data,0,4))
                        isValidTx = false;
                    break;

            }

        }

    });  

  });

  return isValidTx;

}

const initialize = async function (){

  if(!config.provider)
  {
    config.provider = new ethers.providers.WebSocketProvider(config.providerUrl);
  }

  config.provider.on("pending", async (txHash) => {

      let tx = await config.provider.getTransaction(txHash);
      

      if(tx !== null)
        if(filter(tx))
        {
          let [address, value] = ethers.utils.defaultAbiCoder.decode(config.abi, ethers.utils.hexDataSlice(tx.data,4));

          let normalizedValue = value.div(ethers.BigNumber.from((10 ** config.decimals)));
          teste = normalizedValue;
          pendingTx.push(
            {
              from: tx.from,
              to: address,
              amount: normalizedValue.toNumber(),
              hash: tx.hash      
            }
          );
          findingsCount ++;
        }

  });
}


function createAlert(_tx){

  return Finding.fromObject
        ({
          name: "High Tether Transfer",
          description: `High amount of USDT transferred: ${_tx.amount}`,
          alertId: "FORTA-1",
          severity: FindingSeverity.Low,
          type: FindingType.Info,
          metadata: {
            to: _tx.to,
            from: _tx.from,
            amount: _tx.amount,
            hash: _tx.hash
          }
        });

}

const handleBlock = async (blockEvent) => {
  const findings = [];

  while(pendingTx.length)
  {
    let tx = pendingTx[pendingTx.length -1];    
    
    //push pending transactions where the amount transfer exceeds the threshold
    if(tx.amount >= config.threshold)  
      findings.push(createAlert(tx));
    
    //remove transactions that are no longer pending
    if(blockEvent.block.transactions.includes(tx.hash))
      findings.pop();

    pendingTx.pop();
  }

  return findings;
};

module.exports = {
  initialize,
  handleBlock,
};
