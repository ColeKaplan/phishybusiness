import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, Users, ShieldAlert } from 'lucide-react';
import StatCard from './StatCard';
const data = [
  { year: '2019', value: 1.5 },
  { year: '2020', value: 2.1 },
  { year: '2021', value: 2.8 },
  { year: '2022', value: 3.3 },
  { year: '2023', value: 3.9 },
];

interface StatsSectionProps {
  showCards?: boolean;
  showChart?: boolean;
}

const StatsSection = ({ showCards = true, showChart = true }: StatsSectionProps) => {
  return (
    <div className="space-y-8">
      {showCards && (
        <div className="grid grid-cols-1 gap-[.7rem]">
          <StatCard
            title="Annual Losses"
            value="> $1 Trillion"
            icon={<DollarSign className="animate-pulse" />}
            description="Total losses to phone scams in 2024 - Global Anti-Scam Alliance"
          />
          <StatCard
            title="Victims"
            value="21%"
            icon={<Users className="animate-pulse" />}
            description="Americans That Fell For A Scam Call in 2023 - U.S. Spam and Scam Report"
          />
          <StatCard
            title="The Most Vulnerable"
            value="$33,915"
            icon={<ShieldAlert className="animate-pulse" />}
            description="Average loss from victims 60+ years of age - FBI&apos;s IC3"
          />
        </div>
      )}
    </div>
  );
};

export default StatsSection; 