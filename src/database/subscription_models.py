"""
Subscription Plan Models for Leaf Disease Detection System
=========================================================

MongoDB models for subscription plans, user subscriptions, and billing in Indian Rupees.
"""

from datetime import datetime, timedelta
from enum import Enum
from typing import Annotated, List, Optional

from bson import ObjectId
from pydantic import BaseModel, BeforeValidator, Field

from .models import PyObjectId, validate_object_id


class PlanType(str, Enum):
    """Subscription plan types"""
    FREE = "free"
    BASIC = "basic"
    PREMIUM = "premium"
    ENTERPRISE = "enterprise"


class BillingCycle(str, Enum):
    """Billing cycle options"""
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"


class PaymentStatus(str, Enum):
    """Payment status"""
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class SubscriptionStatus(str, Enum):
    """Subscription status"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class SubscriptionPlan(BaseModel):
    """Subscription plan model"""
    
    id: Optional[PyObjectId] = Field(default_factory=ObjectId, alias="_id")
    name: str = Field(..., max_length=100)
    plan_type: PlanType
    description: str = Field(..., max_length=500)
    
    # Pricing in Indian Rupees
    monthly_price: float = Field(..., ge=0)
    quarterly_price: float = Field(..., ge=0)
    yearly_price: float = Field(..., ge=0)
    
    # Plan limits
    max_analyses_per_month: int = Field(..., ge=0)  # 0 = unlimited
    max_image_size_mb: int = Field(default=10, ge=1)
    api_rate_limit_per_minute: int = Field(default=60, ge=1)
    
    # Features
    features: List[str] = []
    has_priority_support: bool = False
    has_api_access: bool = False
    has_bulk_analysis: bool = False
    has_advanced_analytics: bool = False
    has_prescription_export: bool = False
    
    # Plan status
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class UserSubscription(BaseModel):
    """User subscription model"""
    
    id: Optional[PyObjectId] = Field(default_factory=ObjectId, alias="_id")
    user_id: str
    username: str
    plan_id: str
    plan_type: PlanType
    
    # Subscription details
    status: SubscriptionStatus = SubscriptionStatus.ACTIVE
    billing_cycle: BillingCycle
    amount_paid: float = Field(..., ge=0)  # Amount in INR
    
    # Dates
    start_date: datetime = Field(default_factory=datetime.utcnow)
    end_date: datetime
    next_billing_date: Optional[datetime] = None
    
    # Usage tracking
    analyses_used_this_month: int = Field(default=0, ge=0)
    last_reset_date: datetime = Field(default_factory=datetime.utcnow)
    
    # Payment info
    payment_method: Optional[str] = None  # "razorpay", "paytm", "upi", etc.
    transaction_id: Optional[str] = None
    
    # Auto-renewal
    auto_renewal: bool = True
    cancelled_at: Optional[datetime] = None
    cancellation_reason: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class PaymentRecord(BaseModel):
    """Payment record model"""
    
    id: Optional[PyObjectId] = Field(default_factory=ObjectId, alias="_id")
    user_id: str
    username: str
    subscription_id: str
    
    # Payment details
    amount: float = Field(..., ge=0)  # Amount in INR
    currency: str = Field(default="INR")
    payment_method: str  # "razorpay", "paytm", "upi", "card", etc.
    
    # Transaction info
    transaction_id: str
    gateway_transaction_id: Optional[str] = None
    gateway_response: Optional[dict] = None
    
    # Status
    status: PaymentStatus = PaymentStatus.PENDING
    payment_date: Optional[datetime] = None
    
    # Billing info
    billing_cycle: BillingCycle
    billing_period_start: datetime
    billing_period_end: datetime
    
    # Metadata
    invoice_number: Optional[str] = None
    notes: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class UsageQuota(BaseModel):
    """Monthly usage quota tracking"""
    
    id: Optional[PyObjectId] = Field(default_factory=ObjectId, alias="_id")
    user_id: str
    username: str
    subscription_id: str
    
    # Quota period
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2024)
    
    # Usage counters
    analyses_used: int = Field(default=0, ge=0)
    analyses_limit: int = Field(..., ge=0)  # 0 = unlimited
    
    # Additional metrics
    total_api_calls: int = Field(default=0, ge=0)
    total_tokens_used: int = Field(default=0, ge=0)
    total_cost_incurred: float = Field(default=0.0, ge=0)
    
    # Reset tracking
    last_reset_date: datetime = Field(default_factory=datetime.utcnow)
    next_reset_date: datetime
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


# Predefined subscription plans in Indian Rupees
DEFAULT_SUBSCRIPTION_PLANS = [
    {
        "name": "Free Plan",
        "plan_type": "free",
        "description": "Basic disease detection for personal use",
        "monthly_price": 0.0,
        "quarterly_price": 0.0,
        "yearly_price": 0.0,
        "max_analyses_per_month": 10,
        "max_image_size_mb": 5,
        "api_rate_limit_per_minute": 10,
        "features": [
            "10 disease analyses per month",
            "Basic disease identification",
            "Treatment recommendations",
            "5MB image upload limit"
        ],
        "has_priority_support": False,
        "has_api_access": False,
        "has_bulk_analysis": False,
        "has_advanced_analytics": False,
        "has_prescription_export": False
    },
    {
        "name": "Basic Plan",
        "plan_type": "basic",
        "description": "Enhanced features for regular users",
        "monthly_price": 299.0,
        "quarterly_price": 799.0,  # 11% discount
        "yearly_price": 2999.0,    # 16% discount
        "max_analyses_per_month": 100,
        "max_image_size_mb": 10,
        "api_rate_limit_per_minute": 30,
        "features": [
            "100 disease analyses per month",
            "Advanced disease identification",
            "Detailed treatment recommendations",
            "YouTube video tutorials",
            "10MB image upload limit",
            "Email support"
        ],
        "has_priority_support": False,
        "has_api_access": True,
        "has_bulk_analysis": False,
        "has_advanced_analytics": False,
        "has_prescription_export": True
    },
    {
        "name": "Premium Plan",
        "plan_type": "premium",
        "description": "Professional features for farmers and consultants",
        "monthly_price": 799.0,
        "quarterly_price": 2199.0,  # 8% discount
        "yearly_price": 7999.0,     # 17% discount
        "max_analyses_per_month": 500,
        "max_image_size_mb": 20,
        "api_rate_limit_per_minute": 60,
        "features": [
            "500 disease analyses per month",
            "AI-powered severity assessment",
            "Prescription generation",
            "Bulk image analysis",
            "Advanced analytics dashboard",
            "20MB image upload limit",
            "Priority email support",
            "API access"
        ],
        "has_priority_support": True,
        "has_api_access": True,
        "has_bulk_analysis": True,
        "has_advanced_analytics": True,
        "has_prescription_export": True
    },
    {
        "name": "Enterprise Plan",
        "plan_type": "enterprise",
        "description": "Unlimited access for organizations and research",
        "monthly_price": 2499.0,
        "quarterly_price": 6999.0,  # 6% discount
        "yearly_price": 24999.0,    # 17% discount
        "max_analyses_per_month": 0,  # Unlimited
        "max_image_size_mb": 50,
        "api_rate_limit_per_minute": 120,
        "features": [
            "Unlimited disease analyses",
            "Custom AI model training",
            "White-label solution",
            "Advanced API integration",
            "Real-time analytics",
            "50MB image upload limit",
            "24/7 phone support",
            "Custom integrations",
            "Multi-user management"
        ],
        "has_priority_support": True,
        "has_api_access": True,
        "has_bulk_analysis": True,
        "has_advanced_analytics": True,
        "has_prescription_export": True
    }
]


# Request/Response models
class SubscriptionCreateRequest(BaseModel):
    """Request to create subscription"""
    plan_id: str
    billing_cycle: BillingCycle
    payment_method: str


class SubscriptionResponse(BaseModel):
    """Subscription response model"""
    id: str
    user_id: str
    username: str
    plan: SubscriptionPlan
    status: SubscriptionStatus
    billing_cycle: BillingCycle
    amount_paid: float
    start_date: datetime
    end_date: datetime
    analyses_used_this_month: int
    auto_renewal: bool


class PaymentCreateRequest(BaseModel):
    """Request to create payment"""
    subscription_id: str
    amount: float
    payment_method: str
    transaction_id: str


class UsageResponse(BaseModel):
    """Usage quota response"""
    analyses_used: int
    analyses_limit: int
    remaining_analyses: int
    usage_percentage: float
    next_reset_date: datetime