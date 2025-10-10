import {
	FaBalanceScale,
	FaBox,
	FaBug,
	FaChartBar,
	FaCog,
	FaFileAlt,
	FaShieldAlt,
	FaTachometerAlt,
} from "react-icons/fa";

export const menuItems = [
	{
		id: "dashboard",
		label: "Dashboard",
		icon: <FaTachometerAlt/>,
		subMenu: ["Overview", "Activity", "Stats"],
		link: "/dashboard",
	},
	{
		id: "assets",
		label: "Assets",
		icon: <FaBox/>,
		subMenu: ["Servers", "Databases", "Applications"],
		link: "/assets",
	},
	{
		id: "vulnerabilities",
		label: "Vulnerabilities",
		icon: <FaBug/>,
		subMenu: ["Open Issues", "Resolved", "Trends"],
		link: "/vulnerabilities",
	},
	{
		id: "threats",
		label: "Threats",
		icon: <FaShieldAlt/>,
		subMenu: ["Detections", "Indicators", "Responses"],
		link: "/threats",
	},
	{
		id: "compliance",
		label: "Compliance",
		icon: <FaBalanceScale/>,
		subMenu: ["Policies", "Audits", "Reports"],
		link: "/compliance",
	},
	{
		id: "policies",
		label: "Policies",
		icon: <FaFileAlt/>,
		subMenu: ["Create Policy", "Manage Policies"],
		link: "/policies",
	},
	{
		id: "reports",
		label: "Reports",
		icon: <FaChartBar/>,
		subMenu: ["Daily", "Weekly", "Custom"],
		link: "/reports",
	},
	{
		id: "settings",
		label: "Settings",
		icon: <FaCog/>,
		subMenu: ["Profile", "Users", "Integrations"],
		link: "/settings",
	},
];