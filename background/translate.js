export async function translate(mode = MODE.DEFAULT) {
  EventTarget.prototype.on = EventTarget.prototype.addEventListener;
  const $ = document.querySelector.bind(document);
  const $$ = document.querySelectorAll.bind(document);
  const encoder = new TextEncoder();

  const MODE = {
    CLEAR: "clear-translate",
    DEFAULT: "default",
    DIALOG: "dialog",
  };

  if (mode === MODE.CLEAR) return clear();

  const PLUGINS = {
    "www.inoreader.com": () => {
      // magazine view
      $$(".article_magazine_content").forEach(async ($div) => {
        const text = $div.textContent;
        const $p = document.createElement("p");
        $p.textContent = text;
        $div.textContent = "";
        $div.appendChild($p);
        $div.style = "display: block; overflow: unset;";
      });
      $$(".article_magazine_picture").forEach((div) => {
        div.style.height = "400px";
      });
      return;
    },
    "issues.chromium.org": () => {
      Array.from(...$$(".child")).map((div) => {
        const $div = div.cloneNode(true);
        $div.querySelectorAll("br").forEach(($br) => {
          $br.replaceWith("\r");
        });
        const text = $div.textContent
          .replaceAll("\r\r", "\n")
          .replaceAll("\r", " ")
          .replace(/Bug: (.+?) Change-Id: (.+?)Reviewed-on:.+/, "")
          .replace("[Empty comment from Monorail migration]", "");

        const lines = text.split("\n").map((line) => line.trim());

        const $container = document.createElement("div");
        lines.forEach((line) => {
          if (line === "") return;
          const $p = document.createElement("p");
          $p.style = "margin: 4px 0";
          $p.textContent = line.trim();
          $container.appendChild($p);
        });
        div.prepend($container);
      });
    },
  };

  function clear() {
    localStorage.clear();
  }

  function spacer(text) {
    const FULL_HALF =
      /(?<full>[\p{sc=Hira}\p{sc=Kana}\p{sc=Han}]+)(?<half>[\p{ASCII}]+)/gu;
    const HALF_FULL =
      /(?<half>[\p{ASCII}]+)(?<full>[\p{sc=Hira}\p{sc=Kana}\p{sc=Han}]+)/gu;
    return text
      .replaceAll(FULL_HALF, (all, left, right) => `${left} ${right}`)
      .replaceAll(HALF_FULL, (all, left, right) => `${left} ${right}`);
  }

  async function digestMessage(message) {
    const data = encoder.encode(message);
    const sha256 = await crypto.subtle.digest("SHA-256", data);
    const hash = btoa(String.fromCharCode(...new Uint8Array(sha256)));
    return hash;
  }

  function appendChild(target, node) {
    target.parentNode.insertBefore(node, target.nextSibling);
  }

  async function translate({ text, options }) {
    const key = await digestMessage(text);
    const cache = localStorage.getItem(key);
    if (cache) {
      return cache;
    }

    // バックグラウンドに対して翻訳をリクエスト
    chrome.runtime.sendMessage({
      command: "translate_via_deepl",
      key,
      text,
      options,
    });

    const { promise, resolve } = Promise.withResolvers();

    // バックグラウンドからの翻訳レスポンスを受取り
    // 送ったのと同じ Key だったらキャッシュして resolve
    chrome.runtime.onMessage.addListener((message) => {
      if (message.key === key) {
        const translated = spacer(message.translated);
        localStorage.setItem(key, translated);
        resolve(translated);
      }
    });

    return promise;
  }

  function traverse(mode, options) {
    /** Pre Edit */
    PLUGINS[location.host]?.();

    // 全ての <p> を翻訳し、下に <p> を作って追加
    //  header の下じゃない h1 は h1:not(header h1) のように指定する
    //  複数の場合は :is() で列挙する
    $$("p:not([translate=no]):is(:not(:is(header,footer,aside) *))").forEach(
      async (p) => {
        const text = p.textContent;
        const translated = await translate({ text, options });
        const textNode = document.createElement("p");
        textNode.setAttribute("translate", "no");
        textNode.style.color = options.text_color;
        textNode.textContent = translated;
        appendChild(p, textNode);
      },
    );

    // h2 ~ h6, li, th, td は、 <p> 追加ではなく <br> で追記
    $$(
      ":is(h2, h3, h4, h5, h6, li, th, td):not([translate=no]):is(:not(:is(header, footer, aside) *))",
    ).forEach(async (h) => {
      if (h.children[0]?.nodeName !== "P") {
        const text = h.textContent;
        const translated = await translate({ text, options });
        h.innerHTML += `<br><span style="color: ${options.text_color}">${translated}</span>`;
      }
    });

    if (mode === MODE.DIALOG) {
      // ML など、 pre で改行されてる文章を整形して翻訳する
      $$("pre:not(:is(:has(code), div.highlight pre))").forEach(async (pre) => {
        const textContent = pre.textContent;

        // 段落で分割する
        const sections = textContent.split("\n\n").map((section) => {
          // セクションを整形
          console.log({ section });

          // 引用 `>` で始まっているかを確認
          if (section.startsWith("> ")) {
            // そのセクション全部の `>` を消して一文に連結
            // 文頭の `>` のみ残す
            // `>>` となってる場合は失敗するがよし
            section = section.replaceAll("\n>");
            console.log({ blockquote: section });
          }

          // 一行に繋ぐ
          section = section
            .replaceAll("\n", " ")
            .replaceAll(".  ", ".\n")
            .replaceAll("\n ", "\n")
            .trim();
          console.log({ section });
          return section;
        });

        pre.innerHTML = "";

        // セクションごとに翻訳
        for await (const section of sections) {
          const translated = (await translate(section, options))
            .replaceAll("\n ", "\n")
            .trim();
          console.log({ translated });

          const textNode = document.createElement("p");
          textNode.textContent = section;
          pre.appendChild(textNode);

          const translatedNode = document.createElement("p");
          translatedNode.style.color = options.text_color;
          translatedNode.textContent = translated;
          pre.appendChild(translatedNode);
        }
      });
    }
  }

  async function main() {
    console.log("main");
    const { promise, resolve } = Promise.withResolvers();
    chrome.storage.sync.get(["deepl_auth_key", "text_color"], resolve);
    const options = await promise;
    traverse(mode, options);
  }
  main();
}
