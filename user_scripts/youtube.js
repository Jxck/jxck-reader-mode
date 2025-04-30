(function () {
  "use strict";
  const $ = document.querySelector.bind(document);
  const $$ = document.querySelectorAll.bind(document);
  EventTarget.prototype.on = EventTarget.prototype.addEventListener;
  function loop(fn) {
    fn();
    setInterval(fn, 500);
  }

  window.on("load", () => {
    // wide progress bar
    const $progress = $(".ytp-progress-bar");
    if (!$progress) return;
    $progress.style.height = "30px";
  });

  function main() {
    // remove comments
    $("#comments")?.remove();
  }
  loop(main);
})();
