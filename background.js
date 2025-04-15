import { translate } from "./background/translate.js";
import { copy_link } from "./background/copy_link.js";
import { text_to_speech } from "./background/text_to_speech.js";

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
  console.log({ command });
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
  if (command === "text-to-speech") {
    const [tab] = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true,
    });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: text_to_speech,
      args: [MODE.DEFAULT],
    });
  }
  if (command === "copy-link") {
    await copy_link();
  }
});

async function translate_via_deepl(text, auth_key) {
  console.log("fetch deepl api");
  const Endpoint = auth_key.endsWith(":fx")
    ? `https://api-free.deepl.com/v2/translate`
    : `https://api.deepl.com/v2/translate`;
  const url = new URL(Endpoint);
  url.searchParams.set("text", text);
  url.searchParams.set("auth_key", auth_key);
  url.searchParams.set("free_api", false);
  url.searchParams.set("target_lang", "JA");

  const req = await fetch(url, { method: "post" });
  const { translations } = await req.json();
  const translated = translations.map(({ text }) => text).join(" ");
  return translated;
}

chrome.runtime.onMessage.addListener(async (message, sender) => {
  console.log({ message });
  if (message.command === "translate_via_deepl") {
    // 翻訳リクエストだった場合翻訳して返す
    const translated = await (async () => {
      return await translate_via_deepl(
        message.text,
        message.options.deepl_auth_key,
      );
    })();

    console.log({ translated });
    chrome.tabs.sendMessage(sender.tab.id, {
      key: message.key,
      translated,
    });
  }
});
