import util from "util";
import { Note, AbstractNotesStore } from "./Notes.mjs";

import { default as DBG } from "debug";
import sqlite3DB from "sqlite3";

const sqlite3 = sqlite3DB.verbose();

let db = new sqlite3.Database(
  process.env.SQLITE_FILE || "notes.sqlite",
  (err) => {
    if (!err) {
      console.log("The database has been connected successfully");
    } else {
      console.log(err);
    }
  }
);

const debug = DBG("notes:notes-sqlite3");
const error = DBG("notes:error-sqlite3");

export default class SQLITE3NotesStore extends AbstractNotesStore {
  async close() {
    const _db = db;

    db = undefined;

    return _db
      ? new Promise((resolve, reject) => {
          _db.close((err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        })
      : undefined;
  }

  async update(key, title, body) {
    const note = new Note(key, title, body);

    await new Promise((resolve, reject) => {
      db.run(
        "UPDATE notes " + "SET title = ?, body = ? WHERE notekey = ?",
        [title, body, key],
        (err) => {
          if (err) return reject(err);

          resolve(note);
        }
      );
    });

    return note;
  }

  async create(key, title, body) {
    await new Promise((resolve, reject) => {
      db.run(
        "INSERT INTO notes ( notekey, title, body) " + "VALUES ( ?, ? , ? );",
        [key, title, body],
        (err) => {
          if (err) return reject(err);

          resolve();
        }
      );
    });

    return "";
  }

  async read(key) {
    const note = await new Promise((resolve, reject) => {
      db.get("SELECT * FROM notes WHERE notekey = ?", [key], (err, row) => {
        if (!row) {
          reject(new Error(`No note found for ${key}`));
        } else {
          const note = new Note(row.notekey, row.title, row.body);

          resolve(note);
        }
      });
    });

    return note;
  }

  async destroy(key) {
    return await new Promise((resolve, reject) => {
      db.run("DELETE FROM notes WHERE notekey = ?;", [key], (err) => {
        if (err) return reject(err);

        resolve();
      });
    });
  }

  async keylist() {
    const keyz = await new Promise((resolve, reject) => {
      const keyz = [];

      db.all("SELECT notekey FROM notes", (err, rows) => {
        if (err) return reject(err);

        resolve(
          rows.map((row) => {
            return row.notekey;
          })
        );
      });
    });

    return keyz;
  }

  async count() {
    const count = await new Promise((resolve, reject) => {
      db.get("SELECT count(notekey) AS count FROM notes", (err, row) => {
        if (err) return reject(err);

        resolve(row.count);
      });
    });

    return count;
  }
}
