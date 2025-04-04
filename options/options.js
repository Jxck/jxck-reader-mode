EventTarget.prototype.on = EventTarget.prototype.addEventListener;
const $ = document.querySelector.bind(document);

document.addEventListener("DOMContentLoaded", (e) => {
  chrome.storage.sync.get(["deepl_auth_key", "text_color"], ({ deepl_auth_key, text_color }) => {
      console.log({ deepl_auth_key });
      if (deepl_auth_key) {
        $("#deepl_auth_key").value = deepl_auth_key;
      }
      if (text_color) {
        $("text_color").value = text_color;
      }
    },
  );
});

$("#options").on("submit", (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const deepl_auth_key = fd.get("deepl_auth_key");
  const text_color = fd.get("text_color");
  chrome.storage.sync.set({ deepl_auth_key, text_color });
});
