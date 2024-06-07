const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

module.exports = (req, res, next) => {
	try {
		const token = req.headers.authorization?.split(" ")[1];
		const decodedToken = jwt.verify(token, process.env.JTW_TOKEN);
		const userId = decodedToken.donnee.idadmin;
		const access = decodedToken.donnee.access;
		//console.log('header Admin token => ', decodedToken.donnee);
		req.auth = {
			idadmin: userId,
			access: access,
		};
		next();
	} catch (error) {
		console.log("header admin authentification required", error);
		res.status(401).json({ message: "header admin authentification required" });
	}
};
