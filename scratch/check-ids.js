const fs = require('fs');
const content = fs.readFileSync('project.html', 'utf8');
const ids = ['hero-tags', 'stat-grid', 'section-overview', 'about-txt', 'obj-list', 'complete-project-btn'];
ids.forEach(id => {
  const count = content.split('id="' + id + '"').length - 1;
  console.log(id, count > 0);
});
