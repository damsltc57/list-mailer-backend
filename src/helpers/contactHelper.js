const buildContactModel = (contactJson, contactListId, userId) => {
	return {
		firstName: contactJson.first_name,
		lastName: contactJson.last_name,
		email: contactJson.Email,
		companyName: contactJson.company,
		formalityLevel: contactJson?.["TU OU VOUS"] === "VOUS" ? "formal" : "informal",
		interesting: contactJson?.interesting || null,
		country: contactJson?.country,
		website: contactJson?.website_company,
		tvProducer: contactJson?.cinema_television?.includes("Television"),
		filmProducer: contactJson?.cinema_television?.includes("Cinema"),
		contactListId,
		userId,
	};
};

export { buildContactModel };
