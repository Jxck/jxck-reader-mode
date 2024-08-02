export async function copy_link() {
  // get current tab
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: async () => {
      const canonical = document.querySelector("link[rel=canonical]")?.href;
      const url = canonical || location.href;
      const title = document.title.trim();

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
