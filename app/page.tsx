import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import About from "@/components/landing/About";
import FAQ from "@/components/landing/FAQ";
import Features from "@/components/landing/Features";
import Footer from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <main>
      <Header />
      <Hero />
      <About />
      <FAQ />
      <Features />
      <Footer />
    </main>
  );
}
