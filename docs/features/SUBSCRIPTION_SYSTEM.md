# Subscription System Documentation

## Overview

The Leaf Disease Detection System now includes a comprehensive subscription management system with pricing in Indian Rupees (₹). This system provides tiered access to features based on subscription plans.

## Subscription Plans

### 1. Free Plan - ₹0/month
- **Analyses**: 10 per month
- **Image Size**: Up to 5MB
- **Rate Limit**: 10 requests/minute
- **Features**:
  - Basic disease identification
  - Treatment recommendations
  - Email support

### 2. Basic Plan - ₹299/month
- **Analyses**: 100 per month
- **Image Size**: Up to 10MB
- **Rate Limit**: 30 requests/minute
- **Features**:
  - Advanced disease identification
  - Detailed treatment recommendations
  - YouTube video tutorials
  - API access
  - Prescription export (PDF)
  - Email support

**Pricing Options**:
- Monthly: ₹299 (no discount)
- Quarterly: ₹799 (11% discount - ₹266/month)
- Yearly: ₹2,999 (16% discount - ₹250/month)

### 3. Premium Plan - ₹799/month
- **Analyses**: 500 per month
- **Image Size**: Up to 20MB
- **Rate Limit**: 60 requests/minute
- **Features**:
  - AI-powered severity assessment
  - Prescription generation
  - Bulk image analysis
  - Advanced analytics dashboard
  - Priority email support
  - API access

**Pricing Options**:
- Monthly: ₹799 (no discount)
- Quarterly: ₹2,199 (8% discount - ₹733/month)
- Yearly: ₹7,999 (17% discount - ₹667/month)

### 4. Enterprise Plan - ₹2,499/month
- **Analyses**: Unlimited
- **Image Size**: Up to 50MB
- **Rate Limit**: 120 requests/minute
- **Features**:
  - Custom AI model training
  - White-label solution
  - Advanced API integration
  - Real-time analytics
  - 24/7 phone support
  - Custom integrations
  - Multi-user management

**Pricing Options**:
- Monthly: ₹2,499 (no discount)
- Quarterly: ₹6,999 (6% discount - ₹2,333/month)
- Yearly: ₹24,999 (17% discount - ₹2,083/month)

## Database Models

### SubscriptionPlan
```python
{
    "_id": ObjectId,
    "name": str,
    "plan_type": "free|basic|premium|enterprise",
    "description": str,
    "monthly_price": float,
    "quarterly_price": float,
    "yearly_price": float,
    "max_analyses_per_month": int,  # 0 = unlimited
    "max_image_size_mb": int,
    "api_rate_limit_per_minute": int,
    "features": [str],
    "has_priority_support": bool,
    "has_api_access": bool,
    "has_bulk_analysis": bool,
    "has_advanced_analytics": bool,
    "has_prescription_export": bool,
    "is_active": bool,
    "created_at": datetime,
    "updated_at": datetime
}
```

### UserSubscription
```python
{
    "_id": ObjectId,
    "user_id": str,
    "username": str,
    "plan_id": str,
    "plan_type": "free|basic|premium|enterprise",
    "status": "active|inactive|expired|cancelled",
    "billing_cycle": "monthly|quarterly|yearly",
    "amount_paid": float,
    "start_date": datetime,
    "end_date": datetime,
    "next_billing_date": datetime,
    "analyses_used_this_month": int,
    "last_reset_date": datetime,
    "payment_method": str,
    "transaction_id": str,
    "auto_renewal": bool,
    "cancelled_at": datetime,
    "cancellation_reason": str,
    "created_at": datetime,
    "updated_at": datetime
}
```

### PaymentRecord
```python
{
    "_id": ObjectId,
    "user_id": str,
    "username": str,
    "subscription_id": str,
    "amount": float,
    "currency": "INR",
    "payment_method": str,
    "transaction_id": str,
    "gateway_transaction_id": str,
    "gateway_response": dict,
    "status": "pending|completed|failed|refunded",
    "payment_date": datetime,
    "billing_cycle": "monthly|quarterly|yearly",
    "billing_period_start": datetime,
    "billing_period_end": datetime,
    "invoice_number": str,
    "notes": str,
    "created_at": datetime,
    "updated_at": datetime
}
```

### UsageQuota
```python
{
    "_id": ObjectId,
    "user_id": str,
    "username": str,
    "subscription_id": str,
    "month": int,
    "year": int,
    "analyses_used": int,
    "analyses_limit": int,
    "total_api_calls": int,
    "total_tokens_used": int,
    "total_cost_incurred": float,
    "last_reset_date": datetime,
    "next_reset_date": datetime,
    "created_at": datetime,
    "updated_at": datetime
}
```

## API Endpoints

### Public Endpoints

#### GET /subscription/plans
Get all available subscription plans.

**Response**:
```json
[
    {
        "id": "plan_id",
        "name": "Basic Plan",
        "plan_type": "basic",
        "description": "Enhanced features for regular users",
        "monthly_price": 299.0,
        "quarterly_price": 799.0,
        "yearly_price": 2999.0,
        "max_analyses_per_month": 100,
        "features": ["100 analyses per month", "API access", ...]
    }
]
```

