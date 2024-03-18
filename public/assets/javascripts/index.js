document.addEventListener("DOMContentLoaded", function () {
  const socket = io("/home");

  socket.on("connect", (socket) => {
    console.log("socketio connection on /home");
  });

  socket.on("notetitles", function (data) {
    const notelist = data.notelist;

    const noteTitlesContainer = document.getElementById("notetitles");

    noteTitlesContainer.innerHTML = "";

    for (let i = 0; i < notelist.length; i++) {
      const notedata = notelist[i];

      const aTag = document.createElement("a");

      aTag.setAttribute("class", "btn btn-lg btn-block btn-outline-dark");
      aTag.setAttribute("href", `/notes/view?key=${notedata.key}`);
      aTag.textContent = notedata.title;

      const liTag = document.createElement("li");

      liTag.append(aTag);

      noteTitlesContainer.append(liTag);
    }
  });
});
