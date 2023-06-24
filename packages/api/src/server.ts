import https from "node:https";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

import express, { Application, ErrorRequestHandler } from "express";
import helmet from "helmet";
import nocache from "nocache";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";

import authRoute from "./routes/auth.js";
import eventRoute from "./routes/event.js";
import userRoute from "./routes/user.js";

import * as authMiddleware from "./middlewares/auth.js";
import { middleware as rateLimit } from "./lib/rateLimit.js";

const app: Application = express();
const portHttp = process.env.PORT_HTTP || "80";
const portHttps = process.env.PORT_HTTPS || "443";

app.use(helmet({ contentSecurityPolicy: false }));
app.disable("x-powered-by");
app.use(cookieParser());
app.use(bodyParser.json());

app.use("/", express.static(path.join(__dirname, "public/www")));
app.use(
  "/auth",
  authMiddleware.tryRedirectApp,
  nocache(),
  express.static(path.join(__dirname, "public/auth"))
);
app.use(
  "/app",
  authMiddleware.checkCookie,
  nocache(),
  express.static(path.join(__dirname, "public/app"))
);
app.use("/api/auth", rateLimit("sensitive"), nocache(), authRoute);
app.use(
  "/api/event",
  rateLimit("normal"),
  authMiddleware.checkCookie,
  nocache(),
  eventRoute
);
app.use(
  "/api/user",
  rateLimit("normal"),
  authMiddleware.checkCookie,
  nocache(),
  userRoute
);

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error(err);
  res.sendStatus(500);
};
app.use(errorHandler);

http
  .createServer((req, res) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);

    url.port = portHttps;
    url.protocol = "https:";

    res.writeHead(301, { Location: url.toString() });
    res.end();
  })
  .listen(portHttp, () => {
    console.log(`HTTP Server running on port ${portHttp}`);
  });

https
  .createServer(
    {
      key: fs.readFileSync(path.join(__dirname, "keys/nohackgenda.key")),
      cert: fs.readFileSync(path.join(__dirname, "keys/nohackgenda.crt")),
    },
    app
  )
  .listen(portHttps, () => {
    console.log(`HTTPS Server running on port ${portHttps}`);
  });
