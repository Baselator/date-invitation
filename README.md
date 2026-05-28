# Date Invitation

A static, Netlify-ready date invitation flow built with HTML, CSS, JavaScript, and a tiny Node.js local server.

## Run Locally

```bash
npm start
```

Open `http://localhost:8888`.

## Deploy To Netlify

Use these settings:

- Build command: `npm run check`
- Publish directory: `public`

The app submits the final choice to a Netlify Form named `date-response`. To receive emails at `basel.260@gmail.com`, deploy the site, then add an email notification in Netlify under **Project configuration > Notifications** for form submissions.
