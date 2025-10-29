import {
    FaBalanceScale,
    FaBox,
    FaBug,
    FaBuilding,
    FaChartBar,
    FaCog,
    FaFileAlt,
    FaShieldAlt,
    FaTachometerAlt,
    FaUsers,
    FaUserShield,
} from "react-icons/fa";

export const menuItems = [
    {
        id: "dashboard",
        label: "Dashboard",
        icon: <FaTachometerAlt />,
        link: "/dashboard",
        subMenu: [
            { label: "Overview", route: "/dashboard/overview" },
            { label: "Activity", route: "/dashboard/activity" },
            { label: "Stats", route: "/dashboard/stats" },
        ],
    },
    {
        id: "assets",
        label: "Assets",
        icon: <FaBox />,
        link: "/assets",
        subMenu: [
            { label: "Servers", route: "/assets/servers" },
            { label: "Databases", route: "/assets/databases" },
            { label: "Applications", route: "/assets/applications" },
        ],
    },
    {
        id: "vulnerabilities",
        label: "Vulnerabilities",
        icon: <FaBug />,
        link: "/vulnerabilities",
        subMenu: [
            { label: "Open Issues", route: "/vulnerabilities/open-issues" },
            { label: "Resolved", route: "/vulnerabilities/resolved" },
            { label: "Trends", route: "/vulnerabilities/trends" },
        ],
    },
    {
        id: "threats",
        label: "Threats",
        icon: <FaShieldAlt />,
        link: "/threats",
        subMenu: [
            { label: "Detections", route: "/threats/detections" },
            { label: "Indicators", route: "/threats/indicators" },
            { label: "Responses", route: "/threats/responses" },
        ],
    },
    {
        id: "compliances",
        label: "Compliances",
        icon: <FaBalanceScale />,
        link: "/compliances",
        subMenu: [
            { label: "Policies", route: "/compliances/policies" },
            { label: "Audits", route: "/compliances/audits" },
            { label: "Reports", route: "/compliances/reports" },
        ],
    },
    {
        id: "policies",
        label: "Policies",
        icon: <FaFileAlt />,
        link: "/policies",
        subMenu: [
            { label: "Add Policy", route: "/policies/add" },
            { label: "Manage Policies", route: "/policies/manage" },
        ],
    },
    {
        id: "secops",
        label: "SecOps",
        icon: <FaUserShield />,
        link: "/secops",
        subMenu: [
            { label: "Incidents", route: "/secops/incidents" },
            { label: "Playbooks", route: "/secops/playbooks" },
            { label: "Metrics", route: "/secops/metrics" },
        ],
    },
    {
        id: "reports",
        label: "Reports",
        icon: <FaChartBar />,
        link: "/reports",
        subMenu: [
            { label: "Daily", route: "/reports/daily" },
            { label: "Weekly", route: "/reports/weekly" },
            { label: "Custom", route: "/reports/custom" },
        ],
    },
    {
        id: "users",
        label: "Users",
        icon: <FaUsers />,
        link: "/users",
        subMenu: [], // no submenu, hides sub-sidebar
    },
    {
        id: "tenants",
        label: "Tenants",
        icon: <FaBuilding />,
        link: "/tenants",
        subMenu: [], // no submenu, hides sub-sidebar
    },
    {
        id: "settings",
        label: "Settings",
        icon: <FaCog />,
        link: "/settings",
        subMenu: [
            { label: "Profile", route: "/settings/profile" },
            { label: "Notifications", route: "/settings/notifications" },
            { label: "Integrations", route: "/settings/integrations" },
        ],
    },
];
