"use server";

import { revalidatePath } from "next/cache";

import { canModerate } from "@/domain/auth";
import { getPrincipal } from "@/server/auth";
import {
  approveCafe,
  approveReport,
  rejectCafe,
  rejectReport,
} from "@/server/services/submission-service";

/**
 * Moderation actions.
 *
 * ★ Every one of these re-checks `isModerator()` server-side. The page already
 * gates rendering, but a Server Action is a public endpoint: anyone can invoke
 * it directly, and a hidden button is not an access control.
 */

/**
 * Resolve the acting moderator, or refuse.
 *
 * Returns the principal rather than a boolean so every action records *who*
 * decided — recording who decided is the whole point of having accounts.
 */
async function requireModerator(): Promise<{ id: string }> {
  const principal = await getPrincipal();
  if (!canModerate(principal)) throw new Error("Not authorised");
  return principal as { id: string };
}

export async function approveCafeAction(formData: FormData) {
  const moderator = await requireModerator();
  await approveCafe(String(formData.get("id")), moderator.id);
  revalidatePath("/moderate");
  revalidatePath("/explore");
  revalidatePath("/");
}

export async function rejectCafeAction(formData: FormData) {
  const moderator = await requireModerator();
  await rejectCafe(
    String(formData.get("id")),
    moderator.id,
    String(formData.get("note") ?? "") || undefined,
  );
  revalidatePath("/moderate");
}

export async function approveReportAction(formData: FormData) {
  const moderator = await requireModerator();
  await approveReport(String(formData.get("id")), moderator.id);
  revalidatePath("/moderate");
  revalidatePath("/explore");
}

export async function rejectReportAction(formData: FormData) {
  const moderator = await requireModerator();
  await rejectReport(
    String(formData.get("id")),
    moderator.id,
    String(formData.get("note") ?? "") || undefined,
  );
  revalidatePath("/moderate");
}
