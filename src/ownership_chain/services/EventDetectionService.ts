import { Context } from '../processor';
import * as ERC721UniversalContract from '../../abi/UniversalContract';
import { getAccountKey20FromBaseUri } from '../util';
import { v4 as uuidv4 } from 'uuid';
import { RawTransfer, DetectedEvents, RawOwnershipContract } from '../../model';

export class EventDetectionService {
  private ctx: Context;
  private ownershipContractsToCheck: Set<string>;

  constructor(ctx: Context, ownershipContractsToCheck: Set<string>) {
    this.ctx = ctx;
    this.ownershipContractsToCheck = ownershipContractsToCheck;
  }

  public detectEvents(): DetectedEvents {
    const transfers: RawTransfer[] = [];
    const ownershipContractsToInsertInDb: RawOwnershipContract[] = [];
    for (const block of this.ctx.blocks) {
      for (const log of block.logs) {
        this.detectNewERC721Universal(log, ownershipContractsToInsertInDb);
        this.detectTransfer(log, transfers, block.header.timestamp, block.header.height);
      }
    }

    return { transfers, ownershipContracts: ownershipContractsToInsertInDb };
  }

  private detectNewERC721Universal(log: any, ownershipContractsToInsertInDb: RawOwnershipContract[]): void {
    if (log.topics[0] === ERC721UniversalContract.events.NewERC721Universal.topic) {
      const logDecoded = ERC721UniversalContract.events.NewERC721Universal.decode(log);
      this.ownershipContractsToCheck.add(logDecoded.newContractAddress.toLowerCase());
      const laosContractAddress = getAccountKey20FromBaseUri(logDecoded.baseURI);
      ownershipContractsToInsertInDb.push({
        id: logDecoded.newContractAddress,
        laosContract: laosContractAddress,
      });
    }
  }

  private detectTransfer(log: any, transfers: RawTransfer[], timestamp: number, blockNumber: number): void {
    if (this.ownershipContractsToCheck.has(log.address.toLowerCase()) && log.topics[0] === ERC721UniversalContract.events.Transfer.topic) {
      const logDecoded = ERC721UniversalContract.events.Transfer.decode(log);
      console.log('Transfer detected:', logDecoded);
      const { from, to, tokenId } = logDecoded;
      transfers.push({
        id: uuidv4(),
        tokenId,
        from,
        to,
        timestamp: new Date(timestamp),
        blockNumber: blockNumber,
        txHash: log.transactionHash,
        ownershipContract: log.address,
      });
    }
  }
}
