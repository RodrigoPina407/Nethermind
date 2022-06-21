import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  createTransactionEvent,
  ethers,
} from "forta-agent";
import agent, {
  CREATE_FUNCTION_SIG,
  AGENT_DEPLOYER_ADDRESS,

} from "./agent";

describe("forta agent deployed  agent", () => {
  let handleTransaction: HandleTransaction;
  const mockTxEvent = createTransactionEvent({} as any);

  beforeAll(() => {
    handleTransaction = agent.handleTransaction;
  });

  describe("handleTransaction", () => {
    it("returns empty findings if no agents are created", async () => {
      mockTxEvent.filterFunction = jest.fn().mockReturnValue([]);

      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
      expect(mockTxEvent.filterFunction).toHaveBeenCalledTimes(1);
      expect(mockTxEvent.filterFunction).toHaveBeenCalledWith(
        CREATE_FUNCTION_SIG,
        AGENT_DEPLOYER_ADDRESS
      );
    });

    it("returns a finding if an agent is created", async () => {
      const mockCreateAgentEvent = {
        args: {
          from: "0xabc",
          to: "0xdef",
          metadata: "QmVAtFtURYag7pZS7oLT5G7SfXeKpgVP8ZGNHVu7VtZLPr",
          agentId: "85833389299281977326169868148634497765380089334344114319688312380853379831214"

        },
        address: AGENT_DEPLOYER_ADDRESS
      };
      mockTxEvent.filterFunction = jest
        .fn()
        .mockReturnValue([mockCreateAgentEvent]);

      const findings = await handleTransaction(mockTxEvent);
     
      const {metadata, agentId} = mockCreateAgentEvent.args;
      
      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Forta Agent Deployment",
          description: `Forta Agent deployed on: ${mockCreateAgentEvent.address}`,
          alertId: "FORTA-1",
          severity: FindingSeverity.Low,
          type: FindingType.Info,
          metadata: {
            metadata,
            agentId: agentId.toString()
          },
        }),
      ]);
      expect(mockTxEvent.filterFunction).toHaveBeenCalledTimes(1);
      expect(mockTxEvent.filterFunction).toHaveBeenCalledWith(
        CREATE_FUNCTION_SIG,
        AGENT_DEPLOYER_ADDRESS
      );
    });
  });
});
