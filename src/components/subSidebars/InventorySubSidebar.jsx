"use client";

import { useRouter, usePathname } from "next/navigation";

export default function InventorySubSidebar() {
    const router = useRouter();
    const pathname = usePathname();

    const items = [
        { label: "Assets", route: "/inventory/inventory" },
        { label: "Relationships", route: "/inventory/relationships" },
        { label: "Graph View", route: "/inventory/graph" },
        { label: "Drift", route: "/inventory/drift" },
    ];

    return (
        <aside className="sub-sidebar open">
            <div className="sub-sidebar__title">Inventory</div>

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
