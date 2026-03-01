// models/index.js
import { sequelize } from "../db.js";
import Contact from "./contact.model.js";
import Collaborator from "./collaborator.model.js";
import MailTestHistories from "./mail-test-history.model.js";
import GlobalSettings from "./global-setting.model.js";

// Définir les relations après que les modèles soient chargés
export function applyAssociations() {
	Collaborator.belongsTo(Contact, { foreignKey: "contactId" });
	Contact.hasMany(Collaborator, { foreignKey: "contactId" });
}

// Optionnel : exporter pour usage ailleurs
export { Contact, Collaborator, MailTestHistories, GlobalSettings, sequelize };
