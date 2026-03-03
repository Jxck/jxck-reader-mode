EventTarget.prototype.on = EventTarget.prototype.addEventListener;
const $ = document.querySelector.bind(document);

document.addEventListener("DOMContentLoaded", (e) => {
  chrome.storage.sync.get(
    ["deepl_auth_key", "text_color", "translate_limit", "speech_speed"],
    ({ deepl_auth_key, text_color, translate_limit, speech_speed }) => {
      if (deepl_auth_key) {
        $("#deepl_auth_key").value = deepl_auth_key;
      }
      if (text_color) {
        $("#text_color").value = text_color;
      }
      if (translate_limit) {
        $("#translate_limit").value = translate_limit;
      }
      if (speech_speed) {
        $("#speech_speed").value = speech_speed;
        $("output.speech_speed").textContent = speech_speed;
      }
    },
  );
});

$("#options").on("submit", (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const deepl_auth_key = fd.get("deepl_auth_key");
  const text_color = fd.get("text_color");
  const translate_limit = Number(fd.get("translate_limit"));
  const speech_speed = fd.get("speech_speed");
  chrome.storage.sync.set({
    deepl_auth_key,
    text_color,
    translate_limit,
    speech_speed,
  });
});

$("input[type=range]").on("change", (e) => {
  $("output.speech_speed").textContent = e.target.value;
});
