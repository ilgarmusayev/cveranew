'use client';

import { useState } from 'react';
import { getLabel } from '@/lib/cvLanguage';
import RichTextEditor from '@/components/ui/RichTextEditor';
import DateRangeInput from '@/components/cv/DateRangeInput';

// Utility function to safely render HTML content
const stripHtmlTags = (html: string): string => {
    if (!html) return '';
    return html
        // Convert line breaks to newlines
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<p[^>]*>/gi, '')
        .replace(/<\/div>/gi, '\n')
        .replace(/<div[^>]*>/gi, '')
        // Handle headers with spacing
        .replace(/<\/h[1-6]>/gi, '\n\n')
        .replace(/<h[1-6][^>]*>/gi, '')
        // Convert lists to bullet points
        .replace(/<\/li>/gi, '')
        .replace(/<li[^>]*>/gi, '• ')
        .replace(/<\/ul>/gi, '\n')
        .replace(/<ul[^>]*>/gi, '')
        .replace(/<\/ol>/gi, '\n')
        .replace(/<ol[^>]*>/gi, '')
        // Handle emphasis tags
        .replace(/<\/?strong>/gi, '')
        .replace(/<\/?b>/gi, '')
        .replace(/<\/?em>/gi, '')
        .replace(/<\/?i>/gi, '')
        .replace(/<\/?u>/gi, '')
        // Remove all other HTML tags
        .replace(/<[^>]+>/g, '')
        // Clean up HTML entities
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        // Clean up multiple newlines and spaces
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        .replace(/[ \t]+/g, ' ')
        .trim();
};

interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  url?: string;
  github?: string;
  current?: boolean;
  startDate?: string;
  endDate?: string;
}

interface ProjectsSectionProps {
  data: Project[];
  onChange: (data: Project[]) => void;
  cvLanguage?: 'english' | 'azerbaijani';
}

