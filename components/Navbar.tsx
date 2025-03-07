"use client";
import Link from "next/link";
import MaxWidthWrapper from "./pieces/MaxWidthWrapper";
import {
  SignInButton,
  SignOutButton,
  SignUpButton,
  useUser,
} from "@clerk/nextjs";
import { buttonVariants } from "./ui/button";
import { ArrowRight } from "lucide-react";
// import ThemeSwitcher from "./theme/theme-switcher";

const Navbar = () => {
  const { user, isSignedIn } = useUser();
  const isAdmin = user?.emailAddresses.some(
    (email) => email.emailAddress === process.env.NEXT_PUBLIC_ADMIN_EMAIL
  );

  return (
    <nav className="sticky top-4 z-50">
      <MaxWidthWrapper>
        <div className="inset-x-0 mx-auto flex h-14 w-full items-center justify-between rounded-xl bg-white/75 px-4 shadow-md backdrop-blur-lg transition-all dark:bg-gray-900 dark:text-white">
          <Link href="/" className="z-40 flex font-semibold">
            case<span className="text-green-600 dark:text-green-400">cobra</span>
          </Link>

          <div className="flex h-full items-center space-x-4">
            {/* <ThemeSwitcher /> */}
            {isSignedIn ? (
              <>
                <SignOutButton>
                  <Link
                    href="#"
                    className={buttonVariants({ size: "sm", variant: "ghost" })}
                  >
                    Sign out
                  </Link>
                </SignOutButton>

                {isAdmin && (
                  <Link
                    href="/dashboard"
                    className={buttonVariants({ size: "sm", variant: "ghost" })}
                  >
                    Dashboard ✨
                  </Link>
                )}
              </>
            ) : (
              <>
                <SignUpButton>
                  <Link
                    href="#"
                    className={buttonVariants({ size: "sm", variant: "ghost" })}
                  >
                    Sign up
                  </Link>
                </SignUpButton>

                <SignInButton>
                  <Link
                    href="#"
                    className={buttonVariants({ size: "sm", variant: "ghost" })}
                  >
                    Login
                  </Link>
                </SignInButton>
              </>
            )}

            <div className="h-8 w-px bg-gray-300 dark:bg-gray-600 hidden sm:block" />
            <Link
              href="/configure/upload"
              className={buttonVariants({
                size: "sm",
                className: "hidden sm:flex items-center gap-1",
              })}
            >
              Create case
              <ArrowRight className="ml-1.5 h-5 w-5" />
            </Link>
          </div>
        </div>
      </MaxWidthWrapper>
    </nav>
  );
};

export default Navbar;
