import User from '../models/User';
import Referral from '../models/Referral';
import { WalletService } from './wallet';
import mongoose from 'mongoose';
import { randomBytes } from 'crypto';

const REFERRAL_BONUS = 1.00; // $1 USDT per referral
const MAX_REFERRALS = 30; // Maximum referrals per user

/**
 * Referral System Service
 */
export class ReferralService {
    /**
     * Generate unique referral code for user
     */
    static async generateReferralCode(userId: string): Promise<string> {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // If user already has a code, return it
        if (user.referralCode) {
            return user.referralCode;
        }

        // Generate unique code
        let referralCode = '';
        let isUnique = false;

        while (!isUnique) {
            // Generate 8-character alphanumeric code
            referralCode = randomBytes(4).toString('hex').toUpperCase();

            // Check if unique
            const existing = await User.findOne({ referralCode });
            if (!existing) {
                isUnique = true;
            }
        }

        // Save code to user
        await User.updateOne({ _id: userId }, { referralCode });

        return referralCode;
    }

    /**
     * Apply referral code during user registration
     */
    static async applyReferralCode(
        newUserId: string,
        referralCode: string
    ): Promise<void> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Find referrer by code
            const referrer = await User.findOne({ referralCode }).session(session);
            if (!referrer) {
                await session.abortTransaction();
                throw new Error('Invalid referral code');
            }

            // Check if referrer has reached max referrals
            if (referrer.totalReferrals >= MAX_REFERRALS) {
                await session.abortTransaction();
                throw new Error('Referrer has reached maximum referrals');
            }

            // Check if new user already has a referrer
            const newUser = await User.findById(newUserId).session(session);
            if (newUser?.referredBy) {
                await session.abortTransaction();
                throw new Error('User already has a referrer');
            }

            // Update new user with referrer
            await User.updateOne(
                { _id: newUserId },
                { referredBy: referrer._id }
            ).session(session);

            // Create referral record
            await Referral.create([{
                referrer: referrer._id,
                candidate: newUserId,
                status: 'PENDING',
                bonusAmount: REFERRAL_BONUS,
            }], { session });

            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Trigger referral bonus payout (called after first purchase)
     */
    static async triggerReferralBonus(candidateUserId: string): Promise<void> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Find pending referral
            const referral = await Referral.findOne({
                candidate: candidateUserId,
                status: 'PENDING',
            }).session(session);

            if (!referral) {
                await session.abortTransaction();
                return; // No referral to process
            }

            // Credit referrer
            await WalletService.creditBalance(
                referral.referrer.toString(),
                REFERRAL_BONUS,
                'REFERRAL_BONUS',
                { candidateUserId },
                session
            );

            // Update referral status
            await Referral.updateOne(
                { _id: referral._id },
                { status: 'COMPLETED', completedAt: new Date() }
            ).session(session);

            // Increment referrer's total count
            await User.updateOne(
                { _id: referral.referrer },
                { $inc: { totalReferrals: 1 } }
            ).session(session);

            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Get referral stats for a user
     */
    static async getReferralStats(userId: string): Promise<{
        referralCode: string;
        totalReferrals: number;
        pendingReferrals: number;
        completedReferrals: number;
        totalEarned: number;
    }> {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const referralCode = user.referralCode || await this.generateReferralCode(userId);

        const [pending, completed] = await Promise.all([
            Referral.countDocuments({ referrer: userId, status: 'PENDING' }),
            Referral.countDocuments({ referrer: userId, status: 'COMPLETED' }),
        ]);

        return {
            referralCode,
            totalReferrals: user.totalReferrals || 0,
            pendingReferrals: pending,
            completedReferrals: completed,
            totalEarned: completed * REFERRAL_BONUS,
        };
    }
}
