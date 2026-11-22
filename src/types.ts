export interface Media {
  id: string;
  url: string;
  kind: 'image' | 'video';
  width: number;
  height: number;
  alt: string;
  caption: string;
  focalX: number;
  focalY: number;
  color: string;
  blurDataUrl?: string | null;
  poster?: Media | null;
}

export interface Puppy {
  id: string;
  slug: string;
  displayName: string;
  name: string;
  breed: string;
  gender?: string;
  genderLabel: string;
  age: string;
  status: 'available' | 'reserved' | 'rehomed';
  origin?: { slug: string } | null;
  breeds: { slug: string; name: string }[];
  collections: { slug: string }[];
  cover: Media;
  media: Media[];
}

export interface Breed {
  slug: string;
  name: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
}

export interface EnquiryOption {
  id: string;
  label: string;
}
