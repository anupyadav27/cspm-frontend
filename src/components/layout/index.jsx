"use client";

import Sidebar from "@/components/sideBar";
import Header from "@/components/header";
import SubSideBar from "@/components/subSideBar";
import {useState} from "react";

export default function Layout({children}) {
	const [activeItem, setActiveItem] = useState(null);
	const [isSubSidebarOpen, setIsSubSidebarOpen] = useState(false);
	
	
	const handleSidebarClick = (itemId) => {
		if (activeItem === itemId) {
			setIsSubSidebarOpen((prev) => !prev);
		} else {
			setActiveItem(itemId);
			setIsSubSidebarOpen(true);
		}
	};
	
	return (
		<div className="layout">
			<Sidebar activeItem={activeItem} setActiveItem={handleSidebarClick}/>
			<div className="layout__main">
				<Header/>
				<div className="layout__body">
					<SubSideBar isOpen={isSubSidebarOpen}/>
					<div className="layout__content">{children}</div>
				</div>
			</div>
		</div>
	);
}
