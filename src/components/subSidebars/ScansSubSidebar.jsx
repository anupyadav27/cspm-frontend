"use client";

import { useRouter, usePathname } from "next/navigation";

export default function ScansSubSidebar() {
    const router = useRouter();
    const pathname = usePathname();

    const items = [
        { label: "Run Scan", route: "/scans/run" },
        { label: "Scan History", route: "/scans/history" },
    ];

    return (
        <aside className="sub-sidebar open">
            <div className="sub-sidebar__title">Scans</div>

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
