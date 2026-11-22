import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { Element } from 'html-react-parser';
import { EnquiryForm } from '../components/EnquiryForm';
import { JourneyTabs } from '../components/JourneyTabs';
import { LetterForm } from '../components/LetterForm';
import { NoticeBoard } from '../components/NoticeBoard';
import { usePhotoViewer } from '../components/PhotoViewer';
import { PuppyBrowser } from '../components/PuppyBrowser';
import { PuppyGallery } from '../components/PuppyGallery';
import breedData from '../data/breeds.json';
import enquiryOptions from '../data/enquiry-options.json';
import familyPhotos from '../data/families.json';
import faqData from '../data/faq.json';
import homeFamilyOrder from '../data/home-families.json';
import puppyData from '../data/puppies.json';
import { ChatClip, ChatStory } from '../home/ChatStory';
import { HeroLineup } from '../home/HeroLineup';
import { MeetShowcase } from '../home/MeetShowcase';
import { pageTemplate } from '../lib/router';
import { ReferencePuppyJourney } from '../motion/reference-motion';
import { findElement, renderTemplate, textOf } from '../Template';
import type { Breed, EnquiryOption, Faq, Media, Puppy } from '../types';
import { NotFound } from './NotFound';

const puppies = puppyData as unknown as Puppy[];
const available = puppies.filter((pup) => pup.status === 'available');
const breeds = breedData as Breed[];
const faqs = faqData as Faq[];
const options = enquiryOptions as EnquiryOption[];
const families = familyPhotos as Media[];
/** The homepage shows the same family photos in its own curated order. */
const homeFamilies = (homeFamilyOrder as string[]).map((id) => families.find((photo) => photo.id === id)!);

/**
 * One route's content: the saved template for that page, with its interactive
 * parts swapped for live components. Remounted (via `key`) on every navigation.
 */
export function Page({ pathname }: { pathname: string }) {
  const html = pageTemplate(pathname);
  const isHome = pathname === '/';
  const puppy = puppies.find((pup) => pathname === `/puppies/${pup.slug}`);
  const photos = isHome ? homeFamilies : families;
  const { open, viewer } = usePhotoViewer(photos);

  const content = useMemo(() => {
    if (!html) return null;
    return renderTemplate(html, ({ el, has, render, convert }) => {
      // Homepage: the walking puppy is mounted where the reference puts it (end of <main>).
      if (has('pup-probe')) return isHome ? <ReferencePuppyJourney /> : null;
      if (has('pup-prints') || has('pup-layer')) return null;
      if (has('tp-lineup')) return has('tp-lineup--tags') ? null : <HeroLineup friends={available} />;
      if (has('tp-lineup__wings')) return null;
      if (has('tp-clip')) {
        const video = findElement(el, (child) => child.name === 'video');
        if (video)
          return <ChatClip src={video.attribs.src} poster={video.attribs.poster} label={video.attribs['aria-label']} />;
      }

      // Family photo walls open the shared full-screen viewer.
      const label = el.attribs['aria-label'];
      if (el.name === 'button' && label?.startsWith('Open photo ')) {
        const index = Number(label.match(/Open photo (\d+)/)?.[1] ?? 1) - 1;
        return render({ onClick: () => open(index) });
      }

      // Puppies page: the saved list supplies each card's artwork; the browser adds the filters.
      if (el.attribs['data-component'] === 'catalogue') {
        const cards = new Map<string, ReactNode>();
        for (const item of el.children) {
          if (!(item instanceof Element)) continue;
          const link = findElement(item, (child) => child.name === 'a');
          const slug = link?.attribs.href?.split('/').pop();
          if (link && slug) cards.set(slug, convert([link]));
        }
        return <PuppyBrowser puppies={available} breeds={breeds} cards={cards} />;
      }

      if (el.attribs['data-component'] === 'gallery' && puppy)
        return <PuppyGallery name={puppy.displayName} media={puppy.media} />;
      if (has('tp-post')) return <LetterForm puppies={options} />;
      if (el.name === 'form' && puppy) {
        // The profile form greets the puppy by the label saved in its message box.
        const message = findElement(el, (child) => child.name === 'textarea');
        const name = message ? textOf(message).match(/about (.*)\.$/)?.[1] : undefined;
        const compact = !findElement(el, (child) => child.attribs.class === 'grid gap-5 sm:grid-cols-2');
        return <EnquiryForm puppy={{ id: puppy.id, label: name ?? puppy.displayName }} compact={compact} />;
      }
      if (has('tp-notes')) return <NoticeBoard faqs={faqs} />;
    });
    // `open` is stable for the life of the page; the template only changes with the route.
  }, [html, isHome, puppy]);

  if (!content) return <NotFound />;
  return (
    <>
      {content}
      {viewer}
      {isHome && <MeetShowcase />}
      {isHome && <ChatStory />}
      {pathname === '/how-it-works' && <JourneyTabs />}
    </>
  );
}
