# Load environment variables first
from dotenv import load_dotenv
load_dotenv()
load_dotenv('.env.razorpay')

import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse

from src.auth.security import get_current_active_user, get_current_admin_user
from src.database.models import UserInDB
from src.database.subscription_models import (
    BillingCycle,
    PaymentCreateRequest,
    SubscriptionCreateRequest,
    SubscriptionPlan,
    SubscriptionResponse,
    UsageResponse,
)
from src.services.subscription_service import SubscriptionService

logger = logging.getLogger(__name__)

# Test if router is being loaded
print("🔧 SUBSCRIPTION ROUTES MODULE LOADED")
logger.info("🔧 Subscription routes module initialized")

router = APIRouter(prefix="/api/subscriptions", tags=["subscription"])


@router.get("/debug")
async def debug_endpoint():
    """Debug endpoint to test router registration"""
    logger.info("🔧 Debug endpoint called")
    return {
        "message": "Subscription router is working",
        "timestamp": "2024-01-01",
        "status": "ok"
    }


@router.get("/test")
async def test_endpoint():
    """Test endpoint to verify router is working"""
    return {"message": "Subscription router is working"}


@router.get("/plans", response_model=List[SubscriptionPlan])
async def get_subscription_plans():
    """Get all available subscription plans"""
    try:
        plans = await SubscriptionService.get_all_plans()
        return plans
    except Exception as e:
        logger.error(f"Failed to get subscription plans: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve subscription plans"
        )


@router.get("/plans/{plan_id}", response_model=SubscriptionPlan)
async def get_subscription_plan(plan_id: str):
    """Get specific subscription plan by ID"""
    try:
        plan = await SubscriptionService.get_plan_by_id(plan_id)
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subscription plan not found"
            )
        return plan
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get subscription plan {plan_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve subscription plan"
        )


@router.get("/my-subscription")
async def get_my_subscription(current_user: UserInDB = Depends(get_current_active_user)):
    """Get current user's subscription details"""
    try:
        logger.info(f"🔍 Getting subscription for user: {current_user.username}")
        
        subscription = await SubscriptionService.get_user_subscription(str(current_user.id))
        logger.info(f"📋 Subscription lookup result: {subscription}")
        
        if not subscription:
            logger.info("📝 No active subscription found")
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content={"message": "No active subscription found", "subscription": None}
            )
        
        # Get plan details
        plan = await SubscriptionService.get_plan_by_id(subscription.plan_id)
        if not plan:
            logger.error(f"❌ Plan not found for subscription: {subscription.plan_id}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Subscription plan not found"
            )
        
        # Get usage information
        usage_quota = await SubscriptionService.get_user_usage_quota(str(current_user.id))
        
        response_data = {
            "id": str(subscription.id),
            "user_id": subscription.user_id,
            "username": subscription.username,
            "plan": {
                "id": str(plan.id),
                "name": plan.name,
                "plan_type": plan.plan_type.value,
                "price": plan.monthly_price,
                "billing_cycle": subscription.billing_cycle.value,
                "analyses_limit": plan.max_analyses_per_month,
                "features": plan.features
            },
            "status": subscription.status.value,
            "billing_cycle": subscription.billing_cycle.value,
            "amount_paid": subscription.amount_paid,
            "start_date": subscription.start_date.isoformat(),
            "end_date": subscription.end_date.isoformat() if subscription.end_date else None,
            "next_billing_date": subscription.next_billing_date.isoformat() if subscription.next_billing_date else None,
            "analyses_used_this_month": subscription.analyses_used_this_month,
            "auto_renewal": subscription.auto_renewal,
            "usage": {
                "analyses_used": usage_quota.analyses_used if usage_quota else 0,
                "analyses_limit": plan.max_analyses_per_month,
                "usage_percent": (usage_quota.analyses_used / plan.max_analyses_per_month * 100) if usage_quota and plan.max_analyses_per_month > 0 else 0
            }
        }
        
        logger.info(f"✅ Returning subscription data for {plan.name}")
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to get subscription for user {current_user.username}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve subscription"
        )


@router.get("/initialize-plans")
async def initialize_plans():
    """Initialize subscription plans if not exists"""
    try:
        await SubscriptionService.initialize_default_plans()
        return {"message": "Plans initialized successfully"}
    except Exception as e:
        logger.error(f"Failed to initialize plans: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to initialize plans")


