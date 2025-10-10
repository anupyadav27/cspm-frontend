'use client';
import Layout from "@/components/layout";
import {useAppContext} from "@/context/appContext";

export default function Dashboard() {
	const {state} = useAppContext();
	
	return (
		<Layout>
			{JSON.stringify(state)}
		
		</Layout>
	);
}
