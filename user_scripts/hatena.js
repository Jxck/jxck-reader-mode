(function () {
  "use strict";

  const blacklist = ["anond.hatelabo.jp", "togetter.com", "b.hatena.ne.jp", "syu-m-5151.hatenablog.com"];

  // 俺のはてブ
  if (location.href.startsWith("https://hatebu.brdr.jp")) {
    Array.from(document.querySelectorAll("a[target='_blank']"))
      .filter((e) => {
        const href = new URL(e.href);
        return blacklist.includes(href.host);
      })
      .forEach((e) => {
        e.parentElement.remove();
      });

    document.querySelectorAll("div.entry-info").forEach((e) => e.remove());
  }

  // はてなフィルター
  if (location.href.startsWith("https://hatenafilter.com")) {
    Array.from(
      document.querySelectorAll("div.entry > div.title > a[target='_blank']"),
    )
      .filter((e) => {
        const href = new URL(e.href);
        return blacklist.includes(href.host);
      })
      .forEach((e) => {
        console.log(e);
        e.parentElement.parentElement.remove();
      });
    document.querySelectorAll("span.bookmark").forEach((e) => e.remove());
  }
})();
