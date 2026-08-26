import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth-layout";
import { SignupForm } from "@/components/auth-form";
export const metadata: Metadata = { title: "Create account" };
export default function SignupPage() { return <AuthLayout><SignupForm /></AuthLayout>; }
