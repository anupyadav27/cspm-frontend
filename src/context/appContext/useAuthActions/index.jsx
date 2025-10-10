import {useAppContext} from '@/context/appContext';
import usersData from '@/data/samples/users.json';

export const useAuthActions = () => {
	const {state, dispatch} = useAppContext();
	
	const login = (email, password) => {
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
			return {success: true, user: userWithoutPassword};
		}
		
		return {success: false, error: 'Invalid email or password'};
	};
	return {state, login};
};
