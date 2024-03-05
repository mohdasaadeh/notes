import { default as express } from "express";
import { default as hbs } from "hbs";
import * as path from "path";
// import * as favicon from 'serve-favicon';
import { default as logger } from "morgan";
import { default as cookieParser } from "cookie-parser";
import * as http from "http";

import {
  normalizePort,
  onError,
  onListening,
  handle404,
  basicErrorHandler,
} from "./appsupport.mjs";
import { router as indexRouter } from "./routes/index.mjs";
import { router as notesRouter } from "./routes/notes.mjs";
import { approotdir } from "./approotdir.mjs";
import { InMemoryNotesStore } from "./models/notes-memory.mjs";

export const NotesStore = new InMemoryNotesStore();

const __dirname = approotdir;

var app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
hbs.registerPartials(path.join(__dirname, "partials"));

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/notes", notesRouter);

app.use(handle404);
app.use(basicErrorHandler);

const port = normalizePort(process.env.PORT || "3000");

app.set("port", port);

export const server = http.createServer(app);

server.listen(port);
server.on("error", onError);
server.on("listening", onListening);
