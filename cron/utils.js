export const getCollaborators = async (contactSheet) => {
	const data = [];

	data.push({
		firstName: contactSheet[`First Name`] || "",
		lastName: contactSheet[`Last Name`] || "",
		email: contactSheet[`Email Company`]?.trim(),
		phone: contactSheet[`Phone`] || "",
		position: contactSheet[`Position`] || "",
		linkedin: contactSheet[`LinkedIn`] || "",
	});

	for (let i = 1; i < 45; i++) {
		const email = contactSheet[`collaborator${i}_email`]?.trim();
		// On saute les cases vides mais on continue la boucle
		if (!email) continue;

		data.push({
			firstName: contactSheet[`collaborator${i}_first_name`] || "",
			lastName: contactSheet[`collaborator${i}_last_name`] || "",
			email,
			phone: contactSheet[`collaborator${i}_phone`] || "",
			position: contactSheet[`collaborator${i}_position`] || "",
			linkedin: contactSheet[`collaborator${i}_linkedin`] || "",
		});
	}
	return data;
};

function normalizeCollaborator(c) {
	return {
		id: c.id ?? null,
		email: (c.email || "").trim().toLowerCase(),
		firstName: (c.firstName || c.first_name || "").trim(),
		lastName: (c.lastName || c.last_name || "").trim(),
		phone: (c.phone || "").trim(),
		position: (c.position || "").trim(),
		linkedin: (c.linkedin || "").trim(),
	};
}

function buildEmailMap(collabs = []) {
	const map = new Map();
	for (const c of collabs) {
		const n = normalizeCollaborator(c);
		if (!n.email) continue;
		map.set(n.email, n);
	}
	return map;
}

function shallowEqualCollab(a, b) {
	return (
		a.firstName === b.firstName &&
		a.lastName === b.lastName &&
		a.phone === b.phone &&
		a.position === b.position &&
		a.linkedin === b.linkedin
	);
}

/**
 * Calcule le diff entre collaborateurs existants et à venir
 * @returns { toCreate, toUpdate, toDelete }
 */
export function diffCollaborators(existing = [], next = []) {
	const eBy = buildEmailMap(existing);
	const nBy = buildEmailMap(next);

	const toCreate = [];
	const toUpdate = [];
	const toDelete = [];

	// Ajouts + updates
	for (const [email, n] of nBy) {
		const e = eBy.get(email);
		if (!e) {
			toCreate.push(n);
		} else {
			if (!shallowEqualCollab(e, n)) {
				toUpdate.push({ ...n, id: e.id }); // conserve l'id existant pour update
			}
		}
	}

	// Suppressions
	for (const [email, e] of eBy) {
		if (!nBy.has(email)) {
			toDelete.push(e);
		}
	}

	return { toCreate, toUpdate, toDelete };
}
