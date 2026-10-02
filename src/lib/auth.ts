import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";
import { z } from "zod";
declare module "next-auth" {
    interface User {
        role?: string;
        isGuest?: boolean;
    }
    interface Session {
        user: {
            id: string;
            email?: string | null;
            name?: string | null;
            image?: string | null;
            role?: string;
            isGuest?: boolean;
        };
    }
}
declare module "@auth/core/jwt" {
    interface JWT {
        id?: string;
        role?: string;
        isGuest?: boolean;
    }
}
export const { handlers, auth, signIn, signOut } = NextAuth({
    trustHost: true,
    session: { strategy: "jwt" },
    pages: {
        signIn: "/login",
    },
    providers: [
        Credentials({
            id: "credentials",
            name: "Email",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const parsed = z
                    .object({ email: z.string().email(), password: z.string().min(6) })
                    .safeParse(credentials);
                if (!parsed.success)
                    return null;
                const user = await prisma.user.findUnique({
                    where: { email: parsed.data.email.toLowerCase() },
                });
                if (!user?.passwordHash)
                    return null;
                const valid = await compare(parsed.data.password, user.passwordHash);
                if (!valid)
                    return null;
                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    isGuest: user.isGuest,
                };
            },
        }),
        Credentials({
            id: "guest",
            name: "Guest",
            credentials: {},
            async authorize() {
                const guest = await prisma.user.create({
                    data: {
                        name: "Guest",
                        isGuest: true,
                        onboardingDone: false,
                    },
                });
                return {
                    id: guest.id,
                    name: guest.name,
                    role: "learner",
                    isGuest: true,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.isGuest = user.isGuest;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.isGuest = token.isGuest as boolean;
            }
            return session;
        },
    },
});
