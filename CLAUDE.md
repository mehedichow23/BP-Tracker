# BP Tracker

## What this is
A private blood pressure and pulse tracking web app for exactly two users:
me (Mehedi) and my wife. Not a public product. No signup flow needed.
The two accounts (mehedichow23@gmail.com, narjis2612@gmail.com) are
provisioned directly in Supabase Auth via scripts/create-users.mjs.
Public sign-up is turned off in the Supabase dashboard.

## Core flow
Login → "Take Reading" → photo of BP monitor (or manual entry) →
confirm/edit parsed values → save → list view → filter/select → export PDF → share.

## Stack
- Next.js 15 (App Router), TypeScript, Tailwind, shadcn/ui
- Supabase: Postgres + Auth (email + password, sign-up disabled) + Storage
- Claude API (vision) for reading the BP monitor LCD
- @react-pdf/renderer for PDF generation
- Web Share API for sharing to WhatsApp
- Deployed on Vercel at bp.mehedichowdhury.com

## Data model
profiles: id (uuid, FK auth.users), display_name, household_id, created_at
readings: id, user_id, systolic (int, 40-300), diastolic (int, 20-200),
          pulse (int, 20-250, nullable), taken_at (timestamptz),
          notes (text, nullable), image_path (text, nullable),
          source ('manual' | 'ocr'), created_at, updated_at

Systolic, diastolic, and taken_at are mandatory. Pulse and notes are optional.
All fields must be editable after save.

## Access rules
Both users share a household_id. Both can READ all readings in the household.
Each user can only WRITE/UPDATE/DELETE their own readings. Enforced via Supabase RLS,
not application code.

## Non-negotiables
- OCR output is NEVER auto-saved. It always lands on a confirm screen for review.
- If OCR fails, fall back to an empty manual form. Never a dead end.
- Mobile-first. This is used on phones, standing in a kitchen.
- Store timestamps as timestamptz (UTC). Display in the reading creator's
  local timezone and label the timezone explicitly in the PDF.
- Never expose ANTHROPIC_API_KEY or SUPABASE_SERVICE_ROLE_KEY to the client.

## Conventions
- Server Components by default. 'use client' only where interactivity requires it.
- Zod for all form and API validation.
- Validation ranges must match the DB check constraints exactly.
- date-fns for date handling. No moment.js.
- No em dashes in any user-facing copy.

## Build order
Phase 1: Foundation (auth, schema, RLS)
Phase 2: Manual CRUD (create, list, edit, delete) — must fully work before Phase 3
Phase 3: Photo capture + Claude vision OCR
Phase 4: PDF export + share
Phase 5: PWA, charts, polish

Do not skip ahead. Do not build Phase 3 before Phase 2 works end to end.
