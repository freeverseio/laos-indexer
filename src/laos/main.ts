import { TypeormDatabase, TypeormDatabaseOptions, Store } from '@subsquid/typeorm-store'
import { processor, Context } from './processor'
import { EventDetectionService } from './service/EventDetectionService';
import * as EvolutionCollection from '../abi/EvolutionCollection'
import { createMintedWithExternalURIModels } from './mapper/mintMapper';
import { createTokenUriModels } from './mapper/tokenUriMapper';

const options: TypeormDatabaseOptions = {
  supportHotBlocks: true,
  stateSchema: 'laos_processor',
};

processor.run<Store>(new TypeormDatabase(options), async (ctx) => {

  const service = new EventDetectionService(ctx);
  const detectedEvents = service.detectEvents();
  const mintEvents = detectedEvents.mintEvents;

  if (mintEvents.length > 0) {
    let mints = createMintedWithExternalURIModels(mintEvents);
    let tokenUris = createTokenUriModels(mintEvents);
    await ctx.store.upsert(mints.map(mint => mint.asset));
    await ctx.store.upsert(tokenUris);
    await ctx.store.insert(mints.map(mint => mint.metadata));
  }
});