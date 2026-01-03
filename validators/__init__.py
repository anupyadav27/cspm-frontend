"""
Credential validators for all CSPs
"""
from onboarding.validators.base_validator import BaseValidator, ValidationResult
from onboarding.validators.aws_validator import AWSValidator
from onboarding.validators.azure_validator import AzureValidator
from onboarding.validators.gcp_validator import GCPValidator
from onboarding.validators.alicloud_validator import AliCloudValidator
from onboarding.validators.oci_validator import OCIValidator
from onboarding.validators.ibm_validator import IBMValidator

__all__ = [
    'BaseValidator',
    'ValidationResult',
    'AWSValidator',
    'AzureValidator',
    'GCPValidator',
    'AliCloudValidator',
    'OCIValidator',
    'IBMValidator'
]

