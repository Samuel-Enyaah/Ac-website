import HeroSection from "../components/home/HeroSection";
import ServicesSection from "../components/home/ServicesSection";
import FeaturedProductsSection from "../components/home/FeaturedProductsSection";
import WhyChooseUs from "../components/home/WhyChooseUs";
import SolutionsSection from "../components/home/SolutionsSection";
import HomeCTA from "../components/home/HomeCTA";

export default function Home() {
  return (
    <>
      <HeroSection />
      <ServicesSection />
      <FeaturedProductsSection />
      <WhyChooseUs />
      <SolutionsSection />
      <HomeCTA />
    </>
  );
}