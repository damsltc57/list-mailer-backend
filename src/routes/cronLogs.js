import express from "express";
import isAuthenticated from "../middleware/isAuthenticated.js";
import { CronLog } from "../database/models/index.js";

const router = express.Router();

router.get("/", isAuthenticated, async function (req, res, next) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;

        const { count, rows } = await CronLog.findAndCountAll({
            order: [["timestamp", "DESC"]],
            limit,
            offset,
        });

        res.status(200).json({
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            logs: rows,
        });
    } catch (error) {
        console.error("Error fetching cron logs:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
