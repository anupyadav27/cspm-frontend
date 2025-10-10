"use client";

import Sidebar from "@/components/sideBar";
import Header from "@/components/header";
import SubSideBar from "@/components/subSideBar";
import {useEffect, useState} from "react";
import {menuItems} from "@/data/components/menuItems";
import {usePathname, useRouter} from "next/navigation";

export default function Layout({children}) {
	const [activeItem, setActiveItem] = useState(null);
	const [isSubSidebarOpen, setIsSubSidebarOpen] = useState(false);
	const pathname = usePathname();
	const router = useRouter();
	
	useEffect(() => {
		const matchedItem = menuItems.find((item) => pathname.startsWith(item.link));
		if (matchedItem) {
			setActiveItem(matchedItem);
		} else {
			setActiveItem(null);
		}
	}, [pathname]);
	
	const handleSidebarClick = (item) => {
		if (activeItem?.id === item.id) {
			setIsSubSidebarOpen((prev) => !prev);
		} else {
			setActiveItem(item);
			setIsSubSidebarOpen(true);
			router.push(item.link);
		}
	};
	
	return (
		<div className="layout">
			<Sidebar activeItem={activeItem} onItemClick={handleSidebarClick}/>
			<div className="layout__main">
				<Header activeItem={activeItem}/>
				<div className="layout__body">
					<SubSideBar isOpen={isSubSidebarOpen} activeItem={activeItem}/>
					<div className="layout__content">{children}</div>
				</div>
			</div>
		</div>
	);
}
