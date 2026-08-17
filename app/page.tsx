export default function LandingPage() {
  return (
    <main className="choice-landing" aria-label="Choose where your journey begins">
      <div
        className="choice-world-stage"
        role="img"
        aria-label="A glowing Earth and a luminous brain floating in darkness"
      >
        <img className="choice-world-layer choice-world-earth" src="/media/brain-earth.jpg" alt="" />
        <img className="choice-world-layer choice-world-brain" src="/media/brain-earth.jpg" alt="" />
      </div>
      <div className="choice-vignette" aria-hidden="true" />

      <p className="choice-kicker">
        <span>I&apos;m genuinely skitzofrenic</span>
      </p>

      <a className="choice-portal choice-portal-earth" href="#planet-urf" aria-label="Enter through Planet Urf">
        <strong>Planet Urf</strong>
        <small>reality phisico</small>
      </a>

      <a
        className="choice-portal choice-portal-brain"
        href="/bongo"
        aria-label="Enter through that fucking other thing"
      >
        <strong>that fucking other thing</strong>
        <small>Enter the unknown</small>
      </a>
    </main>
  );
}
