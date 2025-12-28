'use client';

import { Idea, Category } from '@/types/database';
import { Edit, Trash2 } from 'lucide-react';
import TweetEmbed, { containsTweetUrl } from './TweetEmbed';

interface IdeaCardProps {
  idea: Idea & { categories?: Category | null };
  category: Category | null;
  onEdit: (idea: Idea) => void;
  onDelete: (id: string) => void;
  onStatusChange: (idea: Idea, newStatus: 'plan_to_do' | 'done' | 'dropped') => void;
}

// Remove tweet URL from description for cleaner display
function getCleanDescription(description: string | null): string | null {
  if (!description) return null;
  const urlPattern = /(https?:\/\/(?:twitter\.com|x\.com)\/\w+\/status(?:es)?\/\d+)/gi;
  return description.replace(urlPattern, '').trim() || null;
}

export default function IdeaCard({ idea, category, onEdit, onDelete, onStatusChange }: IdeaCardProps) {
  const tweetUrl = idea.description ? containsTweetUrl(idea.description) : null;
  const cleanDescription = getCleanDescription(idea.description);
  const statusLabels = {
    plan_to_do: 'Plan to do',
    done: 'Done',
    dropped: 'Dropped',
  };

  const statusColors = {
    plan_to_do: 'bg-blue-900/20 text-blue-400 border-blue-800',
    done: 'bg-green-900/20 text-green-400 border-green-800',
    dropped: 'bg-red-900/20 text-red-400 border-red-800',
  };

  return (
    <div className="bg-[#0d0d0d] border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          {category && (
            <span
              className="inline-block px-3 py-1 rounded-full text-sm font-medium mb-2"
              style={{
                backgroundColor: `${category.color}20`,
                color: category.color,
                border: `1px solid ${category.color}40`,
              }}
            >
              {category.name}
            </span>
          )}
          {idea.emoji && (
            <span className="text-2xl mr-2">{idea.emoji}</span>
          )}
          <h3 className="text-lg font-bold text-white mb-2">{idea.title}</h3>
          {cleanDescription && (
            <p className="text-gray-400 text-sm mb-2">{cleanDescription}</p>
          )}
          {tweetUrl && (
            <TweetEmbed tweetUrl={tweetUrl} />
          )}
        </div>
        <div className="flex gap-2 ml-4">
          <button
            onClick={() => onEdit(idea)}
            className="p-2 text-gray-400 hover:text-white hover:bg-[#141414] rounded-lg"
            title="Edit"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => onDelete(idea.id)}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/10 rounded-lg"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <select
          value={idea.status}
          onChange={(e) => onStatusChange(idea, e.target.value as 'plan_to_do' | 'done' | 'dropped')}
          className={`px-3 py-1 rounded-lg text-sm font-medium border ${statusColors[idea.status]} bg-transparent focus:outline-none cursor-pointer`}
        >
          <option value="plan_to_do">Plan to do</option>
          <option value="done">Done</option>
          <option value="dropped">Dropped</option>
        </select>
        <span className="text-xs text-gray-500">
          {new Date(idea.created_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

