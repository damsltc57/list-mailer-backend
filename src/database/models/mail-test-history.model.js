import { sequelize } from "./index.js";
import { DataTypes } from "sequelize";

const MailTestHistories = sequelize.define("MailTestHistories", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    mailAccountId: DataTypes.INTEGER,
    object: DataTypes.STRING,
    content: DataTypes.TEXT("long"),
    to: DataTypes.STRING,
    status: DataTypes.STRING,
    response: DataTypes.TEXT,
});

export default MailTestHistories;
