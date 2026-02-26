const express = require('express');
const routes = express.Router();
const { v4: uuidv4 } = require('uuid');
const dockerService = require('../dockerControllers/dockerservice');
const fs = require('fs');
const path = require('path');
const db = require('../db');

const activeLabs = new Map();

routes.post('/api/labs/start', async (req, res) => {
    const { categoryId, labId } = req.body;

    if (!categoryId || !labId) {
        return res.status(400).json({ error: "Missing categoryId or labId" });
    }

    const instanceId = uuidv4();

    try {
        const labData = await dockerService.startLabInstance(categoryId, labId, instanceId);
        
        activeLabs.set(instanceId, { ...labData, categoryId, labId });

        res.status(200).json({
            message: "Lab started successfully",
            data: { instanceId, ...labData }
        });
    } catch (error) {
        console.error("Failed to start lab:", error.message);
        const status = error.message.includes("not found") ? 404 : 500;
        res.status(status).json({ error: error.message || "Failed to start lab" });
    }
});


routes.get('/:categoryId/:labId', (req, res, next) => {
    const { categoryId, labId } = req.params;

    if (categoryId === 'api') return next();

    const labFilePath = path.join(__dirname, '..', 'data', categoryId, `${labId}.json`);

    if (!fs.existsSync(labFilePath)) {
        return res.status(404).send('<h2>404 - Lab not found</h2><p>Make sure the JSON file exists in your data folder.</p>');
    }

    const labData = JSON.parse(fs.readFileSync(labFilePath, 'utf-8'));

    const solvedCheck = db.prepare('SELECT lab_id FROM solved_labs WHERE lab_id = ?').get(labId);
    labData.is_solved = !!solvedCheck;

    res.render('lab-detail', { lab: labData, categoryId });
});

routes.post('/api/labs/solve', (req, res) => {
    const { instanceId, status } = req.body;
    console.log("--> WEBHOOK HIT! Payload received:", req.body);

    if (status === 'solved' && activeLabs.has(instanceId)) {
        const labInfo = activeLabs.get(instanceId);
        
        labInfo.solved = true;
        activeLabs.set(instanceId, labInfo);
        

        // 2. Permanently save to SQLite
        try {
            // INSERT OR IGNORE prevents errors if they solve it multiple times
            const stmt = db.prepare('INSERT OR IGNORE INTO solved_labs (lab_id) VALUES (?)');
            stmt.run(labInfo.labId);
            
            console.log(`Successfully saved progress for lab: ${labInfo.labId}`);
        } catch (error) {
            console.error("Database insertion failed:", error);
        }
    }

    res.status(200).json({ received: true });
});
//routes.get('/api/labs/active', (req, res) => {
//    const labsArray = Array.from(activeLabs.values());
//    res.status(200).json({ activeLabs: labsArray });
//});

/*routes.post('/api/labs/stop/:instanceId', async (req, res) => {
    const { instanceId } = req.params;
    const lab = activeLabs.get(instanceId);

    if (!lab) {
        return res.status(404).json({ error: "Lab instance not found" });
    }

    try {
        await dockerService.stopLabInstance(lab.containerId);
        activeLabs.delete(instanceId);

        res.status(200).json({ message: "Lab stopped successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to stop lab" });
    }
});*/

module.exports = routes;