@router.get("/plans-simple")
async def get_plans_simple():
    """Simple plans endpoint without service layer"""
    try:
        from src.database.connection import MongoDB
        
        plans_collection = MongoDB.get_collection("subscription_plans")
        plans_cursor = plans_collection.find({"is_active": True})
        plans = []
        async for plan_data in plans_cursor:
            plans.append({
                "id": str(plan_data["_id"]),
                "name": plan_data["name"],
                "monthly_price": plan_data["monthly_price"]
            })
        
        logger.info(f"📋 Found {len(plans)} plans: {[p['name'] for p in plans]}")
        return {"plans": plans, "count": len(plans)}
    except Exception as e:
        logger.error(f"❌ Error getting plans: {str(e)}")
        return {"error": str(e), "plans": [], "count": 0}


@router.post("/create-order-simple")
async def create_order_simple(
    request: dict,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Simple create order without full service layer"""
    try:
        logger.info(f"🚀 Simple order creation for: {current_user.username}")
        logger.info(f"📡 Request: {request}")
        
        plan_name = request.get('plan_name', '').lower()
        logger.info(f"🔍 Looking for plan: '{plan_name}'")
        
        # Direct database lookup - handle both "premium" and "Premium Plan"
        from src.database.connection import MongoDB
        plans_collection = MongoDB.get_collection("subscription_plans")
        
        # Try exact match first, then with "Plan" suffix
        plan_data = await plans_collection.find_one({
            "name": {"$regex": f"^{plan_name}$", "$options": "i"},
            "is_active": True
        })
        
        if not plan_data:
            # Try with "Plan" suffix
            plan_data = await plans_collection.find_one({
                "name": {"$regex": f"^{plan_name} plan$", "$options": "i"},
                "is_active": True
            })
        
        if not plan_data:
            # List all plans for debugging
            all_plans = []
            async for p in plans_collection.find({"is_active": True}):
                all_plans.append(p["name"])
            
            logger.error(f"❌ Plan '{plan_name}' not found. Available: {all_plans}")
            return {"error": "Plan not found", "available_plans": all_plans}
        
        logger.info(f"✅ Plan found: {plan_data['name']} - ₹{plan_data['monthly_price']}")
        
        return {
            "success": True,
            "plan_name": plan_data["name"],
            "amount": plan_data["monthly_price"],
            "message": "Plan lookup successful"
        }
        
    except Exception as e:
        logger.error(f"❌ Simple order error: {str(e)}")
        return {"error": str(e)}


@router.post("/create-order")
async def create_payment_order(
    request: dict,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Create Razorpay order for subscription payment"""
    try:
        logger.info(f"🚀 Creating payment order for user: {current_user.username}")
        logger.info(f"📡 Request data: {request}")
        
        from src.services.razorpay_service import razorpay_service
        
        plan_name = request.get('plan_name')
        billing_cycle = request.get('billing_cycle', 'monthly')
        
        logger.info(f"🔍 Looking for plan: {plan_name}")
        
        # Get plan details
        plan = await SubscriptionService.get_plan_by_name(plan_name)
        logger.info(f"📋 Plan lookup result: {plan}")
        
        if not plan:
            logger.error(f"❌ Plan '{plan_name}' not found")
            # List all available plans for debugging
            all_plans = await SubscriptionService.get_all_plans()
            logger.info(f"📋 Available plans: {[p.name for p in all_plans]}")
            raise HTTPException(status_code=404, detail="Plan not found")
        
        logger.info(f"✅ Plan found: {plan.name} (ID: {plan.id})")
        
        # Calculate amount based on billing cycle
        if billing_cycle.lower() == 'monthly':
            amount = plan.monthly_price
        elif billing_cycle.lower() == 'quarterly':
            amount = plan.quarterly_price
        else:
            amount = plan.yearly_price
        
        logger.info(f"💰 Calculated amount: ₹{amount} for {billing_cycle} billing")
        
        # Create Razorpay order
        order = razorpay_service.create_order(
            amount=amount,
            receipt=f"sub_{current_user.username}_{plan_name}_{billing_cycle}"
        )
        
        logger.info(f"✅ Razorpay order created successfully: {order['id']}")
        
        return {
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "key_id": razorpay_service.key_id,
            "plan_name": plan.name,
            "billing_cycle": billing_cycle
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Failed to create payment order: {str(e)}")
        logger.error(f"❌ Error type: {type(e).__name__}")
        raise HTTPException(status_code=500, detail="Failed to create payment order")


@router.post("/verify-payment-debug")
async def verify_payment_debug(
    request: dict,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Debug version of payment verification"""
    try:
        from src.services.razorpay_service import razorpay_service
        
        payment_id = request.get('payment_id')
        order_id = request.get('order_id')
        signature = request.get('signature')
        plan_name = request.get('plan_name')
        
        result = {"steps": [], "success": False}
        
        # Step 1: Check Razorpay service
        if razorpay_service.client:
            result["steps"].append("✅ Razorpay client initialized")
        else:
            result["steps"].append("❌ Razorpay client not initialized")
            return result
        
        # Step 2: Verify signature
        try:
            verify_result = razorpay_service.verify_payment(payment_id, order_id, signature)
            result["steps"].append(f"✅ Signature verification: {verify_result}")
        except Exception as e:
            result["steps"].append(f"❌ Signature verification failed: {str(e)}")
            return result
        
        # Step 3: Get payment details
        try:
            payment_details = razorpay_service.get_payment_details(payment_id)
            result["steps"].append(f"✅ Payment details: {payment_details.get('status') if payment_details else 'None'}")
        except Exception as e:
            result["steps"].append(f"❌ Payment details failed: {str(e)}")
            return result
        
        # Step 4: Find plan
        try:
            plan = await SubscriptionService.get_plan_by_name(plan_name)
            result["steps"].append(f"✅ Plan found: {plan.name if plan else 'None'}")
        except Exception as e:
            result["steps"].append(f"❌ Plan lookup failed: {str(e)}")
            return result
        
        result["success"] = True
        return result
        
    except Exception as e:
        return {"error": str(e), "type": type(e).__name__}


@router.post("/test-direct-creation")
async def test_direct_creation(
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Test direct subscription creation bypassing service layer"""
    try:
        from src.database.connection import MongoDB
        from src.database.subscription_models import UserSubscription, BillingCycle, PlanType, SubscriptionStatus
        from datetime import datetime, timedelta
        
        logger.info(f"🧪 Direct test for user: {current_user.username}")
        
        # Create subscription object directly
        now = datetime.utcnow()
        subscription_data = {
            "user_id": str(current_user.id),
            "username": current_user.username,
            "plan_id": "6981eb6d815b3485fabeb05b",  # Premium plan ID
            "plan_type": PlanType.PREMIUM,
            "status": SubscriptionStatus.ACTIVE,
            "billing_cycle": BillingCycle.MONTHLY,
            "amount_paid": 799.0,
            "start_date": now,
            "end_date": now + timedelta(days=30),
            "next_billing_date": now + timedelta(days=30),
            "payment_method": "test",
            "transaction_id": "test_direct_123",
            "analyses_used_this_month": 0,
            "last_reset_date": now,
            "auto_renewal": True,
            "created_at": now,
            "updated_at": now
        }
        
        logger.info(f"📝 Creating subscription with data: {subscription_data}")
        
        # Validate with Pydantic model
        subscription = UserSubscription(**subscription_data)
        logger.info(f"✅ Pydantic validation passed")
        
        # Insert into database
        subscriptions_collection = MongoDB.get_collection("user_subscriptions")
        result = await subscriptions_collection.insert_one(subscription.dict(by_alias=True))
        logger.info(f"💾 Inserted with ID: {result.inserted_id}")
        
        return {
            "success": True,
            "message": "Direct subscription created successfully",
            "subscription_id": str(result.inserted_id)
        }
        
    except Exception as e:
        logger.error(f"❌ Direct creation failed: {str(e)}")
        import traceback
        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        return {"error": str(e), "type": type(e).__name__}


@router.post("/test-subscription-creation")
async def test_subscription_creation(
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Test subscription creation without payment"""
    try:
        logger.info(f"🧪 Testing subscription creation for user: {current_user.username}")
        
        # Get premium plan by ID directly
        premium_plan_id = "6981eb6d815b3485fabeb05b"  # From the API response
        logger.info(f"🔍 Testing with plan ID: {premium_plan_id}")
        
        plan = await SubscriptionService.get_plan_by_id(premium_plan_id)
        if not plan:
            logger.error(f"❌ Plan not found with ID: {premium_plan_id}")
            return {"error": f"Plan not found with ID: {premium_plan_id}"}
        
        logger.info(f"📋 Plan found: {plan.name} (ID: {plan.id})")
        
        # Test subscription creation
        subscription = await SubscriptionService.create_subscription(
            user_id=str(current_user.id),
            username=current_user.username,
            plan_id=str(plan.id),
            billing_cycle=BillingCycle.MONTHLY,
            payment_method="test",
            transaction_id="test_txn_123"
        )
        
        if subscription:
            return {
                "success": True,
                "message": "Test subscription created successfully",
                "subscription_id": str(subscription.id),
                "plan_name": plan.name
            }
        else:
            return {
                "success": False,
                "message": "Failed to create test subscription"
            }
            
    except Exception as e:
        logger.error(f"❌ Test subscription creation failed: {str(e)}")
        import traceback
        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        return {"error": str(e), "type": type(e).__name__}


@router.post("/verify-payment")
async def verify_payment(
    request: dict,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Verify payment and create subscription"""
    try:
        logger.info(f"🔍 Starting payment verification for user: {current_user.username}")
        logger.info(f"📡 Verification request: {request}")
        
        from src.services.razorpay_service import razorpay_service
        
        payment_id = request.get('payment_id')
        order_id = request.get('order_id')
        signature = request.get('signature')
        plan_name = request.get('plan_name')
        billing_cycle = request.get('billing_cycle', 'monthly')
        
        logger.info(f"💳 Payment details: ID={payment_id}, Order={order_id}")
        
        # Verify payment signature
        logger.info("🔒 Verifying payment signature...")
        verification_result = razorpay_service.verify_payment(payment_id, order_id, signature)
        logger.info(f"🔒 Signature verification result: {verification_result}")
        
        if not verification_result:
            logger.error("❌ Payment signature verification failed")
            raise HTTPException(status_code=400, detail="Payment verification failed")
        
        # Get payment details
        logger.info("📡 Fetching payment details from Razorpay...")
        payment_details = razorpay_service.get_payment_details(payment_id)
        logger.info(f"💳 Payment details: {payment_details}")
        
        if not payment_details or payment_details.get('status') != 'captured':
            logger.error(f"❌ Payment not successful. Status: {payment_details.get('status') if payment_details else 'None'}")
            raise HTTPException(status_code=400, detail="Payment not successful")
        
        # Create subscription
        logger.info(f"🔍 Looking up plan: {plan_name}")
        plan = await SubscriptionService.get_plan_by_name(plan_name)
        if not plan:
            logger.error(f"❌ Plan '{plan_name}' not found during verification")
            raise HTTPException(status_code=404, detail="Plan not found")
        
        logger.info(f"✅ Plan found: {plan.name}")
        
        # Cancel existing subscription
        logger.info("🚫 Cancelling existing subscription...")
        cancel_result = await SubscriptionService.cancel_user_subscription(str(current_user.id))
        logger.info(f"🚫 Cancel result: {cancel_result}")
        
        # Convert billing cycle
        billing_cycle_enum = BillingCycle.MONTHLY
        if billing_cycle.lower() == 'quarterly':
            billing_cycle_enum = BillingCycle.QUARTERLY
        elif billing_cycle.lower() == 'yearly':
            billing_cycle_enum = BillingCycle.YEARLY
        
        logger.info(f"📅 Billing cycle: {billing_cycle_enum}")
        
        # Create subscription
        logger.info("🚀 Creating new subscription...")
        subscription = await SubscriptionService.create_subscription(
            user_id=str(current_user.id),
            username=current_user.username,
            plan_id=str(plan.id),
            billing_cycle=billing_cycle_enum,
            payment_method="razorpay",
            transaction_id=payment_id
        )
        
        if not subscription:
            logger.error("❌ Failed to create subscription")
            raise HTTPException(status_code=500, detail="Failed to create subscription")
        
        logger.info(f"✅ Subscription created: {subscription.id}")
        
        # Create payment record
        amount = payment_details.get('amount', 0) / 100  # Convert from paise
        logger.info(f"💰 Creating payment record: ₹{amount}")
        
        payment_record = await SubscriptionService.create_payment_record(
            user_id=str(current_user.id),
            username=current_user.username,
            subscription_id=str(subscription.id),
            amount=amount,
            payment_method="razorpay",
            transaction_id=payment_id,
            billing_cycle=billing_cycle_enum
        )
        
        logger.info(f"✅ Payment record created: {payment_record}")
        
        return {
            "success": True,
            "message": "Payment successful and subscription activated",
            "subscription_id": str(subscription.id),
            "plan_name": plan.name
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Payment verification failed: {str(e)}")
        logger.error(f"❌ Error type: {type(e).__name__}")
        import traceback
        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Payment verification failed")


@router.post("/subscribe")
async def create_subscription(
    request: dict,  # Changed to accept flexible request
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Create new subscription for user"""
    try:
        plan_name = request.get('plan_name')
        billing_cycle = request.get('billing_cycle', 'monthly')
        payment_method = request.get('payment_method', 'card')
        
        if not plan_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Plan name is required"
            )
        
        # Get plan by name
        plan = await SubscriptionService.get_plan_by_name(plan_name)
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subscription plan not found"
            )
        
        # Check if user already has active subscription
        existing_subscription = await SubscriptionService.get_user_subscription(str(current_user.id))
        if existing_subscription:
            # Cancel existing subscription first
            await SubscriptionService.cancel_user_subscription(str(current_user.id))
        
        # Convert billing cycle string to enum
        billing_cycle_enum = BillingCycle.MONTHLY
        if billing_cycle.lower() == 'quarterly':
            billing_cycle_enum = BillingCycle.QUARTERLY
        elif billing_cycle.lower() == 'yearly':
            billing_cycle_enum = BillingCycle.YEARLY
        
        # Create subscription
        subscription = await SubscriptionService.create_subscription(
            user_id=str(current_user.id),
            username=current_user.username,
            plan_id=str(plan.id),
            billing_cycle=billing_cycle_enum,
            payment_method=payment_method,
            transaction_id=f"txn_{current_user.username}_{plan.plan_type.value}"
        )
        
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create subscription"
            )
        
        # Create payment record for paid plans
        if plan.plan_type.value != "free":
            amount = (
                plan.monthly_price if billing_cycle_enum == BillingCycle.MONTHLY
                else plan.quarterly_price if billing_cycle_enum == BillingCycle.QUARTERLY
                else plan.yearly_price
            )
            
            await SubscriptionService.create_payment_record(
                user_id=str(current_user.id),
                username=current_user.username,
                subscription_id=str(subscription.id),
                amount=amount,
                payment_method=payment_method,
                transaction_id=subscription.transaction_id,
                billing_cycle=billing_cycle_enum
            )
        
        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content={
                "message": "Subscription created successfully",
                "subscription_id": str(subscription.id),
                "plan_name": plan.name,
                "amount_paid": subscription.amount_paid
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create subscription: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create subscription"
        )


@router.post("/cancel")
async def cancel_subscription(current_user: UserInDB = Depends(get_current_active_user)):
    """Cancel user's current subscription"""
    try:
        success = await SubscriptionService.cancel_user_subscription(str(current_user.id))
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active subscription found to cancel"
            )
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"message": "Subscription cancelled successfully"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to cancel subscription for {current_user.username}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel subscription"
        )


@router.get("/check-usage")
async def check_usage_limits(current_user: UserInDB = Depends(get_current_active_user)):
    """Check if user can perform analysis based on subscription limits"""
    try:
        # Get user's subscription
        subscription = await SubscriptionService.get_user_subscription(str(current_user.id))
        
        if not subscription:
            # No subscription = free plan with 5 analyses limit
            analyses_used = current_user.analyses_this_month
            analyses_limit = 5  # Free plan limit
            
            return {
                "can_analyze": analyses_used < analyses_limit,
                "analyses_used": analyses_used,
                "analyses_limit": analyses_limit,
                "usage_percent": (analyses_used / analyses_limit) * 100,
                "plan_name": "Free",
                "remaining": max(0, analyses_limit - analyses_used)
            }
        
        # Get plan details
        plan = await SubscriptionService.get_plan_by_id(subscription.plan_id)
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Subscription plan not found"
            )
        
        analyses_used = current_user.analyses_this_month
        analyses_limit = plan.max_analyses_per_month
        
        # Unlimited plans (-1) can always analyze
        if analyses_limit == -1:
            return {
                "can_analyze": True,
                "analyses_used": analyses_used,
                "analyses_limit": -1,
                "usage_percent": 0,
                "plan_name": plan.name,
                "remaining": float('inf')
            }
        
        can_analyze = analyses_used < analyses_limit
        usage_percent = (analyses_used / analyses_limit) * 100 if analyses_limit > 0 else 0
        
        return {
            "can_analyze": can_analyze,
            "analyses_used": analyses_used,
            "analyses_limit": analyses_limit,
            "usage_percent": usage_percent,
            "plan_name": plan.name,
            "remaining": max(0, analyses_limit - analyses_used)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to check usage limits for {current_user.username}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to check usage limits"
        )


@router.get("/usage", response_model=UsageResponse)
async def get_usage_quota(current_user: UserInDB = Depends(get_current_active_user)):
    """Get user's current usage quota"""
    try:
        quota = await SubscriptionService.get_user_usage_quota(str(current_user.id))
        if not quota:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usage quota not found"
            )
        
        remaining = max(0, quota.analyses_limit - quota.analyses_used) if quota.analyses_limit > 0 else float('inf')
        
        return UsageResponse(
            analyses_used=quota.analyses_used,
            analyses_limit=quota.analyses_limit,
            remaining=remaining,
            usage_percent=(quota.analyses_used / quota.analyses_limit * 100) if quota.analyses_limit > 0 else 0
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get usage quota for {current_user.username}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve usage quota"
        )


@router.post("/increment-usage")
async def increment_usage(current_user: UserInDB = Depends(get_current_active_user)):
    """Increment user's analysis usage count"""
    try:
        from src.database.connection import MongoDB
        from datetime import datetime
        
        users_collection = MongoDB.get_collection("users")
        
        # Check if we need to reset monthly count
        now = datetime.utcnow()
        if (now.year != current_user.last_reset_date.year or 
            now.month != current_user.last_reset_date.month):
            # Reset monthly count
            await users_collection.update_one(
                {"_id": current_user.id},
                {
                    "$set": {
                        "analyses_this_month": 1,
                        "last_reset_date": now,
                        "updated_at": now
                    },
                    "$inc": {"total_analyses": 1}
                }
            )
            analyses_this_month = 1
        else:
            # Increment both counters
            await users_collection.update_one(
                {"_id": current_user.id},
                {
                    "$inc": {
                        "total_analyses": 1,
                        "analyses_this_month": 1
                    },
                    "$set": {"updated_at": now}
                }
            )
            analyses_this_month = current_user.analyses_this_month + 1
        
        # Get subscription info for response
        subscription = await SubscriptionService.get_user_subscription(str(current_user.id))
        
        if subscription:
            plan = await SubscriptionService.get_plan_by_id(subscription.plan_id)
            analyses_limit = plan.max_analyses_per_month if plan else -1
            plan_name = plan.name if plan else "Unknown"
        else:
            analyses_limit = 5  # Free plan limit
            plan_name = "Free"
        
        return {
            "success": True,
            "message": "Usage incremented successfully",
            "analyses_used": analyses_this_month,
            "analyses_limit": analyses_limit,
            "usage_percent": (analyses_this_month / analyses_limit * 100) if analyses_limit > 0 else 0,
            "plan_name": plan_name,
            "remaining": max(0, analyses_limit - analyses_this_month) if analyses_limit > 0 else float('inf')
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to increment usage for {current_user.username}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to increment usage"
        )


@router.post("/reset-usage")
async def reset_usage(
    current_user: UserInDB = Depends(get_current_active_user),
    admin_user: UserInDB = Depends(get_current_admin_user)
):
    """Reset user's usage count (admin only)"""
    try:
        success = await SubscriptionService.reset_user_usage(str(current_user.id))
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to reset usage"
            )
        
        return {
            "success": True,
            "message": f"Usage reset successfully for user {current_user.username}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to reset usage for {current_user.username}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reset usage"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get usage quota for {current_user.username}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve usage quota"
        )


@router.get("/payments")
async def get_payment_history(current_user: UserInDB = Depends(get_current_active_user)):
    """Get user's payment history"""
    try:
        payments = await SubscriptionService.get_user_payments(str(current_user.id))
        return payments
    except Exception as e:
        logger.error(f"Failed to get payment history for {current_user.username}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve payment history"
        )


# Admin endpoints
@router.post("/admin/initialize-plans")
async def initialize_subscription_plans(admin_user: UserInDB = Depends(get_current_admin_user)):
    """Initialize default subscription plans (Admin only)"""
    try:
        await SubscriptionService.initialize_default_plans()
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"message": "Subscription plans initialized successfully"}
        )
    except Exception as e:
        logger.error(f"Failed to initialize subscription plans: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to initialize subscription plans"
        )


