
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const db = require('./db');

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const labsRoutes = require('./routes/labs');
app.use(labsRoutes);


const dataDir = path.join(__dirname, 'data');
const categories = [];

const categoryFolders = fs.readdirSync(dataDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

for (const catId of categoryFolders) {
    const catPath = path.join(dataDir, catId);
    const labs = [];
    let catTitle = catId; 
    
    const files = fs.readdirSync(catPath);
    
    for (const file of files) {
        if (!file.endsWith('.json')) continue;
        
        const filePath = path.join(catPath, file);
        const fileData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        
        if (file === 'category.json') {
            catTitle = fileData.title;
        } else {
            labs.push(fileData);
        }
    }
    
    categories.push({ id: catId, title: catTitle, labs: labs });
}


app.get('/', (req, res) => {
    const solvedRows = db.prepare('SELECT lab_id FROM solved_labs').all();
    const solvedLabIds = new Set(solvedRows.map(row => row.lab_id));

    const categoriesWithState = categories.map(category => {
        return {
            ...category,
            labs: category.labs.map(lab => ({
                ...lab,
                is_solved: solvedLabIds.has(lab.id)
            }))
        };
    });

    res.render('index', { categories: categoriesWithState });
});

app.listen(PORT,'0.0.0.0', () => {
    console.log(`Control Plane running on http://localhost:${PORT}`);
});