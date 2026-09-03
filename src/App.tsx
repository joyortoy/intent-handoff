import { useEffect } from "react";
import { registerWebMcpTools } from "./webmcp/register";
import { DebugPanel } from "./components/DebugPanel";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Preferences } from "./components/Preferences";
import { SearchBar } from "./components/SearchBar";
import { TripPanel } from "./components/TripPanel";
import { isDebug, isDemo } from "./flags";

export default function App() {
  useEffect(() => {
    void registerWebMcpTools();
  }, []);

  return (
    <div className={`page ${isDemo() ? "is-demo" : ""}`}>
      <Header />
      <Hero />
      <SearchBar />
      <div className="stage">
        <div className="stage-main">
          <Preferences />
          <section className="how" id="how">
            <h2>How it works</h2>
            <p className="how-sub">Choose what matters. JoyRelay handles the rest.</p>
            <ol>
              <li>
                <strong>Choose what matters</strong>
                <span>Budget, transit, arrival, and style become your trip.</span>
              </li>
              <li>
                <strong>Hand it to JoyRelay</strong>
                <span>We compare stays against exactly what you selected.</span>
              </li>
              <li>
                <strong>Change one thing</strong>
                <span>Update a budget. Everything else stays with you.</span>
              </li>
            </ol>
          </section>
        </div>
        <TripPanel />
      </div>
      {isDebug() ? <DebugPanel /> : null}
    </div>
  );
}
