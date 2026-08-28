import { useEffect } from 'react';
import { useJourney, type Region } from '@/store/journey';
import { blip } from '@/audio/ambience';

/** Don't hijack keys while someone is typing. */
function inTextField(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

/**
 * Full keyboard model for the universe. Every 3D interaction has a key
 * equivalent, which is the difference between a 3D site that is navigable
 * and one that merely has focusable buttons somewhere.
 */
/** Digits mirror the five HUD buttons, not the scroll order. */
const DIGIT_REGIONS: Region[] = ['hero', 'about', 'skills', 'projects'];

export function useKeyboardNav() {
  const advance = useJourney((s) => s.advance);
  const travelTo = useJourney((s) => s.travelTo);
  const enterMilano = useJourney((s) => s.enterMilano);
  const exitMilano = useJourney((s) => s.exitMilano);
  const clearFocus = useJourney((s) => s.clearFocus);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (inTextField(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      const { region, focus, docking } = useJourney.getState();

      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          blip('select');
          advance(1);
          return;
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          blip('select');
          advance(-1);
          return;
        case 'Escape':
          // Changed your mind mid-boarding: abort back to where you were.
          if (docking) {
            blip('close');
            travelTo(region);
          } else if (region === 'milano-interior') {
            blip('close');
            exitMilano();
          } else if (focus.kind !== 'none') {
            blip('close');
            clearFocus();
          }
          return;
        case '1':
        case '2':
        case '3':
        case '4': {
          const target = DIGIT_REGIONS[Number(e.key) - 1];
          if (target) {
            blip('select');
            travelTo(target);
          }
          return;
        }
        case '5':
          blip('approach');
          enterMilano();
          return;
        default:
          return;
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advance, travelTo, enterMilano, exitMilano, clearFocus]);
}
