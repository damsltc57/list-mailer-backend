import ContactModel from "../database/models/contact.model.js";
import { htmlToText } from "html-to-text";

export const formatEmail = (content, to, signature) => {
	const regex = /<span class="mention" data-type="mention" data-id="prénom">\{\{ prénom \}\}<\/span>/g;
	const replacement = to.firstName;

	let newContent = content.replace(regex, replacement);

	if (signature) {
		newContent += signature;
	}
	return newContent;
};

export const buildEmails = async (to) => {
	const toEmails = [];

	for (const contact of to) {
		if (!contact?.collaborators?.length) {
			const data = await ContactModel.findByPk(contact.id);
			if (data) {
				toEmails.push({ id: contact.id, email: data.email, firstName: data.firstName });
			}
		} else {
			for (const collaborator of contact?.collaborators) {
				toEmails.push({ id: collaborator.id, email: collaborator.email, firstName: collaborator.firstName });
			}
		}
	}
	return toEmails;
};
export function buildMailBodies({ html, htmlToTextOptions = {} }) {
	// Génération TEXT depuis le HTML complet (avec signature)
	let text = htmlToText(html, {
		wordwrap: 0, // pas de coupure arbitraire
		selectors: [
			// Lien : "libellé <URL>"
			{ selector: "a", format: "anchor" },
			// Listes plus propres
			{ selector: "ul", options: { itemPrefix: "• " } },
			{ selector: "ol", options: { itemPrefix: (i) => `${i}. ` } },
			// Images : afficher alt si présent
			{ selector: "img", format: "skip" }, // on les ignore (souvent mieux en email)
		],
		// Fusionne avec options utilisateur
		...htmlToTextOptions,
	});

	return text;
}
