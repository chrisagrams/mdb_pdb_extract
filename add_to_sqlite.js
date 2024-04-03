import {readFileSync, existsSync} from 'fs';
import sqlite3 from 'sqlite3';
import path from 'path';
import {html_to_json} from './index.js';

if (process.argv.length < 2) {
    console.log('Usage: node add_to_sqlite.js <directory>');
    process.exit(1);
}
  
const speciesFile = readFileSync('./species_dict.json', 'utf8');
const targetDirectoryPath = process.argv[2];
const targetsFilePath = './files_scv_subset.txt';
const jsonObject = JSON.parse(speciesFile);
  
// Open the database connection
const db = new sqlite3.Database('./db/data.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error(err.message);
        process.exit(1);
    }
});

// Create the table if it does not exist
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS mdb_scv (
        protein_id TEXT PRIMARY KEY,
        sequence_model TEXT NOT NULL,
        job_model TEXT NOT NULL
    )`);
});

// Function to process a single HTML file
const processHtmlFile = (htmlFilePath) => {
    const res = html_to_json(htmlFilePath, null);
    const sequence_model = res.sequence_model;
    const job_model = res.job_model;

    if (sequence_model.protein_id in jsonObject) {
        job_model.species = jsonObject[sequence_model.protein_id].toLowerCase();
    } else {
        console.log('Species not found for protein ID:', sequence_model.protein_id);
        return;
    }

    const stmt = db.prepare(`INSERT INTO mdb_scv (protein_id, sequence_model, job_model) VALUES (?, ?, ?) ON CONFLICT(protein_id) DO UPDATE SET sequence_model = excluded.sequence_model, job_model = excluded.job_model`);
    stmt.run(sequence_model.protein_id, JSON.stringify(sequence_model), JSON.stringify(job_model), function(err) {
        if (err) {
            console.log(err.message);
        }
    });
    stmt.finalize();
}

// Reading and processing target files
const targetFiles = readFileSync(targetsFilePath, 'utf8').split('\n');
targetFiles.forEach(filename => {
    const filePath = path.join(targetDirectoryPath, filename.trim());
    if (existsSync(filePath)) {
        processHtmlFile(filePath);
        console.log(`Added: ${filePath}`);
    } else {
        console.log(`File does not exist: ${filePath}`);
    }
});

// Close the database connection when all processing is complete
db.close((err) => {
    if (err) {
        console.error(err.message);
    }
});