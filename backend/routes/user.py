from fastapi import APIRouter, Depends, HTTPException, Body
from database import users_collection
from auth import get_current_user

router = APIRouter()

@router.post("/api/profile-setup")
def profile_setup(data: dict = Body(...), user: str = Depends(get_current_user)):
    """
    Save or update the user's profile data extracted from resume.
    `user` is the email extracted from JWT token.
    `data` is the parsed resume content (already in JSON).
    """
    result = users_collection.update_one(
        {"email": user},
        {"$set": data},
        upsert=True  # create document if it doesn't exist
    )

    if result.matched_count == 0 and not result.upserted_id:
        raise HTTPException(status_code=400, detail="Failed to update profile")

    return {"message": "Profile setup successful"}

@router.get("/api/profile")
def get_user_profile(user: str = Depends(get_current_user)):
    """
    Fetch the user's profile by their email (from token).
    Returns the saved data if found.
    """
    profile = users_collection.find_one({"email": user}, {"_id": 0})

    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    return profile


