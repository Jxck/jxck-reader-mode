export async function text_to_speech() {
  EventTarget.prototype.on = EventTarget.prototype.addEventListener;
  const $ = document.querySelector.bind(document);
  const $$ = document.querySelectorAll.bind(document);

  // パラメーターの取得
  const { promise, resolve } = Promise.withResolvers();
  chrome.storage.sync.get(["speech_speed"], resolve);
  const options = await promise;
  const RATE = options.speech_speed;
  console.log({ RATE });

  // highlight を一意に識別するための乱数
  function random() {
    return btoa(Math.random()).substring(0, 10);
  }

  // ハイライトを登録し、登録したラベルを返す
  function highlight({ p }) {
    const range = new Range();
    range.setStart(p, 0);
    range.setEnd(p, p.childNodes.length);

    const highlight = new Highlight(range);
    const label = `text-to-speech-${random()}`;
    CSS.highlights.set(label, highlight);

    // css for highlight
    document.styleSheets[0].insertRule(
      `
      ::highlight(${label}) {
        background-color: yellow;
      }
    `,
      0,
    );
    return label;
  }

  // 再生を始めた地点から、次が <p> か <ul> のときだけそのまま読み続ける
  // それ以外は飛ばす
  function next({ p }) {
    if (p.nextSibling === null) return;
    if (["P", "UL"].includes(p.nextSibling.nodeName) === false) {
      return next({ p: p.nextSibling });
    }
    speak({ p: p.nextSibling });
  }

  // <p> を渡すと再生を開始
  function speak({ p }) {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }

    const ssu = new SpeechSynthesisUtterance();
    ssu.lang = "ja-JP";
    ssu.rate = RATE;
    ssu.text = p.textContent;
    console.log(p.textContent);

    const label = highlight({ p });
    speechSynthesis.speak(ssu);

    ssu.on("end", (e) => {
      console.log(e);
      CSS.highlights.delete(label);
      next({ p });
    });
    ssu.on("error", (e) => {
      console.log(e);
      CSS.highlights.delete(label);
    });
  }

  function main() {
    // 再生対象の要素にクリックを貼る
    $$("p:not([translate=no]):is(:not(:is(header,footer,aside) *))").forEach(
      (p) => {
        p.on("click", () => {
          speak({ p });
        });
      },
    );

    // Speaker Icon を左上に表示
    const icon = document.createElement("span");
    icon.id = "jxck-text-to-speech-icon";
    icon.textContent = "🔈";
    document.styleSheets[0].insertRule(
      `
      #${icon.id} {
          display: block;
          position: fixed;
          top: 10;
          left: 10;
          font-size: 30px;
          line-height: 30px;
      }
    `,
      0,
    );
    document.body.appendChild(icon);
  }

  // ESC と Reload は停止
  window.on("keydown", (e) => {
    if (e.key === "Escape") {
      speechSynthesis.cancel();
    }
  });
  window.on("beforeunload", (e) => {
    speechSynthesis.cancel();
  });

  main();
}

// `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🔈</text></svg>`
