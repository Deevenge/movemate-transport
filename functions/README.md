# Driver Application Email Alerts

This Firebase Function sends an email when a user's `driver_application` field is created or changed to a pending/submitted state in Firestore.

It does not need the mobile app to send email directly. The app only needs to keep writing driver applications to:

```text
users/{userId}.driver_application
```

## Setup

1. Create a Gmail app password for the Gmail account that will send the email.
2. Save it as a Firebase secret:

```bash
firebase functions:secrets:set GMAIL_APP_PASSWORD
```

3. Optional: create `functions/.env` if you want sender/recipient addresses different from the default:

```text
GMAIL_EMAIL=williamdeekgaratsi@gmail.com
NOTIFICATION_EMAIL=williamdeekgaratsi@gmail.com
```

For this code, the defaults already send to `williamdeekgaratsi@gmail.com`.

4. Install dependencies and deploy:

```bash
npm --prefix functions install
firebase deploy --only functions:notifyDriverApplication
```

## Notes

- Keep the Gmail app password out of website JavaScript.
- If your mobile app writes driver applications somewhere other than `users/{userId}.driver_application`, update the trigger path and field names in `functions/index.js`.
