import { translate } from "./translate.js";
import { copy_link } from "./copy_link.js";

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
    function: translate,
    args: [id],
  });
});

chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: translate,
    args: [MODE.DEFAULT],
  });
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "translate") {
    const [tab] = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true,
    });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: translate,
      args: [MODE.DEFAULT],
    });
  }
  if (command === "copy-link") {
    await copy_link();
  }
});
