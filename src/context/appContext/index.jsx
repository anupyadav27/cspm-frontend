'use client';

import {createContext, useContext, useReducer, useState,useEffect} from 'react';
import {usePathname, useRouter} from 'next/navigation';
import {appReducer, initialState} from './reducer';
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
		const initializeApp = async () => {
			setLoading(true);
			
			try {
				let user = state.user;
				let isAuthenticated = state.isAuthenticated;
				
				if (!isAuthenticated || !user) {
					const res = await fetch(
						`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
						{
							method: 'POST',
							credentials: 'include',
						}
					);
					
					const data = await res.json();
					
					if (res.ok && data.user) {
						dispatch({
							type: 'LOGIN',
							payload: {
								user: data.user,
								token: data.token,
							},
						});
						
						user = data.user;
						isAuthenticated = true;
					} else {
						dispatch({type: 'LOGOUT'});
						setLoading(false);
						return;
					}
				}
				
				if (isAuthenticated && user) {
					const tenantRes = await fetch(
						`${process.env.NEXT_PUBLIC_API_URL}/api/tenants`,
						{
							method: 'GET',
							credentials: 'include',
						}
					);
					
					const tenantData = await tenantRes.json();
					
					dispatch({
						type: 'SET_TENANTS',
						payload: tenantData || {data: [], pagination: {}},
					});
					
					if (tenantData?.data?.length > 0) {
						dispatch({
							type: 'SELECT_TENANT',
							payload: tenantData.data[0],
						});
					}
					
					dispatch({
						type: 'SET_NOTIFICATIONS',
						payload: notificationsData.notifications || [],
					});
					
					dispatch({
						type: 'SET_NOTIFICATION_SETTINGS',
						payload: notificationsData.notificationSettings || {},
					});
				}
			} catch (error) {
				console.error('App initialization failed:', error);
				dispatch({type: 'LOGOUT'});
			} finally {
				setLoading(false);
			}
		};
		
		initializeApp();
	}, []);
	
	
	useEffect(() => {
		if (!loading) {
			const PUBLIC_ROUTES = ['/auth/login', '/auth/forget-password'];
			if (!state.isAuthenticated && !PUBLIC_ROUTES.includes(pathname)) {
				router.replace('/auth/login');
			}
		}
	}, [state.isAuthenticated, pathname, router, loading]);
	
	return (
		<AppContext.Provider value={{state, dispatch, loading}}>
			{children}
		</AppContext.Provider>
	);
};

export const useAppContext = () => useContext(AppContext);
