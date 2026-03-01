import express from "express";
import isAuthenticated from "../middleware/isAuthenticated.js";
import { GlobalSettings } from "../database/models/index.js";

const router = express.Router();

router.get("/", isAuthenticated, async function (req, res, next) {
    try {
        const settings = await GlobalSettings.findOne();
        if (!settings) {
            return res.status(404).json({ error: "Global settings not found" });
        }
        res.status(200).json(settings);
    } catch (error) {
        console.error("Error fetching global settings:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.post("/update", isAuthenticated, async function (req, res, next) {
    try {
        const { batchLimit } = req.body;
        const settings = await GlobalSettings.findOne();

        if (settings) {
            await settings.update({ batchLimit: batchLimit || 5 });
            res.status(200).json(settings);
        } else {
            const newSettings = await GlobalSettings.create({ batchLimit: batchLimit || 5 });
            res.status(200).json(newSettings);
        }
    } catch (error) {
        console.error("Error updating global settings:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
