'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Mail, MapPin, Phone, Send } from 'lucide-react';
import LandingLayout from '@/components/landing/LandingLayout';
import apiFetch from '@/lib/api';

function normalizePhone(value: string): string {
  return value.replace(/[\s.-]/g, '');
}

function isValidMadagascarPhone(value: string): boolean {
  const normalized = normalizePhone(value);

  return /^03\d{8}$/.test(normalized) || /^\+261\d{9}$/.test(normalized);
}

export default function ContactPage() {
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError('');
    setSuccess(false);

    const nomValue = nom.trim();
    const telephoneValue = telephone.trim();
    const messageValue = message.trim();

    if (!nomValue || !telephoneValue || !messageValue) {
      setError('Tous les champs sont requis.');
      return;
    }

    if (!isValidMadagascarPhone(telephoneValue)) {
      setError(
        'Veuillez saisir un numéro malgache valide : 03XXXXXXXX ou +261XXXXXXXXX.'
      );
      return;
    }

    setSending(true);

    try {
      const response = await apiFetch('/public/contact', {
        method: 'POST',
        body: JSON.stringify({
          clientNom: nomValue,
          clientTel: normalizePhone(telephoneValue),
          details: {
            message: messageValue,
          },
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error || data?.message || 'Impossible d’envoyer votre message.'
        );
      }

      setNom('');
      setTelephone('');
      setMessage('');
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Une erreur est survenue lors de l’envoi.'
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <LandingLayout>
      <main className="min-h-screen bg-slate-50">
        <section className="bg-gradient-to-r from-primary to-dark text-white">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:py-24">
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-2 text-sm text-white/80 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à l’accueil
            </Link>

            <div className="max-w-3xl">
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
                Contact
              </p>

              <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
                Parlons de votre mobilité.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/80">
                Une question sur Dago Mobility, nos services ou votre projet ?
                Écrivez-nous et notre équipe reviendra vers vous.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <h2 className="font-display text-2xl font-bold text-gray-900">
                Nos coordonnées
              </h2>

              <p className="mt-3 leading-relaxed text-gray-600">
                Pour toute demande générale, vous pouvez également nous
                contacter directement.
              </p>

              <div className="mt-8 space-y-4">
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-primary/10 p-3 text-primary">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Email</h3>
                      <a
                        href="mailto:contact@dagoos.mg"
                        className="mt-1 block text-sm text-primary transition hover:underline"
                      >
                        contact@dagoos.mg
                      </a>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-primary/10 p-3 text-primary">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Téléphone</h3>
                      <a
                        href="tel:+261340700405"
                        className="mt-1 block text-sm text-primary transition hover:underline"
                      >
                        +261 34 07 004 05
                      </a>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-primary/10 p-3 text-primary">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Localisation
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">Madagascar</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xl sm:p-8">
              <h2 className="font-display text-2xl font-bold text-gray-900">
                Envoyer un message
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                Les champs marqués sont nécessaires pour que nous puissions
                vous recontacter.
              </p>

              {success && (
                <div
                  className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
                  role="status"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-semibold">Message envoyé.</p>
                    <p className="mt-1">
                      Merci pour votre message. Nous reviendrons vers vous.
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div
                  className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div>
                  <label
                    htmlFor="contact-nom"
                    className="mb-2 block text-sm font-medium text-gray-900"
                  >
                    Nom <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="contact-nom"
                    name="nom"
                    type="text"
                    value={nom}
                    onChange={(event) => setNom(event.target.value)}
                    autoComplete="name"
                    required
                    disabled={sending}
                    placeholder="Votre nom"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-primary focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-telephone"
                    className="mb-2 block text-sm font-medium text-gray-900"
                  >
                    Téléphone <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="contact-telephone"
                    name="telephone"
                    type="tel"
                    value={telephone}
                    onChange={(event) => setTelephone(event.target.value)}
                    autoComplete="tel"
                    required
                    disabled={sending}
                    placeholder="Ex. : 034 12 345 67"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-primary focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Format accepté : 03XXXXXXXX ou +261XXXXXXXXX.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="mb-2 block text-sm font-medium text-gray-900"
                  >
                    Message <span aria-hidden="true">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    required
                    disabled={sending}
                    rows={7}
                    placeholder="Comment pouvons-nous vous aider ?"
                    className="w-full resize-y rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-primary focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  {sending ? 'Envoi en cours…' : 'Envoyer le message'}
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>
    </LandingLayout>
  );
}
