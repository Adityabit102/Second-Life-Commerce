import uuid

import boto3

from utils.config import settings


class S3Service:
    def __init__(self):
        self.client = boto3.client(
            "s3",
            region_name=settings.aws_region,
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
        )
        self.bucket = settings.s3_bucket_name

    def upload_image(
        self, file_bytes: bytes, filename: str, content_type: str = "image/jpeg"
    ) -> str:
        key = f"returns/{uuid.uuid4()}/{filename}"
        self.client.put_object(
            Bucket=self.bucket,
            Key=key,
            Body=file_bytes,
            ContentType=content_type,
        )
        return f"https://{self.bucket}.s3.{settings.aws_region}.amazonaws.com/{key}"

    def delete_image(self, url: str) -> None:
        key = url.split(
            f"{self.bucket}.s3.{settings.aws_region}.amazonaws.com/"
        )[-1]
        self.client.delete_object(Bucket=self.bucket, Key=key)


s3_service = S3Service()
