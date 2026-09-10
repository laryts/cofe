"use server";

import { revalidatePath } from "next/cache";

import {
  isModerationConfigured,
  isModerator,
  signInModerator,
  signOutModerator,
} from "@/server/moderation-auth";
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

async function requireModerator(): Promise<void> {
  if (!(await isModerator())) throw new Error("Not authorised");
}

export async function signIn(_prev: unknown, formData: FormData) {
  if (!isModerationConfigured()) {
    return { error: "Moderation is not configured on this deployment." };
  }

  const token = String(formData.get("token") ?? "");
  const ok = await signInModerator(token);

  if (!ok) return { error: "That token is not right." };

  revalidatePath("/moderate");
  return { error: null };
}

export async function signOut() {
  await signOutModerator();
  revalidatePath("/moderate");
}

export async function approveCafeAction(formData: FormData) {
  await requireModerator();
  await approveCafe(String(formData.get("id")));
  revalidatePath("/moderate");
  revalidatePath("/explore");
  revalidatePath("/");
}

export async function rejectCafeAction(formData: FormData) {
  await requireModerator();
  await rejectCafe(String(formData.get("id")), String(formData.get("note") ?? "") || undefined);
  revalidatePath("/moderate");
}

export async function approveReportAction(formData: FormData) {
  await requireModerator();
  const id = String(formData.get("id"));
  await approveReport(id);
  revalidatePath("/moderate");
  revalidatePath("/explore");
}

export async function rejectReportAction(formData: FormData) {
  await requireModerator();
  await rejectReport(String(formData.get("id")), String(formData.get("note") ?? "") || undefined);
  revalidatePath("/moderate");
}
