# UniSwapV3 Swap detection agent

## Description

This agent detects transactions with swaps from UniswapV3

## Supported Chains

- Ethereum

## Alerts

Describe each of the type of alerts fired by this agent

- FORTA-1
  - Fired when a transaction contains a swap from UniswapV3
  - Severity is always set to "low" (mention any conditions where it could be something else)
  - Type is always set to "info" (mention any conditions where it could be something else)
  - Mention any other type of metadata fields included with this alert

## Test Data

The agent behaviour can be verified with the following transactions:

- 0x720e07622746f0c75faf130cae05621f384694b45c1d4c2927f31b4c89bbf8d6 (XY Oracle, Wrapped Ether)
