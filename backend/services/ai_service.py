import json

import boto3

from utils.config import settings

MODEL_ID = "anthropic.claude-sonnet-4-5-20251001"


class AIService:
    def __init__(self):
        self.client = boto3.client(
            "bedrock-runtime",
            region_name=settings.aws_region,
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
        )

    def _invoke(self, prompt: str, max_tokens: int = 512) -> str:
        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": max_tokens,
            "messages": [{"role": "user", "content": prompt}],
        })
        response = self.client.invoke_model(modelId=MODEL_ID, body=body)
        result = json.loads(response["body"].read())
        return result["content"][0]["text"]

    def assess_return(
        self, product_name: str, reason: str, condition_description: str
    ) -> dict:
        prompt = f"""You are an AI assistant for a sustainable returns platform.
Analyze this return request and respond with ONLY a valid JSON object — no prose.

Product: {product_name}
Return Reason: {reason}
Customer Condition: {condition_description}

JSON keys required:
- condition: "excellent" | "good" | "fair" | "poor"
- recommendation: "resell" | "refurbish_resell" | "donate" | "recycle" | "dispose"
- estimated_resale_value_percent: integer 0-100
- sustainability_impact: one-sentence note on environmental benefit
- notes: brief assessment"""

        return json.loads(self._invoke(prompt))

    def generate_product_listing(
        self, product_name: str, condition: str, category: str
    ) -> dict:
        prompt = f"""Create a marketplace listing for a second-hand item on a sustainable resale platform.
Respond with ONLY a valid JSON object — no prose.

Product: {product_name}
Condition: {condition}
Category: {category}

JSON keys required:
- title: catchy listing title (max 60 chars)
- description: 2-3 sentences highlighting sustainability angle
- sustainability_tagline: short eco-friendly tagline"""

        return json.loads(self._invoke(prompt, max_tokens=400))


ai_service = AIService()
