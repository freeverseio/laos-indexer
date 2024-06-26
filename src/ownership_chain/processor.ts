import { 
    BlockHeader, 
    DataHandlerContext, 
    EvmBatchProcessor, 
    EvmBatchProcessorFields, 
    Log as _Log, 
    Transaction as _Transaction 
} from '@subsquid/evm-processor';
import { Store } from '@subsquid/typeorm-store';
import * as ERC721UniversalContract from '../abi/UniversalContract'

export const CONTRACT_ADDRESS = '0xd4cf03ecf779e71cf30a4d3b1f85a03550de52e9' // Open collection Ownership chain '0x167ef072f21d5ec07139810b32970921d15a3de5'; - private collection ownership chain 0xd4cf03ecf779e71cf30a4d3b1f85a03550de52e9 (57829530)

export const processor = new EvmBatchProcessor()
    .setGateway('https://v2.archive.subsquid.io/network/polygon-mainnet')
    .setDataSource({
        chain: process.env.RPC_ENDPOINT!,
    })
    .setFinalityConfirmation(75)
    .setBlockRange({
        from: 58673132
    })
    .addLog({
       topic0: [ ERC721UniversalContract.events.NewERC721Universal.topic, ERC721UniversalContract.events.Transfer.topic]
    })
    .setFields({
        log: {
            transactionHash: true
        }
    });

export type Fields = EvmBatchProcessorFields<typeof processor>;
export type Context = DataHandlerContext<Store, Fields>;
export type Block = BlockHeader<Fields>;
export type Log = _Log<Fields>;
export type Transaction = _Transaction<Fields>;
