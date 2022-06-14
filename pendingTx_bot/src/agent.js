const { Finding, FindingSeverity, FindingType, getJsonRpcUrl, ethers } = require("forta-agent");
const config = require("./agent.config.json");


const TETHER_DECIMALS = 6;
let findingsCount = 0;
let teste;

const pendingTx = [];

function getSelector(sig)
{
    let selector = ethers.utils.id(sig);

    return selector.slice(0, 5*2);
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
                    if(filter[key] !== null && getSelector(filter[key]) !== _tx.data.slice(0, 10))
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
          let normalizedValue = parseInt(tx.data.slice(37*2), 16)/(10 ** config.decimals);
          pendingTx.push(
            {
              from: tx.from,
              to: tx.to,
              value: tx.value,
              amount: normalizedValue,
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
