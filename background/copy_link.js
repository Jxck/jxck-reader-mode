export async function copy_link() {
  // get current tab
  const win = await chrome.windows.getCurrent({
    populate: true,
    windowTypes: ["normal"],
  });
  const tab = win.tabs.find((t) => t.active);
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: async () => {
      const url = location.href.replace(/\?hl=.*$/, "");

      const omits = [
        "  |  Blog  |  Chrome for Developers",
        "  |  Blog  |  web.dev",
        "  |  Articles  |  web.dev",
        "  |  Chrome for Developers",
        "  |  Google for Developers",
        "  |  Google Search Central Blog",
        " - Google Developers Blog",
        "Google Developers Japan: ",
        "Google Online Security Blog: ",
        " – Firefox Nightly News",
        " | MDN Blog",
      ];
      const title = omits.reduce((acc, curr) => {
        return acc.replace(curr, "");
      }, document.title.trim());

      console.log({ url, title });
      const html = `<ul>
                      <li>${title}
                        <ul>
                          <li><a href="${url}">${url}</a></li>
                        </ul>
                      </li>
                    </ul>
                  `;
      const text = `${title}\n\t${url}`;

      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([text], { type: "text/plain" }),
        }),
      ]);
    },
  });
}
