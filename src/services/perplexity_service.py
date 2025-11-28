"""
Perplexity API Service for YouTube Video Recommendations
========================================================

Fetches treatment-related YouTube videos using Perplexity AI.
"""

import os
import re
import logging
from typing import List, Optional
from dotenv import load_dotenv

try:
    from perplexity import Perplexity
    PERPLEXITY_AVAILABLE = True
except ImportError:
    PERPLEXITY_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("perplexityai package not installed. Run: pip install perplexityai")

from src.database.models import YouTubeVideo

load_dotenv()
logger = logging.getLogger(__name__)


class PerplexityService:
    """Service for fetching YouTube video recommendations via Perplexity AI"""
    
    # Use sonar-pro for best quality, or sonar for cost-efficiency
    MODEL = "sonar"  # Cost-efficient model with online search
    
    def __init__(self, api_key: Optional[str] = None):
        """Initialize Perplexity service"""
        if not PERPLEXITY_AVAILABLE:
            logger.error("Perplexity package not available - video recommendations disabled")
            self.enabled = False
            return
            
        self.api_key = api_key or os.environ.get("PERPLEXITY_API_KEY")
        if not self.api_key:
            logger.warning("PERPLEXITY_API_KEY not found - video recommendations disabled")
            self.enabled = False
        else:
            try:
                # Set API key in environment for the package
                os.environ["PERPLEXITY_API_KEY"] = self.api_key
                self.client = Perplexity()
                logger.info(f"Perplexity service initialized successfully")
                self.enabled = True
            except Exception as e:
                logger.error(f"Failed to initialize Perplexity client: {str(e)}")
                self.enabled = False
    
    def extract_youtube_links(self, text: str) -> List[str]:
        """Extract YouTube URLs from text"""
        # Match various YouTube URL formats
        patterns = [
            r'https?://(?:www\.)?youtube\.com/watch\?v=([a-zA-Z0-9_-]{11})',
            r'https?://(?:www\.)?youtu\.be/([a-zA-Z0-9_-]{11})',
            r'https?://(?:www\.)?youtube\.com/embed/([a-zA-Z0-9_-]{11})',
        ]
        
        video_ids = set()
        for pattern in patterns:
            matches = re.finditer(pattern, text)
            for match in matches:
                video_ids.add(match.group(1))
        
        return [f"https://www.youtube.com/watch?v={vid}" for vid in video_ids]
    
    def parse_video_info(self, url: str, context: str = "") -> YouTubeVideo:
        """Parse YouTube video information from URL and context"""
        # Extract video ID
        video_id_match = re.search(r'(?:v=|/)([a-zA-Z0-9_-]{11})', url)
        if not video_id_match:
            raise ValueError(f"Invalid YouTube URL: {url}")
        
        video_id = video_id_match.group(1)
        
        # Try to extract title from context (look for text before the URL)
        title = "Treatment Video"
        lines = context.split('\n')
        for i, line in enumerate(lines):
            if url in line:
                # Check previous lines for title
                for j in range(max(0, i-3), i):
                    if lines[j].strip() and not lines[j].startswith('http'):
                        title = lines[j].strip().strip('*-•').strip()
                        break
                # Check same line before URL
                before_url = line.split(url)[0].strip().strip('*-•').strip()
                if before_url and len(before_url) > 5:
                    title = before_url
                break
        
        return YouTubeVideo(
            title=title,
            video_id=video_id,
            url=f"https://www.youtube.com/watch?v={video_id}",
            thumbnail=f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg",
            description=None
        )
    
    def get_treatment_videos(
        self, 
        disease_name: str, 
        disease_type: str,
        max_videos: int = 3
    ) -> List[YouTubeVideo]:
        """
        Fetch YouTube video recommendations for disease treatment
        
        Args:
            disease_name: Name of the detected disease
            disease_type: Type of disease (fungal, bacterial, etc.)
            max_videos: Maximum number of videos to return
            
        Returns:
            List of YouTubeVideo objects
        """
        if not self.enabled:
            logger.warning("Perplexity service not enabled - returning empty video list")
            return []
        
        try:
            # Create search query - be very explicit about YouTube URLs
            query = f"""Find {max_videos} YouTube video tutorials about treating {disease_name} ({disease_type} disease) in plants.

For each video, you MUST provide:
1. Video title
2. Complete YouTube URL (https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID)

Format your response like this:
1. [Video Title]
   URL: https://www.youtube.com/watch?v=VIDEO_ID
   
2. [Video Title]
   URL: https://www.youtube.com/watch?v=VIDEO_ID

Focus on practical treatment methods, organic solutions, and step-by-step guides."""
            
            logger.info(f"Requesting treatment videos for: {disease_name}")
            
            # Make API request using official package
            completion = self.client.chat.completions.create(
                model=self.MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful assistant that searches YouTube for plant disease treatment videos. Always include complete YouTube URLs in your response."
                    },
                    {
                        "role": "user",
                        "content": query
                    }
                ]
            )
            
            content = completion.choices[0].message.content
            
            logger.info(f"Perplexity response length: {len(content)} characters")
            logger.debug(f"Response preview: {content[:300]}...")
            
            if not content:
                logger.warning("Empty response from Perplexity")
                return []
            
            # Extract YouTube links
            youtube_urls = self.extract_youtube_links(content)
            
            logger.info(f"Extracted {len(youtube_urls)} YouTube URLs")
            
            if not youtube_urls:
                logger.warning(f"No YouTube links found for {disease_name}")
                logger.warning(f"Response: {content[:200]}...")
                return []
            
            # Parse video information
            videos = []
            for url in youtube_urls[:max_videos]:
                try:
                    video = self.parse_video_info(url, content)
                    videos.append(video)
                    logger.info(f"Added video: {video.title}")
                except Exception as e:
                    logger.error(f"Error parsing video {url}: {str(e)}")
                    continue
            
            logger.info(f"Successfully fetched {len(videos)} videos for {disease_name}")
            return videos
            
        except Exception as e:
            logger.error(f"Error fetching videos: {str(e)}", exc_info=True)
            return []
    
    def get_general_plant_care_videos(self, max_videos: int = 2) -> List[YouTubeVideo]:
        """Get general plant care videos for healthy leaves"""
        if not self.enabled:
            return []
        
        try:
            query = f"""Find {max_videos} YouTube videos about general plant care and disease prevention.

For each video, provide:
1. Video title
2. Complete YouTube URL (https://www.youtube.com/watch?v=VIDEO_ID)

Topics: plant health maintenance, disease prevention, watering, fertilization."""
            
            logger.info("Requesting general plant care videos")
            
            completion = self.client.chat.completions.create(
                model=self.MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "You search YouTube for plant care videos. Always include complete YouTube URLs."
                    },
                    {
                        "role": "user",
                        "content": query
                    }
                ]
            )
            
            content = completion.choices[0].message.content
            youtube_urls = self.extract_youtube_links(content)
            
            videos = []
            for url in youtube_urls[:max_videos]:
                try:
                    video = self.parse_video_info(url, content)
                    videos.append(video)
                except Exception:
                    continue
            
            logger.info(f"Fetched {len(videos)} general care videos")
            return videos
            
        except Exception as e:
            logger.error(f"Error fetching general care videos: {str(e)}")
            return []


# Singleton instance
_perplexity_service = None

def get_perplexity_service() -> PerplexityService:
    """Get or create Perplexity service instance"""
    global _perplexity_service
    if _perplexity_service is None:
        _perplexity_service = PerplexityService()
    return _perplexity_service

