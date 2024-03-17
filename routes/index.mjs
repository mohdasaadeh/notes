import * as express from "express";

import { NotesStore as notes } from "../models/notes-store.mjs";
import { io } from "../app.mjs";

export const router = express.Router();

async function getKeyTitlesList() {
  const keylist = await notes.keylist();

  const keyPromises = keylist.map((key) => notes.read(key));

  const notelist = await Promise.all(keyPromises);

  return notelist.map((note) => {
    return { key: note.key, title: note.title };
  });
}

router.get("/", async (req, res, next) => {
  try {
    const notelist = await getKeyTitlesList();

    res.render("index", {
      title: "Notes",
      notelist: notelist,
      user: req.user ? req.user : undefined,
    });
  } catch (err) {
    next(err);
  }
});

export const emitNoteTitles = async () => {
  const notelist = await getKeyTitlesList();

  io.of("/home").emit("notetitles", { notelist });
};

export function init() {
  io.of("/home").on("connect", (socket) => {
    console.log("socketio connection on /home");
  });

  notes.on("notecreated", emitNoteTitles);
  notes.on("noteupdate", emitNoteTitles);
  notes.on("notedestroy", emitNoteTitles);
}
