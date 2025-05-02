import { prisma } from '../../shared/db';
import { Request, Response } from 'express';

export const getBlock = async (req: Request, res: Response) => {
  const number = parseInt(req.params.number);
  const block = await prisma.block.findUnique({ where: { number }, include: { transactions: true } });
  res.json(block);
};

export const getLatestBlock = async (_req: Request, res: Response) => {
  const block = await prisma.block.findFirst({ orderBy: { number: 'desc' }, include: { transactions: true } });
  res.json(block);
};
