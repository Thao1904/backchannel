# Backchannel Supabase Setup

1. Create a Supabase project.
2. Open the SQL editor and run `supabase/schema.sql`.
3. Add these environment variables to `.env.local`:

```bash
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
NEXT_PUBLIC_REALCHAT_BASE_URL=https://realchat.your-domain.com
```

`NEXT_PUBLIC_REALCHAT_BASE_URL` is optional. If it is missing, QR links use the
current app origin, for example `http://localhost:3000/r`.

The service role key is used only in Next.js API routes. Do not expose it in
client-side code or as a `NEXT_PUBLIC_` variable.

## Flow

- The kiosk creates a room code and join code per chat session.
- The kiosk stores every session locally first.
- If Supabase env vars exist, `/api/kiosk-session` also upserts the session,
  room, and messages into Supabase.
- Mobile users scan the fixed `/r` QR link, enter the join code, and can review
  the matching saved conversation without granting web camera permission.
