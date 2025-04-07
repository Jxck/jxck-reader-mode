export async function text_to_speech() {
  EventTarget.prototype.on = EventTarget.prototype.addEventListener;
  const $ = document.querySelector.bind(document);
  const $$ = document.querySelectorAll.bind(document);



  function random() {
    return btoa(Math.random()).substring(0, 10)
  }
  function highlight({p}) {
    const range = new Range();
    range.setStart(p, 0);
    range.setEnd(p, p.childNodes.length);

    const highlight = new Highlight(range);
    const label = `text-to-speech-${random()}`
    CSS.highlights.set(label, highlight);

    // css for highlight
    document.styleSheets[0].insertRule(`
      ::highlight(${label}) {
        background-color: yellow;
      }
    `, 0);
    return label
  }

  function next({p}) {
    if (p.nextSibling === null) return
    if (["P", "UL"].includes(p.nextSibling.nodeName) === false) {
      return next({p: p.nextSibling})
    }
    speak({p: p.nextSibling})
  }

  function speak({p}) {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel()
    }

    const ssu = new SpeechSynthesisUtterance()
    ssu.lang = "ja-JP"
    ssu.rate = 3
    ssu.text = p.textContent
    console.log(p.textContent)

    const label = highlight({p})
    speechSynthesis.speak(ssu)

    ssu.on("end", (e) => {
      console.log(e)
      CSS.highlights.delete(label)
      next({p})
    })
    ssu.on("error", (e) => {
      console.log(e)
      CSS.highlights.delete(label)
    })
  }

  $$("p:not([translate=no]):is(:not(:is(header,footer,aside) *))").forEach(
    async (p) => {
      p.on("click", () => {
        speak({p})
      })
    },
  );

  window.on("keydown", (e) => {
    if (e.key === "Escape") {
      speechSynthesis.cancel()
    }
  })
}