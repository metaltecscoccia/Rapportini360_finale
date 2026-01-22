import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  gradientFrom: string;
  gradientTo: string;
  onClick: () => void;
  delay?: number;
}

export default function QuickActionCard({
  title,
  description,
  icon: Icon,
  gradientFrom,
  gradientTo,
  onClick,
  delay = 0,
}: QuickActionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <button
        onClick={onClick}
        className={cn(
          "w-full text-left relative overflow-hidden rounded-xl p-3",
          "transition-all duration-300 ease-out",
          "hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "group"
        )}
        style={{
          background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`,
        }}
      >
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300" />

        <div className="relative z-10 flex items-center justify-between gap-3">
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-white mb-0.5">{title}</h3>
            <p className="text-xs text-white/80">{description}</p>
          </div>

          {/* Icon on the right */}
          <div className="flex-shrink-0">
            <div className="inline-flex p-2 rounded-lg bg-white/20 backdrop-blur-sm">
              <Icon className="h-5 w-5 text-white" />
            </div>
          </div>

          {/* Arrow indicator */}
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
            <svg
              className="h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </div>
        </div>
      </button>
    </motion.div>
  );
}
