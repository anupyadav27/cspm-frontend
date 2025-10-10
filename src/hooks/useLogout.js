import {useAppContext} from "@/context/appContext";

export const useLogout = () => {
	const {dispatch} = useAppContext();
	
	const handleLogout = async () => {
		try {
			const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
				method: "POST",
				credentials: "include",
			});
			
			sessionStorage.removeItem("appState");
			dispatch({type: "LOGOUT"});
			
			document.cookie.split(";").forEach((cookie) => {
				const name = cookie.split("=")[0].trim();
				document.cookie = `${name}=; Max-Age=0; path=/;`;
			});
			
			if (res.ok) {
				window.location.href = "/auth/login";
			}
		} catch (error) {
			console.error("Logout failed:", error);
			sessionStorage.removeItem("appState");
			dispatch({type: "LOGOUT"});
			window.location.href = "/auth/login";
		}
	};
	
	return {handleLogout};
};
