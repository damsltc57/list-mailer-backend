import nodemailer from "nodemailer";

export const buildTransporter = (mailAccount) => {
	let config = {};
	if (mailAccount.googleId) {
		config = {
			host: "smtp.gmail.com",
			port: 465,
			secure: true,
			auth: {
				type: "OAuth2",
				user: mailAccount.email,
				accessToken: mailAccount.accessToken,
				refreshToken: mailAccount.refreshToken,
				clientId: process.env.GOOGLE_CLIENT_ID,
				clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			},
		};
	} else {
		config = {
			host: mailAccount?.host,
			port: mailAccount?.port,
			auth: {
				user: mailAccount?.email,
				pass: mailAccount?.pass,
			},
			...(mailAccount?.dkim?.domainName ? { dkim: { ...mailAccount?.dkim } } : {}),
		};
	}
	return nodemailer.createTransport({ ...config, pool: true, rateLimit: Infinity, maxConnections: 5 });
};
