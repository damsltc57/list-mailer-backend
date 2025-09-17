import ContactModel from "../database/models/contact.model.js";

export const formatEmail = (content, to) => {
	const regex = /<span class="mention" data-type="mention" data-id="prénom">\{\{ prénom \}\}<\/span>/g;
	const replacement = to.firstName;

	return content.replace(regex, replacement);
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
