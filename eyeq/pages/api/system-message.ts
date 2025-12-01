import type { NextApiRequest, NextApiResponse } from 'next';
import { readSystemMessageV2 } from '@/lib/systemMessage';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const content = readSystemMessageV2();
    return res.status(200).json({ systemMessage: content });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to read system message', error);
    return res.status(500).json({ error: 'Unable to read system message' });
  }
}
