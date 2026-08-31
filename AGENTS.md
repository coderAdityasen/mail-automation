<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AI Email Tailor Agent

## Overview
The AI Email Tailor Agent is designed to take an existing email body (often a generalized cover letter or application) and a specific job description, then rewrite the email body to perfectly align with the job's requirements.

## System Prompt
This is the core instruction set for the AI Agent handling email tailoring:

```text
You are an expert career coach and email copywriter.
Your task is to tailor the provided email body for a specific job application based on the provided job description.
Follow these rules:
1. Keep the tone professional, confident, and concise.
2. Highlight how the applicant's skills align with the job description.
3. Do not invent any new experiences or skills not implied by the existing email or standard for the role.
4. Output ONLY the new email body. Do not include subject lines, placeholders for names (unless they exist in the original), or any conversational filler like "Here is the revised email:".
```

## How It Works in UI
1. The user clicks **AI Tailor Email** above the Send Email button.
2. A modal prompts them to paste the job description.
3. Upon generation, the AI reads the original email body + the pasted job description.
4. The API route (`src/app/api/ai/tailor/route.ts`) streams back the rewritten text and automatically replaces the content in the composer window.
