import React from 'react';

interface ContentRendererProps {
  content: string;
  className?: string;
}

export function renderContentWithVideos(content: string): React.ReactNode[] {
  if (!content) return [];

  // Split content by video markers
  const parts = content.split(/(\[VIDEO:.*?\])/);
  
  return parts.map((part, index) => {
    // Check if this part is a video marker
    const videoMatch = part.match(/\[VIDEO:(.*?)\]/);
    
    if (videoMatch) {
      const videoUrl = videoMatch[1].trim();
      const videoId = extractYouTubeVideoId(videoUrl);
      
      if (videoId) {
        return (
          <div key={index} className="my-4">
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube video"
                className="absolute top-0 left-0 w-full h-full rounded-lg"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        );
      } else {
        // Invalid video URL, show as text
        return <span key={index} className="text-red-500">[Invalid video URL: {videoUrl}]</span>;
      }
    } else {
      // Regular text content
      return <span key={index}>{part}</span>;
    }
  });
}

function extractYouTubeVideoId(url: string): string | null {
  // Handle various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

export function ContentRenderer({ content, className = '' }: ContentRendererProps) {
  const renderedContent = renderContentWithVideos(content);

  return (
    <div className={`prose prose-gray dark:prose-invert max-w-none ${className}`}>
      {renderedContent}
    </div>
  );
}
