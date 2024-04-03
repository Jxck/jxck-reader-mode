import main from "./main.js";

function clear() {
  localStorage.clear()
}

const TRANSLATE_VIA = {
  GCP: "translate-via-gcp",
  DEEPL: "translate-via-deepl",
  CLEAR: "clear-translate",
}

const updateContextMenus = async () => {
  await chrome.contextMenus.removeAll()
  chrome.contextMenus.create({
    id: TRANSLATE_VIA.GCP,
    title: "translate via gcp",
    contexts: ["all"],
  })
  chrome.contextMenus.create({
    id: TRANSLATE_VIA.DEEPL,
    title: "translate via deepl",
    contexts: ["all"],
  })
  chrome.contextMenus.create({
    id: TRANSLATE_VIA.CLEAR,
    title: "clear translate cache",
    contexts: ["all"],
  })
}

chrome.runtime.onInstalled.addListener(updateContextMenus)
chrome.runtime.onStartup.addListener(updateContextMenus)
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const id = info.menuItemId

  if (id === TRANSLATE_VIA.DEEPL) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: main,
      args: [TRANSLATE_VIA.DEEPL],
    })
  }

  if (id === TRANSLATE_VIA.GCP) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: main,
      args: [TRANSLATE_VIA.GCP],
    })
  }

  if (id === TRANSLATE_VIA.CLEAR) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: clear,
      args: [],
    })
  }
})

chrome.action.onClicked.addListener((tab) => {
  console.log(tab)
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: main,
    args: [TRANSLATE_VIA.DEEPL],
  })
})
