"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface NavLinkProps extends React.ComponentPropsWithoutRef<typeof Link> {
    activeClassName?: string;
    pendingClassName?: string; // Kept for compatibility, though not directly used by Next.js router state
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
    ({ className, activeClassName, pendingClassName, href, ...props }, ref) => {
        const pathname = usePathname();
        const isActive = pathname === href;

        return (
            <Link
                ref={ref}
                href={href}
                className={cn(className, isActive && activeClassName)}
                {...props}
            />
        );
    },
);

NavLink.displayName = "NavLink";

export { NavLink };
