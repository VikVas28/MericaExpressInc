export default function Nav() {
  return (
    <nav className="nav" id="nav">
      <a className="brand" href="#top" data-cursor data-goto="#top"><span className="mk" />MERICA EXPRESS</a>
      <div className="nav__links">
        <a href="#services" className="hide-sm" data-cursor data-goto="#services">Services</a>
        <a href="#coverage" className="hide-sm" data-cursor data-goto="#coverage">Coverage</a>
        <a href="#fleet" className="hide-sm" data-cursor data-goto="#fleet">Fleet</a>
        <a href="#drivers" className="hide-sm" data-cursor data-goto="#drivers">Drive With Us</a>
        <a href="#contact" className="btn btn--acc" data-cursor data-goto="#contact">Get a Quote
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </a>
      </div>
    </nav>
  );
}
