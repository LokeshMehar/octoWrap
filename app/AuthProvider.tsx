"use client";
import { ClerkProvider } from "@clerk/nextjs";

import { dark, neobrutalism} from '@clerk/themes';
import { ReactNode } from 'react';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  return <ClerkProvider appearance={{
    baseTheme: [dark, neobrutalism],
    
  }}>{children}</ClerkProvider>;
};