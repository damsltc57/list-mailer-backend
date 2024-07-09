export const formatEmail = (content, to) => {
	const regex = /<span class="mention" data-type="mention" data-id="prénom">\{\{ prénom \}\}<\/span>/g;
	const replacement = to.firstName;

	return content.replace(regex, replacement);
};
