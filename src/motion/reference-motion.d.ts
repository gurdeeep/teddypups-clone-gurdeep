import type { ComponentType } from 'react';

export type PupPose = 'sit' | 'bow' | 'peek' | 'snug' | 'sniff' | 'walk';
export type PupFacing = 'left' | 'right';

/** [time in seconds, callback] pairs, sorted by time. */
export type PupCue = [number, (now: number) => void];

export interface PupActContext {
  d: PuppyDriver;
  rest: unknown;
  facing: 1 | -1;
  say: (text: string, seconds?: number) => void;
  hearts: () => void;
}

export const ReferencePuppyJourney: ComponentType;
export function cuePup(detail: { look?: Element; secs?: number; say?: string }): void;
export const PupSvg: ComponentType<{ pose: PupPose; facing: PupFacing; label?: string }>;
export class PuppyDriver {
  constructor(svg: SVGSVGElement, pose?: PupPose, facing?: 1 | -1);
  wag(amount: number): void;
  lookAt(point: { x: number; y: number } | null): void;
  cock(degrees: number): void;
  petting(active: boolean): void;
  reset(): void;
  tick(deltaSeconds: number, timeSeconds: number): void;
}
export const restPoses: Record<PupPose, unknown>;
export const pupActs: Record<string, (context: PupActContext, now: number) => PupCue[]>;
export function pickPupAct(previous: string | null, clickStreak: number): string;
export function spawnHearts(root: HTMLElement, x: number, y: number): void;
