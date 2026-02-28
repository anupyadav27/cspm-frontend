"use client";

import { useRouter, usePathname } from "next/navigation";

export default function SecOpsSubSidebar() {
    const router = useRouter();
    const pathname = usePathname();

    const items = [
        { label: "Run Scan", route: "/secops/run" },
        { label: "Scan Results", route: "/secops/results" },
        { label: "Rule Library", route: "/secops/rules" },
    ];

    return (
        <aside className="sub-sidebar open">
            <div className="sub-sidebar__title">Code Security</div>

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
