const blogGrid = document.getElementById('blog-grid');
const blogError = document.getElementById('blog-error');
const articleView = document.getElementById('article-view');
const blogList = document.getElementById('blog-list');

function textElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text;
  return element;
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function renderInlineMarkdown(text) {
  const codeTokens = [];
  let html = escapeHtml(text).replace(/`([^`]+)`/g, (_, code) => {
    const token = `@@CODE${codeTokens.length}@@`;
    codeTokens.push(`<code>${code}</code>`);
    return token;
  });

  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g, (_, label, url) => {
    const safeUrl = url.replace(/&amp;/g, '&amp;').replace(/"/g, '&quot;');
    return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return html.replace(/@@CODE(\d+)@@/g, (_, index) => codeTokens[Number(index)]);
}

function renderMarkdown(markdown) {
  const container = document.createElement('div');
  container.className = 'markdown-content';
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  let paragraph = [];
  let list = null;
  let codeLines = null;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const block = document.createElement('p');
    block.innerHTML = paragraph.map(renderInlineMarkdown).join('<br>');
    container.append(block);
    paragraph = [];
  };
  const flushList = () => {
    if (!list) return;
    container.append(list);
    list = null;
  };

  lines.forEach(line => {
    if (line.trim().startsWith('```')) {
      flushParagraph();
      flushList();
      if (codeLines) {
        const pre = document.createElement('pre');
        const code = document.createElement('code');
        code.textContent = codeLines.join('\n');
        pre.append(code);
        container.append(pre);
        codeLines = null;
      } else {
        codeLines = [];
      }
      return;
    }
    if (codeLines) {
      codeLines.push(line);
      return;
    }
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    const listItem = line.match(/^\s*(?:[-*]|\d+\.)\s+(.+)$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = Math.min(heading[1].length + 1, 5);
      const headingElement = document.createElement(`h${level}`);
      headingElement.innerHTML = renderInlineMarkdown(heading[2]);
      container.append(headingElement);
    } else if (listItem) {
      flushParagraph();
      const ordered = /^\s*\d+\./.test(line);
      const tagName = ordered ? 'ol' : 'ul';
      if (list && list.tagName.toLowerCase() !== tagName) flushList();
      if (!list) list = document.createElement(tagName);
      const item = document.createElement('li');
      item.innerHTML = renderInlineMarkdown(listItem[1]);
      list.append(item);
    } else if (!line.trim()) {
      flushParagraph();
      flushList();
    } else {
      flushList();
      paragraph.push(line);
    }
  });
  flushParagraph();
  flushList();
  if (codeLines) {
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.textContent = codeLines.join('\n');
    pre.append(code);
    container.append(pre);
  }
  return container;
}

function showArticle(article, articles) {
  document.querySelector('.page-header').hidden = true;
  blogList.hidden = true;
  articleView.hidden = false;
  articleView.replaceChildren();

  const backLink = textElement('a', 'btn btn-outline', '← Tous les write-ups');
  backLink.href = 'blog.html';
  articleView.append(backLink);
  articleView.append(textElement('p', 'page-kicker article-kicker', article.date || 'Write-up'));
  articleView.append(textElement('h1', 'page-title article-title', article.title));
  articleView.append(textElement('p', 'page-desc article-summary', article.summary));

  const topics = document.createElement('div');
  topics.className = 'tags article-topics';
  (article.topics || []).forEach(topic => topics.append(textElement('span', 'tag', topic)));
  articleView.append(topics);
  articleView.append(renderMarkdown(article.content || ''));

  if (articles.length > 1) {
    const next = document.createElement('div');
    next.className = 'article-navigation';
    const nextArticle = articles[(articles.indexOf(article) + 1) % articles.length];
    const nextLink = textElement('a', 'repo-link', `Write-up suivant : ${nextArticle.title} →`);
    nextLink.href = `blog.html?article=${encodeURIComponent(nextArticle.id)}`;
    next.append(nextLink);
    articleView.append(next);
  }
}

function renderBlog(articles) {
  const articleId = new URLSearchParams(window.location.search).get('article');
  if (articleId) {
    const article = articles.find(item => item.id === articleId);
    if (article) {
      showArticle(article, articles);
      return;
    }
    throw new Error('Ce write-up est introuvable.');
  }

  if (!articles.length) return;
  document.getElementById('blog-empty').hidden = true;
  articles.forEach(article => {
    const card = document.createElement('article');
    card.className = 'project-card card';
    card.append(textElement('p', 'cat', [article.date, ...(article.topics || [])].filter(Boolean).join(' · ')));
    card.append(textElement('h2', '', article.title));
    card.append(textElement('p', '', article.summary));
    const footer = document.createElement('div');
    footer.className = 'foot';
    const link = textElement('a', 'repo-link', 'Lire le write-up ↗');
    link.href = `blog.html?article=${encodeURIComponent(article.id)}`;
    footer.append(link);
    card.append(footer);
    blogGrid.append(card);
  });
}

fetch('data/blog.json')
  .then(response => {
    if (!response.ok) throw new Error(`Chargement impossible (${response.status})`);
    return response.json();
  })
  .then(articles => {
    if (!Array.isArray(articles)) throw new Error('Le fichier des write-ups doit contenir une liste JSON.');
    renderBlog(articles);
  })
  .catch(error => {
    blogError.hidden = false;
    blogError.textContent = `Impossible de charger les write-ups : ${error.message}`;
    document.getElementById('blog-empty').hidden = true;
  });
