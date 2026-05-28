# Date Invitation

A static, Netlify-ready date invitation flow built with HTML, CSS, JavaScript, a tiny Node.js local server, and one Netlify Function for Resend email.

## Run Locally

```bash
npm start
```

Open `http://localhost:8888`.

## Deploy To Netlify

Use these settings:

- Build command: `npm run check`
- Publish directory: `public`

## Resend Email Setup

The app sends the final choice through `/api/send-response`, a Netlify Function that calls Resend.

Set these environment variables in Netlify under **Site configuration > Environment variables**:

- `RESEND_API_KEY`: your Resend API key
- `DATE_RESPONSE_TO`: `basel.260@gmail.com`
- `RESEND_FROM_EMAIL`: optional. Use an address on your verified Resend domain. If you do not have a verified domain yet, the app defaults to `Date Invitation <onboarding@resend.dev>`.

With Resend's default `onboarding@resend.dev` sender, Resend may only allow sending to the email address on your Resend account. For sending to any Gmail address reliably, verify a domain in Resend and set `RESEND_FROM_EMAIL`.
