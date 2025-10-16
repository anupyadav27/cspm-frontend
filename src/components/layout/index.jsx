"use client";

import Sidebar from "@/components/sideBar";
import Header from "@/components/header";
import SubSideBar from "@/components/subSideBar";
import {useEffect, useState} from "react";
import {menuItems} from "@/data/components/menuItems";
import {usePathname, useRouter} from "next/navigation";
import {useAppContext} from "@/context/appContext";
import SpinnerLoaderOverlay from "@/components/spinnerLoaderOverlay";

export default function Layout({children, headerLabel, isLoading = false}) {
	const {state, dispatch} = useAppContext();
	const appLoading = state.isLoading;
	const [isClient, setIsClient] = useState(false)
	
	const [activeItem, setActiveItem] = useState(null);
	const [isSubSidebarOpen, setIsSubSidebarOpen] = useState(false);
	const pathname = usePathname();
	const router = useRouter();
	
	useEffect(() => {
		setIsClient(true)
	}, []);
	
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
			dispatch({type: "SET_LOADING", payload: true});
			setActiveItem(item);
			router.push(item.link);
		}
	};
	
	const toggleSubSidebar = () => {
		setIsSubSidebarOpen((prev) => !prev);
	};
	
	return (
		<div className="layout">
			<Sidebar activeItem={activeItem} onItemClick={handleSidebarClick}/>
			
			<div className="layout__main">
				<Header title={headerLabel || activeItem?.label}/>
				
				<div className="layout__body">
					<SubSideBar
						isOpen={isSubSidebarOpen}
						activeItem={activeItem}
						toggleSubSidebar={toggleSubSidebar}
					/>
					
					<div className="layout__content">
						{isClient &&
							<SpinnerLoaderOverlay isLoading={(appLoading || isLoading)}/>
						}
						{children}
					</div>
				</div>
			</div>
		</div>
	);
}
