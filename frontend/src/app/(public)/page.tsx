import React from 'react';
import { Hero } from '@/components/home/hero';
import { Programs } from '@/components/home/programs';
import { WhyGymmaster } from '@/components/home/why-gymmaster';
import { Cta } from '@/components/home/cta';

export default function PublicHomePage() {
  return (
    <div className="overflow-x-hidden">
      <Hero />
      <Programs />
      <WhyGymmaster />
      <Cta />
    </div>
  );
}
