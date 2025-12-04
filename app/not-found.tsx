import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
            <h1 className="text-9xl font-bold text-primary mb-4">404</h1>
            <h2 className="text-2xl font-bold text-foreground mb-4">Page Not Found</h2>
            <p className="text-muted-foreground mb-8 max-w-md">
                The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </p>
            <Link href="/dashboard">
                <Button size="lg">Return to Dashboard</Button>
            </Link>
        </div>
    );
}
