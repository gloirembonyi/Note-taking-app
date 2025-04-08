'use client';

import React, { useState, useEffect } from 'react';
import { Lightbulb, X, Loader2, ChevronRight, Tag, Clock, BrainCircuit, BookOpen } from 'lucide-react';

interface NoteContextAnalyzerProps {
  content: string;
  isVisible: boolean;
  onClose: () => void;
}

export default function NoteContextAnalyzer({ content, isVisible, onClose }: NoteContextAnalyzerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'insights' | 'topics' | 'mindmap'>('insights');
  const [insights, setInsights] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [readingTime, setReadingTime] = useState<string>('');
  const [mindMapData, setMindMapData] = useState<any>(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  // Calculate reading time
  useEffect(() => {
    if (content) {
      const words = content.trim().split(/\s+/).length;
      const minutes = Math.max(1, Math.round(words / 200)); // Average reading speed
      setReadingTime(`~${minutes} min read`);
    }
  }, [content]);

  // Analyze the note content
  const analyzeContent = async () => {
    if (!content || content.length < 50) {
      setInsights(['Add more content to get meaningful insights']);
      setTopics(['Note Taking', 'Draft']);
      return;
    }

    setIsLoading(true);

    try {
      // Get key insights
      const insightsResponse = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'extract-insights',
          content
        }),
      });

      // Get related topics
      const topicsResponse = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'find-related-topics',
          content
        }),
      });

      // Get mind map structure
      const mindMapResponse = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'generate-mindmap',
          content
        }),
      });

      if (insightsResponse.ok) {
        const insightsData = await insightsResponse.json();
        setInsights(insightsData.insights || ['No significant insights detected']);
      }

      if (topicsResponse.ok) {
        const topicsData = await topicsResponse.json();
        setTopics(topicsData.relatedTopics || ['General Notes']);
      }

      if (mindMapResponse.ok) {
        const mindMapData = await mindMapResponse.json();
        setMindMapData(mindMapData.mindMap || null);
      }

      setHasAnalyzed(true);
    } catch (error) {
      console.error('Error analyzing content:', error);
      setInsights(['Error analyzing content. Please try again.']);
    } finally {
      setIsLoading(false);
    }
  };

  // Render mind map recursively
  const renderMindMapNode = (node: any, level = 0) => {
    if (!node) return null;

    return (
      <div className={`ml-${level * 4} mb-2`}>
        <div className="flex items-center">
          {level > 0 && <ChevronRight size={14} className="mr-1 text-primary" />}
          <span className={level === 0 ? 'font-bold' : ''}>{node.text}</span>
        </div>
        {node.children && node.children.length > 0 && (
          <div className="ml-4 mt-1 border-l-2 border-gray-200 pl-2">
            {node.children.map((child: any, index: number) => (
              <div key={index}>{renderMindMapNode(child, level + 1)}</div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // If not visible, don't render
  if (!isVisible) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-card border-l border-border shadow-lg z-50 animate-slide-up overflow-hidden flex flex-col">
      <div className="p-4 border-b border-border flex justify-between items-center bg-muted">
        <h3 className="text-lg font-semibold flex items-center">
          <BrainCircuit size={18} className="mr-2 text-primary" />
          Note Analysis
        </h3>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-muted-foreground/10">
          <X size={18} />
        </button>
      </div>

      <div className="flex border-b border-border">
        <button
          className={`flex-1 py-2 text-sm font-medium ${activeTab === 'insights' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('insights')}
        >
          Insights
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium ${activeTab === 'topics' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('topics')}
        >
          Topics
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium ${activeTab === 'mindmap' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('mindmap')}
        >
          Mind Map
        </button>
      </div>

      <div className="p-2 bg-muted/50 text-xs flex items-center justify-between">
        <span className="flex items-center">
          <Clock size={14} className="mr-1" />
          {readingTime}
        </span>
        <button
          onClick={analyzeContent}
          disabled={isLoading}
          className="text-xs bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20 transition-colors flex items-center"
        >
          {isLoading ? <Loader2 size={12} className="mr-1 animate-spin" /> : <Lightbulb size={12} className="mr-1" />}
          {isLoading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!hasAnalyzed && !isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <BookOpen size={32} className="mb-2 opacity-50" />
            <p className="text-sm">Click "Analyze" to get AI-powered insights about your note</p>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 size={32} className="animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Analyzing your note...</p>
          </div>
        ) : activeTab === 'insights' ? (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Key Insights</h4>
            {insights.map((insight, index) => (
              <div key={index} className="p-2 bg-muted rounded-md text-sm">
                <div className="flex">
                  <Lightbulb size={16} className="text-primary mr-2 mt-0.5 flex-shrink-0" />
                  <p>{insight}</p>
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === 'topics' ? (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Related Topics</h4>
            <div className="flex flex-wrap gap-2">
              {topics.map((topic, index) => (
                <div key={index} className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs flex items-center">
                  <Tag size={12} className="mr-1" />
                  {topic}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Mind Map</h4>
            {mindMapData ? (
              <div className="p-2 bg-muted rounded-md text-sm">
                {renderMindMapNode(mindMapData.root)}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Mind map visualization will appear here after analysis.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 