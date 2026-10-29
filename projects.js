const projectGrid = document.getElementById('project-grid');
const filterContainer = document.getElementById('filters');
const emptyMessage = document.getElementById('empty-msg');
const projectError = document.getElementById('project-error');

const topicLabels = {
  soc: 'SOC',
  malware: 'Malware Analysis',
  lab: 'Lab',
  outils: 'Outils',
  recherche: 'Recherche',
  systemes: 'Systèmes'
};

function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text;
  return element;
}

function applyProjectFilter(topic) {
  let visibleCount = 0;
  projectGrid.querySelectorAll('.project-card').forEach(card => {
    const matches = topic === 'all' || card.dataset.topics.split(' ').includes(topic);
    card.hidden = !matches;
    if (matches) visibleCount++;
  });
  emptyMessage.hidden = visibleCount > 0;
}

function renderFilters(projects) {
  const topics = [...new Set(projects.flatMap(project => project.topics || []))].sort();
  filterContainer.replaceChildren();

  const allButton = document.createElement('button');
  allButton.type = 'button';
  allButton.className = 'chip active';
  allButton.dataset.filter = 'all';
  allButton.append('Tous ');
  allButton.append(createTextElement('span', 'count', `(${projects.length})`));
  filterContainer.append(allButton);

  topics.forEach(topic => {
    const button = createTextElement('button', 'chip', topicLabels[topic] || topic);
    button.type = 'button';
    button.dataset.filter = topic;
    filterContainer.append(button);
  });

  filterContainer.addEventListener('click', event => {
    const button = event.target.closest('button[data-filter]');
    if (!button) return;
    filterContainer.querySelectorAll('.chip').forEach(chip => chip.classList.remove('active'));
    button.classList.add('active');
    applyProjectFilter(button.dataset.filter);
  });
}

function renderProjects(projects) {
  projectGrid.replaceChildren();
  projects.forEach(project => {
    const card = document.createElement('article');
    card.className = 'project-card card';
    card.dataset.topics = (project.topics || []).join(' ');
    card.append(createTextElement('p', 'cat', project.category));
    card.append(createTextElement('h3', '', project.title));
    card.append(createTextElement('p', '', project.description));

    const footer = document.createElement('div');
    footer.className = 'foot';
    const tags = document.createElement('div');
    tags.className = 'tags';
    (project.technologies || []).forEach(technology => {
      tags.append(createTextElement('span', 'tag', technology));
    });
    footer.append(tags);

    const projectUrl = typeof project.url === 'string' ? project.url.trim() : '';
    if (/^https?:\/\/\S+$/i.test(projectUrl)) {
      const link = createTextElement('a', 'repo-link', 'Voir le repo ↗');
      link.href = projectUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      footer.append(link);
    } else if (projectUrl) {
      projectError.hidden = false;
      projectError.textContent = `Le lien du projet « ${project.title} » n’a pas été affiché car son URL n’est pas valide.`;
    }

    card.append(footer);
    projectGrid.append(card);
  });
  applyProjectFilter('all');
}

fetch('data/projects.json')
  .then(response => {
    if (!response.ok) throw new Error(`Chargement impossible (${response.status})`);
    return response.json();
  })
  .then(projects => {
    if (!Array.isArray(projects)) throw new Error('Le fichier des projets doit contenir une liste JSON.');
    renderProjects(projects);
    renderFilters(projects);
  })
  .catch(error => {
    projectError.hidden = false;
    projectError.textContent = `Impossible de charger les projets : ${error.message}`;
    emptyMessage.hidden = true;
  });
