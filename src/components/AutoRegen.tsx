import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useGenerate } from '../hooks/useGenerate';

// Always-mounted (lives at the App root) so auto-regeneration fires regardless
// of which mobile view is active. Previously this effect lived in GenerateButton,
// which unmounts on mobile when the calendar is showing — so switching weeks
// there never re-ran the algorithm and the heatmap went stale.
export default function AutoRegen() {
  const { state } = useApp();
  const { autoRegen, isDirty, dataState } = state;
  const generate = useGenerate();

  useEffect(() => {
    if (autoRegen && isDirty && dataState === 'loaded') {
      generate();
    }
  }, [autoRegen, isDirty, dataState, generate]);

  return null;
}
