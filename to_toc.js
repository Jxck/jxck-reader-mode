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
export function to_toc(headings) {
  const rootUL = document.createElement("ul");
  rootUL.level = 1;

  function list([head, ...tail], currentUL) {
    if (head === undefined) return rootUL;
    console.log(currentUL.level, head.level);
    const li = document.createElement("li");
    li.textContent = head.text;
    li.level = head.level;

    if (currentUL.level === head.level) {
      currentUL.appendChild(li);
      return list(tail, currentUL);
    }

    // 一段ネスト
    if (currentUL.level < head.level) {
      const ul = document.createElement("ul");
      ul.level = currentUL.level + 1;
      if (currentUL.lastChild === null) {
        const li = document.createElement("li");
        li.textContent = "EMPTY";
        currentUL.appendChild(li);
      }
      currentUL.lastChild.appendChild(ul);
      return list([head, ...tail], ul);
    }

    // 上に戻る
    if (currentUL.level > head.level) {
      return list([head, ...tail], currentUL.parentNode.parentNode);
    }
  }
  return list(headings, rootUL);
}
