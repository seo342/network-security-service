import HeroSection from "@/components/landing/HeroSection"           // Hero 영역
import FeaturesSection from "@/components/landing/FeaturesSection"   // 기능 소개 영역
import ArchitectureSection from "@/components/landing/ArchitectureSection" // 아키텍처 다이어그램
import CtaSection from "@/components/landing/CtaSection"             // 마지막 CTA 영역

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection/>
      <FeaturesSection/>
      <ArchitectureSection/>
      <CtaSection/>
    </div>
  )
}
