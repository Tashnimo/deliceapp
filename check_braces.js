const fs = require('fs');
const content = fs.readFileSync('script.js', 'utf8');
let open = 0;
for (let i = 0; i < content.length; i++) {
    if (content[i] === '{') open++;
    if (content[i] === '}') open--;
    if (open < 0) {
        console.log(`Brace closed at char ${i} but nothing was open!`);
        break;
    }
}
console.log(`Final open count: ${open}`);
