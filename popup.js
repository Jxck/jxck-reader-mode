"use strict";
import { to_toc } from "./to_toc.js";

document.addEventListener("DOMContentLoaded", async (e) => {
  await main();
});

async function main() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const tabId = tab.id;
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    function: run,
  });
  const $ul = to_toc(result);
  console.log($ul);
  document.querySelector("main").appendChild($ul);
}

function run() {
  const headings = Array.from(
    document.querySelectorAll("h1,h2,h3,h4,h5,h6"),
  ).map((h) => {
    const level = parseInt(h.tagName.replace("H", ""));
    const text = h.textContent.trim();
    console.log({ level, text });
    return {
      level,
      text,
    };
  });
  return headings;
}
