"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const sessionCookie = "cms_admin_session";

function getSessionToken() {
  return process.env.ADMIN_SESSION_SECRET || "local-dev-secret";
}

function isValidToken(token: string | undefined) {
  return token === getSessionToken();
}

export async function isAdminAuthenticated() {
  const token = (await cookies()).get(sessionCookie)?.value;
  return isValidToken(token);
}

export async function requireAdmin() {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    redirect("/login");
  }
}

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") || "");

  if (password !== (process.env.ADMIN_PASSWORD || "changeme")) {
    redirect("/login?error=1");
  }

  (await cookies()).set(sessionCookie, getSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  redirect("/admin");
}

export async function logoutAction() {
  (await cookies()).delete(sessionCookie);
  redirect("/login");
}