#### GET /subscription/plans/{plan_id}
Get specific subscription plan details.

### User Endpoints (Requires Authentication)

#### GET /subscription/my-subscription
Get current user's subscription details.

**Response**:
```json
{
    "id": "subscription_id",
    "user_id": "user_id",
    "username": "username",
    "plan": { /* plan details */ },
    "status": "active",
    "billing_cycle": "monthly",
    "amount_paid": 299.0,
    "start_date": "2024-01-01T00:00:00Z",
    "end_date": "2024-02-01T00:00:00Z",
    "analyses_used_this_month": 15,
    "auto_renewal": true
}
```

#### POST /subscription/subscribe
Create new subscription.

**Request**:
```json
{
    "plan_id": "plan_id",
    "billing_cycle": "monthly",
    "payment_method": "razorpay"
}
```

#### POST /subscription/cancel
Cancel current subscription.

#### GET /subscription/usage
Get current usage quota.

**Response**:
```json
{
    "analyses_used": 15,
    "analyses_limit": 100,
    "remaining_analyses": 85,
    "usage_percentage": 15.0,
    "next_reset_date": "2024-02-01T00:00:00Z"
}
```

#### GET /subscription/payments
Get payment history.

### Admin Endpoints (Requires Admin Role)

#### POST /subscription/admin/initialize-plans
Initialize default subscription plans.

#### GET /subscription/admin/all-subscriptions
Get all user subscriptions.

#### GET /subscription/admin/revenue-stats
Get revenue statistics.

**Response**:
```json
{
    "total_revenue": 50000.0,
    "monthly_revenue": 15000.0,
    "revenue_by_plan": [
        {
            "plan_type": "basic",
            "total_revenue": 20000.0,
            "subscription_count": 67
        }
    ],
    "currency": "INR"
}
```

## Setup Instructions

### 1. Initialize Database Collections

```bash
# Run the initialization script
python scripts/initialize_subscription_plans.py
```

### 2. Update Environment Variables

Add to your `.env` file:
```env
# Payment Gateway (for future integration)
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Subscription Settings
DEFAULT_FREE_PLAN_ANALYSES=10
SUBSCRIPTION_GRACE_PERIOD_DAYS=3
```

### 3. Update User Registration

Modify user registration to automatically assign free plan:

```python
from src.services.subscription_service import SubscriptionService

# After user creation
await SubscriptionService.assign_free_plan(user_id, username)
```

### 4. Add Usage Checking Middleware

Add usage limit checking to disease detection endpoints:

```python
from src.services.subscription_service import SubscriptionService

# Before processing analysis
can_analyze = await SubscriptionService.check_usage_limit(user_id)
if not can_analyze:
    raise HTTPException(
        status_code=429,
        detail="Usage limit exceeded. Please upgrade your plan."
    )

# After successful analysis
await SubscriptionService.increment_usage(user_id)
```

## Payment Integration

### Razorpay Integration (Recommended for India)

1. **Install Razorpay SDK**:
```bash
pip install razorpay
```

2. **Create Payment Order**:
```python
import razorpay

client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

order_data = {
    'amount': int(amount * 100),  # Amount in paise
    'currency': 'INR',
    'receipt': f'receipt_{user_id}_{timestamp}',
    'payment_capture': 1
}

order = client.order.create(data=order_data)
```

3. **Verify Payment**:
```python
def verify_payment(razorpay_order_id, razorpay_payment_id, razorpay_signature):
    try:
        client.utility.verify_payment_signature({
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        })
        return True
    except:
        return False
```

## Usage Tracking

The system automatically tracks:
- Monthly analysis usage per user
- API call counts
- Token usage and costs
- Payment history
- Subscription renewals

## Billing Cycle Management

- **Monthly**: Resets on the same date each month
- **Quarterly**: Resets every 3 months
- **Yearly**: Resets annually

Usage quotas automatically reset based on the billing cycle.

## Revenue Analytics

Admin dashboard provides:
- Total revenue (all time)
- Monthly revenue
- Revenue by plan type
- Subscription counts
- Usage statistics
- Cost analysis

## Future Enhancements

1. **Promo Codes**: Discount system
2. **Referral Program**: User referral rewards
3. **Usage Alerts**: Email notifications for usage limits
4. **Plan Recommendations**: AI-based plan suggestions
5. **Corporate Plans**: Custom enterprise pricing
6. **API Rate Limiting**: Dynamic rate limiting based on plan
7. **White-label Options**: Custom branding for enterprise clients

## Testing

```bash
# Initialize plans
python scripts/initialize_subscription_plans.py

# Test subscription creation
curl -X POST "http://localhost:8000/subscription/subscribe" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan_id": "PLAN_ID",
    "billing_cycle": "monthly",
    "payment_method": "razorpay"
  }'

# Check usage
curl -X GET "http://localhost:8000/subscription/usage" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

This subscription system provides a robust foundation for monetizing the leaf disease detection service while offering flexible pricing options suitable for the Indian market.