"""
OpenAI service for AI-powered file processing and chat functionality.
"""

import logging
import uuid
import time
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timezone
from openai import OpenAI

from config import config
from models.mongo_models import (
    ProcessingJob,
    FileAnalysis,
    Conversation,
    Invoice,
    Summary
)

logger = logging.getLogger(__name__)


class OpenAIService:
    """Service for OpenAI API interactions and processing management."""
    
    def __init__(self):
        """Initialize OpenAI service."""
        self.client = None
        self.authenticated = False
        self._initialize_client()
    
    def _initialize_client(self) -> bool:
        """Initialize OpenAI client with API key."""
        try:
            if not config.OPENAI_API_KEY:
                logger.warning("OpenAI API key not configured")
                return False
            
            self.client = OpenAI(api_key=config.OPENAI_API_KEY)
            self.authenticated = True
            logger.info("OpenAI client initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI client: {e}")
            self.authenticated = False
            return False
    
    def get_client_status(self) -> Dict[str, Any]:
        """Get OpenAI client status information."""
        return {
            "authenticated": self.authenticated,
            "api_key_configured": bool(config.OPENAI_API_KEY),
            "model": config.OPENAI_MODEL,
            "max_tokens": config.OPENAI_MAX_TOKENS,
            "temperature": config.OPENAI_TEMPERATURE
        }
    
    def calculate_cost(self, tokens_used: int, model: str = None) -> float:
        """Calculate estimated cost based on tokens used."""
        if not model:
            model = config.OPENAI_MODEL
        
        # Pricing per 1K tokens (as of 2024)
        pricing = {
            "gpt-4o": 0.005,      # $5 per 1M tokens
            "gpt-4o-mini": 0.00015,  # $0.15 per 1M tokens
            "gpt-4": 0.03,        # $30 per 1M tokens
            "gpt-3.5-turbo": 0.001  # $1 per 1M tokens
        }
        
        rate = pricing.get(model, 0.001)  # Default to gpt-3.5-turbo rate
        return (tokens_used / 1000) * rate
    
    async def create_processing_job(
        self,
        account_id: int,
        task_type: str,
        file_ids: List[str],
        custom_prompt: Optional[str] = None
    ) -> ProcessingJob:
        """Create a new processing job."""
        job_id = str(uuid.uuid4())
        
        job = ProcessingJob(
            job_id=job_id,
            account_id=account_id,
            task_type=task_type,
            file_ids=file_ids,
            custom_prompt=custom_prompt,
            model_used=config.OPENAI_MODEL,
            status="pending"
        )
        
        await job.insert()
        logger.info(f"Created processing job {job_id} for account {account_id}")
        return job
    
    async def process_files_batch(
        self,
        account_id: int,
        task_type: str,
        file_ids: Optional[List[str]] = None,
        custom_prompt: Optional[str] = None
    ) -> ProcessingJob:
        """Process files in batch with OpenAI."""
        start_time = time.time()
        
        # Get files to process
        if file_ids:
            # Process specific files
            files_query = Invoice.find(
                Invoice.id.in_([Invoice.parse_object_id(fid) for fid in file_ids]),
                Invoice.account_id == account_id
            )
        else:
            # Process all uploaded files for account
            files_query = Invoice.find(
                Invoice.account_id == account_id,
                Invoice.last_executed_step >= 2,  # Only uploaded files
                Invoice.status == None  # Not rejected
            )
        
        files_to_process = await files_query.to_list()
        
        if not files_to_process:
            raise ValueError("No files found to process")
        
        # Create processing job
        job = await self.create_processing_job(
            account_id=account_id,
            task_type=task_type,
            file_ids=[str(f.id) for f in files_to_process],
            custom_prompt=custom_prompt
        )
        
        # Update job status to processing
        job.status = "processing"
        job.started_at = datetime.now(timezone.utc)
        await job.save()
        
        processed_count = 0
        failed_count = 0
        total_tokens = 0
        total_cost = 0.0
        
        try:
            for i, file_doc in enumerate(files_to_process):
                try:
                    # Process individual file
                    analysis_result = await self.analyze_file(
                        file_id=str(file_doc.id),
                        file_name=file_doc.name,
                        analysis_type=task_type,
                        account_id=account_id,
                        job_id=job.job_id,
                        custom_prompt=custom_prompt
                    )
                    
                    if analysis_result.success:
                        processed_count += 1
                        total_tokens += analysis_result.tokens_used
                        total_cost += analysis_result.cost_usd
                    else:
                        failed_count += 1
                    
                    # Update progress
                    progress = int(((i + 1) / len(files_to_process)) * 100)
                    job.progress = progress
                    await job.save()
                    
                except Exception as e:
                    logger.error(f"Failed to process file {file_doc.name}: {e}")
                    failed_count += 1
                    continue
            
            # Update job completion
            job.status = "completed"
            job.completed_at = datetime.now(timezone.utc)
            job.processing_time_seconds = time.time() - start_time
            job.processed_files = processed_count
            job.failed_files = failed_count
            job.total_tokens_used = total_tokens
            job.total_cost_usd = total_cost
            job.progress = 100
            
        except Exception as e:
            # Job failed
            job.status = "failed"
            job.error_message = str(e)
            job.completed_at = datetime.now(timezone.utc)
            job.processing_time_seconds = time.time() - start_time
            logger.error(f"Processing job {job.job_id} failed: {e}")
        
        await job.save()
        return job
    
    async def analyze_file(
        self,
        file_id: str,
        file_name: str,
        analysis_type: str,
        account_id: int,
        job_id: Optional[str] = None,
        custom_prompt: Optional[str] = None
    ) -> FileAnalysis:
        """Analyze a single file with OpenAI."""
        start_time = time.time()
        
        if not self.authenticated:
            raise ValueError("OpenAI client not authenticated")
        
        # Build prompt based on analysis type
        prompt = self._build_prompt(analysis_type, file_name, custom_prompt)
        
        try:
            # Make OpenAI API call
            response = self.client.chat.completions.create(
                model=config.OPENAI_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert document analyzer. Provide structured, accurate analysis."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=config.OPENAI_MAX_TOKENS,
                temperature=config.OPENAI_TEMPERATURE,
                timeout=config.OPENAI_TIMEOUT_SECONDS
            )
            
            # Extract response data
            content = response.choices[0].message.content
            tokens_used = response.usage.total_tokens
            cost = self.calculate_cost(tokens_used, config.OPENAI_MODEL)
            
            # Parse extracted data (basic example)
            extracted_data = self._parse_analysis_response(content, analysis_type)
            confidence_score = self._calculate_confidence_score(extracted_data)
            
            # Create analysis record
            analysis = FileAnalysis(
                file_id=file_id,
                file_name=file_name,
                account_id=account_id,
                analysis_type=analysis_type,
                job_id=job_id,
                model_used=config.OPENAI_MODEL,
                prompt_used=prompt,
                tokens_used=tokens_used,
                cost_usd=cost,
                success=True,
                extracted_data=extracted_data,
                confidence_score=confidence_score,
                processing_time_seconds=time.time() - start_time
            )
            
        except Exception as e:
            logger.error(f"OpenAI analysis failed for file {file_name}: {e}")
            
            # Create failed analysis record
            analysis = FileAnalysis(
                file_id=file_id,
                file_name=file_name,
                account_id=account_id,
                analysis_type=analysis_type,
                job_id=job_id,
                model_used=config.OPENAI_MODEL,
                prompt_used=prompt,
                tokens_used=0,
                cost_usd=0.0,
                success=False,
                extracted_data={},
                confidence_score=0.0,
                processing_time_seconds=time.time() - start_time,
                error_message=str(e)
            )
        
        await analysis.insert()
        return analysis
    
    async def chat_completion(
        self,
        message: str,
        account_id: int,
        conversation_id: Optional[str] = None,
        system_prompt: Optional[str] = None
    ) -> Tuple[str, str, int, float]:
        """Handle chat completion with conversation history."""
        if not self.authenticated:
            raise ValueError("OpenAI client not authenticated")
        
        # Get or create conversation
        if conversation_id:
            conversation = await Conversation.find_one(
                Conversation.conversation_id == conversation_id,
                Conversation.account_id == account_id
            )
        else:
            conversation_id = str(uuid.uuid4())
            conversation = None
        
        if not conversation:
            conversation = Conversation(
                conversation_id=conversation_id,
                account_id=account_id,
                system_prompt=system_prompt
            )
            await conversation.insert()
        
        # Build messages for OpenAI
        messages = []
        
        if conversation.system_prompt or system_prompt:
            messages.append({
                "role": "system",
                "content": system_prompt or conversation.system_prompt
            })
        
        # Add conversation history
        messages.extend(conversation.messages)
        
        # Add current message
        messages.append({
            "role": "user",
            "content": message
        })
        
        try:
            # Make OpenAI API call
            response = self.client.chat.completions.create(
                model=config.OPENAI_MODEL,
                messages=messages,
                max_tokens=config.OPENAI_MAX_TOKENS,
                temperature=config.OPENAI_TEMPERATURE,
                timeout=config.OPENAI_TIMEOUT_SECONDS
            )
            
            # Extract response
            ai_response = response.choices[0].message.content
            tokens_used = response.usage.total_tokens
            cost = self.calculate_cost(tokens_used, config.OPENAI_MODEL)
            
            # Update conversation
            conversation.messages.append({
                "role": "user",
                "content": message,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            conversation.messages.append({
                "role": "assistant",
                "content": ai_response,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            
            conversation.total_tokens_used += tokens_used
            conversation.total_cost_usd += cost
            conversation.message_count += 2
            conversation.updated_at = datetime.now(timezone.utc)
            conversation.last_message_at = datetime.now(timezone.utc)
            
            await conversation.save()
            
            return ai_response, conversation_id, tokens_used, cost
            
        except Exception as e:
            logger.error(f"Chat completion failed: {e}")
            raise
    
    def _build_prompt(
        self, 
        analysis_type: str, 
        file_name: str, 
        custom_prompt: Optional[str] = None
    ) -> str:
        """Build analysis prompt based on type."""
        if custom_prompt:
            return custom_prompt.format(file_name=file_name)
        
        prompts = {
            "invoice_extraction": f"""
            Analyze the file "{file_name}" and extract the following invoice information:
            - Invoice number
            - Invoice date
            - Due date
            - Vendor/supplier information
            - Total amount
            - Currency
            - Line items with descriptions and amounts
            - Tax information
            
            Return the information in a structured JSON format.
            """,
            "document_summary": f"""
            Provide a comprehensive summary of the document "{file_name}".
            Include:
            - Document type
            - Key topics and themes
            - Important dates
            - Key participants/entities
            - Main conclusions or decisions
            """,
            "data_extraction": f"""
            Extract all structured data from "{file_name}".
            Identify and extract:
            - Dates
            - Numbers and amounts
            - Names and entities
            - Key-value pairs
            - Tables and lists
            """
        }
        
        return prompts.get(analysis_type, f"Analyze the file '{file_name}' and provide insights.")
    
    def _parse_analysis_response(self, content: str, analysis_type: str) -> Dict[str, Any]:
        """Parse OpenAI response into structured data."""
        # Basic parsing - in production, you'd want more sophisticated parsing
        try:
            # Try to extract JSON if present
            import json
            import re
            
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            else:
                return {
                    "raw_response": content,
                    "analysis_type": analysis_type,
                    "parsed": False
                }
                
        except Exception:
            return {
                "raw_response": content,
                "analysis_type": analysis_type,
                "parsed": False
            }
    
    def _calculate_confidence_score(self, extracted_data: Dict[str, Any]) -> float:
        """Calculate confidence score based on extracted data quality."""
        if not extracted_data or extracted_data.get("parsed") is False:
            return 0.1
        
        # Basic confidence calculation
        score = 0.5  # Base score
        
        # Add points for structured data
        if isinstance(extracted_data, dict) and len(extracted_data) > 1:
            score += 0.3
        
        # Add points for specific fields found
        key_fields = ["invoice_number", "total", "date", "vendor"]
        found_fields = sum(1 for field in key_fields if field in extracted_data)
        score += (found_fields / len(key_fields)) * 0.2
        
        return min(score, 1.0)

    async def summarize_invoice_content(
        self,
        content: str,
        file_id: str,
        file_name: str,
        account_id: int,
        processing_job_id: Optional[str] = None,
        model: str = "gpt-4o"
    ) -> Summary:
        """
        Summarize invoice content using OpenAI with specific prompt template.
        Returns Summary document that gets saved to the database.
        """
        start_time = time.time()
        
        if not self.authenticated:
            raise ValueError("OpenAI client not authenticated")
        
        # Build the specific prompt template
        prompt = f"""write a concise summary of the following:

"{content}"

CONCISE SUMMARY:

If you are 100% certain the following text does not represent an invoice, output only:
not an invoice

Otherwise, extract the following fields and return only a valid JSON object (no explanation, no markdown, no extra text, no code block):

country: the country
supplier: the supplier  
date: the date of the invoice
id: invoice/receipt id
description: what was bought
net_amount: amount before VAT
vat_amount: amount of VAT
vat_rate: rate of the vat
currency: the currency that was used (text)
Text:
{content}

Return only the JSON object or the string not an invoice. Do not include any code block, markdown, or explanation."""

        try:
            # Call OpenAI API
            response = self.client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,  # Low temperature for consistent extraction
                max_tokens=500    # Should be enough for the response
            )
            
            content_result = response.choices[0].message.content.strip()
            tokens_used = response.usage.total_tokens
            cost_usd = self.calculate_cost(tokens_used, model)
            processing_time = time.time() - start_time
            
            # Determine if it's an invoice and parse the result
            is_invoice = content_result.lower() != "not an invoice"
            extracted_data = None
            
            if is_invoice:
                try:
                    # Try to parse as JSON
                    import json
                    extracted_data = json.loads(content_result)
                except json.JSONDecodeError:
                    # If JSON parsing fails, treat as not an invoice
                    is_invoice = False
                    content_result = "not an invoice"
                    logger.warning(f"Failed to parse JSON from OpenAI response for file {file_name}")
            
            # Create and save Summary document
            summary = Summary(
                file_id=file_id,
                file_name=file_name,
                account_id=account_id,
                processing_job_id=processing_job_id,
                model_used=model,
                tokens_used=tokens_used,
                cost_usd=cost_usd,
                is_invoice=is_invoice,
                summary_content=content_result,
                extracted_data=extracted_data,
                processing_time_seconds=processing_time,
                success=True
            )
            
            await summary.insert()
            logger.info(f"Successfully summarized file {file_name} - is_invoice: {is_invoice}")
            
            return summary
            
        except Exception as e:
            # Create failed Summary document
            processing_time = time.time() - start_time
            
            summary = Summary(
                file_id=file_id,
                file_name=file_name,
                account_id=account_id,
                processing_job_id=processing_job_id,
                model_used=model,
                tokens_used=0,
                cost_usd=0.0,
                is_invoice=False,
                summary_content="",
                extracted_data=None,
                processing_time_seconds=processing_time,
                success=False,
                error_message=str(e)
            )
            
            await summary.insert()
            logger.error(f"Failed to summarize file {file_name}: {e}")
            
            return summary


# Global OpenAI service instance
openai_service = OpenAIService() 