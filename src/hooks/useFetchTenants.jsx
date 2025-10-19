'use client';

import { useEffect, useCallback, useState } from 'react';
import { useAppContext } from '@/context/appContext';

export const useFetchTenants = (deps = [], force = false) => {
	const { state, dispatch } = useAppContext();
	
	const [error, setError] = useState(null);
	

	const fetchTenants = useCallback(async () => {
		dispatch({type:"SET_LOADING",payload:true});
		setError(null);

		try {
			const cachedAppState =
				typeof window !== 'undefined' ? JSON.parse(sessionStorage.getItem('appState')) : null;
			
			if (!force && cachedAppState?.tenants?.length > 0) {
				dispatch({ type: 'SET_TENANTS', payload: cachedAppState.tenants });
				return cachedAppState.tenants;
			}
			
			const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tenants`, {
				method: 'GET',
				credentials: 'include',
			});

			if (!res.ok) throw new Error('Failed to fetch tenants');

			const data = await res.json();

			const tenants = data?.data || [];
			
			dispatch({ type: 'SET_TENANTS', payload: tenants });
			
			if (typeof window !== 'undefined') {
				const updatedAppState = JSON.parse(sessionStorage.getItem('appState')) || {};
				updatedAppState.tenants = tenants;
				sessionStorage.setItem('appState', JSON.stringify(updatedAppState));
			}

			return tenants;
		} catch (err) {
			setError(err.message);
			return [];
		} finally {
			dispatch({type:"SET_LOADING",payload:true});
		}
	}, [dispatch, force]);

	useEffect(() => {
		fetchTenants();
	}, deps);

	return { tenants: state.tenants, error, refetch: () => fetchTenants() };
};
