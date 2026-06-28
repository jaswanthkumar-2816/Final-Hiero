const sanitize = str => str;
const name = "Develop a Retrieval-Augmented Generation (RAG) system for a question-answering chatbot";
const html = `
          <a href="#" class="project-card" onclick="window.location.href='project.html?name=' + encodeURIComponent('${sanitize(name).replace(/'/g, '\\'')}'); return false;">
`;
console.log("HTML:", html);

// Simulate browser parsing the onclick script:
const onclickScript = html.match(/onclick="([^"]+)"/)[1];
console.log("onclick JS script string:", onclickScript);
try {
  // Can we parse this as a function?
  new Function(onclickScript);
  console.log("Valid JS");
} catch(e) {
  console.error("Syntax Error in onclick!", e);
}
