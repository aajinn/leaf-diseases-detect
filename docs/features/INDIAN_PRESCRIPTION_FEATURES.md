# Indian-Friendly Prescription Features

## Overview

The prescription system has been enhanced to be India-friendly with local pricing and direct purchase links to popular Indian e-commerce platforms.

## Features

### 1. Indian Rupee (INR) Pricing

All products now display prices in both USD and INR:
- **Primary Display**: ₹1,200-2,000 (INR)
- **Secondary Display**: $15-25 (USD)
- Prices are prominently shown in green color
- Large, easy-to-read format

### 2. Purchase Links Integration

Each product includes direct purchase links to:

#### Supported Platforms:
- **Amazon India** - India's largest e-commerce platform
- **Flipkart** - Leading Indian marketplace
- **BigBasket** - For organic products and fertilizers
- **AgroStar** - Specialized agricultural products store

### 3. Perplexity API Integration

The system uses Perplexity API to:
- Search for current product availability
- Find best prices across platforms
- Get direct product links
- Verify product availability in India

### 4. Smart Link Generation

If Perplexity API is unavailable, the system:
- Falls back to search URLs
- Generates platform-specific search queries
- Ensures users can still find products
- Maintains functionality without API

## Product Examples

### Copper Hydroxide Fungicide
- **Price**: ₹1,200-2,000
- **Links**: Amazon India, Flipkart, AgroStar

### Neem Oil (Organic)
- **Price**: ₹650-1,200
- **Links**: Amazon India, Flipkart, BigBasket, AgroStar

### Balanced Fertilizer
- **Price**: ₹800-1,200
- **Links**: Amazon India, Flipkart, BigBasket

## UI Design

### Product Card Layout:
```
┌─────────────────────────────────────────┐
│ Product Name              ₹1,200-2,000  │
│                           ($15-25)       │
├─────────────────────────────────────────┤
│ Type: Fungicide                         │
│ Dosage: 2-3g per liter                  │
│ Method: Foliar spray                    │
├─────────────────────────────────────────┤
│ 🛒 Buy Online:                          │
│ [Amazon India] [Flipkart] [AgroStar]    │
├─────────────────────────────────────────┤
│ ⚠️ Safety Precautions:                  │
│ • Wear protective clothing              │
│ • Avoid windy conditions                │
└─────────────────────────────────────────┘
```

### Purchase Link Buttons:
- Blue border with white background
- Hover effect: Blue background with white text
- External link icon
- Platform name clearly visible
- Optional price display

## Technical Implementation

### Backend

#### Models (`src/database/prescription_models.py`):
```python
class PurchaseLink(BaseModel):
    platform: str
    url: str
    price: Optional[str] = None

class ProductRecommendation(BaseModel):
    # ... existing fields
    estimated_cost_inr: Optional[str] = None
    purchase_links: List[PurchaseLink] = []
```

#### Service (`src/services/prescription_service.py`):
```python
async def get_purchase_links(product_name, product_type):
    # Uses Perplexity API to find purchase links
    # Falls back to search URLs if API fails
    # Returns list of PurchaseLink objects
```

### Frontend

#### Display (`frontend/prescriptions.html`):
- Shows INR price prominently in green
- USD price as secondary info
- Purchase links in blue card
- Responsive button layout
- External link icons

## Configuration

### Perplexity API Setup:
1. Ensure `PERPLEXITY_API_KEY` is set in `.env`
2. Service automatically enabled if key is present
3. Falls back gracefully if unavailable

### Adding New Platforms:
```python
purchase_links.append(PurchaseLink(
    platform="New Platform",
    url=f"https://newplatform.in/search?q={product_name}",
    price=None
))
```

## User Experience

### For Farmers:
1. View prescription with disease details
2. See product recommendations with Indian prices
3. Click platform button to buy directly
4. Compare prices across platforms
5. Purchase from trusted Indian stores

### Benefits:
- **Local Pricing**: Prices in familiar INR format
- **Easy Purchase**: Direct links to buy products
- **Multiple Options**: Compare across platforms
- **Trusted Stores**: Only reputable Indian platforms
- **Mobile Friendly**: Works on all devices

## Future Enhancements

Potential improvements:
- Real-time price comparison
- Stock availability checking
- Delivery time estimates
- User reviews integration
- Discount/offer notifications
- Local store finder
- Cash on delivery options
- Regional language support

## Testing

To test the feature:
1. Generate a prescription for a diseased plant
2. View prescription details
3. Check INR pricing is displayed
4. Verify purchase links are present
5. Click links to test navigation
6. Confirm links open in new tab

## Support

For issues or questions:
- Check Perplexity API key is configured
- Verify internet connectivity
- Check browser console for errors
- Review server logs for API failures

---

**Status**: ✅ Fully Implemented
**Version**: 1.0
**Date**: December 2024
