const head = document.head;
const script = document.createElement("script");
script.src = chrome.runtime.getURL("user_scripts/radiko-player.js");
head.appendChild(script);
