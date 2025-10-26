"use client";

import { menuItems } from "@/data/components/menuItems";

export default function Sidebar({ activeItem, onItemClick }) {
    return (
        <div className="sidebar">
            <div className="sidebar__main">
                <div className="sidebar__title">CSPM</div>

                {menuItems.map((item) => (
                    <div
                        key={item.id}
                        className={`sidebar__item ${activeItem?.id === item.id ? "sidebar__item--active" : ""}`}
                        onClick={() => onItemClick(item)}
                    >
                        <div className="sidebar__icon">{item.icon}</div>
                        <span className="sidebar__label">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
