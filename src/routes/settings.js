import express from "express";
import { exec } from "child_process";
import isAuthenticated from "../middleware/isAuthenticated.js";
import { GlobalSettings } from "../database/models/index.js";

// Helper function to extract schedule interval in minutes from crontab string
function getBatchCronInterval() {
	return new Promise((resolve) => {
		exec("crontab -l", (error, stdout) => {
			if (error) {
				// If there's an error (e.g. no crontab, or not available locally), return default fallback
				console.error("Failed to read crontab:", error.message);
				return resolve(10);
			}

			// Look for the line containing "batchEmailCron.js"
			const lines = stdout.split("\n");
			const batchLine = lines.find((line) => line.includes("batchEmailCron.js") && !line.trim().startsWith("#"));

			if (batchLine) {
				// The typical format is "*/5 * * * * command...", we split by spaces
				const parts = batchLine.trim().split(/\s+/);
				const minutePart = parts[0];

				if (minutePart.startsWith("*/")) {
					// Extract the number after */
					const interval = parseInt(minutePart.substring(2), 10);
					if (!isNaN(interval)) {
						return resolve(interval);
					}
				} else if (!isNaN(parseInt(minutePart, 10))) {
					// Could be something like "5", though that means 5th minute of the hour, not every 5 min.
					// But let's assume standard */X format for relative intervals
				}
			}

			// Fallback to 10 if not found or couldn't parse
			resolve(10);
		});
	});
}

const router = express.Router();

router.get("/", isAuthenticated, async function (req, res, next) {
	try {
		const settings = await GlobalSettings.findOne();
		let payload = settings ? settings.toJSON() : {};

		// Dynamically append the crontab interval
		const cronIntervalMinutes = await getBatchCronInterval();
		payload.cronIntervalMinutes = cronIntervalMinutes;

		res.status(200).json(payload);
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
