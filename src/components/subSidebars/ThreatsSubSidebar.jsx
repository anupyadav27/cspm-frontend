"use client";

import { useRouter, usePathname } from "next/navigation";

export default function ThreatsSubSidebar() {
    const router = useRouter();
    const pathname = usePathname();

    const items = [
        { label: "Overview", route: "/threats" },
        { label: "Threat List", route: "/threats/list" },
        { label: "Attack Paths", route: "/threats/attack-paths" },
        { label: "Analytics", route: "/threats/analytics" },
        { label: "Hunting", route: "/threats/hunting" },
    ];

    return (
        <aside className="sub-sidebar open">
            <div className="sub-sidebar__title">Threats</div>

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
