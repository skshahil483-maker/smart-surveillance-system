import csv
import io
from sqlalchemy.orm import Session
from app.models.models import Event

def export_events_to_csv(db: Session) -> str:
    """
    Exports database events to CSV string format.
    """
    events = db.query(Event).order_by(Event.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)

    # Write header
    writer.writerow([
        "Event ID", "Camera ID", "Activity", "Status", 
        "Confidence", "Person IDs", "Location", "Timestamp", "Created At"
    ])

    for evt in events:
        writer.writerow([
            evt.event_id,
            evt.camera_id,
            evt.activity,
            evt.status,
            f"{evt.confidence * 100:.1f}%",
            evt.person_ids,
            evt.location,
            evt.timestamp,
            evt.created_at.strftime("%Y-%m-%d %H:%M:%S") if evt.created_at else ""
        ])

    return output.getvalue()
