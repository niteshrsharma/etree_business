import React from "react";
import Hero from "./components/Hero";
import Navbar from "./components/Navbar";
import Services from "./components/Services";
import HowItWorks from "./components/HowItWorks";
import Footer from "./components/Footer";


export default function App() {
  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900 overflow-x-hidden font-sans">
      <Navbar />


      {/* Main content wrapper with consistent max-width */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20">
        <Hero />
        <Services />
        <HowItWorks />
      </main>


      <Footer />
    </div>
  );
}