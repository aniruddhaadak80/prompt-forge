# Security

## Reporting

Please report suspected vulnerabilities privately through the repository’s GitHub security advisory flow. Do not include credentials or private user data in an issue.

## Boundaries

- Generated artifact HTML is untrusted and runs in a script-only iframe.
- Prompt text, source IDs, titles, and URLs are validated and length-bounded.
- Visitor ownership uses an HTTP-only anonymous scope cookie; it is not authentication.
- Public writes are best-effort protected by serverless request limits and should be paired with a hosted rate limiter for a high-traffic deployment.
- SHA-384 chains provide tamper evidence only; they do not encrypt data or replace authorization.
- The core product does not require or store third-party model API keys.

## Operator checklist

- Set `DATABASE_URL` only through the deployment secret manager.
- Set `NEXT_PUBLIC_SITE_URL` to the verified production alias.
- Review feed providers and external links before adding new origins.
- Keep the database role least-privileged and rotate credentials if exposed.
