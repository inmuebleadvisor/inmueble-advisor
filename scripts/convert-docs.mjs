import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';
import HTMLtoDOCX from 'html-to-docx';

// Replicate __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_DIR = path.resolve(__dirname, '../Documentos');
const DEST_DIR = path.join(SOURCE_DIR, 'docx');

async function convertFiles() {
    try {
        // Ensure destination directory exists
        await fs.mkdir(DEST_DIR, { recursive: true });
        console.log(`Created directory: ${DEST_DIR}`);

        // Read all files in source directory
        const files = await fs.readdir(SOURCE_DIR);
        const mdFiles = files.filter(file => path.extname(file).toLowerCase() === '.md');

        console.log(`Found ${mdFiles.length} Markdown files to convert.`);

        for (const file of mdFiles) {
            const filePath = path.join(SOURCE_DIR, file);
            const content = await fs.readFile(filePath, 'utf8');

            // Convert Markdown to HTML
            const htmlContent = marked.parse(content);

            // Convert HTML to DOCX
            const docxBuffer = await HTMLtoDOCX(htmlContent, null, {
                table: { row: { cantSplit: true } },
                footer: true,
                pageNumber: true,
            });

            const destFileName = path.basename(file, '.md') + '.docx';
            const destFilePath = path.join(DEST_DIR, destFileName);

            await fs.writeFile(destFilePath, docxBuffer);
            console.log(`Converted: ${file} -> ${destFileName}`);
        }

        console.log('All files converted successfully!');
    } catch (error) {
        console.error('Error during conversion:', error);
        process.exit(1);
    }
}

convertFiles();
