import { describe, expect, it } from "vitest";

import {
  attributionFor,
  canManageRoles,
  canModerate,
  canSubmitContribution,
  isUserRole,
  parseModeratorEmails,
  resolveRole,
  roleFromModeratorList,
  type Principal,
} from "./permissions";

const visitor = null;
const member: Principal = { id: "u1", role: "user" };
const moderator: Principal = { id: "u2", role: "moderator" };
const admin: Principal = { id: "u3", role: "admin" };

describe("canSubmitContribution", () => {
  it.each([
    ["an anonymous visitor", visitor],
    ["a signed-in member", member],
    ["a moderator", moderator],
  ])("allows %s — contributing never requires an account", (_label, principal) => {
    expect(canSubmitContribution(principal)).toBe(true);
  });
});

describe("canModerate", () => {
  it("refuses anonymous visitors", () => {
    expect(canModerate(visitor)).toBe(false);
  });

  it("refuses ordinary members — an account is not a permission", () => {
    expect(canModerate(member)).toBe(false);
  });

  it.each([
    ["a moderator", moderator],
    ["an admin", admin],
  ])("allows %s", (_label, principal) => {
    expect(canModerate(principal)).toBe(true);
  });
});

describe("canManageRoles", () => {
  it.each([
    ["anonymous", visitor, false],
    ["member", member, false],
    ["moderator", moderator, false],
    ["admin", admin, true],
  ])("%s -> %s", (_label, principal, expected) => {
    // A moderator reviewing submissions must not be able to appoint moderators.
    expect(canManageRoles(principal)).toBe(expected);
  });
});

describe("attributionFor", () => {
  it("attributes a signed-in contributor", () => {
    expect(attributionFor(member)).toBe("u1");
  });

  it("never invents an author for an anonymous contribution", () => {
    expect(attributionFor(visitor)).toBeNull();
  });
});

describe("roleFromModeratorList", () => {
  const list = ["owner@example.com", " Second@Example.COM "];

  it("grants moderator to a listed email", () => {
    expect(roleFromModeratorList("owner@example.com", list)).toBe("moderator");
  });

  it("ignores capitalisation and surrounding whitespace on both sides", () => {
    // Being locked out of your own deployment over a capital letter would be silly.
    expect(roleFromModeratorList("SECOND@example.com", list)).toBe("moderator");
    expect(roleFromModeratorList("  owner@example.com  ", list)).toBe("moderator");
  });

  it("grants nothing to an unlisted email", () => {
    expect(roleFromModeratorList("someone@example.com", list)).toBeNull();
  });

  it.each([[null], [undefined], [""], ["   "]])("grants nothing for %s", (email) => {
    expect(roleFromModeratorList(email, list)).toBeNull();
  });

  it("grants nothing when the list is empty", () => {
    expect(roleFromModeratorList("owner@example.com", [])).toBeNull();
  });
});

describe("resolveRole", () => {
  it("keeps an existing elevated role even when the config no longer lists them", () => {
    // Removing an email from an env var must not silently demote a moderator;
    // demotion should be a deliberate act.
    expect(resolveRole("moderator", null)).toBe("moderator");
    expect(resolveRole("admin", null)).toBe("admin");
  });

  it("does not let the configured list downgrade an admin to moderator", () => {
    expect(resolveRole("admin", "moderator")).toBe("admin");
  });

  it("promotes a plain user named in the configured list", () => {
    expect(resolveRole("user", "moderator")).toBe("moderator");
  });

  it("defaults a brand new person to the lowest role", () => {
    expect(resolveRole(null, null)).toBe("user");
  });
});

describe("parseModeratorEmails", () => {
  it.each([
    [undefined, []],
    ["", []],
    ["a@x.com", ["a@x.com"]],
    ["a@x.com, b@x.com", ["a@x.com", "b@x.com"]],
    ["a@x.com,,  ,b@x.com ", ["a@x.com", "b@x.com"]],
  ])("parses %s", (raw, expected) => {
    expect(parseModeratorEmails(raw)).toEqual(expected);
  });
});

describe("isUserRole", () => {
  it.each([
    ["user", true],
    ["moderator", true],
    ["admin", true],
    ["superuser", false],
    ["", false],
  ])("%s -> %s", (value, expected) => {
    expect(isUserRole(value)).toBe(expected);
  });
});