@router.get("/admin/all-subscriptions")
async def get_all_subscriptions(admin_user: UserInDB = Depends(get_current_admin_user)):
    """Get all user subscriptions (Admin only)"""
    try:
        from src.database.connection import MongoDB
        from src.database.subscription_models import USER_SUBSCRIPTIONS_COLLECTION
        
        subscriptions_collection = MongoDB.get_collection(USER_SUBSCRIPTIONS_COLLECTION)
        subscriptions_cursor = subscriptions_collection.find({}).sort("created_at", -1)
        
        subscriptions = []
        async for sub_data in subscriptions_cursor:
            subscriptions.append({
                "id": str(sub_data["_id"]),
                "username": sub_data["username"],
                "plan_type": sub_data["plan_type"],
                "status": sub_data["status"],
                "billing_cycle": sub_data["billing_cycle"],
                "amount_paid": sub_data["amount_paid"],
                "start_date": sub_data["start_date"],
                "end_date": sub_data["end_date"],
                "auto_renewal": sub_data["auto_renewal"]
            })
        
        return subscriptions
    except Exception as e:
        logger.error(f"Failed to get all subscriptions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve subscriptions"
        )


@router.get("/admin/revenue-stats")
async def get_revenue_statistics(admin_user: UserInDB = Depends(get_current_admin_user)):
    """Get revenue statistics (Admin only)"""
    try:
        from src.database.connection import MongoDB
        from src.database.subscription_models import PAYMENT_RECORDS_COLLECTION
        
        payments_collection = MongoDB.get_collection(PAYMENT_RECORDS_COLLECTION)
        
        # Total revenue
        total_revenue_pipeline = [
            {"$match": {"status": "completed"}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]
        total_revenue_result = await payments_collection.aggregate(total_revenue_pipeline).to_list(1)
        total_revenue = total_revenue_result[0]["total"] if total_revenue_result else 0
        
        # Monthly revenue
        from datetime import datetime
        current_month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        monthly_revenue_pipeline = [
            {"$match": {"status": "completed", "payment_date": {"$gte": current_month_start}}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]
        monthly_revenue_result = await payments_collection.aggregate(monthly_revenue_pipeline).to_list(1)
        monthly_revenue = monthly_revenue_result[0]["total"] if monthly_revenue_result else 0
        
        # Revenue by plan type
        plan_revenue_pipeline = [
            {"$match": {"status": "completed"}},
            {"$lookup": {
                "from": "user_subscriptions",
                "localField": "subscription_id",
                "foreignField": "_id",
                "as": "subscription"
            }},
            {"$unwind": "$subscription"},
            {"$group": {
                "_id": "$subscription.plan_type",
                "total": {"$sum": "$amount"},
                "count": {"$sum": 1}
            }}
        ]
        plan_revenue_cursor = payments_collection.aggregate(plan_revenue_pipeline)
        plan_revenue = []
        async for item in plan_revenue_cursor:
            plan_revenue.append({
                "plan_type": item["_id"],
                "total_revenue": item["total"],
                "subscription_count": item["count"]
            })
        
        return {
            "total_revenue": total_revenue,
            "monthly_revenue": monthly_revenue,
            "revenue_by_plan": plan_revenue,
            "currency": "INR"
        }
        
    except Exception as e:
        logger.error(f"Failed to get revenue statistics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve revenue statistics"
        )