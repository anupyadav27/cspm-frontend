'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import notificationsData from '@/data/samples/notifications.json';
import {useTenantActions} from '@/context/appContext/useTenantActions';
import {useAuthActions} from '@/context/appContext/useAuthActions';
import {useAppContext} from '@/context/appContext';

export default function Header({activeItem}) {
	const router = useRouter();
	const [showUserMenu, setShowUserMenu] = useState(false);
	const [showTenantMenu, setShowTenantMenu] = useState(false);
	
	const {state} = useAppContext();
	const {handleLogout} = useAuthActions();
	const {switchTenant} = useTenantActions();
	
	const currentUser = state?.user?.name || {first: 'A', last: 'J'};
	
	const tenants = state.tenants || [];
	const selectedTenant =
		state.selectedTenant ||
		tenants[0] || {name: 'Default Tenant'};
	
	const unreadCount =
		notificationsData.notifications?.filter((n) => !n.read).length || 0;
	
	const handleTenantSwitch = (tenantId) => {
		switchTenant(tenantId);
		setShowTenantMenu(false);
	};
	
	return (
		<header className="header">
			<div className="header__content">
				<div className="header__left">
					<h1 className="header__title">{activeItem?.label}</h1>
				</div>
				
				<div className="header__actions">
					{}
					<div className="header__tenant">
						<button
							className="header__tenant-btn"
							onClick={() => setShowTenantMenu(!showTenantMenu)}
						>
							{selectedTenant.name}
							<svg
								className={`header__tenant-icon ${
									showTenantMenu ? 'rotate-180' : ''
								}`}
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M19 9l-7 7-7-7"
								/>
							</svg>
						</button>
						
						{showTenantMenu && (
							<div className="header__dropdown">
								{tenants.map((tenant) => (
									<button
										key={tenant.id}
										onClick={() => handleTenantSwitch(tenant.id)}
										className={`header__dropdown-item ${
											selectedTenant.id === tenant.id ? 'active' : ''
										}`}
									>
										{tenant.name}
									</button>
								))}
							</div>
						)}
					</div>
					
					{}
					<div className="header__notifications">
						<button
							className="header__icon-btn"
							onClick={() => router.push('/notifications')}
						>
							<svg
								className="header__icon"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
								/>
							</svg>
							{unreadCount > 0 && (
								<span className="header__badge">{unreadCount}</span>
							)}
						</button>
					</div>
					
					{}
					<div className="header__user">
						<button
							className="header__user-btn"
							onClick={() => setShowUserMenu(!showUserMenu)}
						>
							<div className="header__avatar">
								{currentUser?.first?.[0]?.toUpperCase()}
								{currentUser?.last?.[0]?.toUpperCase()}
							</div>
						</button>
						
						{showUserMenu && (
							<div className="header__dropdown header__dropdown--right">
								<a href="/profile" className="header__dropdown-item">
									Profile
								</a>
								<a href="/settings" className="header__dropdown-item">
									Settings
								</a>
								<button
									onClick={handleLogout}
									className="header__dropdown-item header__dropdown-item--danger"
								>
									Logout
								</button>
							</div>
						)}
					</div>
				</div>
			</div>
		</header>
	);
}
