import express from "express";
import isAuthenticated from "../middleware/isAuthenticated.js";
import { MailTestHistories } from "../database/models/index.js";
import MailAccounts from "../database/models/mail-account.model.js";
import { buildTransporter } from "../utils/transporter.js";
import { buildMailBodies } from "../utils/email.js";

const router = express.Router();

router.get("/", isAuthenticated, async function (req, res, next) {
    try {
        const list = await MailTestHistories.findAll({
            order: [["createdAt", "DESC"]],
            raw: true,
        });

        // Fetch mail account details for each history line
        const accountIds = [...new Set(list.map((item) => item.mailAccountId))];
        const accounts = await MailAccounts.findAll({
            where: { id: accountIds },
            attributes: ["id", "email", "emailNickname"],
            raw: true,
        });

        const accountMap = accounts.reduce((acc, account) => {
            acc[account.id] = account;
            return acc;
        }, {});

        const formattedList = list.map((item) => ({
            ...item,
            mailAccount: accountMap[item.mailAccountId] || null,
        }));

        res.status(200).json(formattedList);
    } catch (error) {
        console.error("Error fetching test email history:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

router.post("/send", isAuthenticated, async function (req, res, next) {
    try {
        const { object, selectedAddress, to, content } = req.body;
        const attachments = [];

        if (!to || !selectedAddress || !content) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const mailAccount = await MailAccounts.findByPk(selectedAddress);
        if (!mailAccount) {
            return res.status(404).json({ error: "Mail account not found" });
        }

        if (req.files) {
            Object.keys(req.files).forEach((key) => {
                let file = req.files[key];
                attachments.push({
                    filename: file.name,
                    content: file.data,
                });
            });
        }

        const transporter = buildTransporter(mailAccount);

        const emailData = {
            from: {
                name: mailAccount.emailNickname,
                address: mailAccount.email,
            },
            to: to,
            subject: object || "Test Email",
            text: buildMailBodies({ html: content, htmlToTextOptions: {} }),
            html: content,
            attachments: attachments,
        };

        let status = "pending";
        let responseData = "";

        try {
            const result = await transporter.sendMail(emailData);
            status = result.accepted.length > 0 ? "sent" : "error";
            responseData = JSON.stringify(result);
        } catch (err) {
            status = "error";
            responseData = JSON.stringify({ message: err.message, stack: err.stack });
        }

        const testHistory = await MailTestHistories.create({
            mailAccountId: mailAccount.id,
            object: object || "Test Email",
            content,
            to,
            status,
            response: responseData,
        });

        if (status === "error") {
            return res.status(500).json({ success: false, error: responseData, history: testHistory });
        }

        res.status(200).json({ success: true, response: responseData, history: testHistory });
    } catch (error) {
        console.error("Error sending test email:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
