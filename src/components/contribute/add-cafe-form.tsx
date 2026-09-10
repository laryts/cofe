"use client";

import { CheckCircle2, LoaderCircle, TriangleAlert } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState, type FormEvent } from "react";

import { RatingInput } from "@/components/contribute/rating-input";
import { TristateInput } from "@/components/contribute/tristate-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SCORED_DIMENSIONS, type ScoredDimension } from "@/domain/scoring";
import type { Coordinates } from "@/domain/geo";
import { messages } from "@/lib/i18n";

const LocationPicker = dynamic(
  () => import("./location-picker").then((mod) => mod.LocationPicker),
  { ssr: false, loading: () => <Skeleton className="h-72 w-full rounded-lg" /> },
);

type Ratings = Record<ScoredDimension, number | null>;

const EMPTY_RATINGS: Ratings = {
  wifi: null,
  outlets: null,
  seating: null,
  longStay: null,
  noise: null,
};

interface FieldError {
  field: string;
  message: string;
}

/**
 * The contribution form.
 *
 * Ordered by what a person can answer without thinking: where it is, then what
 * it was like. The work-condition ratings are the point of the product, so they
 * get the most space and every level is spelled out — but all of them are
 * optional, because a partial honest answer is worth more than a complete
 * guessed one.
 *
 * Submissions are queued for review rather than published, which is what makes
 * it safe to keep this open with no account.
 */
