import type { Metadata } from "next";

import { AddCafeForm } from "@/components/contribute/add-cafe-form";
import { messages } from "@/lib/i18n";

export const metadata: Metadata = {
  title: messages.contribute.title,
  description:
    "Add a café to co-fe. Tell people what the Wi-Fi, power, seating and noise are actually like.",
  alternates: { canonical: "/add" },
};

export default function AddCafePage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-foreground text-3xl text-balance sm:text-4xl">
        {messages.contribute.title}
      </h1>
      <p className="text-muted-foreground mt-3 text-lg text-balance">
        {messages.contribute.subtitle}
      </p>

      <div className="mt-10">
        <AddCafeForm />
      </div>
    </div>
  );
}
