# Whispr Detailed Step-by-Step Manual Setup Guide

This guide provides a comprehensive, step-by-step walkthrough to get the Whispr authentication system running from scratch on your local machine.

---

## Step 1: Clone and Install Dependencies

1. Open your terminal and navigate to the project directory:
   ```bash
   cd c:\Users\singh\Desktop\whispr\code\whispr\whispr\web-v2
   ```
2. Install the necessary dependencies:
   ```bash
   npm install
   ```
3. Copy the example environment file to create your local `.env` file:
   ```bash
   cp .env.example .env
   ```

---

## Step 2: Supabase (PostgreSQL Database) Setup

We use Supabase as our managed PostgreSQL provider.

1. Go to [Supabase](https://supabase.com/) and create an account/login.
2. Click **New Project** and select your organization.
3. Enter a project name (e.g., `whispr`) and a secure database password. Save this password!
4. Once the project is provisioned, go to **Project Settings** (gear icon) -> **Database**.
5. Scroll down to **Connection String** -> **URI**.
6. Copy the connection string. It should look like: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`.
7. Paste this into your `.env` file for **DATABASE_URL**, replacing `[password]` with your actual password.
8. For Prisma migrations, you also need the Direct URL. It is the same string, but change port `6543` to `5432`. Paste this into **DIRECT_URL**.

```env
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

---

## Step 3: Firebase Authentication Setup

Firebase handles the UI portion of Google Sign-in and Phone OTP.

1. Go to the [Firebase Console](https://console.firebase.google.com/) and click **Add project**.
2. Name the project (e.g., `whispr-auth`) and disable Google Analytics (optional).
3. Once created, go to **Build -> Authentication** and click **Get Started**.
4. In the **Sign-in method** tab:
   - Enable **Google** and provide a support email.
   - Enable **Phone**.
5. In the Firebase Dashboard, click the **Web icon** (`</>`) to add a web app to your project. Register it.
6. Copy the `firebaseConfig` object and populate your `.env` file:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`

### Firebase Admin SDK Setup

The backend needs administrative access to verify tokens.

1. Go to **Project Settings** (gear icon next to Project Overview) -> **Service accounts**.
2. Click **Generate new private key**. This will download a JSON file.
3. Open the JSON file in a text editor and copy the respective fields to your `.env` file:
   - `FIREBASE_PROJECT_ID` (e.g., "whispr-auth-12345")
   - `FIREBASE_CLIENT_EMAIL` (e.g., "firebase-adminsdk-xxxxx@whispr-auth-12345.iam.gserviceaccount.com")
   - `FIREBASE_PRIVATE_KEY` (Copy the **entire** string including `-----BEGIN PRIVATE KEY-----`. If there are `\n` characters in the string, wrap the value in double quotes in your `.env` file).

---

## Step 4: Resend (Email Verification) Setup

Resend handles sending verification emails for users who sign up via Phone and need to verify their email address later.

1. Go to [Resend](https://resend.com/) and create an account.
2. Go to **API Keys** and click **Create API Key**.
3. Copy the key and paste it into `RESEND_API_KEY` in your `.env` file.
4. Set the `EMAIL_FROM` variable. 
   > **Note:** Unless you add and verify a custom domain in Resend, you can only send emails from `onboarding@resend.dev` to the email address associated with your Resend account. 

```env
RESEND_API_KEY="re_123456789"
EMAIL_FROM="onboarding@resend.dev"
```

---

## Step 5: Application Security Secrets

You need cryptographically secure strings for JSON Web Token (JWT) signing.

1. Open your terminal and run the following command to generate secure random strings:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Run it twice, and copy the two different strings into your `.env` file:
   ```env
   JWT_ACCESS_SECRET="your_first_random_string"
   JWT_REFRESH_SECRET="your_second_random_string"
   ```
3. Ensure `NEXT_PUBLIC_APP_URL` is set to `http://localhost:3000` for local development.

---

## Step 6: Push Database Migrations

Now that your `.env` file is fully configured, push the Prisma schema to your Supabase database.

1. In your terminal, run:
   ```bash
   npx prisma db push
   ```
   *This command reads `schema.prisma` and creates the `User`, `Session`, `Profile`, and `AuthLog` tables in Supabase.*
2. Generate the Prisma Client to give you TypeScript intellisense:
   ```bash
   npx prisma generate
   ```

---

## Step 7: Run the Application

Start the Next.js development server:

```bash
npm run dev
```

Navigate to [http://localhost:3000/login](http://localhost:3000/login) to test the authentication flows!

---

## Step 8: Production / Long-Term Maintenance

### Setting up Session Cleanup
Tokens and sessions eventually expire but stay in the database. You should set up a cron job to delete them and save space.

**If using Supabase `pg_cron` (Recommended):**
1. Go to the SQL Editor in Supabase.
2. Run the following command to schedule a nightly cleanup job:
   ```sql
   select cron.schedule('nightly-session-cleanup', '0 3 * * *', $$
     DELETE FROM "Session" WHERE "expiresAt" < NOW();
     DELETE FROM "EmailVerification" WHERE "expiresAt" < NOW() OR "used" = true;
   $$);
   ```

Your backend environment is now fully established and production-ready!
