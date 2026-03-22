import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Goals | HabitFlow',
  description: 'Manage and track all your goals.',
};

export default function GoalsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}