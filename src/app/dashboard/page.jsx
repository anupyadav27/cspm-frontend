"use client";


import {useAppContext} from "@/context/appContext";
import Layout from "@/components/layout";


export default function DashBoard() {
	const {state, dispatch} = useAppContext();
	
	const handleLogout = () => {
		dispatch({type: "LOGOUT"});
		sessionStorage.removeItem("authState");
	};
	
	return (<div>
		<Layout>
		
		</Layout>
	</div>)
}