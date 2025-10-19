'use client';
import Layout from "@/components/layout";
import Index from "@/components/tableGrid";
import React, {useEffect, useState} from "react";
import {useAppContext} from "@/context/appContext";


const jsonData = [
	{id: 1, name: 'Ayush Jha', email: 'ayush@example.com', role: 'Admin', active: true},
	{id: 2, name: 'Riya Verma', email: 'riya@example.com', role: 'Editor', active: false},
	{id: 3, name: 'Kunal Shah', email: 'kunal@example.com', role: 'Viewer', active: true},
	{id: 4, name: 'Meena Patel', email: 'meena@example.com', role: 'Editor', active: true},
	{id: 5, name: 'Arjun Singh', email: 'arjun@example.com', role: 'Admin', active: false},
	{id: 6, name: 'Sneha Nair', email: 'sneha@example.com', role: 'Viewer', active: true},
	{id: 7, name: 'Dev Mishra', email: 'dev@example.com', role: 'Editor', active: true},
	{id: 8, name: 'Tanya Roy', email: 'tanya@example.com', role: 'Viewer', active: false},
	{id: 9, name: 'Rohit Kumar', email: 'rohit@example.com', role: 'Editor', active: true},
	{id: 10, name: 'Pooja Sharma', email: 'pooja@example.com', role: 'Viewer', active: true}]

export default function Users() {
	const {dispatch} = useAppContext()
	useEffect(() => {
		dispatch({type: "SET_LOADING", payload: false})
	}, []);
	
	const [users, setUsers] = useState(jsonData);
	
	
	const handleEdit = (user) => {
		alert(`Editing user: ${user.name}`);
	};
	
	const handleDelete = (user) => {
		if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
			setUsers((prev) => prev.filter((u) => u.id !== user.id));
		}
	};
	
	const handleToggleActive = (user) => {
		setUsers((prev) =>
			prev.map((u) => (u.id === user.id ? {...u, active: !u.active} : u))
		);
	};
	
	const columns = [
		{key: 'id', title: 'ID', width: 60},
		{key: 'name', title: 'Name', searchable: true, width: 100},
		{key: 'email', title: 'Email', searchable: true},
		{
			key: 'role',
			title: 'Role',
			filterable: true,
			filterOptions: [
				{label: 'All', value: ''},
				{label: 'Admin', value: 'Admin'},
				{label: 'Editor', value: 'Editor'},
				{label: 'Viewer', value: 'Viewer'},
			],
		},
		{
			key: 'active',
			title: 'Status',
			render: (value, row) => (
				<div className="rtg-cell">
					<label className="rtg-toggle">
						<input
							type="checkbox"
							checked={value}
							onChange={() => handleToggleActive(row)}
						/>
						<span className="rtg-toggle-slider"></span>
					</label>
					<span>{value ? 'Active' : 'Inactive'}</span>
				</div>
			),
		},
		{
			key: 'actions',
			title: 'Actions',
			render: (value, row) => (
				<div className="rtg-cell">
					<button className="rtg__btn rtg__btn--edit" onClick={() => handleEdit(row)}>Edit</button>
					<button className="rtg__btn rtg__btn--delete" onClick={() => handleDelete(row)}>Delete</button>
				</div>
			),
		},
	];
	
	return (
		<Layout>
			
			<Index
				columns={columns}
				data={users}
				paginationMode="client"
				pageSizeOptions={[5, 10]}
				maxHeight="50vh"
				maxWidth="100%"
			/>
		</Layout>
	);
}
