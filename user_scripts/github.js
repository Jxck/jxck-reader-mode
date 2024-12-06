(function () {
  "use strict";
  const $ = document.querySelector.bind(document);
  const $$ = document.querySelectorAll.bind(document);
  EventTarget.prototype.on = EventTarget.prototype.addEventListener;

  // private repo to red
  const Private = $(".octicon-lock");
  if (Private) {
    $(".AppHeader-globalBar").style.backgroundColor = "#990e0e";
  }

  window.addEventListener("load", function () {
    // load all hidden comment
    const $load = document.createElement("button");
    $load.textContent = "comment";
    $(".gh-header-actions").appendChild($load);
    $load.on("click", () => {
      loadComment();
    });

    // remove all comment, only reference
    const $refs = document.createElement("button");
    $refs.textContent = "refs";
    $(".gh-header-actions").appendChild($refs);
    $refs.on("click", () => {
      $$(".TimelineItem.js-comment-container").forEach((e) => e.remove());
    });
  });

  function loadComment() {
    console.log("loadComment");
    const $button = $(".ajax-pagination-btn[data-disable-with]");
    if (!$button) return console.log("all comments loaded");
    $button.click();
    setTimeout(loadComment, 500);
  }
})();
