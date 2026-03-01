import express from 'express';
import multer from 'multer';
import path from 'path';
import auth from '../middleware/auth.js';
import * as resumeController from '../controllers/resumeController.js';
import { resumeChat } from '../controllers/chatController.js';

const router = express.Router();

// Multer config for photo upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './temp'),
  filename: (req, file, cb) => cb(null, `photo-${Date.now()}-${file.originalname}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg'];
    allowedTypes.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Only PNG and JPEG images are allowed'));
  }
});

// ✅ Resume Routes (all protected except download/templates)
router.post('/basic', auth, resumeController.basic);
router.post('/education', auth, resumeController.education);
router.post('/experience', auth, resumeController.experience);
router.post('/projects', auth, resumeController.projects);
router.post('/skills', auth, resumeController.skills);
router.post('/certifications', auth, resumeController.certifications);
router.post('/achievements', auth, resumeController.achievements);
router.post('/hobbies', auth, resumeController.hobbies);
router.post('/personal_details', auth, resumeController.personal_details);
router.post('/references', auth, resumeController.references);
router.post('/photo', auth, upload.single('photo'), resumeController.photo);
router.post('/template', auth, resumeController.template);
router.post('/preview', auth, resumeController.preview);
router.get('/html-preview', resumeController.htmlPreview); // Fast HTML preview (handles auth manually)
router.post('/generate', auth, resumeController.generate);
router.post('/generate-fast', auth, resumeController.generateFast); // Fast PDF generation
router.get('/download', resumeController.download); // download is public
router.get('/preview-pdf', resumeController.previewPdf); // preview PDF is public
router.post('/chat', auth, resumeChat);

// ✅ All Available Templates
const availableTemplates = [
  {
    id: 'hiero-standard',
    name: 'Hiero Professional',
    category: 'professional',
    description: 'Clean, professional format optimized for all career levels and industries. ATS-friendly with modern design.',
    preview: '/templates/previews/hiero-standard.png',
    recommended: ['Software Engineer', 'Business Analyst', 'Project Manager']
  },
  {
    id: 'hiero-modern',
    name: 'Hiero Modern',
    category: 'modern',
    description: 'Contemporary design with bold typography and clean sections. Perfect for creative tech roles.',
    preview: '/templates/previews/hiero-modern.png',
    recommended: ['UI/UX Designer', 'Product Manager', 'Marketing Manager']
  },
  {
    id: 'professionalcv',
    name: 'Professional CV',
    category: 'professional',
    description: 'Classic professional format with traditional layout. Ideal for corporate and academic positions.',
    preview: '/templates/previews/professionalcv.png',
    recommended: ['Finance Manager', 'Consultant', 'Executive']
  },
  {
    id: 'modernsimple',
    name: 'Modern Simple',
    category: 'modern',
    description: 'Minimalist design with clear sections and modern typography. Great for tech professionals.',
    preview: '/templates/previews/modernsimple.png',
    recommended: ['Developer', 'Data Scientist', 'DevOps Engineer']
  },
  {
    id: 'awesomecv',
    name: 'Awesome CV',
    category: 'creative',
    description: 'Eye-catching layout with creative elements. Perfect for design and marketing roles.',
    preview: '/templates/previews/awesomecv.png',
    recommended: ['Graphic Designer', 'Content Creator', 'Brand Manager']
  },
  {
    id: 'altacv',
    name: 'AltaCV',
    category: 'modern',
    description: 'Alternative CV format with sidebar layout. Great for showcasing skills and tech stack.',
    preview: '/templates/previews/altacv.png',
    recommended: ['Full Stack Developer', 'Mobile Developer', 'Software Architect']
  },
  {
    id: 'deedycv',
    name: 'Deedy CV',
    category: 'creative',
    description: 'Developer-friendly format popularized by tech professionals. Clean and information-dense.',
    preview: '/templates/previews/deedycv.png',
    recommended: ['Software Engineer', 'Backend Developer', 'ML Engineer']
  },
  {
    id: 'elegant',
    name: 'Elegant',
    category: 'professional',
    description: 'Sophisticated design with elegant typography. Perfect for senior and executive positions.',
    preview: '/templates/previews/elegant.png',
    recommended: ['Senior Manager', 'Director', 'C-Level Executive']
  },
  {
    id: 'functional',
    name: 'Functional',
    category: 'functional',
    description: 'Skills-focused format emphasizing competencies over chronological history. Great for career changers.',
    preview: '/templates/previews/functional.png',
    recommended: ['Career Changer', 'Consultant', 'Freelancer']
  },
  {
    id: 'awesomece',
    name: 'Awesome Creative',
    category: 'creative',
    description: 'Creative edition with unique styling and visual elements. Stand out in creative industries.',
    preview: '/templates/previews/awesomece.png',
    recommended: ['Creative Director', 'Art Director', 'UX Designer']
  },
  {
    id: 'hiero-blue',
    name: 'Hiero Premium Blue',
    category: 'premium',
    description: 'A premium, high-fidelity template with a specialized two-column layout and blue accents. Perfect for Data Scientists and Analytical roles.',
    preview: '/templates/previews/hiero-blue.png',
    recommended: ['Data Scientist', 'Business Analyst', 'Engineer']
  },
  {
    id: 'hiero-signature',
    name: 'Hiero Signature',
    category: 'premium',
    description: 'Modern minimalist A4 portrait with a bold two-column split layout. Features a grayscale aesthetic with bold orange accents and a vertical timeline.',
    preview: '/templates/previews/hiero-signature.png',
    recommended: ['Graphic Designer', 'UI/UX Designer', 'Creative Lead']
  }
];

const templateCategories = {
  professional: 'Professional & Corporate',
  modern: 'Modern & Tech',
  creative: 'Creative & Design',
  functional: 'Skills-Focused'
};

// Get all available templates
router.get('/templates', (req, res) => {
  res.json({
    success: true,
    templates: availableTemplates,
    categories: templateCategories,
    total: availableTemplates.length,
    message: `${availableTemplates.length} templates available`
  });
});

// TODO (Deprecated) Remove this route after frontend migrates fully to /preview-pdf
// router.post('/template-preview', auth, async (req, res) => { ... });

// ✅ Manual Chat Flow (protected)
const chatSteps = [
  { section: 'basic', prompt: 'What is your full name?' },
  { section: 'education', prompt: 'Tell me about your education.' },
  // Add other steps as needed
  { section: 'template', prompt: 'Which template would you like to use?' }
];

const userProgress = {}; // Replace with DB in production

router.post('/manual-chat', auth, async (req, res) => {
  const userId = req.user.id;
  const { message } = req.body;

  if (!userProgress[userId]) userProgress[userId] = { step: 0, data: {} };

  const progress = userProgress[userId];
  const currentStep = chatSteps[progress.step];

  if (currentStep) {
    progress.data[currentStep.section] = message;
    progress.step += 1;
  }

  if (progress.step >= chatSteps.length) {
    // Finished collecting data → generate resume
    const completedData = progress.data;
    delete userProgress[userId];

    const fakeReq = { body: completedData, user: { id: userId } };
    await resumeController.generate(fakeReq, res);
    return;
  }

  const nextStep = chatSteps[progress.step];
  res.json({ message: nextStep.prompt, section: nextStep.section });
});

export default router;