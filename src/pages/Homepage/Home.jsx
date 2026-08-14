import { useEffect } from "react";
import Hero from "./components/Hero";
import About from "./components/About";
import Maps from "./components/Map";
import DashboardPemantauan from "./components/DashboardPemantauan";
import FAQ from "./components/FAQ";


export default function Home() {
  useEffect(() => {
    document.title = "SIGIZI - Transparansi Program MBG";
  }, []);

  return (
    <div style={{ fontFamily: "'Public Sans', sans-serif" }}>
      <Hero />
      <About />
      <Maps />
      <DashboardPemantauan />
      <FAQ />
    </div>
  );
}
