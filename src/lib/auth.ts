import { betterAuth } from "better-auth";
import { admin, emailOTP, magicLink } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { Pool } from "pg";
import { requireEnv, siteUrl } from "@/lib/env";
import sql from "@/lib/db";
import { sendMail } from "@/lib/mailer";
import { changeEmailConfirmationEmail, changeEmailVerificationEmail, magicLinkEmail } from "@/lib/email-templates";
import { validateDisplayName } from "@/lib/profile";
import { allowMagicLinkFor } from "@/lib/magic-link-limit";
import { deleteSubscriberByEmail } from "@/lib/newsletter";
import { deleteAccountVotes } from "@/lib/voter-account";

const MAGIC_LINK_TTL_SECONDS = 10 * 60;
const SIGN_IN_CODE_LENGTH = 6;
const SIGN_IN_CODE_MAX_ATTEMPTS = 3;
// The email-OTP plugin ships endpoints for verification, password reset and email change. Only sign-in is used here.
const UNUSED_OTP_PATHS = [
  "/email-otp/send-verification-otp",
  "/email-otp/check-verification-otp",
  "/email-otp/verify-email",
  "/email-otp/request-password-reset",
  "/forget-password/email-otp",
  "/email-otp/reset-password",
  "/email-otp/request-email-change",
  "/email-otp/change-email",
];
const CHANGE_EMAIL_TTL_SECONDS = 60 * 60;

declare global {
  var _authPool: Pool | undefined;
}

function adminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

/**
 * The emailed link and code are two ways into one sign-in, so a successful sign-in by either spends both.
 * The magic link row is keyed by a token hash, so it is found by the address inside its JSON value.
 */
async function discardPendingSignIns(email: string): Promise<void> {
  const address = email.trim().toLowerCase();
  await sql`
    DELETE FROM verification
    WHERE identifier = ${`sign-in-otp-${address}`}
       OR CASE WHEN identifier LIKE 'magic-link:%' THEN lower(value::jsonb ->> 'email') END = ${address}`;
}

function createAuth() {
  const pool = (globalThis._authPool ??= new Pool({
    connectionString: requireEnv("DATABASE_URL"),
    max: 5,
  }));

  return betterAuth({
    appName: "M.A. Mastatine",
    baseURL: siteUrl(),
    secret: requireEnv("BETTER_AUTH_SECRET"),
    trustedOrigins: [siteUrl()],
    // The admin plugin's endpoints that act as, or rewrite, another account are not used by this app. Closed so a stolen admin
    // session cannot become the treasurer (see also getFinanceAccess).
    disabledPaths: ["/admin/impersonate-user", "/admin/stop-impersonating", "/admin/create-user", "/admin/update-user", "/admin/set-user-password", ...UNUSED_OTP_PATHS],
    database: pool,
    // The signed cookie cache saves a session + user lookup on most requests; a ban or role change can take up to a minute to apply.
    session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24, cookieCache: { enabled: true, maxAge: 60 } },
    emailVerification: {
      expiresIn: CHANGE_EMAIL_TTL_SECONDS,
      // Only used by the email change: sign-in links already prove an address, so accounts start verified.
      // This is the second step: the current address has already approved the change (see sendChangeEmailConfirmation).
      sendVerificationEmail: async ({ user, url }) => {
        await sendMail({ to: user.email, ...changeEmailVerificationEmail(url, CHANGE_EMAIL_TTL_SECONDS / 60) });
      },
    },
    user: {
      // The current address must approve first, so a stolen session cannot move the account to the thief's inbox.
      changeEmail: {
        enabled: true,
        sendChangeEmailConfirmation: async ({ user, newEmail, url }) => {
          await sendMail({ to: user.email, ...changeEmailConfirmationEmail(newEmail, url, CHANGE_EMAIL_TTL_SECONDS / 60) });
        },
      },
      deleteUser: {
        enabled: true, // requires a fresh session, so a stolen old cookie cannot erase an account
        afterDelete: async (user) => {
          await deleteSubscriberByEmail(user.email);
          await deleteAccountVotes(user.id);
        },
      },
    },
    advanced: {
      useSecureCookies: process.env.NODE_ENV === "production",
      // The route handler replaces this header with the address resolved by clientIp() (see api/auth/[...all]/route.ts).
      ipAddress: { ipAddressHeaders: ["x-forwarded-for"] },
    },
    rateLimit: {
      enabled: true,
      window: 60,
      max: 60,
      customRules: {
        "/sign-in/magic-link": { window: 60, max: 3 },
        "/magic-link/verify": { window: 60, max: 10 },
        "/sign-in/email-otp": { window: 60, max: 10 },
        "/change-email": { window: 3600, max: 5 },
      },
    },
    databaseHooks: {
      session: {
        create: {
          // Addresses added to ADMIN_EMAILS later are promoted at their next sign-in (the link or code proves the address is theirs).
          after: async (session) => {
            // Signing in is what keeps a membership from lapsing (see is_member).
            const [row] = await sql<{ email: string; role: string }[]>`UPDATE "user" SET last_active_at = NOW() WHERE id = ${session.userId} RETURNING email, role`;
            if (!row) return;
            if (row.role !== "admin" && adminEmails().has(row.email.toLowerCase())) {
              await sql`UPDATE "user" SET role = 'admin' WHERE id = ${session.userId}`;
            }
            await discardPendingSignIns(row.email);
          },
        },
      },
      user: {
        update: {
          // /api/auth/update-user is public: keep the display-name rules and refuse profile pictures we never show.
          before: async (data) => {
            const rest: Record<string, unknown> = { ...data };
            delete rest.image;
            if (typeof rest.name === "string") {
              const checked = validateDisplayName(rest.name);
              if ("error" in checked) return false;
              rest.name = checked.name;
            }
            return { data: rest };
          },
        },
        create: {
          // Users are only created once an emailed magic link is opened, so the address is verified.
          before: async (user) => ({
            data: { ...user, role: adminEmails().has(user.email.toLowerCase()) ? "admin" : "user" },
          }),
        },
      },
    },
    plugins: [
      magicLink({
        expiresIn: MAGIC_LINK_TTL_SECONDS,
        storeToken: "hashed",
        sendMagicLink: async ({ email, url }) => {
          // Silently skip when one address is being hammered; the caller always sees "check your email".
          if (!allowMagicLinkFor(email)) return;
          // The same email carries a one-time code, so the link and the code are two ways to finish one sign-in.
          const code = await getAuth().api.createVerificationOTP({ body: { email, type: "sign-in" } });
          await sendMail({ to: email, ...magicLinkEmail(url, MAGIC_LINK_TTL_SECONDS / 60, code) });
        },
      }),
      emailOTP({
        otpLength: SIGN_IN_CODE_LENGTH,
        expiresIn: MAGIC_LINK_TTL_SECONDS,
        allowedAttempts: SIGN_IN_CODE_MAX_ATTEMPTS,
        storeOTP: "hashed",
        // Codes are created in sendMagicLink and mailed together with the link, never sent on their own.
        sendVerificationOTP: async () => {},
      }),
      admin({ defaultRole: "user", adminRoles: ["admin"] }),
      nextCookies(), // keep last
    ],
  });
}

type Auth = ReturnType<typeof createAuth>;
let instance: Auth | undefined;

/** Lazily created so `next build` does not need runtime secrets. */
export function getAuth(): Auth {
  return (instance ??= createAuth());
}
