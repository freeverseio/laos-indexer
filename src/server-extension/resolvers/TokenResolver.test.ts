import { EntityManager } from 'typeorm';
import { TokenResolver } from './TokenResolver';
import { TokenQueryResult, TokenOrderByOptions, TokenConnection, TokenEdge, PageInfo } from '../../model';

export const mockEntityManager = () => {
  return {
    getRepository: jest.fn().mockReturnThis(),
    count: jest.fn(),
    query: jest.fn(),
  } as unknown as EntityManager;
};

describe('TokenResolver', () => {
  let resolver: TokenResolver;
  let mockTx: jest.Mock;

  beforeEach(() => {
    const manager = mockEntityManager();
    mockTx = jest.fn().mockResolvedValue(manager);
    resolver = new TokenResolver(mockTx);
  });

  it('should return NFT details by ID', async () => {
    const manager = await mockTx();
    const mockData = [
      {
        tokenId: 'token1',
        owner: 'owner1',
        tokenUri: 'uri1',
        createdAt: new Date('2021-01-01'),
      },
    ];

    manager.query.mockResolvedValue(mockData);

    const result = await resolver.token('contractId', 'token1');

    expect(result).toEqual(
      new TokenQueryResult({
        createdAt: new Date('2021-01-01'),
        tokenId: 'token1',
        owner: 'owner1',
        tokenUri: 'uri1',
      })
    );
   
  });

  it('should return null if no NFT details are found', async () => {
    const manager = await mockTx();
    manager.query.mockResolvedValue([]);

    const result = await resolver.token('contractId', 'token1');

    expect(result).toBeNull();
   
  });

  it('should return tokens by owner', async () => {
    const manager = await mockTx();
    const mockData = [
      {
        tokenId: 'token1',
        owner: 'owner1',
        tokenUri: 'uri1',
        createdAt: new Date('2021-01-01').getTime(), // Use numeric timestamp for createdAt
      },
    ];

    manager.query.mockResolvedValue(mockData);

    const result = await resolver.tokens(
      {
        owner: 'owner1',
      },
      {
        first: 10,
        after: Buffer.from('0').toString('base64'), // Use base64 encoded timestamp
      },
      TokenOrderByOptions.CREATED_AT_ASC
    );

    expect(result).toEqual(new TokenConnection(
      [new TokenEdge(
        Buffer.from(mockData[0].createdAt.toString()).toString('base64'),
        new TokenQueryResult({
          ...mockData[0],
          createdAt: new Date(mockData[0].createdAt)
        })
      )],
      new PageInfo({
        endCursor: Buffer.from(mockData[0].createdAt.toString()).toString('base64'),
        hasNextPage: false,
        hasPreviousPage: true,
        startCursor: Buffer.from(mockData[0].createdAt.toString()).toString('base64')
      })
    ));

   
  });

  it('should return tokens by collection', async () => {
    const manager = await mockTx();
    const mockData = [
      {
        tokenId: 'token1',
        owner: 'owner1',
        tokenUri: 'uri1',
        createdAt: new Date('2021-01-01').getTime(), // Use numeric timestamp for createdAt
      },
    ];

    manager.query.mockResolvedValue(mockData);

    const result = await resolver.tokens(
      {
        contractAddress: 'collectionId',
      },
      {
        first: 10,
        after: Buffer.from('0').toString('base64'), // Use base64 encoded timestamp
      },
      TokenOrderByOptions.CREATED_AT_ASC
    );

    expect(result).toEqual(new TokenConnection(
      [new TokenEdge(
        Buffer.from(mockData[0].createdAt.toString()).toString('base64'),
        new TokenQueryResult({
          ...mockData[0],
          createdAt: new Date(mockData[0].createdAt)
        })
      )],
      new PageInfo({
        endCursor: Buffer.from(mockData[0].createdAt.toString()).toString('base64'),
        hasNextPage: false,
        hasPreviousPage: true,
        startCursor: Buffer.from(mockData[0].createdAt.toString()).toString('base64')
      })
    ));

  
  });

  it('should return an empty array if no tokens are found', async () => {
    const manager = await mockTx();
    manager.query.mockResolvedValue([]);

    const result = await resolver.tokens(
      {
        contractAddress: 'collectionId',
      },
      {
        first: 10,
        after: Buffer.from('0').toString('base64'), // Use base64 encoded timestamp
      },
      TokenOrderByOptions.CREATED_AT_ASC
    );

    expect(result).toEqual(new TokenConnection(
      [],
      new PageInfo({
        endCursor: undefined,
        hasNextPage: false,
        hasPreviousPage: true,
        startCursor: undefined
      })
    ));

    expect(manager.query).toHaveBeenCalledWith(
      expect.any(String),
      ['collectionid', 0, expect.any(Number)]
    );
  });
});
