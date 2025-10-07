"use client";

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
import {usePathname, useRouter} from "next/navigation";
import {useEffect} from "react";

const menuItems = [
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

export default function Sidebar({activeItem, setActiveItem}) {
	const router = useRouter();
	const pathname = usePathname()
	
	useEffect(() => {
		const matchedItem = menuItems.find((item) =>
			pathname.startsWith(item.link)
		);
		if (matchedItem) {
			setActiveItem(matchedItem.id);
		}
	}, [pathname]);
	
	const handleClick = (item) => {
		setActiveItem(item.id);
		router.push(item.link);
	};
	
	
	return (
		<div className="sidebar">
			<div className="sidebar__main">
				<div className="sidebar__title">CSPM</div>
				
				{menuItems.map((item) => (
					<div
						key={item.id}
						className={`sidebar__item ${
							activeItem === item.id ? "sidebar__item--active" : ""
						}`}
						onClick={() => handleClick(item)}
					>
						<div
							className={`sidebar__icon`}
						>
							{item.icon}
						</div>
						<span
							className={`sidebar__label`}
						>
              {item.label}
            </span>
					</div>
				))}
			</div>
		</div>
	);
}

