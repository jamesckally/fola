export const Loading = () => {
    return (
        <div className="flex items-center justify-center h-screen bg-background">
            <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-[#00ff9d]/30 border-t-[#00ff9d] animate-spin"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00ff9d] to-[#00d9ff] animate-pulse"></div>
                </div>
            </div>
        </div>
    );
};
