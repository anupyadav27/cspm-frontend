"use client";

import { FaChevronRight, FaChevronLeft } from "react-icons/fa";
import { menuItems } from "@/data/components/menuItems";
import { usePathname } from "next/navigation";

export default function SubSideBar({ isOpen, activeItem, toggleSubSidebar }) {
    const pathname = usePathname();
    const menu = activeItem || menuItems.find((item) => pathname.startsWith(item.link));

    if (!menu) return null;

    return (
        <>
            <button
                className={`sub-sidebar__toggle ${isOpen ? "open" : ""}`}
                onClick={toggleSubSidebar}
            >
                {isOpen ? <FaChevronLeft size={16} /> : <FaChevronRight size={16} />}
            </button>

            <aside className={`sub-sidebar ${isOpen ? "open" : ""}`}>
                {menu.subMenu?.map((sub, idx) => (
                    <div key={idx} className="sub-sidebar__item">
                        {sub}
                    </div>
                ))}
            </aside>
        </>
    );
}
