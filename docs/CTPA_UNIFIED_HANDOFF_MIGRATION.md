# WorkforceApps → unified C/TPA handoff

Scope: Reuse the existing central Workforce login at workforceapps.screenings4u.com, existing selector.html, selector.js and existing one-time portal-session-handoff flow. No second login or duplicate selector.

## Authorization and target

- DOT C/TPA: keep portal_code=ctpa_dot, surface=dot. Existing secure handoff to https://ctpa.screenings4u.com/auth-handoff.html and existing C/TPA DOT workspace remain unchanged.
- NON-DOT C/TPA: keep portal_code=ctpa_workforce, surface=workforce and independent purchased Workforce subscription, but stage a redirect to the same canonical hostname https://ctpa.screenings4u.com/auth-handoff.html.
- The selector's **one C/TPA card** already shows DOT and NON-DOT contexts based on actual authorized server rows; it must never grant a context by changing a label.
- The central handoff server must validate the exact selected active NON-DOT membership **and** subscription before generating its single-use transfer token.
- The C/TPA auth-handoff.js receiver must redeem that token, verify it belongs to ctpa_workforce, validate selected ctpa_id, subscription_id, membership_id through nondot-workforce-session-context, then open /nondot-workspace.html without another login.
- NON-DOT-only portal sessions can access only the NON-DOT read-only workspace while remaining feature workflows migrate. The existing DOT C/TPA pages require a separate verified DOT subscription and cannot be opened using a NON-DOT handoff.
- All sensitive reads and writes remain governed by backend company, membership, purchased-feature and role rules. The new NON-DOT workspace API returns sanitized summaries only and requires exact verified ctpa/organization matching.
- Users with multiple C/TPA subscriptions must select a real authorized card. No arbitrary fallback to the first membership/subscription.
- Retain original ctpa-non-dot.screenings4u.com destination until a complete authenticated preproduction test and management approval.

## Changes staged, not released

- `workforceapps.screenings4u.com` migration branch: selector.js accepts canonical C/TPA host for either portal_code, preserving authorized-card handoff; selector.html loads the versioned script.
- `app.screenings4u.com` migration branch: source of portal-session-handoff v96 staged to return canonical hostname for ctpa_workforce, select exact active membership+subscription, and include trialing. **This replacement has NOT been deployed; the live function still directs NON-DOT C/TPA to the legacy host.**
- `ctpa.screenings4u.com` migration branch: auth-handoff.js accepts either verified DOT or NON-DOT one-time target, verifies exact NON-DOT plan and membership, and saves operating context; session-security.js revalidates NON-DOT access without cached authorization; app.js restricts NON-DOT-only sessions to read-only NON-DOT pages.
- New separately deployed `workforce-ctpa-unified-workspaces` enables read-only discovery of both DOT and NON-DOT existing memberships. The read-only NON-DOT workspace service is separately deployed.
- All deployed new APIs are protected by JWT; no subscription or authorization records were modified to facilitate handoff.

## Required verification before changing production

1. Confirm DOT-only C/TPA with existing subscription goes through the unchanged DOT handoff to its original dashboard.
2. Confirm NON-DOT-only C/TPA uses the existing WorkforceApps login and card, receives no second login and opens ONLY /nondot-workspace.html.
3. Confirm organization with both surfaces sees one C/TPA category card with two authorized context choices and opens the matching business surface.
4. Confirm the selection rejects another organization ID, another subscription ID, invalid/used/expired handoff, revoked membership and expired subscription.
5. Confirm direct /dashboard.html, test orders and official result downloads are unavailable to a NON-DOT-only account until their backend write features are migrated.
6. Verify mobile selector, branch deployment, CORS, Supabase OTP redemption and browser authentication/session lifecycle.
7. Only after all checks pass: deploy canonical central handoff, point the selector to that release, then monitor and preserve a rollback to the legacy NON-DOT hostname.
8. Do not delete the old repo or redirect until all NON-DOT actions and records have been migrated and tested.

Training and LMS portals are out of scope.
