# Security Scan Report (2026-03-28)

## Scope
- Scanned client/shared/supabase function code for general web vulnerabilities and XSS vectors.
- Excluded smart contracts and P2P/smart-contract-related code paths per request.

## Methods Used
- Pattern search for risky DOM/JS sinks (`dangerouslySetInnerHTML`, `innerHTML`, `eval`, inline script APIs).
- Manual review of sanitizer utilities and all discovered HTML injection sinks.
- Attempted dependency vulnerability audit with `npm audit --omit=dev`.

## Findings

### 1) URL sanitization too permissive in rich HTML sanitizers (Fixed)
**Risk:** Medium

`sanitizeRichText`/`sanitizeBlogHtml` sanitized HTML but did not explicitly constrain URI schemes through `ALLOWED_URI_REGEXP`.
While DOMPurify blocks many dangerous cases by default, explicit protocol allowlisting reduces bypass risk and makes policy unambiguous.

**Fix applied:**
- Added strict URL allowlists:
  - Rich text links: `https`, `http`, `mailto`, `tel`, root-relative paths, hash links.
  - Blog image/link context: `https`, `http`, root-relative paths only.

### 2) Notification list used unsanitized image URL (Fixed)
**Risk:** Medium

Announcement list rendered `announcement.image_url` directly in `img.src` in one path while other paths already used `sanitizeImageUrl`.

**Fix applied:**
- Replaced direct usage with `sanitizeImageUrl(announcement.image_url)`.

### 3) Notification metadata URL could navigate to non-internal paths (Fixed)
**Risk:** Medium

Notifications accepted `notification.metadata.url` and passed it to router navigation without checking it was an internal route.

**Fix applied:**
- Added strict internal-route check (`startsWith('/')`) before navigation.
- Non-internal values are blocked and logged.

### 4) Duplicate image sanitizer implementation in blog page (Fixed)
**Risk:** Low (consistency/maintenance)

`blog.tsx` had a local sanitizer differing from centralized sanitizer policy.

**Fix applied:**
- Removed local implementation and imported shared `sanitizeImageUrl`.

## Dependency Audit Status
- `npm audit --omit=dev` could not complete in this environment due upstream registry endpoint returning HTTP 403.
- This is an environment limitation, not a code-level pass/fail.

## Residual Recommendations
1. Add automated lint rules for dangerous DOM APIs (`innerHTML`, `dangerouslySetInnerHTML`) with sanitizer exceptions.
2. Add unit tests for sanitizer behavior against representative payloads.
3. Add CSP headers (`default-src`, `img-src`, `script-src`) to reduce XSS impact even if injection occurs.
