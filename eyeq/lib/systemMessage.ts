import fs from 'fs';
import path from 'path';

export const SYSTEM_MESSAGE_V2_PATH = path.join(process.cwd(), 'config', 'system_message_v2.txt');

export function readSystemMessageV2(): string {
  if (!fs.existsSync(SYSTEM_MESSAGE_V2_PATH)) {
    throw new Error(`System message file missing at ${SYSTEM_MESSAGE_V2_PATH}`);
  }

  return fs.readFileSync(SYSTEM_MESSAGE_V2_PATH, 'utf8').trim();
}
