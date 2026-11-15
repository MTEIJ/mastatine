"use client";

import { createContext, useContext } from "react";

interface AccountState {
  signedIn: boolean;
  isAdmin: boolean;
}

const AccountStateContext = createContext<AccountState>({ signedIn: false, isAdmin: false });

/**
 * Who is signed in, resolved on the server by the root layout. Reading it here instead of asking the browser's auth
 * client keeps that client (and one extra request per page view) out of every page's JavaScript.
 */
export function AccountStateProvider({ signedIn, isAdmin, children }: AccountState & { children: React.ReactNode }) {
  return <AccountStateContext value={{ signedIn, isAdmin }}>{children}</AccountStateContext>;
}

export function useAccountState(): AccountState {
  return useContext(AccountStateContext);
}
