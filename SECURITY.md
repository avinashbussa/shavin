# Security Policy

## Supported versions

Shavin is pre-1.0. Security fixes land on the latest `0.x` release and `main`;
older `0.x` versions are not patched. Upgrade to the newest release before reporting.

## Known advisories

- **zod (GHSA-mrhx-c7xc-m3w5, high), in @shavin/block-schema 0.1.0.** zod below 4.6.6 can run out of
  memory when it validates a very large array against an array schema with no length limit. The
  block schemas use zod 3, which has no patched release; the fix is zod 4, a major version, so it
  needs a breaking change to the block schemas and is planned for a later release. If you validate
  block documents that come from untrusted sources, cap the size of the input before parsing it.
  `npm audit` reports this advisory for @shavin/block-schema until then.

## Reporting a vulnerability

**Do not open a public issue for security reports.**

Report privately through GitHub Security Advisories:
[https://github.com/avinashbussa/shavin/security/advisories/new](https://github.com/avinashbussa/shavin/security/advisories/new).
If that is unavailable, email hello@shavin.cc.

Please include a description, affected package and version, and steps to reproduce.
The maintainers aim to acknowledge within 72 hours and to agree a disclosure timeline with you.
