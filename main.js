export async function main(mode = MODE.DEFAULT) {
  EventTarget.prototype.on = EventTarget.prototype.addEventListener
  const $ = document.querySelector.bind(document)
  const $$ = document.querySelectorAll.bind(document)

  const MODE = {
    GCP: "translate-via-gcp",
    DEEPL: "translate-via-deepl",
    CLEAR: "clear-translate",
    DEFAULT: "default",
    DIALOG: "dialog",
  }

  if (mode === MODE.CLEAR) return clear()

  const PLUGINS = {
    "www.inoreader.com": () => {
      // magazine view
      $$(".article_magazine_content").forEach(async ($div) => {
        const text = $div.textContent
        const $p = document.createElement("p")
        $p.textContent = text
        $div.textContent = ""
        $div.appendChild($p)
        $div.style = "display: block; overflow: unset;"
      })
      $$(".article_magazine_picture").forEach((div) => {
        div.style.height = "400px"
      })
      return
    }
  }

  function clear() {
    localStorage.clear()
  }

  function spacer(text) {
    const FULL_HALF =
      /(?<full>[\p{sc=Hira}\p{sc=Kana}\p{sc=Han}]+)(?<half>[\p{ASCII}]+)/gu
    const HALF_FULL =
      /(?<half>[\p{ASCII}]+)(?<full>[\p{sc=Hira}\p{sc=Kana}\p{sc=Han}]+)/gu
    return text
      .replaceAll(FULL_HALF, (all, left, right) => `${left} ${right}`)
      .replaceAll(HALF_FULL, (all, left, right) => `${left} ${right}`)
  }

  async function digestMessage(message) {
    const data = encoder.encode(message)
    const sha256 = await crypto.subtle.digest("SHA-256", data)
    const hash = btoa(String.fromCharCode(...new Uint8Array(sha256)))
    return hash
  }

  async function translate_via_deepl(text, auth_key) {
    console.log("fetch deepl api")
    const Endpoint = auth_key.endsWith(":fx")
      ? `https://api-free.deepl.com/v2/translate`
      : `https://api.deepl.com/v2/translate`
    const url = new URL(Endpoint)
    url.searchParams.set("text", text)
    url.searchParams.set("auth_key", auth_key)
    url.searchParams.set("free_api", false)
    url.searchParams.set("target_lang", "JA")

    const req = await fetch(url, { method: "post" })
    const { translations } = await req.json()
    const translated = translations.map(({ text }) => text).join(" ")
    return translated
  }

  async function translate_via_gcp(text, auth_key) {
    console.log("fetch google translate api")
    const Endpoint = `https://translation.googleapis.com/language/translate/v2`
    const url = new URL(Endpoint)
    url.searchParams.set("q", text)
    url.searchParams.set("target", "ja")
    url.searchParams.set("format", "text")
    url.searchParams.set("source", "en")
    url.searchParams.set("model", "base")
    url.searchParams.set("key", auth_key)
    const req = await fetch(url, { method: "post" })
    const { data } = await req.json()
    const translated = data.translations
      .map(({ translatedText }) => {
        return translatedText.replaceAll(/[！-～]/g, (c) =>
          String.fromCharCode(c.charCodeAt(0) - 0xfee0)
        )
      })
      .join(" ")
    return translated
  }

  async function translate(text, options) {
    const key = await digestMessage(text)
    const cache = localStorage.getItem(key)
    if (cache) {
      // console.log("cache hit")
      return spacer(cache)
    }

    const translated = await (async () => {
      if (options.gcp_api_key) {
        return await translate_via_gcp(text, options.gcp_api_key)
      }
      return await translate_via_deepl(text, options.deepl_auth_key)
    })()

    localStorage.setItem(key, translated)
    return spacer(translated)
  }

  function appendChild(target, node) {
    target.parentNode.insertBefore(node, target.nextSibling)
  }

  function traverse(mode, options) {
    console.log("traverse")

    /** Pre Edit */
    PLUGINS[location.host]()

    // 全ての <p> を翻訳し、下に <p> を作って追加
    //  header の下じゃない h1 は h1:not(header h1) のように指定する
    //  複数の場合は :is() で列挙する
    $$("p:not([translate=no]):is(:not(:is(header,footer,aside) *))").forEach(
      async (p) => {
        // console.log({p})
        const text = p.textContent
        const translated = await translate(text, options)
        const textNode = document.createElement("p")
        textNode.setAttribute("translate", "no")
        textNode.style.color = options.text_color
        textNode.textContent = translated
        appendChild(p, textNode)
      }
    )

    // h2 ~ h6, li, th, td は、 <p> 追加ではなく <br> で追記
    $$(
      ":is(h2, h3, h4, h5, h6, li, th, td):not([translate=no]):is(:not(:is(header, footer, aside) *))"
    ).forEach(async (h) => {
      if (h.children[0]?.nodeName !== "P") {
        const text = h.textContent
        const translated = await translate(text, options)
        h.innerHTML += `<br><span style="color: ${options.text_color}">${translated}</span>`
      }
    })

    if (mode === MODE.DIALOG) {
      // ML など、 pre で改行されてる文章を整形して翻訳する
      $$("pre:not(:is(:has(code), div.highlight pre))").forEach(async (pre) => {
        const textContent = pre.textContent

        // 段落で分割する
        const sections = textContent.split("\n\n").map((section) => {
          // セクションを整形
          console.log({ section })

          // 引用 `>` で始まっているかを確認
          if (section.startsWith("> ")) {
            // そのセクション全部の `>` を消して一文に連結
            // 文頭の `>` のみ残す
            // `>>` となってる場合は失敗するがよし
            section = section.replaceAll("\n>")
            console.log({ blockquote: section })
          }

          // 一行に繋ぐ
          section = section
            .replaceAll("\n", " ")
            .replaceAll(".  ", ".\n")
            .replaceAll("\n ", "\n")
            .trim()
          console.log({ section })
          return section
        })

        pre.innerHTML = ""

        // セクションごとに翻訳
        for await (const section of sections) {
          const translated = (await translate(section, options))
            .replaceAll("\n ", "\n")
            .trim()
          console.log({ translated })

          const textNode = document.createElement("p")
          textNode.textContent = section
          pre.appendChild(textNode)

          const translatedNode = document.createElement("p")
          translatedNode.style.color = options.text_color
          translatedNode.textContent = translated
          pre.appendChild(translatedNode)
        }
      })
    }
  }

  const encoder = new TextEncoder()
  const { promise, resolve } = Promise.withResolvers()
  chrome.storage.sync.get(
    ["deepl_auth_key", "gcp_api_key", "text_color"],
    resolve
  )
  const options = await promise
  traverse(mode, options)
}
