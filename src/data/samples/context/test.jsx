appState = {
	"user": {
		"id": "68e813d9dca8668fc3294b9f", "email": "ayush@mahasos.com", "roles": ["user"], "name": {
			"first": "ayush"
		}, "preferences": {
			"theme": "light", "notifications": true, "language": "en"
		}
	},
	"role": "user",
	"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZTgxM2Q5ZGNhODY2OGZjMzI5NGI5ZiIsImVtYWlsIjoiYXl1c2hAbWFoYXNvcy5jb20iLCJyb2xlcyI6WyJ1c2VyIl0sImlhdCI6MTc2MDA4NzUwOSwiZXhwIjoxNzYwMDkxMTA5fQ.xYmvTxV8Cpeg5Oxq0zPpCvgD2e_978v9XY-AX7vPVG4",
	"isAuthenticated": true,
	"tenants": [{
		"id": "1",
		"name": "Acme Corporation",
		"slug": "acme-corp",
		"status": "active",
		"plan": "enterprise",
		"createdAt": "2024-01-10T10:00:00Z",
		"settings": {
			"allowSAML": true, "maxUsers": 100, "features": ["cloud-connector", "threat-engine", "compliance-engine"]
		},
		"billing": {"resourceUsage": 75, "storageUsed": "250GB", "apiCalls": 125000}
	}, {
		"id": "2",
		"name": "Tech Innovations Inc",
		"slug": "tech-innovations",
		"status": "active",
		"plan": "professional",
		"createdAt": "2024-02-15T14:30:00Z",
		"settings": {"allowSAML": false, "maxUsers": 50, "features": ["cloud-connector", "threat-engine"]},
		"billing": {"resourceUsage": 45, "storageUsed": "150GB", "apiCalls": 75000}
	}, {
		"id": "3",
		"name": "Global Security Solutions",
		"slug": "global-security",
		"status": "active",
		"plan": "enterprise",
		"createdAt": "2024-03-20T09:00:00Z",
		"settings": {
			"allowSAML": true,
			"maxUsers": 200,
			"features": ["cloud-connector", "threat-engine", "compliance-engine", "vulnerability-engine"]
		},
		"billing": {"resourceUsage": 92, "storageUsed": "500GB", "apiCalls": 250000}
	}],
	"selectedTenant": {
		"id": "1",
		"name": "Acme Corporation",
		"slug": "acme-corp",
		"status": "active",
		"plan": "enterprise",
		"createdAt": "2024-01-10T10:00:00Z",
		"settings": {
			"allowSAML": true, "maxUsers": 100, "features": ["cloud-connector", "threat-engine", "compliance-engine"]
		},
		"billing": {"resourceUsage": 75, "storageUsed": "250GB", "apiCalls": 125000}
	},
	"notifications": [{
		"id": "1",
		"userId": "1",
		"type": "alert",
		"title": "Critical Security Alert",
		"message": "Unauthorized access attempt detected on AWS EC2 instance",
		"category": "security",
		"isRead": false,
		"createdAt": "2025-10-03T08:15:00Z"
	}, {
		"id": "2",
		"userId": "1",
		"type": "update",
		"title": "System Update Available",
		"message": "New compliance checks are available for GDPR framework",
		"category": "system",
		"isRead": false,
		"createdAt": "2025-10-03T07:30:00Z"
	}, {
		"id": "3",
		"userId": "1",
		"type": "info",
		"title": "Monthly Report Ready",
		"message": "Your September security posture report is ready to download",
		"category": "reports",
		"isRead": true,
		"createdAt": "2025-10-01T10:00:00Z"
	}, {
		"id": "4",
		"userId": "2",
		"type": "alert",
		"title": "Compliance Violation Detected",
		"message": "S3 bucket configured without encryption",
		"category": "compliance",
		"isRead": false,
		"createdAt": "2025-10-02T14:20:00Z"
	}, {
		"id": "5",
		"userId": "1",
		"type": "update",
		"title": "New User Added",
		"message": "Sarah Johnson has been added to your tenant",
		"category": "system",
		"isRead": true,
		"createdAt": "2025-09-28T16:45:00Z"
	}],
	"notificationSettings": {
		"1": {
			"userId": "1",
			"emailEnabled": true,
			"emailFrequency": "immediate",
			"webhookEnabled": true,
			"webhookUrl": "https://webhook.example.com/cspm",
			"siemEnabled": false,
			"categories": {
				"security": true, "compliance": true, "system": true, "reports": false
			}
		},
		"2": {
			"userId": "2",
			"emailEnabled": true,
			"emailFrequency": "daily",
			"webhookEnabled": false,
			"webhookUrl": "",
			"siemEnabled": false,
			"categories": {
				"security": true, "compliance": true, "system": false, "reports": true
			}
		}
	},
	"isLoading": false
}
