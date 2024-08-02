import { main } from "./main.js";

const MODE = {
  GCP: "translate-via-gcp",
  DEEPL: "translate-via-deepl",
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
  console.log(tab);
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: main,
    args: [MODE.DEFAULT],
  });
});

chrome.commands.onCommand.addListener(async (command) => {
  console.log({ command });
  // get current tab
  const [tab] = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  console.log({ tab });
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: async () => {
      const url =
        document.querySelector("link[rel=canonical]")?.href || location.href;
      const title = document.title.trim();

      const body = `
        <ul>
          <li>${title}
            <ul>
              <li><a href="${url}">${url}</a></li>
            </ul>
          </li>
        </ul>
      `;

      const blob = new Blob([body], { type: "text/html" });
      const item = [
        new window.ClipboardItem({
          "text/html": blob,
        }),
      ];

      await navigator.clipboard.write(item);
    },
  });
  console.log(result);
});
