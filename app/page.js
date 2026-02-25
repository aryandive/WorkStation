"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEnvironment } from '@/context/EnvironmentContext';
import { useAuth } from '@/context/AuthContext';
import TimeWidget from '@/components/Time';
import Social from '@/components/Social';
import TodoList from '@/components/TodoList';
import PomodoroTimer from '@/components/PomodoroTimer';
import StatsPopup from '@/components/stats/StatsPopup';
import EnvironmentPanel from '@/components/environment/EnvironmentPanel';
import MasterPlayer from '@/components/environment/MasterPlayer';
import TopRightNav from '@/components/TopRightNav';
import SignUpModal from '@/components/auth/SignUpModal';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react'; // Replaced Play/Pause with Eye/EyeOff
import { Button } from '@/components/ui/button';
import TestingWarning from '@/components/TestingWarning';

export default function PomodoroTimerPage() {
  const [isTodoOpen, setIsTodoOpen] = useState(false);
  const [isPomodoroOpen, setIsPomodoroOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isEnvironmentPanelOpen, setIsEnvironmentPanelOpen] = useState(false);

  // Hover States for "Peek" functionality in Zen Mode
  const [isFeatureNavHovered, setIsFeatureNavHovered] = useState(false);
  const [isTopHovered, setIsTopHovered] = useState(false);
  const [isBottomHovered, setIsBottomHovered] = useState(false);

  // Zen Mode State (Default: False = UI Visible)
  const [isZenMode, setIsZenMode] = useState(false);

  // Contexts
  const { toggleGlobalPlay } = useEnvironment(); // Kept in case you want to map it to a keybind later, but removed from UI
  const { user, isSignUpModalOpen, openSignUpModal, closeSignUpModal } = useAuth();
  const router = useRouter();
  const updateTaskTimeRef = useRef(null);

  // --- Visibility Logic ---
  // UI is visible if:
  // 1. Zen Mode is OFF (!isZenMode)
  // 2. OR User is hovering over any UI zone (isTopHovered, etc.)
  const isUiVisible = !isZenMode || isTopHovered || isBottomHovered || isFeatureNavHovered;

  // --- Funnel Logic ---
  const handleJournalClick = (e) => {
    e.preventDefault();
    if (!user) {
      router.push('/journal');
    } else {
      router.push('/journal');
    }
  };

  const navItems = [
    { name: 'Environment', icon: '/theme.svg', action: () => setIsEnvironmentPanelOpen(true) },
    { name: 'Stats', icon: '/stats.svg', action: () => setIsStatsOpen(true) },
    { name: 'Pomodoro', icon: '/pomo.svg', action: () => setIsPomodoroOpen(true) },
    { name: 'Todo', icon: '/todo.svg', action: () => setIsTodoOpen(true) },
    { name: 'Journal', icon: '/journal.svg', isLink: true, href: '/journal', action: handleJournalClick },
  ];

  const fadeClass = cn(
    "transition-opacity duration-500 ease-in-out",
    isUiVisible ? "opacity-100" : "opacity-0 pointer-events-none"
  );

  return (
    <>
      <div className="relative h-screen overflow-hidden bg-black">
        <MasterPlayer />

        {/* --- Top UI Zone --- 
            Wraps both Left and Right Top UI. 
            Padding provides the 'near' proximity trigger. 
        */}
        <div
          className="absolute top-0 left-0 right-0 z-30 p-6 flex justify-between items-start"
          onMouseEnter={() => setIsTopHovered(true)}
          onMouseLeave={() => setIsTopHovered(false)}
        >
          {/* Top Left: Logo, Goal & Zen Toggle */}
          <div className={cn("flex flex-col gap-4", fadeClass)}>
            <Image width={50} height={50} src="/logo.webp" alt="Work Station Logo" className="rounded-md" />
            <div>
              <h2 className='text-gray-300 text-sm tracking-widest'>TODAY&apos;S FOCUS</h2>
              <h1 className='text-2xl font-bold text-white'>Focus Goal</h1>
              {/* --- INSERT THE NEW COMPONENT HERE --- */}
              <div className="mt-1">
                <TestingWarning />
              </div>
            </div>

            {/* Zen Mode Toggle (Replaces Play/Pause) */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsZenMode(!isZenMode)}
                variant="outline"
                size="icon"
                className="bg-black/20 border-white/20 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-all"
              >
                {isZenMode ? <EyeOff size={20} /> : <Eye size={20} />}
              </Button>
              {!isZenMode && <span className="text-xs text-white/50">Hide UI</span>}
            </div>
          </div>

          {/* Top Right: Nav & Time */}
          <div className={cn('flex flex-col items-end gap-4', fadeClass)}>
            <TopRightNav />
            <TimeWidget />
          </div>
        </div>


        {/* --- Bottom UI Zone --- */}
        <div
          className="absolute bottom-0 left-0 right-0 z-30 p-6"
          onMouseEnter={() => setIsBottomHovered(true)}
          onMouseLeave={() => setIsBottomHovered(false)}
        >
          {/* Center: Feature Navigation */}
          <div
            className={cn(
              "absolute bottom-10 md:bottom-20 left-1/2 -translate-x-1/2",
              "w-full max-w-sm md:w-[30%] flex justify-evenly items-center text-white pb-0 pt-2",
              "backdrop-blur-md rounded-full drop-shadow-xl bg-black/20 border border-white/10",
              fadeClass
            )}
            onMouseEnter={() => setIsFeatureNavHovered(true)}
            onMouseLeave={() => setIsFeatureNavHovered(false)}
          >
            {navItems.map((item, index) => {
              const content = (
                <div key={item.name} className="group flex flex-col items-center cursor-pointer p-2" onClick={item.action}>
                  <Image className='w-5 h-5 group-hover:w-8 group-hover:h-8 transition-all duration-200' style={{ height: 'auto' }} width={20} height={20} src={item.icon} alt={item.name} />
                  <span className={cn("mt-1 text-xs text-white transition-all duration-300 ease-out", isFeatureNavHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none')} style={{ transitionDelay: `${index * 50}ms` }}>{item.name}</span>
                </div>
              );
              if (item.isLink) {
                return <a href={item.href} onClick={item.action} key={item.name} className="pointer-events-auto">{content}</a>;
              }
              return <div key={item.name} className="pointer-events-auto">{content}</div>;
            })}
          </div>

          {/* Bottom Left: Socials */}
          <div className={cn('absolute bottom-6 left-6', fadeClass)}>
            <Social />
          </div>

          {/* Bottom Right: Logo/Menu */}
          <div className={cn("absolute bottom-6 right-6", fadeClass)}>
            <div className="relative group inline-block">
              <Image src="/logo.webp" alt="Logo" width={50} height={50} className="cursor-pointer rounded-md" />
              <div className="absolute bottom-full right-0 mb-2 w-48 bg-gray-800 text-white text-sm rounded-lg shadow-lg p-3 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-400 delay-200 ease-out transform origin-bottom-right z-10">
                <div className="font-bold mb-1">Work Station</div>
                <div className="mb-1">
                  <a href="/help" className="underline hover:text-blue-300">Need Help</a>
                  <span className="mx-1">|</span>
                  <a href="/contact" className="underline hover:text-blue-300">Contact Me</a>
                </div>
                <div className="text-xs text-gray-400">v1.0.0</div>
              </div>
            </div>
          </div>
        </div>

        <SignUpModal isOpen={isSignUpModalOpen} setIsOpen={closeSignUpModal} />

        {/* Tools Layer (Z-50) 
            These remain visible regardless of Zen Mode because they are tools the user 
            might be using actively while "in the zone".
        */}
        <div className="pointer-events-auto relative z-50">
          {isPomodoroOpen && <PomodoroTimer isOpen={isPomodoroOpen} setIsOpen={setIsPomodoroOpen} onTaskTimeUpdateRef={updateTaskTimeRef} />}
          {isTodoOpen && <TodoList isOpen={isTodoOpen} setIsOpen={setIsTodoOpen} onTaskTimeUpdateRef={updateTaskTimeRef} />}
          {isStatsOpen && <StatsPopup isOpen={isStatsOpen} setIsOpen={setIsStatsOpen} />}
          {isEnvironmentPanelOpen && <EnvironmentPanel isOpen={isEnvironmentPanelOpen} setIsOpen={setIsEnvironmentPanelOpen} />}
        </div>
      </div>
    </>
  );
}