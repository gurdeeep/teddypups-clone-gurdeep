import { useRef, useState } from 'react';
import type { FormEvent } from 'react';

type Field = 'name' | 'phone' | 'email' | 'area' | 'message';

export interface EnquiryState {
  ok: boolean;
  message?: string;
  errors?: Partial<Record<Field, string>>;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Validates an enquiry and "sends" it.
 *
 * The reference posts to a private server action we have no access to, so this
 * runs the same checks in the browser and returns the same messages. Nothing is
 * transmitted unless VITE_ENQUIRY_ENDPOINT is set, in which case the fields are
 * POSTed there as JSON.
 */
export async function sendEnquiry(form: FormData): Promise<EnquiryState> {
  const value = (key: string) => String(form.get(key) ?? '').trim();
  if (value('website')) return { ok: true }; // honeypot: bots fill the hidden field

  const errors: EnquiryState['errors'] = {};
  if (value('name').length < 2) errors.name = 'Please tell us your name.';
  if (!/^\+?\d{7,15}$/.test(value('phone').replace(/[\s().-]/g, '')))
    errors.phone = 'Add a phone or WhatsApp number we can reach, with country code.';
  if (value('email') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value('email')))
    errors.email = "That email doesn't look right.";
  if (Object.keys(errors).length) return { ok: false, message: 'Please check the highlighted fields.', errors };

  const endpoint = import.meta.env.VITE_ENQUIRY_ENDPOINT as string | undefined;
  if (!endpoint) {
    await wait(600); // stand-in for the network round trip
    return { ok: true };
  }
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(form)),
    });
    if (!response.ok) throw new Error(String(response.status));
    return { ok: true };
  } catch {
    return {
      ok: false,
      message: 'Sorry, we could not send that just now. Please try again or message us on WhatsApp.',
    };
  }
}

/** Form state shared by both enquiry forms: latest result, pending flag and submit handler. */
export function useEnquiry() {
  const [state, setState] = useState<EnquiryState>({ ok: false });
  const [pending, setPending] = useState(false);
  const ref = useRef<HTMLFormElement>(null);
  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    setPending(true);
    setState(await sendEnquiry(data));
    setPending(false);
  };
  return { state, pending, onSubmit, ref };
}
