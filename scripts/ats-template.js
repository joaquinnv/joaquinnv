'use strict';
/**
 * ATS-friendly CV template: single column, plain semantic HTML, standard section
 * headings, no icons/pills/photo. Content comes from i18n/{en,es}.json so the
 * ATS PDF never drifts from the site/CV.
 */
const fs = require('fs');
const path = require('path');

const CONTACT = {
  email: 'nvjoaquin@gmail.com',
  linkedin: {
    href: 'https://www.linkedin.com/in/joaqu%C3%ADn-noguera-velazquez-043234138',
    text: 'linkedin.com/in/joaquín-noguera-velazquez-043234138',
  },
  github: { href: 'https://github.com/joaquinnv', text: 'github.com/joaquinnv' },
  portfolio: { href: 'https://joaquinnv.github.io/joaquinnv/', text: 'joaquinnv.github.io/joaquinnv' },
};

const SUMMARY_LABEL = { en: 'Professional Summary', es: 'Resumen profesional' };

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Escapes text and keeps hyphenated words (US-based, data-driven, Tier-3) on one
 * line. When Chromium breaks a line at a hyphen, PDF text extraction drops the
 * hyphen and glues the halves ("USbased"), so ATS keyword matching misses them.
 */
const text = (s) => esc(s).replace(/(\S+-\S+)/g, '<span class="nb">$1</span>');

function loadLang(lang) {
  const file = path.resolve(__dirname, '..', 'i18n', `${lang}.json`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

const CSS = `
  @page { size: A4; margin: 10mm 15mm; }
  * { box-sizing: border-box; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 9.4pt; line-height: 1.3; color: #111; }
  h1 { font-size: 20pt; margin: 0 0 1mm; letter-spacing: 0.2pt; }
  .headline { font-size: 11pt; font-weight: bold; margin: 0 0 2mm; }
  .contact { margin: 0 0 0.8mm; font-size: 9.2pt; }
  .contact a { color: #111; text-decoration: none; }
  h2 { font-size: 10.6pt; text-transform: uppercase; letter-spacing: 0.6pt; margin: 3.8mm 0 1.5mm; padding-bottom: 0.6mm; border-bottom: 0.7pt solid #444; }
  p { margin: 0 0 1.2mm; }
  .job { margin: 0 0 2.6mm; page-break-inside: avoid; }
  .job-title { margin: 0; }
  .job-dates { margin: 0 0 0.8mm; color: #333; }
  ul { margin: 0; padding-left: 4.6mm; }
  li { margin: 0 0 0.5mm; }
  .skills p { margin: 0 0 0.9mm; }
  .nb { white-space: nowrap; }
`;

function buildAtsHtml(lang) {
  const d = loadLang(lang);
  const cv = d.cv;
  const sectionTitles = cv.sections;

  const jobs = cv.roles
    .map(
      (r) => `
    <div class="job">
      <p class="job-title"><strong>${esc(r.title)}</strong>, ${esc(r.company)} — ${esc(r.location)}</p>
      <p class="job-dates">${esc(r.period)}</p>
      <ul>
        ${r.bullets.map((b) => `<li>${text(b)}</li>`).join('\n        ')}
      </ul>
    </div>`,
    )
    .join('\n');

  const skills = d.skills.categories
    .map((c) => `<p><strong>${esc(c.title)}:</strong> ${text(c.items.join(', '))}</p>`)
    .join('\n    ');

  const education = cv.education
    .map((e) => `<p><strong>${esc(e.degree)}</strong>, ${esc(e.school)} (${esc(e.period)})</p>`)
    .join('\n    ');

  const languages = cv.languages_list.map((l) => `${esc(l.name)}: ${esc(l.level)}`).join(' | ');

  const link = (o) => `<a href="${esc(o.href)}">${esc(o.text)}</a>`;

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <title>${esc(cv.title)} — CV</title>
  <style>${CSS}</style>
</head>
<body>
  <h1>${esc(cv.title)}</h1>
  <p class="headline">${esc(cv.subtitle)}</p>
  <p class="contact">${esc(CONTACT.email)} | ${esc(cv.location)}</p>
  <p class="contact">${link(CONTACT.linkedin)} | ${link(CONTACT.github)} | ${link(CONTACT.portfolio)}</p>

  <h2>${esc(SUMMARY_LABEL[lang])}</h2>
  <p>${text(cv.summary)}</p>

  <h2>${esc(sectionTitles.experience)}</h2>
  ${jobs}

  <h2>${esc(sectionTitles.skills)}</h2>
  <div class="skills">
    ${skills}
  </div>

  <h2>${esc(sectionTitles.education)}</h2>
  ${education}

  <h2>${esc(sectionTitles.languages)}</h2>
  <p>${languages}</p>
</body>
</html>
`;
}

module.exports = { buildAtsHtml };