export function AddCafeForm() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [countryCode, setCountryCode] = useState("BR");
  const [website, setWebsite] = useState("");
  const [openingHours, setOpeningHours] = useState("");
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);

  const [ratings, setRatings] = useState<Ratings>(EMPTY_RATINGS);
  const [allowsCalls, setAllowsCalls] = useState<boolean | null>(null);
  const [hasAirConditioning, setHasAirConditioning] = useState<boolean | null>(null);
  const [hasRestroom, setHasRestroom] = useState<boolean | null>(null);

  const [comment, setComment] = useState("");
  const [contributorHandle, setContributorHandle] = useState("");
  const [visitedAt, setVisitedAt] = useState("");
  const [honeypot, setHoneypot] = useState("");

  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const anyRating = Object.values(ratings).some((value) => value !== null);
  const canSubmit =
    name.trim().length >= 2 &&
    city.trim().length > 0 &&
    coordinates !== null &&
    (anyRating || comment.trim().length > 0);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!coordinates) return;

    setStatus("submitting");
    setErrors([]);
    setFormError(null);

    try {
      const response = await fetch("/api/v1/cafes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          address,
          neighborhood,
          city,
          countryCode,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          website: website || undefined,
          openingHours: openingHours || undefined,
          ratings,
          amenities: { allowsCalls, hasAirConditioning, hasRestroom },
          comment: comment || undefined,
          contributorHandle: contributorHandle || undefined,
          visitedAt: visitedAt || undefined,
          website_url: honeypot,
        }),
      });

      if (response.ok) {
        setStatus("done");
        return;
      }

      const body: unknown = await response.json().catch(() => null);
      const error = (body as { error?: { message?: string; details?: FieldError[] } } | null)
        ?.error;

      setErrors(error?.details ?? []);
      setFormError(error?.message ?? "Something went wrong. Please try again.");
      setStatus("idle");
    } catch {
      setFormError("Could not reach the server. Check your connection and try again.");
      setStatus("idle");
    }
  }

  if (status === "done") return <SubmittedState />;

  const errorFor = (field: string) => errors.find((issue) => issue.field === field)?.message;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8" noValidate>
      <section className="flex flex-col gap-4">
        <SectionHeading
          title="Where is it?"
          hint="Only the name, city and pin are required — the rest helps people find it."
        />

        <Field label="Café name" required error={errorFor("name")}>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Estúdio Bica"
            required
            maxLength={120}
          />
        </Field>

        <Field label="Street address" error={errorFor("address")}>
          <Input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="Rua Dr. Diogo de Faria, 700"
            maxLength={200}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_6rem]">
          <Field label="Neighbourhood" error={errorFor("neighborhood")}>
            <Input
              value={neighborhood}
              onChange={(event) => setNeighborhood(event.target.value)}
              placeholder="Vila Mariana"
              maxLength={120}
            />
          </Field>

          <Field label="City" required error={errorFor("city")}>
            <Input
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="São Paulo"
              required
              maxLength={120}
            />
          </Field>

          <Field label="Country" required error={errorFor("countryCode")}>
            <Input
              value={countryCode}
              onChange={(event) => setCountryCode(event.target.value.toUpperCase().slice(0, 2))}
              placeholder="BR"
              maxLength={2}
              className="uppercase"
            />
          </Field>
        </div>

        <Field label="Pin the location" required error={errorFor("latitude")}>
          <LocationPicker value={coordinates} onChange={setCoordinates} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Website" error={errorFor("website")}>
            <Input
              type="url"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              placeholder="https://…"
              maxLength={300}
            />
          </Field>

          <Field label="Opening hours" error={errorFor("openingHours")}>
            <Input
              value={openingHours}
              onChange={(event) => setOpeningHours(event.target.value)}
              placeholder="Mon–Fri 8am–7pm"
              maxLength={200}
            />
          </Field>
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <SectionHeading
          title="What is it like to work there?"
          hint="Rate a typical moment, not the best or worst you have seen. Skip anything you did not observe."
        />

        {SCORED_DIMENSIONS.map((dimension) => (
          <RatingInput
            key={dimension}
            dimension={dimension}
            value={ratings[dimension]}
            onChange={(value) => setRatings((current) => ({ ...current, [dimension]: value }))}
          />
        ))}
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading
          title="Good to know"
          hint="These filter results but never change the score — people want opposite things from them."
        />

        <TristateInput
          label="Can you take a call here?"
          hint="Without disturbing people, or being glared at."
          value={allowsCalls}
          onChange={setAllowsCalls}
        />
        <TristateInput
          label="Air conditioning"
          value={hasAirConditioning}
          onChange={setHasAirConditioning}
        />
        <TristateInput
          label="Restroom for customers"
          value={hasRestroom}
          onChange={setHasRestroom}
        />
      </section>

      <section className="flex flex-col gap-4">
        <SectionHeading title="Anything else?" />

        <Field
          label="A note for other people"
          hint="The practical detail that saves someone a wasted trip — where the sockets are, when it gets busy."
          error={errorFor("comment")}
        >
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={4}
            maxLength={600}
            placeholder="The long table at the back has sockets along its whole length. Gets busy around 1pm."
            className="border-border-strong bg-surface text-foreground placeholder:text-subtle-foreground w-full rounded-lg border px-4 py-3 text-base"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="When were you last there?" error={errorFor("visitedAt")}>
            <Input
              value={visitedAt}
              onChange={(event) => setVisitedAt(event.target.value)}
              placeholder="Last week"
              maxLength={40}
            />
          </Field>

          <Field label="Your name or handle" hint="Optional — shown next to your note.">
            <Input
              value={contributorHandle}
              onChange={(event) => setContributorHandle(event.target.value)}
              placeholder="@yourhandle"
              maxLength={60}
            />
          </Field>
        </div>
      </section>

      {/*
        Honeypot. Hidden from people, filled in by naive bots. `aria-hidden` plus
        tabIndex keeps it away from screen readers and keyboard users alike.
      */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website URL
          <input
            type="text"
            name="website_url"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(event) => setHoneypot(event.target.value)}
          />
        </label>
      </div>

      {formError && (
        <p
          role="alert"
          className="border-score-low/40 bg-score-low/10 text-score-low flex items-start gap-2.5 rounded-lg border p-4 text-sm"
        >
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {formError}
        </p>
      )}

      <div className="border-border flex flex-col gap-3 border-t pt-6">
        <p className="text-muted-foreground text-sm">
          Your submission goes to a moderator before it appears. By submitting you agree to license
          this data under{" "}
          <Link
            href="https://github.com/laryts/cofe/blob/main/DATA-LICENSE"
            className="text-accent underline underline-offset-4"
          >
            ODbL 1.0
          </Link>
          , and confirm it is your own first-hand experience.
        </p>

        <Button type="submit" size="lg" disabled={!canSubmit || status === "submitting"}>
          {status === "submitting" && <LoaderCircle aria-hidden="true" className="animate-spin" />}
          {status === "submitting" ? "Sending…" : messages.contribute.submit}
        </Button>

        {!canSubmit && (
          <p className="text-subtle-foreground text-xs">
            Needs a name, a city, a pin on the map, and at least one rating or a note.
          </p>
        )}
      </div>
    </form>
  );
}

function SectionHeading({ title, hint }: { title: string; hint?: string }) {
  return (
    <div>
      <h2 className="font-display text-foreground text-xl">{title}</h2>
      {hint && <p className="text-muted-foreground mt-1 text-sm text-pretty">{hint}</p>}
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  error,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-foreground text-sm font-medium">
        {label}
        {required && (
          <span className="text-accent ml-1" aria-label="required">
            *
          </span>
        )}
      </span>
      {hint && <span className="text-subtle-foreground text-xs">{hint}</span>}
      {children}
      {error && (
        <span role="alert" className="text-score-low text-xs">
          {error}
        </span>
      )}
    </label>
  );
}

function SubmittedState() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <CheckCircle2 aria-hidden="true" className="text-score-high size-10" />
      <h2 className="font-display text-foreground text-2xl text-balance">
        {messages.contribute.thanksTitle}
      </h2>
      <p className="text-muted-foreground max-w-sm text-balance">
        {messages.contribute.thanksBody}
      </p>

      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Button asChild variant="secondary">
          <Link href="/explore">{messages.home.exploreCta}</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/add">Add another</Link>
        </Button>
      </div>
    </div>
  );
}
