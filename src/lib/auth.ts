import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Preconfigured partner and admin credentials
const DEFAULT_USERS = [
  {
    username: "admin",
    email: "admin@vedro.com",
    name: "Admin",
    role: "ADMIN",
  },
  {
    username: "vineet",
    email: "vineet@vedrolife.com",
    name: "Vineet Mishra",
    role: "PARTNER",
  },
  {
    username: "vivek",
    email: "vivek@vedrolife.com",
    name: "Vivek",
    role: "PARTNER",
  },
  {
    username: "varunesh",
    email: "varunesh@vedrolife.com",
    name: "Varunesh",
    role: "PARTNER",
  },
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "vedro_secret_key_production_session_secure_2026",
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;
        const username = typeof credentials.username === "string" ? credentials.username : "";
        const email = typeof credentials.email === "string" ? credentials.email : "";
        const password = typeof credentials.password === "string" ? credentials.password : "";

        if ((!username && !email) || !password) return null;

        const idInput = (username || email).toLowerCase().trim();

        // 1. Check default credentials
        const defaultUser = DEFAULT_USERS.find(
          (u) => u.username.toLowerCase() === idInput || u.email.toLowerCase() === idInput
        );

        const configuredPassword = process.env.ADMIN_PASSWORD || "Vedro@Life123";
        if (defaultUser && password === configuredPassword) {
          return {
            id: `usr-${defaultUser.username}`,
            name: defaultUser.name,
            email: defaultUser.email,
            role: defaultUser.role,
            companyId: "vedro-fmcg",
          };
        }

        // 2. Query database for AppUser records
        try {
          const user = await prisma.appUser.findFirst({
            where: {
              OR: [
                { email: idInput },
                { email: `${idInput}@vedro.com` },
                { email: `${idInput}@vedrolife.com` },
              ],
            },
            select: {
              id: true,
              name: true,
              email: true,
              passwordHash: true,
              isActive: true,
              memberships: {
                where: { isActive: true },
                select: {
                  role: true,
                  companyId: true,
                },
                take: 1,
              },
            },
          });

          if (user && user.isActive && user.passwordHash) {
            const isValid = await bcrypt.compare(password, user.passwordHash);
            if (isValid) {
              const primaryMembership = user.memberships[0];
              return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: primaryMembership?.role || "PARTNER",
                companyId: primaryMembership?.companyId || null,
              };
            }
          }
        } catch (error) {
          console.error("Database auth lookup note:", error);
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = (user as any).role;
        token.companyId = (user as any).companyId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        if (token.name) session.user.name = token.name as string;
        if (token.email) session.user.email = token.email as string;
        (session.user as any).role = token.role as string;
        (session.user as any).companyId = token.companyId as string;
      }
      return session;
    },
  },
});
