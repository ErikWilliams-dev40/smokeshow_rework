# Developer Offboarding

Applies to departures, engagement endings, and role changes that reduce required access.

Open an offboarding issue at notice. A technical admin owns it and it stays open until
every item is checked. Target: all access revoked within **4 hours** of the effective time,
or immediately for an involuntary or for-cause departure.

## Access revocation

Owner: technical admin.

- [ ] GitHub org membership removed; all repository access revoked.
- [ ] Personal access tokens, SSH keys and deploy keys revoked.
- [ ] Secret store, cloud, CI/CD, staging and production access removed.
- [ ] Communication and internal tool accounts disabled.
- [ ] Removed from CODEOWNERS, reviewer groups and on-call rotations.
- [ ] Active sessions terminated.
- [ ] Any shared-with-them credential **rotated**, not just revoked
      ([secrets handling](../security/secrets-handling.md)).

## Handover

Owner: departing developer + their manager.

- [ ] Open branches pushed or explicitly abandoned; nothing important left only locally.
- [ ] Open PRs merged, closed or reassigned with a note on current state.
- [ ] Assigned issues reassigned or handed back to the backlog.
- [ ] Undocumented knowledge written down — runbooks, ADRs, README updates.
- [ ] Named successor for anything they solely owned.

## Device and data

Owner: departing developer, confirmed in writing.

- [ ] Local clones of company repositories deleted.
- [ ] Company data, exports and credentials removed from the device, personal cloud
      storage, personal email and any password manager.
- [ ] Company-issued hardware, licenses and hardware tokens returned.
- [ ] For BYOD, written confirmation that deletion is complete
      ([contractor/BYOD rules](../policies/contractor-byod.md)).

## Verification

Owner: technical admin, within 5 business days.

- [ ] Re-audit org membership, repository collaborators and outside collaborators.
- [ ] Review access logs for activity after the effective time.
      Anything found is a security event — [incident reporting](../security/incident-reporting.md).
- [ ] Confirm rotations completed.
- [ ] Record completion on the offboarding issue and close it.

## Role change

Same process, applied selectively: remove access no longer required by the new role,
rotate anything shared, and keep the rest. Least privilege doesn't pause for transitions.
