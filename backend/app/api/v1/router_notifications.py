from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from app.core.database import engine
from app.api.v1.router_auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/my")
#Get my notifications
def get_my_notifications(current_user: dict = Depends(get_current_user)):
    with engine.connect() as conn:
        result = conn.execute(
            text("""
                SELECT notificationid, userid, message, isread, createdat
                FROM notifications
                WHERE userid = :userid
                ORDER BY createdat DESC
            """),
            {"userid": current_user["userid"]}#Get user ID from token
        ).fetchall()

    notifications = []
    for row in result:
        #convert data from DB to JSON
        notifications.append({
            "notificationId": str(row[0]),
            "userId": str(row[1]),
            "message": row[2],
            "isRead": row[3],
            "createdAt": row[4]
        })
# Return NOTIFICATION response related to the user
    return {
        "message": "Notifications retrieved successfully",
        "count": len(notifications),
        "notifications": notifications
    }


#marking the notification as read, even in the database 
@router.patch("/{notification_id}/read")
def mark_notification_as_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    with engine.connect() as conn:
        notification = conn.execute(
            text("""
                SELECT notificationid, userid, isread
                FROM notifications
                WHERE notificationid = :notification_id
            """),
            {"notification_id": notification_id}
        ).fetchone()

        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")

        # Prevent user from modifying someone else's notification
        if str(notification[1]) != str(current_user["userid"]):
            raise HTTPException(status_code=403, detail="Not allowed")
        
        #Update database
        conn.execute(
            text("""
                UPDATE notifications
                SET isread = TRUE
                WHERE notificationid = :notification_id
            """),
            {"notification_id": notification_id}
        )
        conn.commit()
    
    #Return success
    return {
        "message": "Notification marked as read",
        "notificationId": notification_id
    }


#delete notification from database
@router.delete("/{notification_id}")
def delete_notification(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    with engine.connect() as conn:
        notification = conn.execute(
            text("""
                SELECT notificationid, userid
                FROM notifications
                WHERE notificationid = :notification_id
            """),
            {"notification_id": notification_id}
        ).fetchone()

        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")

        # Prevent user from deleting someone else's notification
        if str(notification[1]) != str(current_user["userid"]):
            raise HTTPException(status_code=403, detail="Not allowed to delete this notification")

        #Delete from database
        conn.execute(
            text("""
                DELETE FROM notifications
                WHERE notificationid = :notification_id
            """),
            {"notification_id": notification_id}
        )
        conn.commit()

    #Return success
    return {
        "message": "Notification deleted successfully",
        "notificationId": notification_id
    }
