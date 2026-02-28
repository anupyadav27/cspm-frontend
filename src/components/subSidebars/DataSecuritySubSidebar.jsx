"use client";

import { useRouter, usePathname } from "next/navigation";

export default function DataSecuritySubSidebar() {
    const router = useRouter();
    const pathname = usePathname();

    const items = [
        { label: "Catalog", route: "/datasec/catalog" },
        { label: "Classification", route: "/datasec/classification" },
        { label: "Lineage", route: "/datasec/lineage" },
        { label: "Residency", route: "/datasec/residency" },
        { label: "Activity", route: "/datasec/activity" },
    ];

    return (
        <aside className="sub-sidebar open">
            <div className="sub-sidebar__title">Data Security</div>

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
