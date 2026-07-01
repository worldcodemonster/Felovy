import type { NextApiRequest, NextApiResponse } from 'next';
import serverless from 'serverless-http';
import app from '@/server/app';

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

const handler = serverless(app, { binary: true });

export default function api(req: NextApiRequest, res: NextApiResponse) {
  return handler(req, res);
}
