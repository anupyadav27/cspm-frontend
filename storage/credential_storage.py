"""
Credential storage with encryption
"""
import json
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from onboarding.database.models import AccountCredential
from onboarding.storage.encryption import encryption_service
from uuid import UUID


class CredentialStorage:
    """Service for storing and retrieving encrypted credentials"""
    
    def __init__(self, db: Session):
        self.db = db
        self.encryption = encryption_service
    
    def store(
        self,
        account_id: UUID,
        credential_type: str,
        credentials: Dict[str, Any],
        expires_at: Optional = None
    ) -> AccountCredential:
        """
        Store encrypted credentials
        
        Args:
            account_id: Account UUID
            credential_type: Type of credential (e.g., 'aws_iam_role')
            credentials: Credential data dictionary
            expires_at: Optional expiration timestamp
            
        Returns:
            AccountCredential object
        """
        # Convert credentials to JSON string
        credentials_json = json.dumps(credentials)
        
        # Encrypt
        encrypted_data = self.encryption.encrypt(credentials_json)
        
        # Store in database
        credential = AccountCredential(
            account_id=account_id,
            credential_type=credential_type,
            encrypted_data=encrypted_data,
            encryption_key_id=None,  # Could store key ID if using KMS
            expires_at=expires_at
        )
        
        self.db.add(credential)
        self.db.commit()
        self.db.refresh(credential)
        
        return credential
    
    def retrieve(self, account_id: UUID) -> Dict[str, Any]:
        """
        Retrieve and decrypt credentials for an account
        
        Args:
            account_id: Account UUID
            
        Returns:
            Decrypted credentials dictionary
            
        Raises:
            ValueError: If no credentials found
        """
        credential = self.db.query(AccountCredential).filter(
            AccountCredential.account_id == account_id
        ).order_by(
            AccountCredential.created_at.desc()
        ).first()
        
        if not credential:
            raise ValueError(f"No credentials found for account {account_id}")
        
        # Decrypt
        decrypted_json = self.encryption.decrypt(credential.encrypted_data)
        
        # Parse JSON
        credentials = json.loads(decrypted_json)
        
        # Update last_used_at
        credential.last_used_at = func.now()
        self.db.commit()
        
        return credentials
    
    def delete(self, account_id: UUID) -> bool:
        """
        Delete credentials for an account
        
        Args:
            account_id: Account UUID
            
        Returns:
            True if deleted, False if not found
        """
        deleted = self.db.query(AccountCredential).filter(
            AccountCredential.account_id == account_id
        ).delete()
        
        self.db.commit()
        return deleted > 0