export default function ProjectsSection({ data, onChange, cvLanguage = 'azerbaijani' }: ProjectsSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Normalize data to ensure technologies is always an array
  const normalizedData = data.map(project => ({
    ...project,
    technologies: project.technologies || []
  }));

  const addProject = () => {
    const newProject: Project = {
      id: Date.now().toString(),
      name: '',
      description: '',
      technologies: [],
      url: '',
      github: '',
      current: false,
      startDate: '',
      endDate: ''
    };
    onChange([newProject, ...normalizedData]);
    setExpandedId(newProject.id);
  };

  const updateProject = (id: string, field: keyof Project, value: string | string[] | boolean) => {
    const updated = normalizedData.map(project => 
      project.id === id ? { ...project, [field]: value } : project
    );
    onChange([...updated]);
  };

  const updateProjectMultiple = (id: string, updates: Partial<Project>) => {
    const updated = normalizedData.map(project =>
      project.id === id ? { ...project, ...updates } : project
    );
    onChange([...updated]);
  };

  const removeProject = (id: string) => {
    onChange(normalizedData.filter(project => project.id !== id));
  };

  const moveProject = (id: string, direction: 'up' | 'down') => {
    const index = normalizedData.findIndex(project => project.id === id);
    if (direction === 'up' && index > 0) {
      const updated = [...normalizedData];
      [updated[index], updated[index - 1]] = [updated[index - 1], updated[index]];
      onChange(updated);
    } else if (direction === 'down' && index < normalizedData.length - 1) {
      const updated = [...normalizedData];
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
      onChange(updated);
    }
  };

  const updateTechnologies = (id: string, techString: string) => {
    const technologies = techString.split(',').map(tech => tech.trim()).filter(tech => tech);
    updateProject(id, 'technologies', technologies);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {cvLanguage === 'english' ? 'Projects' : 'Layihələr'}
          </h3>
        </div>
        <button
          onClick={addProject}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          <span className="hidden sm:inline">
            {cvLanguage === 'english' ? '+ Add' : '+ Əlavə edin'}
          </span>
          <span className="sm:hidden">
            {cvLanguage === 'english' ? '+' : '+'}
          </span>
        </button>
      </div>

      {normalizedData.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <p className="text-gray-500 mb-4">
            {cvLanguage === 'english' ? 'No projects added yet' : 'Hələ heç bir layihə əlavə etməmisiniz'}
          </p>
          <button
            onClick={addProject}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {cvLanguage === 'english' ? 'Add your first project' : 'İlk layihənizi əlavə edin'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {normalizedData.map((project, index) => (
            <div key={project.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-blue-500">🚀</span>
                  <h4 className="font-medium text-gray-900">
                    {project.name || (cvLanguage === 'english' ? 'New project' : 'Yeni layihə')}
                  </h4>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 whitespace-pre-line">
                  {stripHtmlTags(project.description) || (cvLanguage === 'english' ? 'Project description' : 'Layihə təsviri')}
                </p>
                {project.technologies && project.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {project.technologies.slice(0, 3).map((tech, idx) => (
                      <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {tech}
                      </span>
                    ))}
                    {project.technologies.length > 3 && (
                      <span className="text-xs text-gray-500">+{project.technologies.length - 3}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Action links moved to bottom of card */}
              <div className="flex items-center justify-between mt-4 pt-2 border-t border-gray-100">
                {/* Move buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => moveProject(project.id, 'up')}
                    disabled={index === 0}
                    className={`p-1 rounded transition-colors ${
                      index === 0
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                    title={cvLanguage === 'english' ? 'Move Up' : 'Yuxarı'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => moveProject(project.id, 'down')}
                    disabled={index === normalizedData.length - 1}
                    className={`p-1 rounded transition-colors ${
                      index === normalizedData.length - 1
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                    title={cvLanguage === 'english' ? 'Move Down' : 'Aşağı'}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* Edit and remove buttons */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setExpandedId(expandedId === project.id ? null : project.id)}
                    className="text-blue-600 hover:text-blue-800 transition-colors text-sm cursor-pointer"
                  >
                    {expandedId === project.id ? (cvLanguage === 'english' ? 'Close' : 'Bağlayın') : (cvLanguage === 'english' ? 'Edit' : 'Redaktə edin')}
                  </button>
                  <button
                    onClick={() => removeProject(project.id)}
                    className="text-red-600 hover:text-red-800 transition-colors text-sm cursor-pointer"
                  >
                    {cvLanguage === 'english' ? 'Delete' : 'Silin'}
                  </button>
                </div>
              </div>

              {expandedId === project.id && (
                <div className="space-y-4 border-t border-gray-200 pt-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {cvLanguage === 'english' ? 'Project Name' : 'Layihə adı'} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={project.name}
                        onChange={(e) => updateProject(project.id, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder={cvLanguage === 'english' ? 'Project Name' : 'Layihənin adı'}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {cvLanguage === 'english' ? 'Project URL' : 'Layihə URL-i'} <span className="text-gray-400 text-xs">{cvLanguage === 'english' ? '(optional)' : '(ixtiyari)'}</span>
                      </label>
                      <input
                        type="url"
                        value={project.url || ''}
                        onChange={(e) => updateProject(project.id, 'url', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="https://myproject.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {cvLanguage === 'english' ? 'GitHub Repository' : 'GitHub URL-i'} <span className="text-gray-400 text-xs">{cvLanguage === 'english' ? '(optional)' : '(ixtiyari)'}</span>
                      </label>
                      <input
                        type="url"
                        value={project.github || ''}
                        onChange={(e) => updateProject(project.id, 'github', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="https://github.com/username/project"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {cvLanguage === 'english' ? 'Technologies' : 'Texnologiyalar'} <span className="text-gray-400 text-xs">{cvLanguage === 'english' ? '(comma separated)' : '(vergüllə ayırın)'}</span>
                      </label>
                      <input
                        type="text"
                        value={project.technologies ? project.technologies.join(', ') : ''}
                        onChange={(e) => updateTechnologies(project.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="React, Node.js, PostgreSQL, AWS"
                      />
                    </div>
                  </div>

                  {/* Date Range Input */}
                  <DateRangeInput
                    startDate={project.startDate || ''}
                    endDate={project.endDate}
                    current={project.current || false}
                    onStartDateChange={(date) => updateProject(project.id, 'startDate', date)}
                    onEndDateChange={(date) => updateProject(project.id, 'endDate', date)}
                    onCurrentChange={(current) => updateProjectMultiple(project.id, { 
                      current, 
                      endDate: current ? '' : project.endDate 
                    })}
                    startLabel={cvLanguage === 'english' ? 'Start Date' : 'Başlama tarixi'}
                    endLabel={cvLanguage === 'english' ? 'End Date' : 'Bitirmə tarixi'}
                    currentLabel={cvLanguage === 'english' ? 'Currently ongoing' : 'Davam edir'}
                    cvLanguage={cvLanguage}
                  />

                  <div className="flex items-end">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={Boolean(project.current)}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          updateProjectMultiple(project.id, {
                            current: isChecked,
                            endDate: isChecked ? '' : project.endDate,
                          });
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {cvLanguage === 'english' ? 'Currently ongoing' : 'Davam edir'}
                      </span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {cvLanguage === 'english' ? 'Description' : 'Təsvir'} <span className="text-red-500">*</span>
                    </label>
                    <RichTextEditor
                      value={project.description}
                      onChange={(value) => updateProject(project.id, 'description', value)}
                      placeholder={cvLanguage === 'english' 
                        ? 'Describe the project\'s purpose, technologies used, and results achieved...' 
                        : 'Layihənin məqsədini, istifadə olunan texnologiyaları və əldə olunan nəticələri təsvir edin...'
                      }
                      minHeight="120px"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {normalizedData.length > 0 && (
        <div className="text-center">
          <button
            onClick={addProject}
            className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            {cvLanguage === 'english' ? '+ Add another project' : '+ Başqa layihə əlavə edin'}
          </button>
        </div>
      )}
    </div>
  );
}
