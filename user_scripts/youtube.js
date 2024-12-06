(function () {
  "use strict";
  const $ = document.querySelector.bind(document);
  const $$ = document.querySelectorAll.bind(document);
  EventTarget.prototype.on = EventTarget.prototype.addEventListener;

  window.on("load", () => {
    removeComments();

    // wide progress bar
    const $progress = $(".ytp-progress-bar");
    $progress.style.height = "30px";
  });

  function removeComments() {
    const $comments = $("#comments");
    console.log($comments);
    if ($comments) {
      $comments.remove();
      return console.log("remove comment");
    }
    setTimeout(() => {
      console.log("recurse");
      removeComments();
    }, 500);
  }
})();
