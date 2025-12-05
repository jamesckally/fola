/*
import { publicClient } from './canton';
import { creditRPSend } from './rewards';

publicClient.watchEvent({
    event: {
        type: 'event',
        name: 'Transfer',
        inputs: [
            { name: 'from', type: 'address' },
            { name: 'to', type: 'address' },
            { name: 'value', type: 'uint256' }
        ]
    },
    onLogs: async (logs) => {
        for (const log of logs) {
            const sender = log.args.from;
            const user = await User.findOne({ address: sender });
            if (user) {
                await creditRPSend(user._id.toString());
            }
        }
    }
});
*/