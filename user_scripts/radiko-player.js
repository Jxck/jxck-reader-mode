function main() {
  function move(delta) {
    const playBackRate = player._player._audio.playbackRate;

    const $url = document.querySelector("#url");
    const url = new URL($url.value);
    const seek = url.searchParams.get("seek");
    const update = moment(seek, "YYYYMMDDHHmmss")
      .add(delta, "s")
      .format("YYYYMMDDHHmmss");
    url.searchParams.set("seek", update);
    play(url.toString());

    setTimeout(() => {
      player._player._audio.playbackRate = playBackRate;
      console.log(player._player._audio.playbackRate);
    }, 1000);
  }

  const $share = document.querySelector(".btn--share");
  $share.textContent = "-20";
  $share.onclick = (e) => {
    e.stopPropagation();
    move(-20);
  };

  const $tooltip = document.querySelector(".btn--tooltip");
  $tooltip.textContent = "+60";
  $tooltip.onclick = (e) => {
    e.stopPropagation();
    move(60);
  };
  document.querySelector(".btn--tooltip + .tooltip").remove();

  const url = new URL(
    document.querySelector('meta[property="og:url"]').content,
  );
  const search = url.searchParams;
  const t = search.get("t");
  const [all, year, month, day, _id] = t.match(/(\d{4})(\d{2})(\d{2})(\d{6})/);
  const date = new Date(year, month - 1, day);
  const id = parseInt(_id);

  function format(date, id) {
    const yyyy = date.getFullYear();
    const mm = (date.getMonth() + 1).toString().padStart(2, "0");
    const dd = date.getDate().toString().padStart(2, "0");
    return `${yyyy}${mm}${dd}${id}`;
  }

  url.searchParams.set("t", format(date, id - 10000));
  const prevURL = url.toString();

  url.searchParams.set("t", format(date, id + 10000));
  const nextURL = url.toString();

  date.setDate(date.getDate() - 1);
  url.searchParams.set("t", format(date, id));
  const prevDayURL = url.toString();

  date.setDate(date.getDate() + 2);
  url.searchParams.set("t", format(date, id));
  const nextDayURL = url.toString();

  const prev = document.createElement("a");
  prev.href = prevURL;
  prev.style.display = "block";
  prev.style.textAlign = "left";
  prev.textContent = "prev";
  document.querySelector(".live-detail__share").appendChild(prev);

  const prevDay = prev.cloneNode();
  prevDay.textContent = "prevDay";
  prevDay.href = prevDayURL;
  document.querySelector(".live-detail__share").appendChild(prevDay);

  const down = prev.cloneNode();
  down.textContent = "<<<";
  down.href = "#";
  document.querySelector(".live-detail__share").appendChild(down);

  const next = document.createElement("a");
  next.href = nextURL;
  next.style.display = "block";
  next.style.textAlign = "right";
  next.textContent = "next";
  document.querySelector(".live-detail__noti").appendChild(next);

  const nextDay = next.cloneNode();
  nextDay.textContent = "nextDay";
  nextDay.href = nextDayURL;
  document.querySelector(".live-detail__noti").appendChild(nextDay);

  const up = next.cloneNode();
  up.textContent = ">>>";
  up.href = "#";
  document.querySelector(".live-detail__noti").appendChild(up);

  up.onclick = (e) => {
    e.preventDefault();
    player._player._audio.playbackRate += 0.1;
    console.log(player._player._audio.playbackRate);
  };
  down.onclick = (e) => {
    e.preventDefault();
    player._player._audio.playbackRate -= 0.1;
    console.log(player._player._audio.playbackRate);
  };
}

// window.$.Radiko.EventEmitter.once("radikoready", (e) => {
//   console.log("radikoready", e);
// });
// window.$.Radiko.EventEmitter.once("removeview", (e) => {
//   console.log("removeview", e);
// });

window.addEventListener("load", (e) => {
  console.log(e.type);
  setTimeout(main, 1000);
});
window.addEventListener("hashchange", (e) => {
  console.log(e.type);
  setTimeout(main, 1000);
});
window.addEventListener("popstate", (e) => {
  console.log(e.type);
  setTimeout(main, 1000);
});
