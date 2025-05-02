import { prisma } from '../../shared/db';
import { Request, Response } from 'express';

export const getLatestTx = async (_req: Request, res: Response) => {
  const tx = await prisma.transaction.findFirst({
    orderBy: { id: 'desc' }
  });
  res.json(tx);
};

export const getTxByHash = async (req: Request, res: Response) => {
  const tx = await prisma.transaction.findUnique({
    where: { hash: req.params.hash }
  });
  res.json(tx);
};
