"""
Pydantic schemas for hairstyle recommendation evaluation.
Mirrors the TypeScript zod schemas from src/lib/hairstyle-recommendation/schema.ts.
"""

from typing import Optional
from pydantic import BaseModel, Field


class FaceAnalysis(BaseModel):
    """Output from analyze stage (face shape detection)."""
    faceShape: str = Field(..., description="One of 7 face shapes")
    confidence: float = Field(..., ge=0, le=1, description="Model confidence 0-1")
    features: list[str] = Field(..., max_length=5, description="Up to 5 features")
    gender: str = Field("unknown", description="Detected gender: male|female|unknown")
    notes: Optional[str] = Field(None, max_length=240, description="Optional notes")


class ProviderRecommendation(BaseModel):
    """Single recommendation from provider (minimal output)."""
    hairstyleId: str = Field(..., description="ID from candidate list")
    reason: str = Field(..., max_length=280, description="Why this suits them")
    tips: list[str] = Field(..., min_length=1, max_length=3, description="1-3 tips, max 120 chars each")

    @property
    def tips_valid(self) -> bool:
        """Check if all tips are within max length."""
        return all(len(tip) <= 120 for tip in self.tips)


class Fixture(BaseModel):
    """Test photo with ground truth labels."""
    imagePath: str = Field(..., description="Relative path to image from evals/hairstyle/")
    gender: str = Field(..., description="Ground truth gender: male|female")
    faceShape: str = Field(..., description="Ground truth face shape (7 enum)")
    faceShapeConfident: bool = Field(True, description="Whether we're confident in face shape label")
    name: Optional[str] = Field(None, description="Photo identifier/name")
