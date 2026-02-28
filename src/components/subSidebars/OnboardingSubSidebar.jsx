"use client";

import { useRouter, usePathname } from "next/navigation";

export default function OnboardingSubSidebar() {
    const router = useRouter();
    const pathname = usePathname();

    const items = [
        { label: "Tenants", route: "/onboarding/tenants" },
        { label: "Accounts", route: "/onboarding/accounts" },
        { label: "Schedules", route: "/onboarding/schedules" },
    ];

    return (
        <aside className="sub-sidebar open">
            <div className="sub-sidebar__title">Onboarding</div>

            {items.map((item) => (
                <div
                    key={item.route}
                    onClick={() => router.push(item.route)}
                    className={`sub-sidebar__item ${
                        pathname.startsWith(item.route) ? "sub-sidebar__item--active" : ""
                    }`}
                >
                    {item.label}
                </div>
            ))}
        </aside>
    );
}
