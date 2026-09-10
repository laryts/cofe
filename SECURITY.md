# Security Policy

## Reporting a vulnerability

**Please do not open a public issue for a security vulnerability.**

Report it privately through GitHub's
[private vulnerability reporting](https://github.com/laryts/cofe/security/advisories/new), which
opens a confidential channel with the maintainers.

Please include:

- What the issue is and where in the codebase
- Steps to reproduce, or a proof of concept
- What an attacker could actually achieve with it

### What to expect

| | |
| --- | --- |
| Acknowledgement | Within 5 days |
| Initial assessment | Within 14 days |
| Fix or mitigation plan | Communicated once assessed |

co-fe is a volunteer-run open source project, so these are honest intentions rather than a
contractual SLA. We would rather tell you that plainly than promise a 24-hour response we cannot
keep.

We will credit you in the advisory unless you prefer otherwise.

## Scope

**In scope**

- The application code in this repository
- SQL injection, XSS, SSRF, authentication or authorisation flaws
- Exposure of secrets, or of data that should not be public
- Dependency vulnerabilities with a realistic exploit path here

**Out of scope**

- Vulnerabilities in third-party services (report those to the service)
- Issues requiring physical access, or a compromised user device
- Missing hardening headers with no demonstrated impact
- Automated scanner output with no working proof of concept
- Denial of service through sheer volume

## Notes for people running their own instance

- **Set `GEOCODING_USER_AGENT`** to something identifying your deployment. The default identifies
  this project, and sending unattributable traffic to a shared public geocoder is both rude and
  likely to get your instance blocked.
- **Never commit `.env`.** It is gitignored; keep it that way.
- **`DATABASE_URL` is server-only.** It is imported behind the `server-only` package, so leaking it
  into a client bundle is a build error rather than a silent disaster — please do not work around
  that.
- **The public geocoding proxy is rate limited per process, not globally.** Behind more than one
  instance you need a shared limiter or a self-hosted geocoder.

## Data privacy

co-fe collects no personal data in its current form. There are no accounts, no cookies for tracking,
and no analytics. Browser geolocation, when granted, is used in the page to centre a search and is
never stored or transmitted to our server.

When accounts arrive in V1 this section will be revised before that code ships, not after.
