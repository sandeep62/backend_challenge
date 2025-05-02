import { prisma } from '../../shared/db';
import { Request, Response } from 'express';

export const getStats = async (_req: Request, res: Response) => {
  const result = await prisma.transaction.aggregate({
    _sum: { amount: true },
    _count: { _all: true }
  });
  res.json(result);
};

export const getStatsInRange = async (req: Request, res: Response) => {
  const [start, end] = req.params.range.split(':').map(Number);
  const result = await prisma.transaction.aggregate({
    where: {
      blockNumber: { gte: start, lte: end }
    },
    _sum: { amount: true },
    _count: { _all: true }
  });
  res.json(result);
};
