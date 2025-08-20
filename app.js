import createError from "http-errors";
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import indexRouter from "./src/routes/index.js";
import authRouter from "./src/routes/auth.js";
import contactRouter from "./src/routes/contact.js";
import mailAccount from "./src/routes/mailAccount.js";
import mailHistory from "./src/routes/mailHistory.js";
import sequelize from "./src/database/models/index.js";
import fileUpload from "express-fileupload";
import cors from "cors";
import { fileURLToPath } from "url";
import http from "http";
// import { updateContacts } from "./cron/contacts.js";
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

const app = express();
const port = normalizePort(process.env.PORT || "3005");
const server = http.createServer(app);

const start = async () => {
	app.set("port", port);
	await sequelize;

	app.use(fileUpload({ debug: false }));
	app.use(cors({ origin: process.env.APP_ORIGIN }));

	app.use(logger("dev"));
	app.use(express.urlencoded({ extended: false }));
	app.use(cookieParser());
	app.use(express.static(path.join(__dirname, "public")));
	app.use(express.json({ limit: "10mb", extended: true }));
	app.use(express.urlencoded({ limit: "10mb", extended: true, parameterLimit: 50000 }));

	app.use((req, res, next) => {
		res.setHeader(
			"Access-Control-Allow-Headers",
			"Origin, X-Requested-With, Content, Accept, Content-Type, Authorization",
		);
		res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
		next();
	});

	app.use("/", indexRouter);
	app.use("/auth", authRouter);
	app.use("/contact", contactRouter);
	app.use("/mail-account", mailAccount);
	app.use("/history", mailHistory);

	// catch 404 and forward to error handler
	// app.use(function (req, res, next) {
	// 	next(createError(404));
	// });

	// error handler
	app.use(function (err, req, res, next) {
		// set locals, only providing error in development
		res.locals.message = err.message;
		res.locals.error = req.app.get("env") === "development" ? err : {};

		// render the error page
		res.status(err.status || 500);
		res.render("error");
	});
};

start().then(() => {
	server.listen(port);
	server.on("error", onError);
	server.on("listening", onListening);
});

function onListening() {
	console.log(`🚀 Server ready at http://localhost:${server.address().port}/`);
}

function normalizePort(val) {
	const port = parseInt(val, 10);

	if (isNaN(port)) {
		// named pipe
		return val;
	}

	if (port >= 0) {
		// port number
		return port;
	}

	return false;
}

function onError(error) {
	if (error.syscall !== "listen") {
		throw error;
	}

	const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

	// handle specific listen errors with friendly messages
	switch (error.code) {
		case "EACCES":
			console.error(bind + " requires elevated privileges");
			process.exit(1);
			break;
		case "EADDRINUSE":
			console.error(bind + " is already in use");
			process.exit(1);
			break;
		default:
			throw error;
	}
}

export default app;
