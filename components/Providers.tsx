"use client";

import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ReactNode, useEffect, useState } from "react";
import { ThemeProvider } from "next-themes";

const client = new QueryClient();

const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <QueryClientProvider client={client}>
      <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
    </QueryClientProvider>
  );
};

export default Providers;
