import { Request, Response } from 'express';
import { prisma } from '../../shared/db';

export const getAddressDetails = async (req: Request, res: Response) => {
  const address = req.params.address.toLowerCase();

  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [{ from: address }, { to: address }]
      },
      orderBy: { blockNumber: 'desc' }
    });

    res.json({
      address,
      txCount: transactions.length,
      transactions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch address details' });
  }
};
