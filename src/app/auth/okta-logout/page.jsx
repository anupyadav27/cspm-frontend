"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import PreLoader from "@/components/preLoader";

export default function OktaLogout() {
    const router = useRouter();

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUri = urlParams.get("post_logout_redirect_uri");

        const timer = setTimeout(() => {
            if (redirectUri) {
                window.location.href = redirectUri;
            } else {
                router.replace("/auth/login");
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className="okta-logout-page">
            <PreLoader isLoading={true} />
        </div>
    );
}
