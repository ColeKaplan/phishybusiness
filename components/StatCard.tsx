import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  description: string;
}

const StatCard = ({ title, value, icon, description }: StatCardProps) => {
  const colorMap = {
    rose: 'from-rose-50 to-transparent hover:shadow-rose-200/50',
    amber: 'from-amber-50 to-transparent hover:shadow-amber-200/50',
    emerald: 'from-emerald-50 to-transparent hover:shadow-emerald-200/50'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="relative p-6 rounded-xl backdrop-blur-xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300"
    >
      <div className={`absolute inset-0 rounded-xl bg-gradient-to-br from-primary/10 to-transparent`}></div>
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <h3 className="text-3xl font-bold mt-2 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">{value}</h3>
        </div>
        <div className="text-2xl">{icon}</div>
      </div>
      <p className="mt-3 text-sm text-gray-600" style={{ whiteSpace: "pre-line" }}>{description}</p>
    </motion.div>
  );
};

export default StatCard; 