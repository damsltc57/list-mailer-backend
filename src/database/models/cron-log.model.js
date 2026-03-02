import { sequelize } from "./index.js";
import { DataTypes } from "sequelize";

const CronLog = sequelize.define(
    "CronLogs",
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        cronName: { type: DataTypes.STRING, allowNull: false },
        summary: { type: DataTypes.STRING, allowNull: true },
        status: { type: DataTypes.STRING, allowNull: false }, // 'success', 'warning', 'error'
        details: { type: DataTypes.TEXT, allowNull: true }, // JSON stringified details
        timestamp: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    { timestamps: true }
);

export default CronLog;
