EventTarget.prototype.on = EventTarget.prototype.addEventListener

export default async function main(via = TRANSLATE_VIA.DEEPL) {
  console.log(via)

  const TRANSLATE_VIA = {
    GCP: "translate-via-gcp",
    DEEPL: "translate-via-deepl",
  }
  const encoder = new TextEncoder()

  const { deepl_auth_key, gcp_api_key, text_color } = await new Promise(
    (done, fail) => {
      chrome.storage.sync.get(
        ["deepl_auth_key", "gcp_api_key", "text_color"],
        ({ deepl_auth_key, gcp_api_key, text_color }) => {
          done({ deepl_auth_key, gcp_api_key, text_color })
        }
      )
    }
  )
  console.log({ text_color })

  const FULL_HALF =
    /(?<full>[\p{sc=Hira}\p{sc=Kana}\p{sc=Han}]+)(?<half>[\p{ASCII}]+)/gu
  const HALF_FULL =
    /(?<half>[\p{ASCII}]+)(?<full>[\p{sc=Hira}\p{sc=Kana}\p{sc=Han}]+)/gu
  function spacer(text) {
    return text
      .replaceAll(FULL_HALF, (all, left, right) => {
        return `${left} ${right}`
      })
      .replaceAll(HALF_FULL, (all, left, right) => {
        return `${left} ${right}`
      })
  }

  async function digestMessage(message) {
    const data = encoder.encode(message)
    const sha256 = await crypto.subtle.digest("SHA-256", data)
    const hash = btoa(String.fromCharCode(...new Uint8Array(sha256)))
    // console.log({ message, hash })
    return hash
  }

  async function translate_via_deepl(text) {
    console.log("fetch deepl api")
    const Endpoint = deepl_auth_key.endsWith(":fx")
      ? `https://api-free.deepl.com/v2/translate`
      : `https://api.deepl.com/v2/translate`
    const url = new URL(Endpoint)
    url.searchParams.set("text", text)
    url.searchParams.set("auth_key", deepl_auth_key)
    url.searchParams.set("free_api", false)
    url.searchParams.set("target_lang", "JA")

    const req = await fetch(url, { method: "post" })
    const { translations } = await req.json()
    const translated = translations.map(({ text }) => text).join(" ")
    return translated
  }

  async function translate_via_gcp(text) {
    console.log("fetch google translate api")
    const Endpoint = `https://translation.googleapis.com/language/translate/v2`
    const url = new URL(Endpoint)
    url.searchParams.set("q", text)
    url.searchParams.set("target", "ja")
    url.searchParams.set("format", "text")
    url.searchParams.set("source", "en")
    url.searchParams.set("model", "base")
    url.searchParams.set("key", gcp_api_key)
    const req = await fetch(url, {
      method: "post",
    })
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

  async function translate(text, via) {
    const hash = await digestMessage(text)
    const key = `${via}-${hash}`
    const cache = localStorage.getItem(key)
    if (cache) {
      // console.log("cache hit")
      return spacer(cache)
    }

    const translated = await (async () => {
      if (via === TRANSLATE_VIA.DEEPL) {
        return await translate_via_deepl(text)
      }
      if (via === TRANSLATE_VIA.GCP) {
        return await translate_via_gcp(text)
      }
    })()

    localStorage.setItem(key, translated)
    return spacer(translated)
  }

  function appendChild(target, node) {
    target.parentNode.insertBefore(node, target.nextSibling)
  }

  function traverse(via) {
    console.log("traverse")

    /** Pre Edit */

    // Inoreader
    if (location.host.endsWith("inoreader.com")) {
      // card view
      document
        .querySelectorAll(".article_tile_title a, .article_tile_content")
        .forEach(async (p) => {
          const text = p.textContent
          const translated = await translate(text, via)
          p.innerHTML += `<br><span style="color: ${text_color}">${translated}</span>`
        })
      document
        .querySelectorAll("div.article_tile, div.article_tile_content_wraper")
        .forEach((div) => {
          div.style.height = "600px"
        })

      // magazine view
      document
        .querySelectorAll(
          ".article_magazine_title a, .article_magazine_content"
        )
        .forEach(async (p) => {
          const text = p.textContent
          const translated = await translate(text, via)
          p.innerHTML += `<br><span style="color: ${text_color}">${translated}</span>`
        })
      document
        .querySelectorAll("div.article_magazine_picture")
        .forEach((div) => {
          div.style.height = "400px"
        })
      document
        .querySelectorAll("div.article_magazine_content")
        .forEach((div) => {
          div.style.overflow = "unset"
        })
      return
    }

    // 全ての <p> を翻訳し、下に <p> を作って追加
    //  header の下じゃない h1 は h1:not(header h1) のように指定する
    //  複数の場合は :is() で列挙する
    document
      .querySelectorAll(
        "p:not([translate=no]):is(:not(:is(header,footer,aside) *))"
      )
      .forEach(async (p) => {
        // console.log({p})
        const text = p.textContent
        const translated = await translate(text, via)
        const textNode = document.createElement("p")
        textNode.setAttribute("translate", "no")
        textNode.style.color = text_color
        textNode.textContent = translated
        console.log(textNode)
        appendChild(p, textNode)
      })

    // h2 ~ h6, li, th, td は、 <p> 追加ではなく <br> で追記
    document
      .querySelectorAll(
        ":is(h2, h3, h4, h5, h6, li, th, td):not([translate=no]):is(:not(:is(header, footer, aside) *))"
      )
      .forEach(async (h) => {
        if (h.children[0]?.nodeName !== "P") {
          const text = h.textContent
          const translated = await translate(text, via)
          h.innerHTML += `<br><span style="color: ${text_color}">${translated}</span>`
        }
      })

    // ML など、 pre で改行されてる文章を整形して翻訳する
    document
      .querySelectorAll("pre:not(:is(:has(code), div.highlight pre))")
      .forEach(async (pre) => {
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
            console.log({blockquote: section})
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
          const translated = (await translate(section, via))
            .replaceAll("\n ", "\n")
            .trim()
          console.log({ translated })

          const textNode = document.createElement("p")
          textNode.textContent = section
          pre.appendChild(textNode)

          const translatedNode = document.createElement("p")
          translatedNode.style.color = text_color
          translatedNode.textContent = translated
          pre.appendChild(translatedNode)
        }
      })

    /** Post Edit */

    // Chromium
    if (location.host === "bugs.chromium.org") {
      function queryShadow([head, ...tail], host = document) {
        return Array.from(host.querySelectorAll(head)).flatMap((e) => {
          if (e.shadowRoot) {
            return queryShadow(tail, e.shadowRoot)
          }
          return e
        })
      }

      queryShadow([
        "mr-comment-list",
        "mr-comment",
        "mr-comment-content",
        "span",
      ]).forEach(async (span) => {
        console.log(span)
        const text = span.textContent
        const translated = await translate(text, via)
        span.innerHTML += `<br>${translated}`
      })

      queryShadow(["mr-description", "mr-comment-content", "span"]).forEach(
        async (span) => {
          console.log(span)
          const text = span.textContent
          const translated = await translate(text, via)
          span.innerHTML += `<br>${translated}`
        }
      )
    }
  }
  traverse(via)
}