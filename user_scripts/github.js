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

  // load all hidden comment
  window.addEventListener("load", function () {
    const $button = document.createElement("button");
    $button.textContent = "comment";
    $(".gh-header-actions").appendChild($button);
    $button.on("click", () => {
      loadComment();
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
