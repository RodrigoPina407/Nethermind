
export const FACTORY_ADDRESS = "0x1F98431c8aD98523631AE4a59f267346ea31F984";

export const SWAP_EVENT = "event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)";

export const ABI =
[
    "function swap(address recipient,bool zeroForOne,int256 amountSpecified,uint160 sqrtPriceLimitX96,bytes calldata data)",
    "function token0() external view returns (address)",
    "function token1() external view returns (address)",
    "function factory() external view returns (address)"
]

