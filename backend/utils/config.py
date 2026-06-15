from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "us-east-1"
    s3_bucket_name: str = ""
    database_url: str = "sqlite:///./second_life.db"
    groq_api_key: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
