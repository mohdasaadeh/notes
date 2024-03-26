import { default as express } from "express";
import { default as hbs } from "hbs";
import * as path from "path";
import { default as logger } from "morgan";
import { default as cookieParser } from "cookie-parser";
import * as http from "http";
import { default as rfs } from "rotating-file-stream";
import capcon from "capture-console";
import session from "express-session";
import sessionFileStore from "session-file-store";
import { Server } from "socket.io";
import passportSocketIo from "passport.socketio";
import RedisStore from "connect-redis";
import { createAdapter } from "@socket.io/redis-adapter";
import { Redis } from "ioredis";

import {
  normalizePort,
  onError,
  onListening,
  handle404,
  basicErrorHandler,
  datedFileNameGenerator,
} from "./appsupport.mjs";
import { router as indexRouter, init as indexInit } from "./routes/index.mjs";
import { router as notesRouter, init as notesInit } from "./routes/notes.mjs";
import { router as usersRouter, initPassport } from "./routes/users.mjs";
import { approotdir } from "./approotdir.mjs";
import { useModel as useNotesModel } from "./models/notes-store.mjs";

export const sessionCookieName = "notescookie.sid";
const sessionSecret = "keyboard mouse";

let sessionStore;
let redisClient;

if (
  typeof process.env.REDIS_ENDPOINT !== "undefined" &&
  process.env.REDIS_ENDPOINT !== ""
) {
  redisClient = new Redis({ host: process.env.REDIS_ENDPOINT });

  sessionStore = new RedisStore({ client: redisClient, prefix: "notey:" });
} else {
  const FileStore = sessionFileStore(session);

  sessionStore = new FileStore({ path: "sessions" });
}

capcon.startCapture(process.stderr, async (stderr) => {
  const stream = rfs.createStream(
    (time, index) => {
      return datedFileNameGenerator(time, index, "errors.txt");
    },
    {
      size: "10M",
      interval: "1d",
      compress: "gzip",
    }
  );

  stream.write(new Date() + " - " + stderr);
});

useNotesModel(process.env.NOTES_MODEL ? process.env.NOTES_MODEL : "memory")
  .then((store) => {
    indexInit();
    notesInit();
  })
  .catch((error) => {
    onError({ code: "ENOTESSTORE", error });
  });

const __dirname = approotdir;

const app = express();

export const port = normalizePort(process.env.PORT || "3000");

app.set("port", port);

export const server = http.createServer(app);

server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

let adapter;

if (
  typeof process.env.REDIS_ENDPOINT !== "undefined" &&
  process.env.REDIS_ENDPOINT !== ""
) {
  const subClient = redisClient.duplicate();

  adapter = createAdapter(redisClient, subClient);
}

export const io = new Server(server);

io.adapter(adapter);

io.use(
  passportSocketIo.authorize({
    cookieParser: cookieParser,
    key: sessionCookieName,
    secret: sessionSecret,
    store: sessionStore,
  })
);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
hbs.registerPartials(path.join(__dirname, "partials"));

app.use(
  session({
    store: sessionStore,
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    name: sessionCookieName,
  })
);

initPassport(app);

app.use(
  logger(process.env.REQUEST_LOG_FORMAT || "dev", {
    stream: process.env.REQUEST_LOG_FILE
      ? rfs.createStream(
          (time, index) => {
            return datedFileNameGenerator(
              time,
              index,
              process.env.REQUEST_LOG_FILE
            );
          },
          {
            size: "10M",
            interval: "1d",
            compress: "gzip",
          }
        )
      : process.stdout,
  })
);
if (process.env.REQUEST_LOG_FILE) {
  app.use(logger(process.env.REQUEST_LOG_FORMAT || "dev"));
}
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(
  "/assets/vendor/bootstrap",
  express.static(path.join(__dirname, "node_modules", "bootstrap", "dist"))
);
app.use(
  "/assets/vendor/jquery",
  express.static(path.join(__dirname, "node_modules", "jquery", "dist"))
);
app.use(
  "/assets/vendor/popper.js",
  express.static(
    path.join(__dirname, "node_modules", "popper.js", "dist", "umd")
  )
);
app.use(
  "/assets/vendor/feather-icons",
  express.static(path.join(__dirname, "node_modules", "feather-icons", "dist"))
);

app.use("/", indexRouter);
app.use("/notes", notesRouter);
app.use("/users", usersRouter);

app.use(handle404);
app.use(basicErrorHandler);

capcon.stopCapture(process.stderr);
