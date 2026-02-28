"use client";

import { useRouter, usePathname } from "next/navigation";

export default function SettingsSubSidebar() {
    const router = useRouter();
    const pathname = usePathname();

    const items = [
        { label: "Platform Health", route: "/settings/health" },
        { label: "Engine Status", route: "/settings/engine-status" },
    ];

    return (
        <aside className="sub-sidebar open">
            <div className="sub-sidebar__title">Settings</div>

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
