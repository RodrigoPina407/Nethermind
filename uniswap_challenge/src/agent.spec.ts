import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleTransaction,
  Initialize,
  createTransactionEvent,
  ethers,
} from "forta-agent";

import agent from "./agent";

import{
  SWAP_EVENT,
  ABI
} from "./agent.config"

describe("Uniswap swap event", () => {
  let handleTransaction: HandleTransaction;
  let initialize: Initialize;
  const mockTxEvent = createTransactionEvent({} as any);

  beforeAll(() => {
    initialize = agent.initialize;
    handleTransaction = agent.handleTransaction;
    initialize();
  });

  describe("handleTransaction", () => {
    it("returns empty findings if there are no Swap events", async () => {
      mockTxEvent.filterLog = jest.fn().mockReturnValue([]);

      const findings = await handleTransaction(mockTxEvent);

      expect(findings).toStrictEqual([]);
      expect(mockTxEvent.filterLog).toHaveBeenCalledTimes(1);
      expect(mockTxEvent.filterLog).toHaveBeenCalledWith(
        SWAP_EVENT
      );
    });

    it("returns a finding if there is a Swap event from UniswapV3", async () => {
      
      const mockSwapEvent = {
        args: {
          sender: "0xabc",
          recipient: "0xdef",
          token0: "USD Coin",
          amount0: ethers.BigNumber.from("200000000"),
          token1: "Wrapped Ether",
          amount1: ethers.BigNumber.from("123400000")
        },
        address: "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640"
      };
      mockTxEvent.filterLog = jest
        .fn()
        .mockReturnValue([mockSwapEvent]);

      const findings = await handleTransaction(mockTxEvent);

      const {sender, recipient, amount0, amount1, token0, token1} = mockSwapEvent.args;

      expect(findings).toStrictEqual([
        Finding.fromObject({
          name: "Swap event",
          description: `Swap event from Uniswap on pool: ${mockSwapEvent.address}`,
          alertId: "FORTA-1",
          severity: FindingSeverity.Low,
          type: FindingType.Info,
          protocol: "UniswapV3",
          metadata: {
            sender,
            recipient,
            token0,
            amount0: amount0.toString(),
            token1,
            amount1: amount1.toString()
          }
        }),
      ]);
      expect(mockTxEvent.filterLog).toHaveBeenCalledTimes(1);
      expect(mockTxEvent.filterLog).toHaveBeenCalledWith(SWAP_EVENT);

    });
  });
});
