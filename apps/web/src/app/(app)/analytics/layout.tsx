import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Analytics | HabitFlow',
  description: 'View your habit tracking analytics and trends.',
};

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}