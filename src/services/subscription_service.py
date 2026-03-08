"""
Subscription Service
===================

Handles subscription plan management, user subscriptions, and usage tracking.
"""

import logging
from datetime import datetime, timedelta
from typing import List, Optional

from bson import ObjectId

from src.database.connection import MongoDB
from src.database.subscription_models import (
    DEFAULT_SUBSCRIPTION_PLANS,
    BillingCycle,
    PaymentRecord,
    PaymentStatus,
    PlanType,
    SubscriptionPlan,
    SubscriptionStatus,
    UsageQuota,
    UserSubscription,
)

logger = logging.getLogger(__name__)

# Collection names
SUBSCRIPTION_PLANS_COLLECTION = "subscription_plans"
USER_SUBSCRIPTIONS_COLLECTION = "user_subscriptions"
PAYMENT_RECORDS_COLLECTION = "payment_records"
USAGE_QUOTAS_COLLECTION = "usage_quotas"


class SubscriptionService:
    """Service for managing subscriptions"""

    @staticmethod
    async def initialize_default_plans():
        """Initialize default subscription plans"""
        try:
            plans_collection = MongoDB.get_collection(SUBSCRIPTION_PLANS_COLLECTION)
            
            # Check if plans already exist
            existing_count = await plans_collection.count_documents({})
            if existing_count > 0:
                logger.info("Subscription plans already initialized")
                return

            # Insert default plans
            for plan_data in DEFAULT_SUBSCRIPTION_PLANS:
                plan = SubscriptionPlan(**plan_data)
                await plans_collection.insert_one(plan.dict(by_alias=True))
            
            logger.info(f"Initialized {len(DEFAULT_SUBSCRIPTION_PLANS)} subscription plans")
        except Exception as e:
            logger.error(f"Failed to initialize subscription plans: {str(e)}")
            raise

    @staticmethod
    async def get_all_plans() -> List[SubscriptionPlan]:
        """Get all active subscription plans"""
        try:
            plans_collection = MongoDB.get_collection(SUBSCRIPTION_PLANS_COLLECTION)
            plans_cursor = plans_collection.find({"is_active": True})
            plans = []
            async for plan_data in plans_cursor:
                plans.append(SubscriptionPlan(**plan_data))
            return plans
        except Exception as e:
            logger.error(f"Failed to get subscription plans: {str(e)}")
            return []

    @staticmethod
    async def get_plan_by_id(plan_id: str) -> Optional[SubscriptionPlan]:
        """Get subscription plan by ID"""
        try:
            logger.info(f"🔍 Looking up plan by ID: {plan_id}")
            plans_collection = MongoDB.get_collection(SUBSCRIPTION_PLANS_COLLECTION)
            
            # Convert string to ObjectId
            try:
                object_id = ObjectId(plan_id)
                logger.info(f"✅ Converted to ObjectId: {object_id}")
            except Exception as oid_error:
                logger.error(f"❌ Invalid ObjectId format: {plan_id}, error: {oid_error}")
                return None
            
            plan_data = await plans_collection.find_one({"_id": object_id})
            logger.info(f"📋 Plan data found: {plan_data is not None}")
            
            if plan_data:
                plan = SubscriptionPlan(**plan_data)
                logger.info(f"✅ Plan object created: {plan.name}")
                return plan
            
            logger.warning(f"⚠️ No plan found with ID: {plan_id}")
            return None
        except Exception as e:
            logger.error(f"❌ Failed to get plan {plan_id}: {str(e)}")
            logger.error(f"❌ Error type: {type(e).__name__}")
            return None

    @staticmethod
    async def get_plan_by_name(plan_name: str) -> Optional[SubscriptionPlan]:
        """Get subscription plan by name"""
        try:
            plans_collection = MongoDB.get_collection(SUBSCRIPTION_PLANS_COLLECTION)
            
            # Try exact match first
            plan_data = await plans_collection.find_one({
                "name": {"$regex": f"^{plan_name}$", "$options": "i"},
                "is_active": True
            })
            
            # If not found, try with "Plan" suffix
            if not plan_data:
                plan_data = await plans_collection.find_one({
                    "name": {"$regex": f"^{plan_name} plan$", "$options": "i"},
                    "is_active": True
                })
            
            if plan_data:
                return SubscriptionPlan(**plan_data)
            return None
        except Exception as e:
            logger.error(f"Failed to get plan by name {plan_name}: {str(e)}")
            return None

    @staticmethod
    async def get_user_subscription(user_id: str) -> Optional[UserSubscription]:
        """Get user's current subscription"""
        try:
            logger.info(f"🔍 Getting subscription for user_id: {user_id}")
            subscriptions_collection = MongoDB.get_collection(USER_SUBSCRIPTIONS_COLLECTION)
            subscription_data = await subscriptions_collection.find_one({
                "user_id": user_id,
                "status": {"$in": [SubscriptionStatus.ACTIVE.value]}
            })
            
            logger.info(f"📋 Raw subscription data: {subscription_data}")
            
            if subscription_data:
                # Convert ObjectId to string for plan_id
                if "_id" in subscription_data and isinstance(subscription_data["_id"], ObjectId):
                    subscription_data["_id"] = str(subscription_data["_id"])
                if "plan_id" in subscription_data and isinstance(subscription_data["plan_id"], ObjectId):
                    subscription_data["plan_id"] = str(subscription_data["plan_id"])
                
                logger.info(f"✅ Converted subscription data: plan_id={subscription_data.get('plan_id')}, plan_type={subscription_data.get('plan_type')}")
                return UserSubscription(**subscription_data)
            
            logger.warning(f"⚠️ No subscription found for user {user_id}")
            return None
        except Exception as e:
            logger.error(f"Failed to get user subscription for {user_id}: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return None

    @staticmethod
    async def create_subscription(
        user_id: str,
        username: str,
        plan_id: str,
        billing_cycle: BillingCycle,
        payment_method: str,
        transaction_id: str
    ) -> Optional[UserSubscription]:
        """Create new user subscription"""
        try:
            logger.info(f"🚀 Creating subscription for user {username}, plan_id: {plan_id}")
            
            # Get plan details
            plan = await SubscriptionService.get_plan_by_id(plan_id)
            if not plan:
                logger.error(f"❌ Plan not found with ID: {plan_id}")
                raise ValueError(f"Invalid plan ID: {plan_id}")
            
            logger.info(f"✅ Plan found: {plan.name}")

            # Calculate amount based on billing cycle
            if billing_cycle == BillingCycle.MONTHLY:
                amount = plan.monthly_price
                end_date = datetime.utcnow() + timedelta(days=30)
                next_billing = datetime.utcnow() + timedelta(days=30)
            elif billing_cycle == BillingCycle.QUARTERLY:
                amount = plan.quarterly_price
                end_date = datetime.utcnow() + timedelta(days=90)
                next_billing = datetime.utcnow() + timedelta(days=90)
            else:  # YEARLY
                amount = plan.yearly_price
                end_date = datetime.utcnow() + timedelta(days=365)
                next_billing = datetime.utcnow() + timedelta(days=365)
            
            logger.info(f"💰 Calculated amount: ₹{amount} for {billing_cycle.value} billing")

            # Cancel existing subscription if any
            logger.info("🚫 Cancelling existing subscriptions...")
            cancel_result = await SubscriptionService.cancel_user_subscription(user_id)
            logger.info(f"🚫 Cancel result: {cancel_result}")

            # Create new subscription
            logger.info("📝 Creating subscription object...")
            subscription = UserSubscription(
                user_id=user_id,
                username=username,
                plan_id=plan_id,
                plan_type=plan.plan_type,
                billing_cycle=billing_cycle,
                amount_paid=amount,
                end_date=end_date,
                next_billing_date=next_billing,
                payment_method=payment_method,
                transaction_id=transaction_id
            )
            
            logger.info(f"📝 Subscription object created successfully")

            logger.info("💾 Inserting subscription into database...")
            subscriptions_collection = MongoDB.get_collection(USER_SUBSCRIPTIONS_COLLECTION)
            result = await subscriptions_collection.insert_one(subscription.dict(by_alias=True))
            logger.info(f"💾 Subscription inserted with ID: {result.inserted_id}")
            
            # Create usage quota
            logger.info(f"📊 Creating usage quota: {plan.max_analyses_per_month} analyses")
            quota_result = await SubscriptionService.create_usage_quota(
                user_id, username, str(result.inserted_id), plan.max_analyses_per_month
            )
            logger.info(f"📊 Usage quota created: {quota_result is not None}")

            # Set the subscription ID for the created subscription
            subscription.id = result.inserted_id

            logger.info(f"✅ Successfully created subscription for user {username}: {plan.name}")
            return subscription

        except Exception as e:
            logger.error(f"❌ Failed to create subscription: {str(e)}")
            logger.error(f"❌ Error type: {type(e).__name__}")
            import traceback
            logger.error(f"❌ Traceback: {traceback.format_exc()}")
            return None

    @staticmethod
    async def cancel_user_subscription(user_id: str) -> bool:
        """Cancel user's current subscription by deleting it and resetting usage"""
        try:
            logger.info(f"🚫 Cancelling/deleting subscriptions for user: {user_id}")
            
            subscriptions_collection = MongoDB.get_collection(USER_SUBSCRIPTIONS_COLLECTION)
            
            # Delete all existing subscriptions for this user
            result = await subscriptions_collection.delete_many({"user_id": user_id})
            logger.info(f"🚫 Deleted {result.deleted_count} subscriptions")
            
            # Delete usage quotas (will be recreated with new subscription)
            quotas_collection = MongoDB.get_collection(USAGE_QUOTAS_COLLECTION)
            quota_result = await quotas_collection.delete_many({"user_id": user_id})
            logger.info(f"🚫 Deleted {quota_result.deleted_count} usage quotas")
            
            # Reset user's monthly usage counter
            users_collection = MongoDB.get_collection("users")
            await users_collection.update_one(
                {"_id": user_id},
                {"$set": {"analyses_this_month": 0, "last_reset_date": datetime.utcnow()}}
            )
            logger.info(f"🔄 Reset usage counter for user")
            
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"❌ Failed to cancel subscription for {user_id}: {str(e)}")
            return False

    @staticmethod
    async def create_usage_quota(
        user_id: str, username: str, subscription_id: str, analyses_limit: int
    ) -> Optional[UsageQuota]:
        """Create monthly usage quota"""
        try:
            logger.info(f"📊 Creating usage quota for user {username}, limit: {analyses_limit}")
            
            now = datetime.utcnow()
            next_reset = datetime(now.year, now.month + 1, 1) if now.month < 12 else datetime(now.year + 1, 1, 1)

            quota = UsageQuota(
                user_id=user_id,
                username=username,
                subscription_id=subscription_id,
                month=now.month,
                year=now.year,
                analyses_limit=analyses_limit,
                next_reset_date=next_reset
            )
            
            logger.info(f"📊 Usage quota object created successfully")

            quotas_collection = MongoDB.get_collection(USAGE_QUOTAS_COLLECTION)
            result = await quotas_collection.insert_one(quota.dict(by_alias=True))
            logger.info(f"📊 Usage quota inserted with ID: {result.inserted_id}")
            
            return quota

        except Exception as e:
            logger.error(f"❌ Failed to create usage quota: {str(e)}")
            logger.error(f"❌ Error type: {type(e).__name__}")
            import traceback
            logger.error(f"❌ Traceback: {traceback.format_exc()}")
            return None

    @staticmethod
    async def get_user_usage_quota(user_id: str) -> Optional[UsageQuota]:
        """Get user's current usage quota"""
        try:
            now = datetime.utcnow()
            quotas_collection = MongoDB.get_collection(USAGE_QUOTAS_COLLECTION)
            quota_data = await quotas_collection.find_one({
                "user_id": user_id,
                "month": now.month,
                "year": now.year
            })
            if quota_data:
                # Ensure analyses_used exists
                if 'analyses_used' not in quota_data:
                    quota_data['analyses_used'] = 0
                return UsageQuota(**quota_data)
            return None
        except Exception as e:
            logger.error(f"Failed to get usage quota for {user_id}: {str(e)}")
            return None

    @staticmethod
    async def increment_usage(user_id: str) -> bool:
        """Increment user's analysis usage count in usage_quotas"""
        try:
            now = datetime.utcnow()
            quotas_collection = MongoDB.get_collection(USAGE_QUOTAS_COLLECTION)
            
            # Find current quota
            quota = await quotas_collection.find_one({
                "user_id": user_id,
                "month": now.month,
                "year": now.year
            })
            
            if not quota:
                # Create quota if doesn't exist (for users without subscription)
                subscription = await SubscriptionService.get_user_subscription(user_id)
                if subscription:
                    plan = await SubscriptionService.get_plan_by_id(subscription.plan_id)
                    limit = plan.max_analyses_per_month if plan else 10
                else:
                    limit = 10  # Free plan default
                
                await SubscriptionService.create_usage_quota(
                    user_id=user_id,
                    username="",
                    subscription_id="",
                    analyses_limit=limit
                )
            
            result = await quotas_collection.update_one(
                {
                    "user_id": user_id,
                    "month": now.month,
                    "year": now.year
                },
                {
                    "$inc": {"analyses_used": 1},
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )
            
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Failed to increment usage for {user_id}: {str(e)}")
            return False

    @staticmethod
    async def check_usage_limit(user_id: str) -> bool:
        """Check if user has exceeded usage limit"""
        try:
            quota = await SubscriptionService.get_user_usage_quota(user_id)
            
            logger.info(f"check_usage_limit for user {user_id}: quota={quota}")
            
            if not quota:
                logger.warning(f"No quota found for user {user_id}")
                return False  # No quota found, deny access
            
            logger.info(f"Quota details: limit={quota.analyses_limit}, used={quota.analyses_used}")
            
            # Unlimited usage (0 limit means unlimited)
            if quota.analyses_limit == 0:
                logger.info(f"User {user_id} has unlimited plan (limit=0), allowing")
                return True
            
            can_analyze = quota.analyses_used < quota.analyses_limit
            logger.info(f"User {user_id} can_analyze={can_analyze} ({quota.analyses_used}/{quota.analyses_limit})")
            return can_analyze
        except Exception as e:
            logger.error(f"Failed to check usage limit for {user_id}: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return False

    @staticmethod
    async def create_payment_record(
        user_id: str,
        username: str,
        subscription_id: str,
        amount: float,
        payment_method: str,
        transaction_id: str,
        billing_cycle: BillingCycle
    ) -> Optional[PaymentRecord]:
        """Create payment record"""
        try:
            now = datetime.utcnow()
            
            if billing_cycle == BillingCycle.MONTHLY:
                period_end = now + timedelta(days=30)
            elif billing_cycle == BillingCycle.QUARTERLY:
                period_end = now + timedelta(days=90)
            else:  # YEARLY
                period_end = now + timedelta(days=365)

            payment = PaymentRecord(
                user_id=user_id,
                username=username,
                subscription_id=subscription_id,
                amount=amount,
                payment_method=payment_method,
                transaction_id=transaction_id,
                billing_cycle=billing_cycle,
                billing_period_start=now,
                billing_period_end=period_end,
                status=PaymentStatus.COMPLETED,
                payment_date=now
            )

            payments_collection = MongoDB.get_collection(PAYMENT_RECORDS_COLLECTION)
            await payments_collection.insert_one(payment.dict(by_alias=True))
            return payment

        except Exception as e:
            logger.error(f"Failed to create payment record: {str(e)}")
            return None

    @staticmethod
    async def get_user_payments(user_id: str) -> List[PaymentRecord]:
        """Get user's payment history"""
        try:
            payments_collection = MongoDB.get_collection(PAYMENT_RECORDS_COLLECTION)
            payments_cursor = payments_collection.find({"user_id": user_id}).sort("created_at", -1)
            payments = []
            async for payment_data in payments_cursor:
                payments.append(PaymentRecord(**payment_data))
            return payments
        except Exception as e:
            logger.error(f"Failed to get payments for {user_id}: {str(e)}")
            return []

    @staticmethod
    async def get_plan_by_type(plan_type: PlanType) -> Optional[SubscriptionPlan]:
        """Get plan by type (for free plan assignment)"""
        try:
            plans_collection = MongoDB.get_collection(SUBSCRIPTION_PLANS_COLLECTION)
            plan_data = await plans_collection.find_one({
                "plan_type": plan_type.value,
                "is_active": True
            })
            if plan_data:
                return SubscriptionPlan(**plan_data)
            return None
        except Exception as e:
            logger.error(f"Failed to get plan by type {plan_type}: {str(e)}")
            return None

    @staticmethod
    async def assign_free_plan(user_id: str, username: str) -> bool:
        """Assign free plan to new user"""
        try:
            free_plan = await SubscriptionService.get_plan_by_type(PlanType.FREE)
            if not free_plan:
                logger.error("Free plan not found")
                return False

            subscription = await SubscriptionService.create_subscription(
                user_id=user_id,
                username=username,
                plan_id=str(free_plan.id),
                billing_cycle=BillingCycle.MONTHLY,
                payment_method="free",
                transaction_id="free_plan"
            )
            
            return subscription is not None
        except Exception as e:
            logger.error(f"Failed to assign free plan to {username}: {str(e)}")
            return False

    @staticmethod
    async def reset_user_usage(user_id: str) -> bool:
        """Reset user's usage count (admin only)"""
        try:
            now = datetime.utcnow()
            quotas_collection = MongoDB.get_collection(USAGE_QUOTAS_COLLECTION)
            
            result = await quotas_collection.update_one(
                {
                    "user_id": user_id,
                    "month": now.month,
                    "year": now.year
                },
                {
                    "$set": {
                        "analyses_used": 0,
                        "updated_at": now
                    }
                }
            )
            
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Failed to reset usage for {user_id}: {str(e)}")
            return False