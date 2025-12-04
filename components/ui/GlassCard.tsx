interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
}

export default function GlassCard({ children, className = '' }: GlassCardProps) {
    return (
        <div className={`glass p-4 rounded-xl ${className}`}>
            {children}
        </div>
    );
}