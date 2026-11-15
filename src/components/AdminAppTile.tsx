"use client";

import AppTile from "@/components/AppTile";
import { ADMIN_APP } from "@/content/apps";
import { useAccountState } from "@/components/AccountState";

/** Only admins see the admin tile; the root layout tells us who is signed in. */
export default function AdminAppTile() {
  const { isAdmin } = useAccountState();
  if (!isAdmin) return null;
  return (
    <li>
      <AppTile app={ADMIN_APP} />
    </li>
  );
}
