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
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PomodoroTimerPage() {
  const [isTodoOpen, setIsTodoOpen] = useState(false);
  const [isPomodoroOpen, setIsPomodoroOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isEnvironmentPanelOpen, setIsEnvironmentPanelOpen] = useState(false);
  const [isFeatureNavHovered, setIsFeatureNavHovered] = useState(false);
  const [isTopHovered, setIsTopHovered] = useState(false);
  const [isBottomHovered, setIsBottomHovered] = useState(false);

  const { isGlobalPlaying, toggleGlobalPlay, youtube } = useEnvironment();
  const { user, isSignUpModalOpen, openSignUpModal, closeSignUpModal } = useAuth();
  const router = useRouter();
  const updateTaskTimeRef = useRef(null);

  const isUiVisible = !(youtube.id && youtube.showPlayer) || isTopHovered || isBottomHovered;

  // --- Funnel Logic ---
  const handleJournalClick = (e) => {
    e.preventDefault();
    if (!user) {
      // **CHANGE**: Instead of opening a modal, redirect to the landing page.
      router.push('/landing');
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

  // Define the class variables for UI animations.
  const topUiElementClass = cn("transition-all duration-300 ease-in-out pointer-events-auto", !isUiVisible && "opacity-0 -translate-y-4");
  const bottomUiElementClass = cn("transition-all duration-300 ease-in-out pointer-events-auto", !isUiVisible && "opacity-0 translate-y-4");

  return (
    <>
      <div className="relative h-screen overflow-hidden bg-black">
        <MasterPlayer />

        {/* Hover zones to control UI visibility */}
        <div
          className="absolute top-0 left-0 right-0 h-32 z-20"
          onMouseEnter={() => setIsTopHovered(true)}
          onMouseLeave={() => setIsTopHovered(false)}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-48 z-20"
          onMouseEnter={() => setIsBottomHovered(true)}
          onMouseLeave={() => setIsBottomHovered(false)}
        />

        <div className="absolute inset-0 z-30 pointer-events-none">
          {/* FIX: This div now correctly uses topUiElementClass */}
          <div className={cn("absolute left-4 top-4 flex flex-col gap-4", topUiElementClass)}>
            <Image width={50} height={50} src="/logo.jpg" alt="Work Station Logo" className="rounded-md" />
            <div>
              <h2 className='text-gray-300'>TODAY&apos;S FOCUS</h2>
              <h1 className='text-2xl font-bold'>Focus Goal</h1>
            </div>
            <Button onClick={toggleGlobalPlay} variant="outline" size="icon" className="bg-black/20 border-white/20 hover:bg-white/20 text-white rounded-full">
              {isGlobalPlaying ? <Pause size={20} /> : <Play size={20} />}
            </Button>
          </div>

          <div className={cn('absolute right-4 top-4 flex flex-col items-end gap-4', topUiElementClass)}>
            <TopRightNav />
            <TimeWidget />
          </div>

          <div
            className={cn("bottom w-full max-w-sm md:w-[30%] absolute flex justify-evenly items-center align-middle text-white pb-0 pt-2 left-1/2 -translate-x-1/2 gap-0 bottom-10 md:bottom-20 backdrop-blur-md rounded-full drop-shadow-xl", bottomUiElementClass)}
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

          <div className={cn('absolute bottom-4 left-4', bottomUiElementClass)}>
            <Social />
          </div>

          <div className={cn("absolute bottom-4 right-4", bottomUiElementClass)}>
            <div className="relative group inline-block">
              <Image src="/logo.jpg" alt="Logo" width={50} height={50} className="cursor-pointer rounded-md" />
              <div className="absolute bottom-full right-0 mb-2 w-48 bg-gray-800 text-white text-sm rounded-lg shadow-lg p-3 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-200 ease-out transform origin-bottom-right z-10">
                <div className="font-bold mb-1">Work Station</div>
                <div className="mb-1">
                  <a href="/help" className="underline hover:text-blue-300">Need Help</a>
                  <span className="mx-1">|</span>
                  <a href="/contact" className="underline hover:text-blue-300">Contact Me</a>
                </div>
                <div className="text-xs text-gray-400">v0.0.0</div>
              </div>
            </div>
          </div>
        </div>

        {/* The sign-up modal can now be removed from this page if you wish,
            as the primary funnel has changed. However, it can be kept for other
            potential upgrade paths. I'll leave it for now. */}
        <SignUpModal isOpen={isSignUpModalOpen} setIsOpen={closeSignUpModal} />

        <div className="pointer-events-auto">
          {isPomodoroOpen && <PomodoroTimer isOpen={isPomodoroOpen} setIsOpen={setIsPomodoroOpen} onTaskTimeUpdateRef={updateTaskTimeRef} />}
          {isTodoOpen && <TodoList isOpen={isTodoOpen} setIsOpen={setIsTodoOpen} onTaskTimeUpdateRef={updateTaskTimeRef} />}
          {isStatsOpen && <StatsPopup isOpen={isStatsOpen} setIsOpen={setIsStatsOpen} />}
          {isEnvironmentPanelOpen && <EnvironmentPanel isOpen={isEnvironmentPanelOpen} setIsOpen={setIsEnvironmentPanelOpen} />}
        </div>
      </div>
    </>
  );
}