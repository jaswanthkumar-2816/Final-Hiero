const fs = require('fs');
const path = require('path');

const targetDirs = [
  path.resolve(__dirname, '.'),
  path.resolve(__dirname, 'hiero-prototype/jss/hiero/hiero-last/public')
];

const logos = {
  // Oracle: Red circle with white capsule/pill shape (matching uploaded image)
  'oracle.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <circle cx="100" cy="100" r="98" fill="#C74634"/>
  <rect x="44" y="72" width="112" height="56" rx="28" ry="28" fill="none" stroke="#FFFFFF" stroke-width="22"/>
</svg>`,

  // Deloitte: Black circle, large bold white D, green dot (matching uploaded image)
  'deloitte.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <circle cx="100" cy="100" r="98" fill="#000000"/>
  <text x="32" y="148" font-family="Arial Black, Helvetica Neue, sans-serif" font-size="140" font-weight="900" fill="#FFFFFF">D</text>
  <circle cx="164" cy="142" r="14" fill="#86BC25"/>
</svg>`,

  // SAP: White circle with blue trapezoid and SAP text (matching uploaded image)
  'sap.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <circle cx="100" cy="100" r="98" fill="#FFFFFF" stroke="#CCCCCC" stroke-width="2"/>
  <defs>
    <linearGradient id="sapBlue" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#00A1E0"/>
      <stop offset="100%" stop-color="#005EA6"/>
    </linearGradient>
    <clipPath id="circ"><circle cx="100" cy="100" r="96"/></clipPath>
  </defs>
  <polygon points="22,68 178,68 148,140 22,140" fill="url(#sapBlue)" clip-path="url(#circ)"/>
  <text x="34" y="128" font-family="Arial Black, Impact, sans-serif" font-size="58" font-weight="900" fill="#FFFFFF" clip-path="url(#circ)">SAP</text>
</svg>`,

  // IBM: Blue 8-stripe IBM letters on white (matching uploaded image — clean wide layout)
  'ibm.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 180">
  <rect width="400" height="180" fill="white"/>
  <g fill="#006699">
    <!-- I -->
    <rect x="10" y="20" width="62" height="14"/>
    <rect x="10" y="42" width="62" height="14"/>
    <rect x="30" y="64" width="22" height="14"/>
    <rect x="30" y="86" width="22" height="14"/>
    <rect x="30" y="108" width="22" height="14"/>
    <rect x="10" y="130" width="62" height="14"/>
    <rect x="10" y="152" width="62" height="14"/>
    <!-- B -->
    <rect x="100" y="20" width="62" height="14"/>
    <rect x="100" y="42" width="80" height="14"/>
    <rect x="100" y="64" width="22" height="14"/>
    <rect x="155" y="64" width="22" height="14"/>
    <rect x="100" y="86" width="72" height="14"/>
    <rect x="100" y="108" width="22" height="14"/>
    <rect x="158" y="108" width="22" height="14"/>
    <rect x="100" y="130" width="80" height="14"/>
    <rect x="100" y="152" width="62" height="14"/>
    <!-- M -->
    <rect x="200" y="20" width="62" height="14"/>
    <rect x="200" y="42" width="62" height="14"/>
    <rect x="200" y="64" width="22" height="14"/>
    <rect x="220" y="64" width="22" height="14"/>
    <rect x="240" y="64" width="22" height="14"/>
    <rect x="200" y="86" width="22" height="14"/>
    <rect x="240" y="86" width="22" height="14"/>
    <rect x="200" y="108" width="22" height="14"/>
    <rect x="240" y="108" width="22" height="14"/>
    <rect x="200" y="130" width="62" height="14"/>
    <rect x="200" y="152" width="62" height="14"/>
    <!-- second leg of M -->
    <rect x="310" y="20" width="62" height="14"/>
    <rect x="310" y="42" width="62" height="14"/>
    <rect x="310" y="64" width="22" height="14"/>
    <rect x="350" y="64" width="22" height="14"/>
    <rect x="310" y="86" width="22" height="14"/>
    <rect x="350" y="86" width="22" height="14"/>
    <rect x="310" y="108" width="22" height="14"/>
    <rect x="350" y="108" width="22" height="14"/>
    <rect x="310" y="130" width="62" height="14"/>
    <rect x="310" y="152" width="62" height="14"/>
  </g>
</svg>`,

  // Accenture: White circle with purple > chevron (matching uploaded image)
  'accenture.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <circle cx="100" cy="100" r="98" fill="#FFFFFF" stroke="#CCCCCC" stroke-width="2"/>
  <polygon points="62,42 126,100 62,158 90,158 154,100 90,42" fill="#A100FF"/>
</svg>`
};

targetDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  Object.entries(logos).forEach(([filename, content]) => {
    const fullPath = path.join(dir, filename);
    fs.writeFileSync(fullPath, content.trim(), 'utf8');
    console.log('Wrote ' + fullPath);
  });
});
console.log('Done!');
