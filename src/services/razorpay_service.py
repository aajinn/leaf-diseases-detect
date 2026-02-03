"""
Razorpay Payment Service
========================

Handles Razorpay payment integration for subscriptions.
"""

import logging
import os
from typing import Dict, Optional

from dotenv import load_dotenv

# Load environment variables
load_dotenv()
load_dotenv('.env.razorpay')  # Load Razorpay config

import razorpay
from fastapi import HTTPException

logger = logging.getLogger(__name__)


class RazorpayService:
    """Service for Razorpay payment processing"""
    
    def __init__(self):
        self.key_id = os.getenv("RAZORPAY_KEY_ID")
        self.key_secret = os.getenv("RAZORPAY_KEY_SECRET")
        
        logger.info(f"🔧 Razorpay Key ID: {self.key_id[:10]}..." if self.key_id else "❌ Razorpay Key ID not found")
        logger.info(f"🔧 Razorpay Key Secret: {'*' * 10}" if self.key_secret else "❌ Razorpay Key Secret not found")
        
        if not self.key_id or not self.key_secret:
            logger.warning("⚠️ Razorpay credentials not configured")
            self.client = None
        else:
            logger.info("✅ Initializing Razorpay client...")
            self.client = razorpay.Client(auth=(self.key_id, self.key_secret))
            logger.info("✅ Razorpay client initialized successfully")
    
    def create_order(self, amount: float, currency: str = "INR", receipt: str = None) -> Dict:
        """Create Razorpay order"""
        logger.info(f"💳 Creating Razorpay order: amount={amount}, currency={currency}, receipt={receipt}")
        
        if not self.client:
            logger.error("❌ Razorpay client not initialized")
            raise HTTPException(status_code=500, detail="Payment gateway not configured")
        
        try:
            order_data = {
                "amount": int(amount * 100),  # Amount in paise
                "currency": currency,
                "receipt": receipt or f"order_{int(amount)}",
                "payment_capture": 1
            }
            
            logger.info(f"📡 Sending order data to Razorpay: {order_data}")
            order = self.client.order.create(data=order_data)
            logger.info(f"✅ Razorpay order created successfully: {order}")
            return order
        except Exception as e:
            logger.error(f"❌ Failed to create Razorpay order: {str(e)}")
            logger.error(f"❌ Error type: {type(e).__name__}")
            raise HTTPException(status_code=500, detail="Failed to create payment order")
    
    def verify_payment(self, payment_id: str, order_id: str, signature: str) -> bool:
        """Verify Razorpay payment signature"""
        if not self.client:
            return False
        
        try:
            params_dict = {
                'razorpay_order_id': order_id,
                'razorpay_payment_id': payment_id,
                'razorpay_signature': signature
            }
            
            self.client.utility.verify_payment_signature(params_dict)
            return True
        except Exception as e:
            logger.error(f"Payment verification failed: {str(e)}")
            return False
    
    def get_payment_details(self, payment_id: str) -> Optional[Dict]:
        """Get payment details from Razorpay"""
        if not self.client:
            return None
        
        try:
            payment = self.client.payment.fetch(payment_id)
            return payment
        except Exception as e:
            logger.error(f"Failed to fetch payment details: {str(e)}")
            return None


# Global instance
razorpay_service = RazorpayService()