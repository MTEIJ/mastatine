"use client";

import AppTile from "@/components/AppTile";
import { FINANCE_APP } from "@/content/apps";
import { useAccountState } from "@/components/AccountState";

/** Only the treasurer and auditors see the finance tile; the root layout tells us who is signed in. */
export default function FinanceAppTile() {
  const { isFinance } = useAccountState();
  if (!isFinance) return null;
  return (
    <li>
      <AppTile app={FINANCE_APP} />
    </li>
  );
}
