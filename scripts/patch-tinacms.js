const fs = require('fs');
const path = require('path');

const problematicFilePath = path.join(__dirname, '..', 'node_modules', '@tinacms', 'cli', 'dist', 'index.js');

try {
  if (fs.existsSync(problematicFilePath)) {
    let fileContent = fs.readFileSync(problematicFilePath, 'utf8');

    const oldString = '        "process.env": `new Object(${JSON.stringify(publicEnv)})`,';
    const newString = '        "process.env": JSON.stringify(publicEnv),';

    if (fileContent.includes(oldString)) {
      fileContent = fileContent.replace(oldString, newString);
      fs.writeFileSync(problematicFilePath, fileContent, 'utf8');
      console.log('Successfully patched @tinacms/cli to fix Netlify build issue.');
    } else {
      console.log('@tinacms/cli patch already applied or target string not found.');
    }
  } else {
    console.log('Could not find @tinacms/cli file to patch. Skipping.');
  }
} catch (error) {
  console.error('Failed to patch @tinacms/cli:', error);
}