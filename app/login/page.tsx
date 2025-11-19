"use client";

import { Shield } from "lucide-react";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage(){
    return(
        <div className="min-h-screen bg-background">
            {/*중앙 정렬*/}
            <div className="flex items-center justify-center p-4 pt-20">
                <div className="absolute inset-0 grid-bg opacity-10"></div>
                <div className="w-full max-w-md relative z-10">
                    {/*로고*/}
                    <div className="mb-8 flex items-center justify-center gap-2">
                    <Shield className="h-8 w-8 text-primary" />
                    <span className="text-2xl font-bold text-foreground">SecureNet AI</span>
                    </div>
                    {/*로그인 폼*/}
                    <LoginForm/>
                </div>
            </div>
        </div>
    )
}