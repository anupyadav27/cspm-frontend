'use client';

import {createContext, useContext, useEffect, useReducer, useState} from 'react';
import {usePathname, useRouter} from 'next/navigation';
import {appReducer, initialState} from './reducer';
import tenantsData from '@/data/samples/tenants.json';
import notificationsData from '@/data/samples/notifications.json';

const AppContext = createContext();

export const AppProvider = ({children}) => {
	const pathname = usePathname();
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	
	const savedState =
		typeof window !== 'undefined' && sessionStorage.getItem('appState')
			? JSON.parse(sessionStorage.getItem('appState'))
			: initialState;
	
	const [state, dispatch] = useReducer(appReducer, savedState);
	
	useEffect(() => {
		if (typeof window !== 'undefined') {
			sessionStorage.setItem('appState', JSON.stringify(state));
		}
	}, [state]);
	
	useEffect(() => {
		const handleStorage = (e) => {
			if (e.key === 'appState' && e.newValue) {
				const parsed = JSON.parse(e.newValue);
				dispatch({type: 'SET_USER', payload: {user: parsed.user}});
			} else if (e.key === 'appState' && e.newValue === null) {
				dispatch({type: 'LOGOUT'});
			}
		};
		window.addEventListener('storage', handleStorage);
		return () => window.removeEventListener('storage', handleStorage);
	}, []);
	
	useEffect(() => {
		const PUBLIC_ROUTES = ['/auth/login', '/auth/forget-password'];
		if (!state.isAuthenticated && !PUBLIC_ROUTES.includes(pathname)) {
			router.replace('/auth/login');
		}
	}, [state.isAuthenticated, pathname, router]);
	
	useEffect(() => {
		const initializeApp = async () => {
			setLoading(true);
			let restoredUser = null;
			
			try {
				const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`, {
					method: 'POST',
					credentials: 'include',
				});
				
				const data = await res.json();
				
				if (res.ok && data.user) {
					restoredUser = data.user;
					dispatch({
						type: 'LOGIN',
						payload: {
							user: restoredUser,
							token: data.token,
						},
					});
				} else {
					dispatch({type: 'LOGOUT'});
				}
			} catch (err) {
				console.error('Token refresh failed:', err);
				dispatch({type: 'LOGOUT'});
			}
			
			if (restoredUser || !state.user) {
				dispatch({type: 'SET_TENANTS', payload: tenantsData.tenants});
				dispatch({type: 'SELECT_TENANT', payload: tenantsData.tenants[0]});
				dispatch({type: 'SET_NOTIFICATIONS', payload: notificationsData.notifications});
				dispatch({
					type: 'SET_NOTIFICATION_SETTINGS',
					payload: notificationsData.notificationSettings || {},
				});
			}
			
			setLoading(false);
		};
		
		initializeApp();
	}, []);
	
	return (
		<AppContext.Provider value={{state, dispatch, loading}}>
			{children}
		</AppContext.Provider>
	);
};

export const useAppContext = () => useContext(AppContext);
