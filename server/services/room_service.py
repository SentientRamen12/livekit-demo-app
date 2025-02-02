import livekit
import livekit.rtc


class RoomService:
    def __init__(self):
        self.room = None

    def create_room(self):
        self.room = livekit.rtc.Room()

    def get_room(self):
        return self.room
    

room_service = RoomService()
