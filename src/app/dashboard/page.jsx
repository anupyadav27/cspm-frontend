"use client";


import Layout from "@/components/layout";
import Button from "@/components/button";
import {useLogout} from "@/hooks/useLogout";


export default function DashBoard() {
	const {handleLogout} = useLogout();
	
	return (<div>
		<Layout>
			<Button
				onClick={handleLogout}
			/>
		
		</Layout>
	</div>)
}