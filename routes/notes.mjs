// const util = require('util');
import { default as express } from "express";
import DBG from "debug";

import { NotesStore as notes } from "../models/notes-store.mjs";
import { ensureAuthenticated } from "./users.mjs";
import { emitNoteTitles } from "./index.mjs";
import { io } from "../app.mjs";
import {
  postMessage,
  destroyMessage,
  recentMessages,
  emitter as msgEvents,
} from "../models/messages-sequelize.mjs";

const debug = DBG("notes:home");
const error = DBG("notes:error-home");

export const router = express.Router();

router.get("/add", ensureAuthenticated, (req, res, next) => {
  res.render("noteedit", {
    title: "Add a Note",
    docreate: true,
    notekey: "",
    user: req.user,
    note: undefined,
  });
});

router.post("/save", ensureAuthenticated, async (req, res, next) => {
  try {
    let note;

    if (req.body.docreate === "create") {
      note = await notes.create(
        req.body.notekey,
        req.body.title,
        req.body.body
      );
    } else {
      note = await notes.update(
        req.body.notekey,
        req.body.title,
        req.body.body
      );
    }

    res.redirect("/notes/view?key=" + req.body.notekey);
  } catch (err) {
    next(err);
  }
});

router.get("/view", async (req, res, next) => {
  try {
    let note = await notes.read(req.query.key);

    res.render("noteview", {
      title: note ? note.title : "",
      notekey: req.query.key,
      user: req.user ? req.user : undefined,
      note: note,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/edit", ensureAuthenticated, async (req, res, next) => {
  try {
    const note = await notes.read(req.query.key);

    res.render("noteedit", {
      title: note ? "Edit " + note.title : "Add a Note",
      docreate: false,
      notekey: req.query.key,
      user: req.user,
      note: note,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/destroy", ensureAuthenticated, async (req, res, next) => {
  try {
    const note = await notes.read(req.query.key);

    res.render("notedestroy", {
      title: note ? note.title : "",
      notekey: req.query.key,
      user: req.user,
      note: note,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/destroy/confirm", ensureAuthenticated, async (req, res, next) => {
  try {
    await notes.destroy(req.body.notekey);

    res.redirect("/");
  } catch (err) {
    next(err);
  }
});

export function init() {
  io.of("/notes").on("connect", (socket) => {
    const notekey = socket.handshake.query.key;

    if (notekey) {
      socket.join(notekey);

      socket.on("create-message", async (newmsg, fn) => {
        try {
          await postMessage(
            newmsg.from,
            newmsg.namespace,
            newmsg.room,
            newmsg.message
          );

          fn("ok");
        } catch (err) {
          error(`FAIL to create message ${err.stack}`);
        }
      });

      socket.on("delete-message", async (data) => {
        try {
          await destroyMessage(data.id);
        } catch (err) {
          error(`FAIL to delete message ${err.stack}`);
        }
      });
    }
  });

  notes.on("noteupdated", (note) => {
    const toemit = {
      key: note.key,
      title: note.title,
      body: note.body,
    };

    io.of("/notes").to(note.key).emit("noteupdated", toemit);

    emitNoteTitles();
  });

  notes.on("notedestroyed", (key) => {
    io.of("/notes").to(key).emit("notedestroyed", key);

    emitNoteTitles();
  });

  msgEvents.on("newmessage", (newmsg) => {
    io.of(newmsg.namespace).to(newmsg.room).emit("newmessage", newmsg);
  });

  msgEvents.on("destroymessage", (data) => {
    io.of(data.namespace).to(data.room).emit("destroymessage", data);
  });
}
