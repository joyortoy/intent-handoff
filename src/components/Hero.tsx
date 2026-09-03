export function Hero() {
  return (
    <section className="hero" aria-label="Tokyo">
      <img className="hero-photo" src="/media/tokyo-hero.jpg" alt="Tokyo at dusk" />
      <div className="hero-shade" />
      <div className="hero-copy">
        <p className="hero-kicker">Find a stay that fits the way you travel</p>
        <h1>Find your perfect stay in Tokyo</h1>
        <p className="hero-sub">
          Tell us what matters to you.
          <br />
          We’ll handle the rest.
        </p>
      </div>
    </section>
  );
}
