"use client";
import { ClerkProvider } from "@clerk/nextjs";

import { dark, neobrutalism, shadesOfPurple } from '@clerk/themes';
import { ReactNode } from 'react';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  return <ClerkProvider appearance={{
    baseTheme: [dark, neobrutalism],
    variables: { colorPrimary: 'orange' },
    signIn: {
      baseTheme: [shadesOfPurple],
      variables: { colorPrimary: 'blue' },
    },
  }}>{children}</ClerkProvider>;
};