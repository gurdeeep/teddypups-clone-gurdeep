import { PAW_PATH } from '../lib/paw';

export function PawIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden fill="currentColor">
      <path d={PAW_PATH} />
    </svg>
  );
}
