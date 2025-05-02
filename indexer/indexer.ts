

import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

// Constants
const MAX_RETRIES = 3;
const BATCH_SIZE = 10;

// Ethers v6 utility function
const safeFormatEther = (value: bigint): number => {
  return parseFloat(ethers.formatEther(value));
};

// Provider setup for Ethers v6
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const prisma = new PrismaClient();

// Transaction type
interface SafeTransaction {
  hash: string;
  from: string;
  to: string | null;
  value: bigint;
  nonce: number;
}

async function processBlock(blockNumber: number, retryCount = 0): Promise<void> {
  try {
    const exists = await prisma.block.findUnique({ where: { number: blockNumber } });
    if (exists) {
      console.log(`⏭️ Block ${blockNumber} already exists. Skipping.`);
      return;
    }

    const block = await provider.getBlock(blockNumber);
    if (!block) {
      console.warn(`⚠️ Block ${blockNumber} not found`);
      return;
    }

    const transactions = await Promise.all(
      block.transactions.map(async (txHash: string) => {
        try {
          const tx = await provider.getTransaction(txHash);
          if (!tx) return null;
          
          // Explicit null check and property verification
          if (!tx.hash || !tx.from || tx.value === undefined) {
            console.warn(`Invalid transaction format for ${txHash}`);
            return null;
          }

          return {
            hash: tx.hash,
            from: tx.from,
            to: tx.to ?? null,
            value: tx.value,
            nonce: tx.nonce
          };
        } catch (error) {
          console.warn(`Failed to fetch tx ${txHash}:`, error);
          return null;
        }
      })
    );

    // Filter out null values with proper type guard
    const validTxs = transactions.filter((tx): tx is SafeTransaction => 
      tx !== null && 
      tx.hash !== undefined && 
      tx.from !== undefined && 
      tx.value !== undefined
    );

    await prisma.block.create({
      data: {
        number: block.number,
        hash: block.hash ?? '',
        txCount: validTxs.length,
        transactions: {
          create: validTxs.map(tx => ({
            hash: tx.hash,
            from: tx.from,
            to: tx.to ?? '',
            amount: safeFormatEther(tx.value),
            nonce: tx.nonce,
          }))
        }
      }
    });

    console.log(`✅ Block ${blockNumber} indexed with ${validTxs.length} transactions`);
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.warn(`Retrying block ${blockNumber} (attempt ${retryCount + 1})`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return processBlock(blockNumber, retryCount + 1);
    }
    console.error(`❌ Failed to process block ${blockNumber} after ${MAX_RETRIES} attempts:`, error);
    throw error;
  }
}


async function processBlockRange(start: number, end: number) {
  for (let i = start; i <= end; i += BATCH_SIZE) {
    const batchEnd = Math.min(i + BATCH_SIZE - 1, end);
    await Promise.all(
      Array.from({ length: batchEnd - i + 1 }, (_, idx) => 
        processBlock(i + idx).catch(console.error)
      )
    );
  }
}

async function main() {
  try {
    const args = process.argv.slice(2);
    const latest = await provider.getBlockNumber();

    const blockHandler = (blockNumber: number) => {
      processBlock(blockNumber).catch(console.error);
    };

    if (args.length === 2) {
      const [start, end] = args.map(Number);
      await processBlockRange(start, end);
    } else if (args.length === 1) {
      const start = Number(args[0]);
      await processBlockRange(start, latest);
      provider.on('block', blockHandler);
    } else {
      await processBlockRange(0, latest);
      provider.on('block', blockHandler);
    }

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\nShutting down indexer...');
      provider.off('block', blockHandler);
      await prisma.$disconnect();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Indexer failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unhandled error in main:', err);
  process.exit(1);
});