import { main } from "./main.js"

const MODE = {
  GCP: "translate-via-gcp",
  DEEPL: "translate-via-deepl",
  CLEAR: "clear-translate",
  DEFAULT: "default",
  DIALOG: "dialog",
}

const updateContextMenus = async () => {
  await chrome.contextMenus.removeAll()
  chrome.contextMenus.create({
    id: MODE.DEFAULT,
    title: "default mode",
    contexts: ["all"],
  })
  chrome.contextMenus.create({
    id: MODE.DIALOG,
    title: "dialog mode",
    contexts: ["all"],
  })
  chrome.contextMenus.create({
    id: MODE.CLEAR,
    title: "clear cache",
    contexts: ["all"],
  })
}

chrome.runtime.onInstalled.addListener(updateContextMenus)
chrome.runtime.onStartup.addListener(updateContextMenus)
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const id = info.menuItemId
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: main,
    args: [id],
  })
})

chrome.action.onClicked.addListener((tab) => {
  console.log(tab)
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: main,
    args: [MODE.DEFAULT],
  })
})
