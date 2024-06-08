import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const isAuthenticated = (req, res, next) => {
	try {
		const token = req.headers.authorization?.split(" ")[1];
		const decodedToken = jwt.verify(token, process.env.JTW_TOKEN);
		const { email, userId } = decodedToken;
		//console.log('header Admin token => ', decodedToken.donnee);
		req.auth = {
			email,
			id: userId,
		};
		next();
	} catch (error) {
		console.log("header admin authentification required", error);
		res.status(401).json({ message: "header admin authentification required" });
	}
};

export default isAuthenticated;
