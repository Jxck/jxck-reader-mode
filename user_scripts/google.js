(() => {
  "use strict";
  function item(href, q, text) {
    const $a = document.createElement("a");
    $a.classList = ["zItAnd FOU1zf"];
    $a.href = href + q;
    $a.textContent = text;
    $a.style = "margin: 0 4px";
    return $a;
  }

  window.addEventListener("load", () => {
    console.log("add m3 link to google search result");

    const href = location.href;

    const $en = item(href, "&lr=lang_en&gl=us&as_dt=e&as_sitesearch=jp", "En"); // google search result to english only
    const $m3 = item(href, "&tbs=qdr:m3", "3M"); // google search result to recent 3 month

    const $div = document.createElement("div");
    $div.setAttribute("popover", "manual");
    $div.style = "top: 0; left: 0; margin: 0;";
    $div.prepend($m3);
    $div.prepend($en);
    document.body.appendChild($div);
    $div.showPopover();
  });
})();
