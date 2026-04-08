from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from app.core.database import engine
from app.api.v1.router_auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

# Pydantic model for sending notifications
class SendNotificationRequest(BaseModel):
    recipientEmail: str
    title: str
    message: str

@router.get("/my")
#Get my notifications
def get_my_notifications(current_user: dict = Depends(get_current_user)):
    with engine.connect() as conn:
        result = conn.execute(
            text("""
                SELECT n.notificationid, n.userid, n.senderid, n.title, n.message, n.isread, n.createdat,
                       u.firstname, u.lastname, u.email
                FROM notifications n
                JOIN users u ON n.senderid = u.userid
                WHERE n.userid = :userid
                ORDER BY n.createdat DESC
            """),
            {"userid": current_user["userid"]}
        ).fetchall()

    notifications = []
    for row in result:
        notifications.append({
            "notificationId": str(row[0]),
            "userId": str(row[1]),
            "senderId": str(row[2]),
            "title": row[3],
            "message": row[4],
            "isRead": row[5],
            "createdAt": row[6],
            "senderFirstName": row[7],
            "senderLastName": row[8],
            "senderEmail": row[9]
        })

    return {
        "message": "Notifications retrieved successfully",
        "count": len(notifications),
        "notifications": notifications
    }

# Send notification to a specific student by email
@router.post("/send")
def send_notification(
    request: SendNotificationRequest,
    current_user: dict = Depends(get_current_user)
):
    # Only instructors can send notifications
    if current_user.get("role") != "instructor":
        raise HTTPException(status_code=403, detail="Only instructors can send notifications")

    with engine.connect() as conn:
        # Find the student by email
        student = conn.execute(
            text("""
                SELECT userid, email, role
                FROM users
                WHERE email = :email AND role = 'student'
            """),
            {"email": request.recipientEmail}
        ).fetchone()

        if not student:
            raise HTTPException(status_code=404, detail="Student with this email not found")

        # Create notification record
        conn.execute(
            text("""
                INSERT INTO notifications (userid, senderid, title, message, isread, createdat)
                VALUES (:userid, :senderid, :title, :message, FALSE, CURRENT_TIMESTAMP)
            """),
            {
                "userid": student[0],
                "senderid": current_user["userid"],
                "title": request.title,
                "message": request.message
            }
        )
        conn.commit()

    return {
        "message": "Notification sent successfully",
        "recipientEmail": request.recipientEmail
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
