// testModule.js
    const resumeController = require('./controllers/resumeController');

    console.log('resumeController import in testModule:', {
      login: typeof resumeController.login,
      basic: typeof resumeController.basic,
      education: typeof resumeController.education,
      projects: typeof resumeController.projects,
      skills: typeof resumeController.skills,
      certifications: typeof resumeController.certifications,
      achievements: typeof resumeController.achievements,
      hobbies: typeof resumeController.hobbies,
      personal_details: typeof resumeController.personal_details,
      references: typeof resumeController.references,
      photo: typeof resumeController.photo,
      template: typeof resumeController.template,
      preview: typeof resumeController.preview,
      generate: typeof resumeController.generate,
      download: typeof resumeController.download
    });

    // Clear module cache
    delete require.cache[require.resolve('./controllers/resumeController')];
    const resumeControllerAfterClear = require('./controllers/resumeController');

    console.log('resumeController import after cache clear:', {
      login: typeof resumeControllerAfterClear.login,
      basic: typeof resumeControllerAfterClear.basic,
      education: typeof resumeControllerAfterClear.education,
      projects: typeof resumeControllerAfterClear.projects,
      skills: typeof resumeControllerAfterClear.skills,
      certifications: typeof resumeControllerAfterClear.certifications,
      achievements: typeof resumeControllerAfterClear.achievements,
      hobbies: typeof resumeControllerAfterClear.hobbies,
      personal_details: typeof resumeControllerAfterClear.personal_details,
      references: typeof resumeControllerAfterClear.references,
      photo: typeof resumeControllerAfterClear.photo,
      template: typeof resumeControllerAfterClear.template,
      preview: typeof resumeControllerAfterClear.preview,
      generate: typeof resumeControllerAfterClear.generate,
      download: typeof resumeControllerAfterClear.download
    });