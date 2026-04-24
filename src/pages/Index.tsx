import { motion, Variants } from 'framer-motion';
import { PageLayout } from '@/components/layout/PageLayout';
import { HeroSection } from '@/components/dashboard/HeroSection';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { NewsHighlights } from '@/components/dashboard/NewsHighlights';
import { MatchOfTheMatch } from '@/components/dashboard/MatchOfTheMatch';
import { TopScorers } from '@/components/dashboard/TopScorers';
import { NextMatchCountdown } from '@/components/dashboard/NextMatchCountdown';

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0
  }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
};

const Index = () => {
  return (
    <PageLayout hideHeader>
      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-6 pb-4"
      >
        {/* Hero Section with Logo and Stats */}
        <motion.div 
          variants={sectionVariants}
          transition={{ duration: 0.6 }}
        >
          <HeroSection />
        </motion.div>

        {/* Quick Stats Cards */}
        <motion.div 
          variants={sectionVariants}
          transition={{ duration: 0.6 }}
        >
          <QuickStats />
        </motion.div>

        {/* Next Match Countdown - Full Width Featured */}
        <motion.section 
          variants={sectionVariants}
          transition={{ duration: 0.6 }}
        >
          <NextMatchCountdown />
        </motion.section>

        {/* News Highlights */}
        <motion.section 
          variants={sectionVariants}
          transition={{ duration: 0.6 }}
        >
          <NewsHighlights />
        </motion.section>

        {/* MOTM and Top Scorers Grid */}
        <motion.div 
          variants={sectionVariants}
          transition={{ duration: 0.6 }}
          className="grid gap-4 lg:grid-cols-2"
        >
          <MatchOfTheMatch />
          <TopScorers />
        </motion.div>
      </motion.div>
    </PageLayout>
  );
};

export default Index;
