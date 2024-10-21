export async function copy_link() {
  // get current tab
  const win = await chrome.windows.getCurrent({
    populate: true,
    windowTypes: ["normal"],
  })
  const tab = win.tabs.find(t => t.active)
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: async () => {
      const url = location.href
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
