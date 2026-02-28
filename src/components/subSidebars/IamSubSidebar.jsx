"use client";

import { useRouter, usePathname } from "next/navigation";

export default function IamSubSidebar() {
    const router = useRouter();
    const pathname = usePathname();

    const items = [
        { label: "Findings", route: "/iam/findings" },
        { label: "Modules", route: "/iam/modules" },
    ];

    return (
        <aside className="sub-sidebar open">
            <div className="sub-sidebar__title">IAM Security</div>

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
