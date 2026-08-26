import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth-layout";
import { LoginForm } from "@/components/auth-form";
export const metadata: Metadata = { title: "Sign in" };
export default function LoginPage() { return <AuthLayout><LoginForm /></AuthLayout>; }
