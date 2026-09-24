import React from 'react';
import { Hero } from '@/components/home/hero';
import { Programs } from '@/components/home/programs';
import { WeeklySchedule } from '@/components/home/weekly-schedule';
import { ProgressDashboard } from '@/components/home/progress-dashboard';
import { FeaturedArticle } from '@/components/home/featured-article';
import { Cta } from '@/components/home/cta';

export default function PublicHomePage() {
  return (
    <div className="overflow-x-hidden">
      <Hero />
      <Programs />
      <WeeklySchedule />
      <ProgressDashboard />
      <FeaturedArticle />
      <Cta />
    </div>
  );
}
