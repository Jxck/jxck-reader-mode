(function () {
  "use strict";
  const $ = document.querySelector.bind(document);
  const $$ = document.querySelectorAll.bind(document);
  EventTarget.prototype.on = EventTarget.prototype.addEventListener;

  // private repo to red
  const $header = $("header");
  const Private = $(".octicon-lock");
  if (Private) {
    $header.style.backgroundColor = "#990e0e";
  }

  const $main = $("main");
  window.addEventListener("load", function () {
    // load all hidden comment
    const $load = document.createElement("button");
    $load.textContent = "comment";
    $main.prepend($load);
    $load.on("click", () => {
      loadComment();
    });

    // remove all comment, only reference
    const $refs = document.createElement("button");
    $refs.textContent = "refs";
    $main.prepend($refs);
    $refs.on("click", () => {
      $$(".react-issue-comment ").forEach((e) => e.remove());
    });
  });

  function loadComment() {
    console.log("loadComment");
    const $loadMore = $("[data-testid=issue-timeline-load-more-load-top]");
    if (!$loadMore) return console.log("all comments loaded");
    $loadMore.click();
    setTimeout(loadComment, 500);
  }
})();
