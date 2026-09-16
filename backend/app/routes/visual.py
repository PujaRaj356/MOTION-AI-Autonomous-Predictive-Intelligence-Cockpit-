import traceback
from fastapi import APIRouter, HTTPException
from backend.app.schemas.models import VisualInspectionRequest, VisualInspectionResponse
from backend.app.services.visual_inspection_service import visual_inspection_service

router = APIRouter(prefix="", tags=["Visual Inspection"])

@router.post("/inspect/visual", response_model=VisualInspectionResponse)
def run_visual_inspection(request: VisualInspectionRequest):
    try:
        return visual_inspection_service.analyze_image(
            request.image_base64,
            request.machine_type.upper(),
            request.machine_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Visual inspection error: {str(e)}")
