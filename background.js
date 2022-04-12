async function main() {
  "use strict";
  console.log("deepl");
  EventTarget.prototype.on = EventTarget.prototype.addEventListener;
  const encoder = new TextEncoder();

  const deepl_auth_key = await new Promise((done, fail) => {
    chrome.storage.sync.get(["deepl_auth_key"], ({ deepl_auth_key }) => {
      done(deepl_auth_key);
    });
  });

  async function digestMessage(message) {
    const data = encoder.encode(message);
    const sha256 = await crypto.subtle.digest("SHA-256", data);
    const hash = btoa(String.fromCharCode(...new Uint8Array(sha256)));
    console.log({ message, hash });
    return hash;
  }

  async function deepl(text) {
    console.log("fetch api");
    const url = new URL(`https://api.deepl.com/v2/translate`);
    url.searchParams.set("text", text);
    url.searchParams.set("auth_key", deepl_auth_key);
    url.searchParams.set("free_api", false);
    url.searchParams.set("target_lang", "JA");

    const req = await fetch(url, { method: "post" });
    const { translations } = await req.json();
    const translated = translations.map(({ text }) => text).join(" ");
    return translated;
  }

  async function translate(text) {
    const hash = await digestMessage(text);
    const cache = localStorage.getItem(hash);
    if (cache) {
      console.log("cache hit");
      return cache;
    }

    const translated = await deepl(text);
    const key = await digestMessage(text);
    localStorage.setItem(key, translated);
    return translated;
  }

  function appendChild(target, node) {
    target.parentNode.insertBefore(node, target.nextSibling);
  }

  function traverse() {
    console.log("traverse");
    const target = Array.from(document.querySelectorAll('body, main, article')).reduce((curr, prev) => curr || prev)
    target.querySelectorAll("p").forEach(async (p) => {
      // console.log({p})
      const text = p.textContent;
      const translated = await translate(text);
      const textNode = document.createElement("p");
      textNode.textContent = translated;
      console.log(textNode);
      appendChild(p, textNode);
    });

    target
      .querySelectorAll("h2, h3, h4, h5, h6, li, th, td")
      .forEach(async (h) => {
        const text = h.textContent;
        const translated = await translate(text);
        h.innerHTML += `<br>${translated}`;
      });
  }
  traverse();
}

chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: main,
  });
});
