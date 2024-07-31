"use strict";

/**
 * Headings の配列を <ul>/<ol> リストに組み直す
 * [{level: 1, text: "foo"}, {level: 2, text: "bar"}]
 * <ul>
 *   <li>foo</li>
 *   <li>
 *     <ul>
 *       <li>bar</li>
 *     </ul>
 *   </li>
 * </ul>
 */
function to_toc(headings) {
  const root = document.createElement("ul");
  root.level = 1;

  function list([head, ...tail], current) {
    if (head === undefined) return root;
    const li = document.createElement("li");
    li.textContent = head.text;
    li.level = head.level;

    if (current.level === head.level) {
      current.appendChild(li);
      return list(tail, current);
    }

    // 一段ネスト
    if (current.level < head.level) {
      const ul = document.createElement("ul");
      current.appendChild(ul);
      ul.level = current.level + 1;
      return list([head, ...tail], ul);
    }

    // 上に戻る
    if (current.level > head.level) {
      return list([head, ...tail], current.parentNode.parentNode);
    }
  }
  return list(headings, root);
}

document.addEventListener("DOMContentLoaded", async (e) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const tabId = tab.id;
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId },
    function: run,
  });
  const $ul = to_toc(result);
  console.log($ul);
  document.querySelector("main").appendChild($ul);
});

function run() {
  const headings = Array.from(
    document.querySelectorAll("h1,h2,h3,h4,h5,h6")
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
