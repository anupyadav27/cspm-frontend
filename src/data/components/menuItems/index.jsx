import {
  FaBalanceScale,
  FaBox,
  FaBug,
  FaChartBar,
  FaCog,
  FaFileAlt,
  FaShieldAlt,
  FaTachometerAlt,
  FaUserShield,
  FaUsers,
  FaBuilding,
} from "react-icons/fa";

export const menuItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <FaTachometerAlt />,
    subMenu: ["Overview", "Activity", "Stats"],
    link: "/dashboard",
  },
  {
    id: "assets",
    label: "Assets",
    icon: <FaBox />,
    subMenu: ["Servers", "Databases", "Applications"],
    link: "/assets",
  },
  {
    id: "vulnerabilities",
    label: "Vulnerabilities",
    icon: <FaBug />,
    subMenu: ["Open Issues", "Resolved", "Trends"],
    link: "/vulnerabilities",
  },
  {
    id: "threats",
    label: "Threats",
    icon: <FaShieldAlt />,
    subMenu: ["Detections", "Indicators", "Responses"],
    link: "/threats",
  },
  {
    id: "compliance",
    label: "Compliance",
    icon: <FaBalanceScale />,
    subMenu: ["Policies", "Audits", "Reports"],
    link: "/compliance",
  },
  {
    id: "policies",
    label: "Policies",
    icon: <FaFileAlt />,
    subMenu: ["Create Policy", "Manage Policies"],
    link: "/policies",
  },
  {
    id: "secops",
    label: "SecOps",
    icon: <FaUserShield />,
    subMenu: ["Incidents", "Playbooks", "Metrics"],
    link: "/secops",
  },
  {
    id: "reports",
    label: "Reports",
    icon: <FaChartBar />,
    subMenu: ["Daily", "Weekly", "Custom"],
    link: "/reports",
  },
  {
    id: "users",
    label: "Users",
    icon: <FaUsers />,
    link: "/users", // sidebar item with icon, no submenu
  },
  {
    id: "tenants",
    label: "Tenants",
    icon: <FaBuilding />,
    link: "/tenants", // sidebar item with icon, no submenu
  },
  {
    id: "settings",
    label: "Settings",
    icon: <FaCog />,
    subMenu: ["Profile", "Notifications", "Integrations"], // pages without sidebar icons
    link: "/settings",
  },
];
