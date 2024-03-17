import { default as DBG } from "debug";
const debug = DBG("notes:notes-store");
const error = DBG("notes:error-store");

let _NotesStore;

export async function useModel(model) {
  try {
    const NotesStoreModule = await import(`./notes-${model}.mjs`);

    const NotesStoreClass = NotesStoreModule.default;

    _NotesStore = new NotesStoreClass();

    return _NotesStore;
  } catch (err) {
    throw new Error(`No recognized NotesStore in ${model} because
${err}`);
  }
}

export { _NotesStore as NotesStore };
