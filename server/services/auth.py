from livekit import api
from config import get_settings

async def authenticate(identity: str):
    settings = get_settings()
    token = api.AccessToken(settings.livekit_api_key, settings.livekit_api_secret) \
    .with_identity(identity) \
    .with_name(identity) \
    .with_grants(api.VideoGrants(
        room_join=True,
        room='base_room',
    ))
    return token.to_jwt()