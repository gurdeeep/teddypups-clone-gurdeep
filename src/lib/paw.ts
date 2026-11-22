/** Outline of one rotated ellipse (a toe pad) as cubic Bézier segments. */
function ellipsePath(cx: number, cy: number, rx: number, ry: number, degrees: number) {
  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const k = 0.5523; // circle-to-Bézier constant
  const at = (x: number, y: number) => `${(cx + x * cos - y * sin).toFixed(2)} ${(cy + x * sin + y * cos).toFixed(2)}`;
  return (
    `M${at(rx, 0)}C${at(rx, k * ry)} ${at(k * rx, ry)} ${at(0, ry)}` +
    `C${at(-k * rx, ry)} ${at(-rx, k * ry)} ${at(-rx, 0)}` +
    `C${at(-rx, -k * ry)} ${at(-k * rx, -ry)} ${at(0, -ry)}` +
    `C${at(k * rx, -ry)} ${at(rx, -k * ry)} ${at(rx, 0)}Z`
  );
}

/** The site's paw print in a 64×64 box: one palm pad and four toe pads. */
export const PAW_PATH =
  'M32 30.5c-7.6 0-15.6 8.3-15.6 15.5 0 5.4 4.2 8.3 9.2 8.3 2.6 0 4.5-1.1 6.4-1.1s3.8 1.1 6.4 1.1c5 0 9.2-2.9 9.2-8.3 0-7.2-8-15.5-15.6-15.5z' +
  ellipsePath(14.6, 29.2, 5.3, 6.9, -28) +
  ellipsePath(24.2, 16.6, 5.5, 7.3, -10) +
  ellipsePath(39.8, 16.6, 5.5, 7.3, 10) +
  ellipsePath(49.4, 29.2, 5.3, 6.9, 28);
