"use client";
import { KindeProvider } from "@kinde-oss/kinde-auth-nextjs";
import { ReactNode } from "react";

type IAuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: IAuthProviderProps) => {
  return <KindeProvider>{children}</KindeProvider>;
};