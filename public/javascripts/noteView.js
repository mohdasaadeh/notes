document.addEventListener("DOMContentLoaded", () => {
  const socket = io("/notes", {
    query: { key: notekey },
  });

  const noteTitle = document.getElementById("note-title");
  const noteBody = document.getElementById("note-body");
  const navbarTitle = document.getElementById("navbar-title");

  socket.on("noteupdated", (note) => {
    noteTitle.innerHTML = "";
    noteTitle.textContent = note.title;

    navbarTitle.innerHTML = "";
    navbarTitle.textContent = note.title;

    noteBody.innerHTML = "";
    noteBody.textContent = note.body;
  });

  socket.on("notedestroyed", (key) => {
    window.location.href = "/";
  });
});
