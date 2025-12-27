export const runtime = 'nodejs';

import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { isEmailWhitelisted } from '@/lib/whitelist';
import { deriveCantonPartyId } from '@/lib/canton';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import { generateDepositAddress } from '@/lib/services/hdWallet';
import Wallet from '@/lib/models/Wallet';

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            httpOptions: {
                timeout: 10000,
            },
        }),
        CredentialsProvider({
            id: 'credentials',
            name: 'Phrase Key',
            credentials: {
                phrase: { label: "Phrase", type: "text" }
            },
            async authorize(credentials) {
                if (!credentials?.phrase) {
                    console.log("Phrase login: No phrase provided");
                    return null;
                }

                try {
                    await dbConnect();
                    const phrase = credentials.phrase.trim();
                    console.log("Phrase login: Attempting login with phrase length:", phrase.split(' ').length);

                    // Derive address from phrase (Use Canton Party ID)
                    const address = deriveCantonPartyId(phrase);
                    console.log("Phrase login: Derived Canton address:", address);

                    // Find wallet
                    const wallet = await Wallet.findOne({ publicAddress: address });
                    if (!wallet) {
                        console.log("Phrase login: Wallet not found for address:", address);
                        return null;
                    }
                    console.log("Phrase login: Wallet found:", wallet._id);

                    // Find user
                    const user = await User.findById(wallet.userId);
                    if (!user) {
                        console.log("Phrase login: User not found for wallet:", wallet._id);
                        return null;
                    }
                    console.log("Phrase login: User found:", user.email);

                    return {
                        id: user._id.toString(),
                        email: user.email,
                        name: user.name,
                        image: user.image,
                    };
                } catch (error) {
                    console.error("Phrase login error:", error);
                    return null;
                }
            }
        }),
        CredentialsProvider({
            id: 'email',
            name: 'Email',
            credentials: {
                email: { label: "Email", type: "email" },
                referralCode: { label: "Referral Code", type: "text", optional: true }
            },
            async authorize(credentials) {
                if (!credentials?.email) return null;

                try {
                    await dbConnect();

                    const email = credentials.email.trim().toLowerCase();

                    // Check if email is whitelisted
                    const isWhitelisted = await isEmailWhitelisted(email);

                    // Find or create user
                    let user = await User.findOne({ email });

                    if (!user) {
                        // New user registration
                        if (!isWhitelisted) {
                            // Check non-whitelisted user count
                            const nonWhitelistedCount = await User.countDocuments({ isWhitelisted: false });
                            if (nonWhitelistedCount >= 6000) {
                                throw new Error("RegistrationLimitReached");
                            }
                        }

                        // Create new user
                        user = await User.create({
                            email,
                            name: email.split('@')[0],
                            isWhitelisted,
                        });

                        // Generate unique deposit address
                        try {
                            const depositInfo = generateDepositAddress(user._id.toString());
                            user.depositAddress = depositInfo.address;
                            user.depositAddressIndex = depositInfo.index;
                            await user.save();
                            console.log(`🔑 Generated deposit address for ${email}: ${depositInfo.address}`);
                        } catch (error) {
                            console.error('Failed to generate deposit address:', error);
                            // Don't fail user creation if deposit address generation fails
                        }

                        // Check for referral code in credentials (passed from frontend)
                        if (credentials.referralCode) {
                            const referrer = await User.findOne({ referralCode: credentials.referralCode });
                            if (referrer) {
                                user.referredBy = referrer._id;
                                await user.save();
                                console.log(`✅ User ${email} referred by ${referrer.email}`);
                            }
                        }
                    }

                    return {
                        id: user._id.toString(),
                        email: user.email,
                        name: user.name,
                        image: user.image,
                    };
                } catch (error: any) {
                    console.error("Email login error:", error);
                    if (error.message === "RegistrationLimitReached") {
                        throw error;
                    }
                    return null;
                }
            }
        })
    ],
    callbacks: {
        async signIn({ user, account }) {
            // Skip whitelist check for credentials login (phrase and email)
            // Email provider already checks whitelist, phrase assumes already whitelisted
            if (account?.provider === 'credentials' || account?.provider === 'email') return true;

            if (!user.email) return false;

            await dbConnect();

            // Check whitelist for Google OAuth
            const isWhitelisted = await isEmailWhitelisted(user.email);

            // Check if user already exists
            const existingUser = await User.findOne({ email: user.email });

            if (!existingUser) {
                // New user registration
                if (!isWhitelisted) {
                    // Check non-whitelisted user count
                    const nonWhitelistedCount = await User.countDocuments({ isWhitelisted: false });
                    if (nonWhitelistedCount >= 6000) {
                        return false; // Deny registration - limit reached
                    }
                }

                // Create new user
                await User.create({
                    email: user.email,
                    name: user.name,
                    googleId: user.id,
                    isWhitelisted,
                });
            } else {
                // Update existing user
                await User.findOneAndUpdate(
                    { email: user.email },
                    {
                        name: user.name,
                        googleId: user.id,
                    }
                );
            }

            return true;
        },
        async jwt({ token, user, account }) {
            if (account) {
                token.accessToken = account.access_token;
            }

            // If user is present (sign in), fetch user data and wallet address
            if (user) {
                await dbConnect();
                const dbUser = await User.findOne({ email: user.email });
                if (dbUser) {
                    token.userId = dbUser._id.toString();
                    if (dbUser.walletAddress) {
                        token.walletAddress = dbUser.walletAddress;
                    }
                    if (dbUser.referralCode) {
                        token.referralCode = dbUser.referralCode;
                    }
                }
            }
            // If userId or walletAddress is missing but we have email (subsequent requests),
            // check DB again in case wallet was just created
            else if ((!token.userId || !token.walletAddress || !token.referralCode) && token.email) {
                await dbConnect();
                const dbUser = await User.findOne({ email: token.email });
                if (dbUser) {
                    token.userId = dbUser._id.toString();
                    if (dbUser.walletAddress) {
                        token.walletAddress = dbUser.walletAddress;
                    }
                    if (dbUser.referralCode) {
                        token.referralCode = dbUser.referralCode;
                    }
                }
            }

            return token;
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken;
            // @ts-ignore
            session.user.id = token.userId;
            // @ts-ignore
            session.user.walletAddress = token.walletAddress;
            // @ts-ignore
            session.user.referralCode = token.referralCode;
            return session;
        },
    },
    pages: {
        signIn: '/auth',
        error: '/auth', // Redirect to auth page on error to show custom message
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };