import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | HabitFlow',
  description: 'View your weekly habit summary and progress.',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}