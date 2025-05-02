// api/routes/index.ts
import express from 'express';
import { exec } from 'child_process';


const router = express.Router();

router.post('/', (req: any, res: any) => {
  const { auth_token, scan } = req.query;

  if (auth_token !== process.env.AUTH_TOKEN) {
    return res.status(403).send('Forbidden');
  }

  if (!scan || typeof scan !== 'string') {
    return res.status(400).send('Missing or invalid scan range');
  }

  const [from, to] = scan.split(':');

  exec(`npx ts-node indexer/indexer.ts ${from} ${to}`, (err, stdout, stderr) => {
    if (err) return res.status(500).send(stderr);
    res.send(stdout);
  });
});

export default router;
