import {useAppContext} from '@/context/appContext';
import usersData from '@/data/samples/users.json';

export const useAuthActions = () => {
	const {state, dispatch} = useAppContext();
	
	const handleLogin = async (email, password) => {
		const user = usersData.users.find(
			(u) => u.email === email && u.password === password
		);
		
		if (user) {
			const userWithoutPassword = {...user};
			delete userWithoutPassword.password;
			
			dispatch({
				type: 'LOGIN',
				payload: {
					user: userWithoutPassword,
					role: user.role,
					token: 'demo-token',
				},
			});
			
			sessionStorage.setItem(
				'appState',
				JSON.stringify({
					user: userWithoutPassword,
					role: user.role,
					token: 'demo-token',
				})
			);
			
			return {success: true, user: userWithoutPassword};
		}
		
		return {success: false, error: 'Invalid email or password'};
	};
	
	const handleLogout = async () => {
		try {
			await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
				method: 'POST',
				credentials: 'include',
			}).catch(() => {
			});
			
			sessionStorage.removeItem('appState');
			dispatch({type: 'LOGOUT'});
			
			document.cookie.split(';').forEach((cookie) => {
				const name = cookie.split('=')[0].trim();
				document.cookie = `${name}=; Max-Age=0; path=/;`;
			});
			
			window.location.href = '/auth/login';
		} catch (error) {
			console.error('Logout failed:', error);
			sessionStorage.removeItem('appState');
			dispatch({type: 'LOGOUT'});
			window.location.href = '/auth/login';
		}
	};
	
	return {
		state,
		handleLogin,
		handleLogout,
	};
};
