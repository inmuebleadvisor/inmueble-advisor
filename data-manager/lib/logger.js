import fs from 'fs';
import path from 'path';
import colors from 'colors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOG_DIR = path.join(__dirname, '../logs');

if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const LOG_FILE = path.join(LOG_DIR, `import_${timestamp}.log`);

const writeLog = (level, message, data = null) => {
    const time = new Date().toISOString();
    let logLine = `[${time}] [${level}] ${message}`;
    if (data) {
        logLine += ` | Data: ${JSON.stringify(data)}`;
    }
    logLine += '\n';

    fs.appendFileSync(LOG_FILE, logLine);
};

export const logger = {
    info: (msg, data) => {
        writeLog('INFO', msg, data);
    },
    warn: (msg, data) => {
        console.warn(colors.yellow(`⚠️  ${msg}`));
        writeLog('WARN', msg, data);
    },
    error: (msg, data) => {
        console.error(colors.red(`❌ ${msg}`));
        writeLog('ERROR', msg, data);
    },
    success: (msg) => {
        console.log(colors.green(`✅ ${msg}`));
        writeLog('SUCCESS', msg);
    },
    path: LOG_FILE
};
