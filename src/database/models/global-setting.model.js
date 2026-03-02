import { sequelize } from "./index.js";
import { DataTypes } from "sequelize";

const GlobalSettings = sequelize.define("GlobalSettings", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    batchLimit: { type: DataTypes.INTEGER, defaultValue: 5 },
    isPaused: { type: DataTypes.BOOLEAN, defaultValue: false },
});

export default GlobalSettings;
