"""
Client for calling engine APIs
"""
import httpx
from typing import List, Optional, Dict, Any
from onboarding.config import settings


class EngineClient:
    """HTTP client to call engine APIs via ClusterIP"""
    
    def __init__(self):
        self.aws_url = settings.aws_engine_url
        self.azure_url = settings.azure_engine_url
        self.gcp_url = settings.gcp_engine_url
        self.alicloud_url = settings.alicloud_engine_url
        self.oci_url = settings.oci_engine_url
        self.ibm_url = settings.ibm_engine_url
    
    async def scan_aws(
        self,
        credentials: Dict[str, Any],
        account_number: str,
        regions: Optional[List[str]] = None,
        services: Optional[List[str]] = None,
        exclude_services: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Call AWS engine API"""
        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(
                f"{self.aws_url}/api/v1/scan",
                json={
                    "account": account_number,
                    "credentials": credentials,
                    "regions": regions or [],
                    "services": services or [],
                    "exclude_services": exclude_services or []
                }
            )
            response.raise_for_status()
            return response.json()
    
    async def scan_azure(
        self,
        credentials: Dict[str, Any],
        subscription_id: str,
        regions: Optional[List[str]] = None,
        services: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Call Azure engine API"""
        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(
                f"{self.azure_url}/api/v1/scan",
                json={
                    "subscription": subscription_id,
                    "credentials": credentials,
                    "regions": regions or [],
                    "services": services or []
                }
            )
            response.raise_for_status()
            return response.json()
    
    async def scan_gcp(
        self,
        credentials: Dict[str, Any],
        project_id: str,
        regions: Optional[List[str]] = None,
        services: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Call GCP engine API"""
        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(
                f"{self.gcp_url}/api/v1/scan",
                json={
                    "project": project_id,
                    "credentials": credentials,
                    "regions": regions or [],
                    "services": services or []
                }
            )
            response.raise_for_status()
            return response.json()
    
    async def scan_alicloud(
        self,
        credentials: Dict[str, Any],
        account_id: str,
        regions: Optional[List[str]] = None,
        services: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Call AliCloud engine API"""
        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(
                f"{self.alicloud_url}/api/v1/scan",
                json={
                    "account": account_id,
                    "credentials": credentials,
                    "regions": regions or [],
                    "services": services or []
                }
            )
            response.raise_for_status()
            return response.json()
    
    # Common methods for all engines
    async def cancel_scan(self, provider: str, scan_id: str) -> Dict[str, Any]:
        """Cancel a running scan"""
        url_map = {
            "aws": self.aws_url,
            "azure": self.azure_url,
            "gcp": self.gcp_url,
            "alicloud": self.alicloud_url,
            "oci": self.oci_url,
            "ibm": self.ibm_url
        }
        
        url = url_map.get(provider.lower())
        if not url:
            raise ValueError(f"Unknown provider: {provider}")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(f"{url}/api/v1/scan/{scan_id}/cancel")
            response.raise_for_status()
            return response.json()
    
    async def get_scan_progress(self, provider: str, scan_id: str) -> Dict[str, Any]:
        """Get scan progress"""
        url_map = {
            "aws": self.aws_url,
            "azure": self.azure_url,
            "gcp": self.gcp_url,
            "alicloud": self.alicloud_url,
            "oci": self.oci_url,
            "ibm": self.ibm_url
        }
        
        url = url_map.get(provider.lower())
        if not url:
            raise ValueError(f"Unknown provider: {provider}")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(f"{url}/api/v1/scan/{scan_id}/progress")
            response.raise_for_status()
            return response.json()
    
    async def get_scan_status(self, provider: str, scan_id: str) -> Dict[str, Any]:
        """Get scan status with progress"""
        url_map = {
            "aws": self.aws_url,
            "azure": self.azure_url,
            "gcp": self.gcp_url,
            "alicloud": self.alicloud_url,
            "oci": self.oci_url,
            "ibm": self.ibm_url
        }
        
        url = url_map.get(provider.lower())
        if not url:
            raise ValueError(f"Unknown provider: {provider}")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(f"{url}/api/v1/scan/{scan_id}/status")
            response.raise_for_status()
            return response.json()
    
    async def get_scan_results(
        self,
        provider: str,
        scan_id: str,
        page: int = 1,
        page_size: int = 100
    ) -> Dict[str, Any]:
        """Get scan results with pagination"""
        url_map = {
            "aws": self.aws_url,
            "azure": self.azure_url,
            "gcp": self.gcp_url,
            "alicloud": self.alicloud_url,
            "oci": self.oci_url,
            "ibm": self.ibm_url
        }
        
        url = url_map.get(provider.lower())
        if not url:
            raise ValueError(f"Unknown provider: {provider}")
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.get(
                f"{url}/api/v1/scan/{scan_id}/results",
                params={"page": page, "page_size": page_size}
            )
            response.raise_for_status()
            return response.json()
    
    async def get_scan_summary(self, provider: str, scan_id: str) -> Dict[str, Any]:
        """Get scan summary with statistics"""
        url_map = {
            "aws": self.aws_url,
            "azure": self.azure_url,
            "gcp": self.gcp_url,
            "alicloud": self.alicloud_url,
            "oci": self.oci_url,
            "ibm": self.ibm_url
        }
        
        url = url_map.get(provider.lower())
        if not url:
            raise ValueError(f"Unknown provider: {provider}")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(f"{url}/api/v1/scan/{scan_id}/summary")
            response.raise_for_status()
            return response.json()
    
    async def list_scans(
        self,
        provider: str,
        status: Optional[str] = None,
        filter_key: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Dict[str, Any]:
        """List scans with filters"""
        url_map = {
            "aws": (self.aws_url, "account"),
            "azure": (self.azure_url, "subscription"),
            "gcp": (self.gcp_url, "project"),
            "alicloud": (self.alicloud_url, "account"),
            "oci": (self.oci_url, "compartment"),
            "ibm": (self.ibm_url, "account")
        }
        
        url_info = url_map.get(provider.lower())
        if not url_info:
            raise ValueError(f"Unknown provider: {provider}")
        
        url, filter_param = url_info
        
        params = {"limit": limit, "offset": offset}
        if status:
            params["status"] = status
        if filter_key:
            params[filter_param] = filter_key
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(f"{url}/api/v1/scans", params=params)
            response.raise_for_status()
            return response.json()
    
    async def get_engine_metrics(self, provider: str) -> Dict[str, Any]:
        """Get engine metrics"""
        url_map = {
            "aws": self.aws_url,
            "azure": self.azure_url,
            "gcp": self.gcp_url,
            "alicloud": self.alicloud_url,
            "oci": self.oci_url,
            "ibm": self.ibm_url
        }
        
        url = url_map.get(provider.lower())
        if not url:
            raise ValueError(f"Unknown provider: {provider}")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(f"{url}/api/v1/metrics")
            response.raise_for_status()
            return response.json()

