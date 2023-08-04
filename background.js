async function main(via = TRANSLATE_VIA.GCP) {
  const TRANSLATE_VIA = {
    GCP: "translate-via-gcp",
    DEEPL: "translate-via-deepl",
  }

  console.log(via)
  EventTarget.prototype.on = EventTarget.prototype.addEventListener
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
    const Endpoint = `https://api.deepl.com/v2/translate`
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

    // Pre Edit
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

    if (location.host === "developer.mozilla.org") {
      document.querySelector("header").remove()
    }

    document
      .querySelectorAll(
        ":not(header):not(footer):not(aside):not(.repository-container-header) p:not([translate=no])"
      )
      .forEach(async (p) => {
        // console.log({p})
        const text = p.textContent
        const translated = await translate(text, via)
        const textNode = document.createElement("p")
        textNode.setAttribute("translate", "no")
        console.log({ text_color })
        textNode.style.color = text_color
        textNode.textContent = translated
        console.log(textNode)
        appendChild(p, textNode)
      })

    document
      .querySelectorAll(
        ":not(header):not(footer):not(aside) :is(h2, h3, h4, h5, h6, li, th, td):not([translate=no])"
      )
      .forEach(async (h) => {
        if (h.children[0]?.nodeName !== "P") {
          const text = h.textContent
          const translated = await translate(text, via)
          h.innerHTML += `<br><span style="color: ${text_color}">${translated}</span>`
        }
      })

    document.querySelectorAll("pre").forEach(async (pre) => {
      const textContent = pre.textContent
      const lines = textContent.split("\n\n")

      pre.innerHTML = ""
      for await (const line of lines) {
        console.log({ line })

        const text = line
          .replaceAll("\n", " ")
          .replaceAll(".  ", ".\n")
          .replaceAll("\n ", "\n")
          .trim()
        console.log({ text })

        const translated = (await translate(text, via))
          .replaceAll("\n ", "\n")
          .trim()
        console.log({ translated })

        const textNode = document.createElement("p")
        textNode.textContent = text
        pre.appendChild(textNode)

        const translatedNode = document.createElement("p")
        translatedNode.style.color = text_color
        translatedNode.textContent = translated
        pre.appendChild(translatedNode)
      }
    })

    // Post Edit
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

const TRANSLATE_VIA = {
  GCP: "translate-via-gcp",
  DEEPL: "translate-via-deepl",
}

const updateContextMenus = async () => {
  await chrome.contextMenus.removeAll()
  chrome.contextMenus.create({
    id: TRANSLATE_VIA.GCP,
    title: "translate via gcp",
    contexts: ["all"],
  })
  chrome.contextMenus.create({
    id: TRANSLATE_VIA.DEEPL,
    title: "translate via deepl",
    contexts: ["all"],
  })
}

chrome.runtime.onInstalled.addListener(updateContextMenus)
chrome.runtime.onStartup.addListener(updateContextMenus)
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const id = info.menuItemId

  if (id === TRANSLATE_VIA.DEEPL) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: main,
      args: [TRANSLATE_VIA.DEEPL],
    })
  }

  if (id === TRANSLATE_VIA.GCP) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: main,
      args: [TRANSLATE_VIA.GCP],
    })
  }
})

chrome.action.onClicked.addListener((tab) => {
  console.log(tab)
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: main,
    args: [TRANSLATE_VIA.GCP],
  })
})
