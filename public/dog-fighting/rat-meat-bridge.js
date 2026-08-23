(() => {
  const rewardMessage = {
    type: "trip-rat-meat-earned",
    amount: 1,
    source: "dog-fight-round-win",
  };
  let lastRoundBanner = "";

  const text = (element) => element?.textContent?.trim() ?? "";

  function checkRoundResult() {
    const paragraphs = Array.from(document.querySelectorAll("p"));
    const roundBanner = paragraphs.find((element) => / TAKES THE ROUND$/.test(text(element)));

    if (!roundBanner) {
      lastRoundBanner = "";
      return;
    }

    const result = text(roundBanner);
    if (!result || result === lastRoundBanner) return;
    lastRoundBanner = result;

    const playerName = paragraphs.find((element) => {
      const classes = element.className;
      return typeof classes === "string" && classes.includes("tracking-wide") && classes.includes("font-display");
    });

    const name = text(playerName);
    if (name && result === `${name} TAKES THE ROUND`) {
      window.top?.postMessage(rewardMessage, window.location.origin);
    }
  }

  const start = () => {
    checkRoundResult();
    new MutationObserver(checkRoundResult).observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
