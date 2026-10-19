import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'test-rs-data');
if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath, { recursive: true });
}

console.log('Starting mongod on port 27018 with dbPath:', dbPath);

const mongod = spawn('"C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe"', [
  '--replSet', 'rs0',
  '--port', '27018',
  '--dbpath', dbPath,
  '--bind_ip', '127.0.0.1'
], { shell: true, detached: true, stdio: 'ignore' });

mongod.unref();

console.log('mongod started in background (PID:', mongod.pid, ')');
