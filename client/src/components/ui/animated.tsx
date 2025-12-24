import { motion, AnimatePresence, Variants } from "framer-motion";
import { forwardRef, ReactNode } from "react";
import { Button, ButtonProps } from "./button";
import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";

const buttonVariants: Variants = {
  initial: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 },
};

const successVariants: Variants = {
  initial: { scale: 0, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: { type: "spring", stiffness: 500, damping: 30 }
  },
  exit: { scale: 0, opacity: 0 }
};

interface AnimatedButtonProps extends ButtonProps {
  isLoading?: boolean;
  isSuccess?: boolean;
  children: ReactNode;
}

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ isLoading, isSuccess, children, className, disabled, ...props }, ref) => {
    return (
      <motion.div
        variants={buttonVariants}
        initial="initial"
        whileHover={!disabled && !isLoading ? "hover" : undefined}
        whileTap={!disabled && !isLoading ? "tap" : undefined}
        className="inline-flex"
      >
        <Button
          ref={ref}
          className={cn("relative overflow-hidden", className)}
          disabled={disabled || isLoading}
          {...props}
        >
          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.span
                key="success"
                variants={successVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                Fatto!
              </motion.span>
            ) : isLoading ? (
              <motion.span
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                Caricamento...
              </motion.span>
            ) : (
              <motion.span
                key="default"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                {children}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>
    );
  }
);

AnimatedButton.displayName = "AnimatedButton";

const fadeInVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" }
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: { duration: 0.2 }
  }
};

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function FadeIn({ children, className, delay = 0 }: FadeInProps) {
  return (
    <motion.div
      variants={fadeInVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
};

interface AnimatedListProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedList({ children, className }: AnimatedListProps) {
  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface AnimatedListItemProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedListItem({ children, className }: AnimatedListItemProps) {
  return (
    <motion.div variants={staggerItemVariants} className={className}>
      {children}
    </motion.div>
  );
}

const pageTransitionVariants: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.3, ease: "easeOut" }
  },
  exit: { 
    opacity: 0, 
    x: -20,
    transition: { duration: 0.2 }
  }
};

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      variants={pageTransitionVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  );
}

const cardHoverVariants: Variants = {
  initial: { scale: 1, y: 0 },
  hover: { 
    scale: 1.01, 
    y: -2,
    transition: { type: "spring", stiffness: 400, damping: 25 }
  },
  tap: { scale: 0.99 }
};

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

export function AnimatedCard({ children, className, onClick, interactive = true }: AnimatedCardProps) {
  return (
    <motion.div
      variants={interactive ? cardHoverVariants : undefined}
      initial="initial"
      whileHover={interactive ? "hover" : undefined}
      whileTap={interactive && onClick ? "tap" : undefined}
      onClick={onClick}
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        interactive && "cursor-pointer",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

const pulseVariants: Variants = {
  initial: { scale: 1 },
  pulse: {
    scale: [1, 1.05, 1],
    transition: { duration: 0.3 }
  }
};

interface PulseOnChangeProps {
  children: ReactNode;
  trigger: any;
  className?: string;
}

export function PulseOnChange({ children, trigger, className }: PulseOnChangeProps) {
  return (
    <motion.div
      key={trigger}
      variants={pulseVariants}
      initial="initial"
      animate="pulse"
      className={className}
    >
      {children}
    </motion.div>
  );
}

const spinVariants: Variants = {
  initial: { rotate: 0 },
  spin: { 
    rotate: 180,
    transition: { duration: 0.3, ease: "easeInOut" }
  }
};

interface AnimatedIconProps {
  children: ReactNode;
  isOpen?: boolean;
  className?: string;
}

export function AnimatedChevron({ children, isOpen, className }: AnimatedIconProps) {
  return (
    <motion.div
      animate={{ rotate: isOpen ? 180 : 0 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 100, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      type: "spring",
      stiffness: 300,
      damping: 30
    }
  },
  exit: { 
    opacity: 0, 
    y: 50, 
    scale: 0.95,
    transition: { duration: 0.2 }
  }
};

interface SlideUpProps {
  children: ReactNode;
  className?: string;
  isVisible?: boolean;
}

export function SlideUp({ children, className, isVisible = true }: SlideUpProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={slideUpVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const skeletonPulse: Variants = {
  initial: { opacity: 0.5 },
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

interface AnimatedSkeletonProps {
  className?: string;
}

export function AnimatedSkeleton({ className }: AnimatedSkeletonProps) {
  return (
    <motion.div
      variants={skeletonPulse}
      initial="initial"
      animate="animate"
      className={cn("bg-muted rounded-md", className)}
    />
  );
}

const shakeVariants: Variants = {
  shake: {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.4 }
  }
};

interface ShakeOnErrorProps {
  children: ReactNode;
  hasError?: boolean;
  className?: string;
}

export function ShakeOnError({ children, hasError, className }: ShakeOnErrorProps) {
  return (
    <motion.div
      animate={hasError ? "shake" : undefined}
      variants={shakeVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export { AnimatePresence };
