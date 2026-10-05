// Photographs of the Kolkata that surrounds the journey: the five windows on the
// home page and the two narrow frames beside "Still on the line" in the footer.
// To change one, replace the file in images/kolkata/ with a picture of the same
// name (.jpg, .jpeg, .png or .webp). Until a file exists, its slot shows the
// place name instead, so nothing ever breaks.
import type { ImageMetadata } from 'astro';

const files = import.meta.glob('/images/kolkata/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}', { import: 'default', eager: true }) as Record<string, ImageMetadata>;

function find(name: string): ImageMetadata | undefined {
  const hit = Object.keys(files).find((k) => k.split('/').pop()!.replace(/\.[^.]+$/, '').toLowerCase() === name);
  return hit ? files[hit] : undefined;
}

export type Frame = { name: string; place: string; note: string; alt: string; image?: ImageMetadata };

const frame = (name: string, place: string, note: string, alt: string): Frame => ({ name, place, note, alt, image: find(name) });

export const windows: Frame[] = [
  frame('howrah-bridge', 'Howrah Bridge', 'Rush hour on the cantilever', 'Traffic crossing Howrah Bridge, in black and white'),
  frame('victoria-memorial', 'Victoria Memorial', 'Marble, doubled in the water', 'Victoria Memorial reflected in the pool in front of it'),
  frame('prinsep-ghat', 'Prinsep Ghat', 'Where the river slows down', 'Prinsep Ghat by the Hooghly'),
  frame('new-market', 'New Market', 'Old Calcutta, still haggling', 'Street life outside New Market in old Kolkata'),
  frame('yellow-taxi', 'Yellow taxi', 'No refusal, mostly', 'A classic yellow Kolkata taxi'),
];

export const sides: Frame[] = [
  frame('line-left', 'College Street', 'Books by the yard', 'Book stalls on College Street'),
  frame('line-right', 'Kumartuli', 'Clay, before the goddess', 'Idol makers at work in Kumartuli'),
];
