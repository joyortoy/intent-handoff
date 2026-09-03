import { HandoffButton } from "./HandoffButton";

export function Header() {
  return (
    <header className="topbar">
      <a className="wordmark" href="#find">
        <span className="mark" aria-hidden="true" />
        JoyRelay
      </a>
      <nav className="nav">
        <a href="#find">Find Hotels</a>
        <a href="#trip">My Trips</a>
        <a href="#how">How it works</a>
      </nav>
      <div className="top-actions">
        <span className="catalog-chip">Demo Catalog</span>
        <HandoffButton compact />
      </div>
    </header>
  );
}
