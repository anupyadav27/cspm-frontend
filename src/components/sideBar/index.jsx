"use client";

import {
    FaTachometerAlt,
    FaCloudUploadAlt,
    FaSearch,
    FaBoxes,
    FaShieldAlt,
    FaBalanceScale,
    FaUserShield,
    FaDatabase,
    FaCode,
    FaCog,
} from "react-icons/fa";

export default function Sidebar({ activeSection, onSectionHover, onSectionLeave, onSectionClick }) {
    return (
        <div className="sidebar">
            <div className="sidebar__main">
                <div className="sidebar__title">CSPM</div>

                <SidebarItem
                    id="dashboard"
                    label="Dashboard"
                    icon={<FaTachometerAlt />}
                    active={activeSection === "dashboard"}
                    onHover={onSectionHover}
                    onLeave={onSectionLeave}
                    onClick={onSectionClick}
                />

                <SidebarItem
                    id="onboarding"
                    label="Onboarding"
                    icon={<FaCloudUploadAlt />}
                    active={activeSection === "onboarding"}
                    onHover={onSectionHover}
                    onLeave={onSectionLeave}
                    onClick={onSectionClick}
                />

                <SidebarItem
                    id="scans"
                    label="Scans"
                    icon={<FaSearch />}
                    active={activeSection === "scans"}
                    onHover={onSectionHover}
                    onLeave={onSectionLeave}
                    onClick={onSectionClick}
                />

                <SidebarItem
                    id="inventory"
                    label="Inventory"
                    icon={<FaBoxes />}
                    active={activeSection === "inventory"}
                    onHover={onSectionHover}
                    onLeave={onSectionLeave}
                    onClick={onSectionClick}
                />

                <SidebarItem
                    id="threats"
                    label="Threats"
                    icon={<FaShieldAlt />}
                    active={activeSection === "threats"}
                    onHover={onSectionHover}
                    onLeave={onSectionLeave}
                    onClick={onSectionClick}
                />

                <SidebarItem
                    id="compliance"
                    label="Compliance"
                    icon={<FaBalanceScale />}
                    active={activeSection === "compliance"}
                    onHover={onSectionHover}
                    onLeave={onSectionLeave}
                    onClick={onSectionClick}
                />

                <SidebarItem
                    id="iam"
                    label="IAM Security"
                    icon={<FaUserShield />}
                    active={activeSection === "iam"}
                    onHover={onSectionHover}
                    onLeave={onSectionLeave}
                    onClick={onSectionClick}
                />

                <SidebarItem
                    id="datasec"
                    label="Data Security"
                    icon={<FaDatabase />}
                    active={activeSection === "datasec"}
                    onHover={onSectionHover}
                    onLeave={onSectionLeave}
                    onClick={onSectionClick}
                />

                <SidebarItem
                    id="secops"
                    label="Code Security"
                    icon={<FaCode />}
                    active={activeSection === "secops"}
                    onHover={onSectionHover}
                    onLeave={onSectionLeave}
                    onClick={onSectionClick}
                />

                <SidebarItem
                    id="settings"
                    label="Settings"
                    icon={<FaCog />}
                    active={activeSection === "settings"}
                    onHover={onSectionHover}
                    onLeave={onSectionLeave}
                    onClick={onSectionClick}
                />
            </div>
        </div>
    );
}

function SidebarItem({ id, label, icon, active, onHover, onLeave, onClick }) {
    return (
        <div
            className={`sidebar__item ${active ? "sidebar__item--active" : ""}`}
            onMouseEnter={() => onHover(id)}
            onMouseLeave={onLeave}
            onClick={() => onClick(id)}
        >
            <div className="sidebar__icon">{icon}</div>
            <span className="sidebar__label">{label}</span>
        </div>
    );
}
