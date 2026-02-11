// templates/index.js
import { generateClassicTemplate } from './classic.js';
import { generateMinimalTemplate } from './minimal.js';
import { generateModernProTemplate } from './modernPro.js';
import { generateRishiTemplate } from './rishiTemplate.js';
import { generateHemanthTemplate } from './hemanthTemplate.js';
import { renderPriyaAnalyticsTemplate } from './priyaAnalyticsTemplate.js';
import { renderHieroEliteTemplate } from './hieroEliteTemplate.js';
import { generateHieroBlueTemplate } from './hieroBlueTemplate.js';

export function listTemplates() {
  return [
    { id: 'classic', name: 'Classic Professional' },
    { id: 'minimal', name: 'Minimal' },
    { id: 'modern-pro', name: 'Modern Professional' },
    { id: 'rishi', name: 'Rishi Tech Modern' },
    { id: 'hemanth', name: 'Hemanth Dark Creative' },
    { id: 'priya-analytics', name: 'Priya Analytics' },
    { id: 'hiero-elite', name: 'Hiero Elite' },
    { id: 'hiero-blue', name: 'Hiero Premium Blue' },
  ];
}

export function generateTemplateHTML(templateId, data = {}) {
  switch ((templateId || '').toLowerCase()) {
    case 'minimal':
      return generateMinimalTemplate(data);
    case 'modern-pro':
    case 'modernpro':
      return generateModernProTemplate(data);
    case 'rishi':
      return generateRishiTemplate(data);
    case 'hemanth':
      return generateHemanthTemplate(data);
    case 'priya-analytics':
      return renderPriyaAnalyticsTemplate(data);
    case 'hiero-elite':
      return renderHieroEliteTemplate(data);
    case 'hiero-blue':
      return generateHieroBlueTemplate(data);
    case 'classic':
    default:
      return generateClassicTemplate(data);
  }
}
