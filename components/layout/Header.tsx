import Image from 'next/image';
import { Switch } from '@/components/ui/switch';

export default function Header() {
    return (
        <div className="flex justify-between items-center mb-6">
            <Image src="/logo.svg" alt="SwapaWallet" width={140} height={40} />
            <Switch checked={true} onCheckedChange={() => { }} />
        </div>
    );
}