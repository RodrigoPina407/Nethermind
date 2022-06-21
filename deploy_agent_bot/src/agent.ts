import {
  BlockEvent,
  Finding,
  HandleBlock,
  HandleTransaction,
  TransactionEvent,
  FindingSeverity,
  FindingType,
  getJsonRpcUrl,
} from "forta-agent";

export const CREATE_FUNCTION_SIG =
  "function createAgent(uint256 agentId, address owner, string metadata, uint256[] chainIds)";
export const AGENT_DEPLOYER_ADDRESS = "0x61447385b019187daa48e91c55c02af1f1f3f863";
let findingsCount = 0;

const handleTransaction: HandleTransaction = async (
  txEvent: TransactionEvent
) => {
  const findings: Finding[] = [];

  // limiting this agent to emit only 5 findings so that the alert feed is not spammed
  if (findingsCount >= 5) return findings;

  // filter the transaction logs for createagent function calls
  const createAgentEvents = txEvent.filterFunction(
    CREATE_FUNCTION_SIG,
    AGENT_DEPLOYER_ADDRESS
  );

  createAgentEvents.forEach((createAgentEvent) => {
    // extract create agent arguments
    const {agentId, metadata } = createAgentEvent.args;
  
      findings.push(
        Finding.fromObject({
          name: "Forta Agent Deployment",
          description: `Forta Agent deployed on: ${createAgentEvent.address}`,
          alertId: "FORTA-1",
          severity: FindingSeverity.Low,
          type: FindingType.Info,
          metadata: {
            metadata,
            agentId: agentId.toString()
          },
        })
      );
      findingsCount++;
    
  });

  return findings;
};


export default {
  handleTransaction,
  // handleBlock
};
