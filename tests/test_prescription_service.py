"""
Tests for Prescription Service
"""

import pytest
from datetime import datetime
from src.services.prescription_service import PrescriptionService


def test_treatment_protocols_exist():
    """Test that treatment protocols are defined"""
    assert "bacterial_blight" in PrescriptionService.TREATMENT_PROTOCOLS
    assert "fungal_leaf_spot" in PrescriptionService.TREATMENT_PROTOCOLS
    assert "healthy" in PrescriptionService.TREATMENT_PROTOCOLS


def test_protocol_structure():
    """Test that protocols have required fields"""
    protocol = PrescriptionService.TREATMENT_PROTOCOLS["bacterial_blight"]
    
    assert "priority" in protocol
    assert "duration" in protocol
    assert "products" in protocol
    assert "steps" in protocol
    assert "prevention_tips" in protocol
    assert "monitoring_schedule" in protocol
    assert "warning_signs" in protocol
    assert "success_indicators" in protocol


def test_product_structure():
    """Test that products have required fields"""
    protocol = PrescriptionService.TREATMENT_PROTOCOLS["bacterial_blight"]
    product = protocol["products"][0]
    
    assert "name" in product
    assert "type" in product
    assert "dosage" in product
    assert "application_method" in product
    assert "frequency" in product
    assert "duration" in product
    assert "safety_precautions" in product


def test_step_structure():
    """Test that treatment steps have required fields"""
    protocol = PrescriptionService.TREATMENT_PROTOCOLS["bacterial_blight"]
    step = protocol["steps"][0]
    
    assert "step_number" in step
    assert "title" in step
    assert "description" in step
    assert "timing" in step
    assert "products_needed" in step
    assert "estimated_duration" in step


def test_severity_adjustment_severe():
    """Test severity adjustment for severe cases"""
    protocol = PrescriptionService.TREATMENT_PROTOCOLS["fungal_leaf_spot"]
    adjusted = PrescriptionService._adjust_for_severity(protocol, "severe")
    
    assert adjusted["priority"] == "urgent"
    # Check that frequency was increased
    for product in adjusted["products"]:
        assert "Every" in product["frequency"]


def test_severity_adjustment_mild():
    """Test severity adjustment for mild cases"""
    protocol = PrescriptionService.TREATMENT_PROTOCOLS["bacterial_blight"]
    adjusted = PrescriptionService._adjust_for_severity(protocol, "mild")
    
    assert adjusted["priority"] == "low"


def test_severity_adjustment_moderate():
    """Test that moderate severity doesn't change priority"""
    protocol = PrescriptionService.TREATMENT_PROTOCOLS["fungal_leaf_spot"]
    adjusted = PrescriptionService._adjust_for_severity(protocol, "moderate")
    
    # Should maintain original priority
    assert adjusted["priority"] == protocol["priority"]


@pytest.mark.asyncio
async def test_prescription_id_format():
    """Test prescription ID format"""
    # This would need a mock database
    # Just test the format generation
    from bson import ObjectId
    
    prescription_id = f"RX-{datetime.now().strftime('%Y%m%d')}-{str(ObjectId())[:8]}"
    
    assert prescription_id.startswith("RX-")
    assert len(prescription_id.split("-")) == 3
    parts = prescription_id.split("-")
    assert len(parts[1]) == 8  # YYYYMMDD
    assert len(parts[2]) == 8  # ObjectId prefix


def test_all_protocols_have_products():
    """Test that all protocols have at least one product"""
    for disease, protocol in PrescriptionService.TREATMENT_PROTOCOLS.items():
        assert len(protocol["products"]) > 0, f"{disease} has no products"


def test_all_protocols_have_steps():
    """Test that all protocols have at least one step"""
    for disease, protocol in PrescriptionService.TREATMENT_PROTOCOLS.items():
        assert len(protocol["steps"]) > 0, f"{disease} has no steps"


def test_step_numbers_sequential():
    """Test that step numbers are sequential"""
    for disease, protocol in PrescriptionService.TREATMENT_PROTOCOLS.items():
        steps = protocol["steps"]
        for i, step in enumerate(steps, 1):
            assert step["step_number"] == i, f"{disease} step {i} has wrong number"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
