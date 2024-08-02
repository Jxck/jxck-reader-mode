import { main } from "./main.js";

const MODE = {
  CLEAR: "clear-translate",
  DEFAULT: "default",
  DIALOG: "dialog",
};

const updateContextMenus = async () => {
  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({
    id: MODE.DEFAULT,
    title: "default mode",
    contexts: ["all"],
  });
  chrome.contextMenus.create({
    id: MODE.DIALOG,
    title: "dialog mode",
    contexts: ["all"],
  });
  chrome.contextMenus.create({
    id: MODE.CLEAR,
    title: "clear cache",
    contexts: ["all"],
  });
};

chrome.runtime.onInstalled.addListener(updateContextMenus);
chrome.runtime.onStartup.addListener(updateContextMenus);
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const id = info.menuItemId;
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: main,
    args: [id],
  });
});

chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: main,
    args: [MODE.DEFAULT],
  });
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "copy-link") {
    await copy_link();
  }
});

async function copy_link() {
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
