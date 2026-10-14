# Release-note style

Inspect previous notes, but do not blindly copy the newest body: it may be auto-generated. User corrections and accepted examples take precedence.

Default to `## Changes` and short plain-language bullets describing final behavior. Combine PRs addressing the same outcome; put their numbers in parentheses. Keep the full changelog link for GitHub. Avoid PR-title dumps, author boilerplate, marketing introductions, and download inventories unless the project expects them.

```markdown
## Changes

- Keep Staff History columns readable with synchronized horizontal scrolling (#19).
- Restore calendar date selection and alignment (#18).
- Restore grid icons and selected-row readability (#16, #17).
```

Use merged PRs as evidence, then check their combined diff. Changes introduced and removed before reaching upstream are not product history. Within one release interval, describe the final feature instead of listing intermediate fixes. Mention a regression fix only when the affected behavior actually shipped to that destination.

Each referenced PR must belong to the relevant interval. Cover significant user-visible changes; group or omit minor internal work. Do not infer security fixes or performance promises from commit titles alone.

Store notes match that destination's language and formatting. Adapt PR references to supported rendering; retain traceability locally if public notes omit PR numbers. Handle configured locales without overwriting unrelated translations.
