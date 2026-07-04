import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

export const AnimatedHpDisplay = ({
  value,
  maxHp,
  isActive,
  colorClass,
  className,
}: {
  value: number;
  maxHp: number;
  isActive: boolean;
  colorClass: string;
  className?: string;
}) => {
  const [prevHp, setPrevHp] = useState(value);
  const [animateState, setAnimateState] = useState<'idle' | 'heal' | 'damage'>('idle');

  useEffect(() => {
    let animationTimeout: NodeJS.Timeout;
    if (value > prevHp) {
      setAnimateState('heal');
    } else if (value < prevHp) {
      setAnimateState('damage');
    }
    setPrevHp(value);

    animationTimeout = setTimeout(() => setAnimateState('idle'), 500);
    return () => clearTimeout(animationTimeout);
  }, [value, prevHp]);

  return (
    <motion.div
      animate={
        animateState === 'heal'
          ? { scale: [1, 1.2, 1], backgroundColor: ['transparent', '#86efac', 'transparent'] }
          : animateState === 'damage'
          ? { scale: [1, 0.9, 1], backgroundColor: ['transparent', '#fca5a5', 'transparent'], x: [0, -4, 4, -4, 4, 0] }
          : {}
      }
      transition={{ duration: 0.4 }}
      className={cn('rounded-md relative inline-block p-1', className)}
    >
      <div className={cn('min-w-8 text-center font-sans font-bold block', colorClass)}>
        {value}
      </div>
    </motion.div>
  );
};
