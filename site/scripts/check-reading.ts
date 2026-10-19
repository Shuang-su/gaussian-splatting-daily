import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { buildArchive, ROOT } from "../lib/content";
import { parseMarkdown } from "../lib/markdown";
import { editorialWarnings } from "../lib/editorial-lint";
const archive = await buildArchive();
const warnings = ["docs/reading", "docs/articles", "docs/weekly"].flatMap(directory => fs.existsSync(path.join(ROOT, directory)) ? fs.readdirSync(path.join(ROOT, directory)).filter(file => !file.startsWith(".") && file.endsWith(".md")).flatMap(file => editorialWarnings(parseMarkdown(matter(fs.readFileSync(path.join(ROOT, directory, file), "utf8")).content)).map(warning => ({ file: `${directory}/${file}`, ...warning }))) : []);
console.log(JSON.stringify({ valid: true, readingEditions: archive.articles.filter(article => article.readingEdition).length, independentArticles: archive.editorials.length, weeklyEditions: archive.weeklyEditorials.length, warnings }, null, 2));
