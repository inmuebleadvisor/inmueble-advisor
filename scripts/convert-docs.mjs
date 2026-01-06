import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';
import HTMLtoDOCX from 'html-to-docx';

// Replicate __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SOURCE_DIR = path.resolve(PROJECT_ROOT, 'Documentos');
const DEST_DIR = path.join(SOURCE_DIR, 'docx');

// Exclusions for the recursive search
const EXCLUDES = ['node_modules', '.git', 'dist', 'build', 'coverage', 'Documentos'];

async function getFilesRecursively(dir) {
    let results = [];
    const list = await fs.readdir(dir, { withFileTypes: true });

    for (const file of list) {
        const fullPath = path.join(dir, file.name);
        if (file.isDirectory()) {
            if (!EXCLUDES.includes(file.name)) {
                results = results.concat(await getFilesRecursively(fullPath));
            }
        } else {
            if (file.name.toLowerCase() === 'readme.md') {
                results.push(fullPath);
            }
        }
    }
    return results;
}

async function convertToDocx(filePath, outputPath, headerText = '') {
    const content = await fs.readFile(filePath, 'utf8');

    // Prepend header if requested
    const markdownContent = headerText ? `**${headerText}**\n\n${content}` : content;

    // Convert Markdown to HTML
    const htmlContent = marked.parse(markdownContent);

    // Convert HTML to DOCX
    const docxBuffer = await HTMLtoDOCX(htmlContent, null, {
        table: { row: { cantSplit: true } },
        footer: true,
        pageNumber: true,
    });

    await fs.writeFile(outputPath, docxBuffer);
    console.log(`Converted: ${path.relative(PROJECT_ROOT, filePath)} -> ${path.basename(outputPath)}`);
}

async function convertFiles() {
    try {
        // Ensure destination directory exists
        await fs.mkdir(DEST_DIR, { recursive: true });
        console.log(`Created directory: ${DEST_DIR}`);

        // 1. Process standard markdown files in Documentos/ (Existing logic)
        // Check if directory exists first to avoid errors
        try {
            const files = await fs.readdir(SOURCE_DIR);
            const mdFiles = files.filter(file => path.extname(file).toLowerCase() === '.md');

            console.log(`Found ${mdFiles.length} standard Markdown files in Documentos.`);

            for (const file of mdFiles) {
                const filePath = path.join(SOURCE_DIR, file);
                const destFileName = path.basename(file, '.md') + '.docx';
                const destFilePath = path.join(DEST_DIR, destFileName);
                await convertToDocx(filePath, destFilePath);
            }
        } catch (err) {
            console.warn(`Warning parsing Documentos folder: ${err.message}`);
        }

        // 2. Process recursively found README.md files
        console.log('Searching for README.md files...');
        const readmeFiles = await getFilesRecursively(PROJECT_ROOT);
        console.log(`Found ${readmeFiles.length} README.md files.`);

        for (const filePath of readmeFiles) {
            // Calculate relative path to use as context
            const relativePath = path.relative(PROJECT_ROOT, filePath);
            const relativeDir = path.dirname(relativePath);

            // Create a safe filename replacement for slashes
            const safeDirName = relativeDir === '.' ? 'ROOT' : relativeDir.replace(/[\\/]/g, '_');
            const destFileName = `README_${safeDirName}.docx`;
            const destFilePath = path.join(DEST_DIR, destFileName);

            const headerText = `Folder: ${relativeDir === '.' ? 'Root' : relativeDir}`;
            await convertToDocx(filePath, destFilePath, headerText);
        }

        console.log('All files converted successfully!');
    } catch (error) {
        console.error('Error during conversion:', error);
        process.exit(1);
    }
}

convertFiles();
