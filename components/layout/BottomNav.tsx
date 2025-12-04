'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, History, Settings } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'History', href: '/history', icon: History },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  if (['/', '/login', '/register', '/seed', '/verify'].includes(pathname)) return null;

  return (
    <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center pointer-events-none px-4">
      {/* This forces EXACT same width as CardCenter */}
      <div className="w-full max-w-md pointer-events-auto">
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="glass border border-white/10 backdrop-blur-2xl rounded-3xl py-5 shadow-2xl"
        >
          <div className="flex justify-around items-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link href={item.href} key={item.name}>
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="relative p-4"
                  >
                    <Icon
                      size={28}
                      className={`transition-all duration-300 ${isActive
                        ? 'text-primary drop-shadow-[0_0_16px_#14F195]'
                        : 'text-white/60 hover:text-white/90'
                        }`}
                    />
                    {isActive && (
                      <motion.div
                        layoutId="activeGlow"
                        className="absolute inset-0 bg-primary/30 rounded-full blur-xl -z-10"
                      />
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}