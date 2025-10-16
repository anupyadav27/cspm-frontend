import tenantsData from '@/data/samples/tenants.json';

export const initialState = {
	user: null,
	role: null,
	token: null,
	isAuthenticated: false,
	tenants: tenantsData.tenants || [],
	selectedTenant: null,
	notifications: [],
	notificationSettings: null,
	isLoading: true,
};

export function appReducer(state, action) {
	let newState = {...state};
	
	switch (action.type) {
		case 'LOGIN':
			newState = {
				...state,
				user: action.payload.user || null,
				role: action.payload.user?.roles?.[0] || null,
				token: action.payload.token || null,
				isAuthenticated: true,
				isLoading: false,
			};
			break;
		
		case 'SET_USER':
			newState = {
				...state,
				user: action.payload.user || null,
				role: action.payload.user?.roles?.[0] || null,
			};
			break;
		
		case 'LOGOUT':
			newState = {
				...initialState,
				tenants: state.tenants,
				isAuthenticated: false,
				isLoading: false,
			};
			break;
		
		case 'SET_TENANTS':
			newState.tenants = action.payload;
			break;
		
		case 'SELECT_TENANT':
			newState.selectedTenant = action.payload;
			break;
		
		case 'SET_NOTIFICATIONS':
			newState.notifications = action.payload;
			break;
		
		case 'SET_NOTIFICATION_SETTINGS':
			newState.notificationSettings = action.payload;
			break;
		
		case 'MARK_AS_READ':
			newState.notifications = state.notifications.map((n) =>
				n.id === action.payload ? {...n, isRead: true} : n
			);
			break;
		
		case 'MARK_AS_UNREAD':
			newState.notifications = state.notifications.map((n) =>
				n.id === action.payload ? {...n, isRead: false} : n
			);
			break;
		
		case 'DELETE_NOTIFICATION':
			newState.notifications = state.notifications.filter(
				(n) => n.id !== action.payload
			);
			break;
		
		case 'SET_LOADING':
			newState.isLoading = !!action.payload;
			break;
		
		default:
			return state;
	}
	
	if (typeof window !== 'undefined')
		sessionStorage.setItem('appState', JSON.stringify(newState));
	return newState;
}
