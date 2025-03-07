"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Moon, Sun, Laptop } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering after component mounts
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="bg-background border-primary/20 hover:bg-primary/10">
          {theme === "light" ? (
            <Sun className="h-5 w-5 text-primary" />
          ) : theme === "dark" ? (
            <Moon className="h-5 w-5 text-primary" />
          ) : (
            <Laptop className="h-5 w-5 text-primary" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="border-primary/20">
        <DropdownMenuItem onClick={() => setTheme("light")} className="hover:bg-primary/10 cursor-pointer">
          <Sun className="mr-2 h-4 w-4 text-primary" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="hover:bg-primary/10 cursor-pointer">
          <Moon className="mr-2 h-4 w-4 text-primary" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="hover:bg-primary/10 cursor-pointer">
          <Laptop className="mr-2 h-4 w-4 text-primary" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}