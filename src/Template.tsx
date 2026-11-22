import { createElement } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import parse, { attributesToProps, domToReact, Element } from 'html-react-parser';
import type { DOMNode, HTMLReactParserOptions } from 'html-react-parser';
import { PupBuddy } from './components/PupBuddy';
import type { PupFacing, PupPose } from './motion/reference-motion';

const VOID_TAGS = ['img', 'input', 'br', 'hr', 'source', 'area', 'wbr'];

/** What a slot function gets for each element in a template. */
export interface Node {
  el: Element;
  /** The element's attributes as React props. */
  props: Record<string, unknown>;
  has: (className: string) => boolean;
  /** The element's children, converted to React (slots still apply inside). */
  children: () => ReactNode;
  /** The element itself, with extra props merged in. */
  render: (extra?: Record<string, unknown>) => ReactNode;
  /** Convert any other nodes with the same slots applied. */
  convert: (nodes: DOMNode[]) => ReactNode;
}

/** Return a React node to replace the element, or undefined to keep it as written. */
export type Slot = (node: Node) => ReactNode | undefined;

export const hasClass = (el: Element, className: string) => !!el.attribs.class?.split(/\s+/).includes(className);

export function textOf(node: DOMNode): string {
  if ('data' in node) return node.data;
  if ('children' in node) return (node.children as DOMNode[]).map(textOf).join('');
  return '';
}

export function findElement(el: Element, test: (candidate: Element) => boolean): Element | undefined {
  for (const child of el.children) {
    if (!(child instanceof Element)) continue;
    if (test(child)) return child;
    const match = findElement(child, test);
    if (match) return match;
  }
}

/** Works out which mascot a `.pup-buddy` block in a template is, then renders the live component. */
function buddy(el: Element) {
  const parent = el.parent instanceof Element && 'data-pup-stop' in el.parent.attribs ? el.parent : null;
  const label = findElement(el, (child) => child.name === 'svg')?.attribs['aria-label'];
  const className = (el.attribs.class ?? '').replace(/^pup-buddy ?/, '');
  let pose = parent?.attribs['data-pose'] as PupPose | undefined;
  if (!pose) {
    if (/peeking/.test(label ?? '') || className.includes('tp-booth__teddy')) pose = 'peek';
    else if (/ready to play/.test(label ?? '')) pose = 'bow';
    else pose = 'sit';
  }
  return (
    <PupBuddy
      pose={pose}
      facing={(el.attribs['data-facing'] as PupFacing) ?? 'right'}
      act={!parent && /which way you pick/.test(label ?? '') ? 'tilt' : undefined}
      label={label}
      className={className}
      style={attributesToProps(el.attribs).style as CSSProperties | undefined}
      asStop={!!parent}
    />
  );
}

/**
 * Turns a saved HTML template into React elements.
 *
 * Most of each page is static markup, so it is rendered as written. The `slot`
 * callback is asked about every element and can swap in a real component
 * (a form, a gallery, the filter list) or attach handlers and state.
 */
export function renderTemplate(html: string, slot?: Slot): ReactNode {
  const options: HTMLReactParserOptions = {
    replace(domNode) {
      if (!(domNode instanceof Element)) return;
      const el = domNode;
      if (el.name === 'script' || el.name === 'template') return <></>;
      const props = attributesToProps(el.attribs) as Record<string, unknown>;
      const convert = (nodes: DOMNode[]) => domToReact(nodes, options);
      const children = () => convert(el.children as DOMNode[]);
      const render = (extra: Record<string, unknown> = {}) =>
        createElement(el.name, { ...props, ...extra }, ...(VOID_TAGS.includes(el.name) ? [] : [children()]));
      const replaced = slot?.({ el, props, has: (className) => hasClass(el, className), children, render, convert });
      if (replaced !== undefined) return <>{replaced}</>;
      if (hasClass(el, 'pup-buddy')) return buddy(el);
    },
  };
  return parse(html, options);
}
