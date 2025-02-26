'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './CoinFlip.module.css';

interface CoinFlipProps {
  result: 'Heads' | 'Tails';
  onAnimationEnd?: () => void;
  isCompleted?: boolean;
  shouldStartCountdown?: boolean;
  isFirstSpin?: boolean;
}

export default function CoinFlip({ result, onAnimationEnd, isCompleted, shouldStartCountdown, isFirstSpin }: CoinFlipProps) {
  const [isFlipping, setIsFlipping] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const [animationComplete, setAnimationComplete] = useState(false);

  // Predefined animations for heads and tails
  const animations = {
    heads: {
      rotateY: [0, 360, 720, 1080, 1440, 1800, 1800], // 5 full spins ending at 0 (heads)
      rotateX: [0, -45, 0, -45, 0, -45, 0], // Wobble effect
    },
    tails: {
      rotateY: [0, 360, 720, 1080, 1440, 1800, 1980], // 5.5 spins ending at 180 (tails)
      rotateX: [0, 45, 0, 45, 0, 45, 0], // Wobble effect
    }
  };

  // Start countdown immediately
  useEffect(() => {
    setShowResult(false);
    setCountdown(15);
    setAnimationComplete(false);
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }

    if (countdown === 0) {
      // Reset animation states
      setIsFlipping(false);
      setShowResult(false);
      setAnimationComplete(false);
      
      // Start the flip animation after a short delay
      setTimeout(() => {
        setIsFlipping(true);
        
        // End the flip animation after 3 seconds
        setTimeout(() => {
          setIsFlipping(false);
          setShowResult(true);
          setAnimationComplete(true);
          if (onAnimationEnd) {
            onAnimationEnd();
          }
        }, 3000);
      }, 100);

      setCountdown(-1);
    }
  }, [countdown, onAnimationEnd]);

  const flipVariants = {
    initial: {
      rotateY: 0, // Always start at heads up (0 degrees)
    },
    flipping: {
      rotateY: result === 'Tails' 
        ? [0, 360, 720, 1080, 1440, 1800, 1980] // End at 180 degrees (tails up) after 5.5 rotations
        : [0, 360, 720, 1080, 1440, 1800], // End at 0 degrees (heads up) after 5 rotations
      transition: {
        duration: 3,
        ease: "easeOut",
        times: result === 'Tails' 
          ? [0, 0.2, 0.4, 0.6, 0.8, 0.9, 1] 
          : [0, 0.2, 0.4, 0.6, 0.8, 1],
      },
    },
    static: {
      rotateY: result === 'Tails' ? 180 : 0, // Final position: 180 for tails, 0 for heads
      transition: {
        duration: 0.5,
        ease: "easeOut",
      }
    },
  };

  if (countdown > 0) {
    return (
      <div className={styles.coinContainer}>
        <motion.div
          className={styles.countdown}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          {countdown}
        </motion.div>
      </div>
    );
  }

  return (
    <div className={styles.coinContainer}>
      <motion.div
        className={styles.coin}
        variants={flipVariants}
        initial="initial"
        animate={isFlipping ? "flipping" : "static"}
        style={{ 
          transformStyle: "preserve-3d",
          perspective: "1000px"
        }}
        onAnimationComplete={() => {
          if (isFlipping) {
            setAnimationComplete(true);
          }
        }}
      >
        <div className={`${styles.side} ${styles.heads}`}>
          <span>H</span>
        </div>
        <div className={`${styles.side} ${styles.tails}`}>
          <span>T</span>
        </div>
      </motion.div>
      
      <AnimatePresence>
        {showResult && animationComplete && (
          <motion.div
            className="text-2xl font-bold mt-4 text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            {result}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 