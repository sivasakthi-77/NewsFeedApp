/* NewsWave — Vanilla JS News Feed
   IMPORTANT: This example embeds your API key directly for quick local testing.
   Exposing API keys in client-side code is unsafe for production. For production,
   proxy requests through a server and keep the key secret.
*/

const API_KEY = "88974f8f1e2c4338b1eb5139e6c0693a"; 
const API_BASE = "https://newsapi.org/v2";
const DEFAULT_COUNTRY = "us";
const PAGE_SIZE = 20;

const categories = ["general","technology","sports","business","health","entertainment","science"];

const elements = {
  newsGrid: document.getElementById('newsGrid'),
  status: document.getElementById('status'),
  statusText: document.getElementById('statusText'),
  loader: document.getElementById('loader'),
  categoriesContainer: document.getElementById('categories'),
  searchInput: document.getElementById('searchInput'),
  yearEl: document.getElementById('year')
};

let activeCategory = "general";

function setYear(){ 
  elements.yearEl.textContent = new Date().getFullYear(); 
}
setYear();

function buildCategories(){
  categories.forEach(cat=>{
    const btn = document.createElement('button');
    btn.className = 'cat-btn' + (cat===activeCategory ? ' active':'');
    btn.textContent = cat[0].toUpperCase() + cat.slice(1);
    btn.dataset.cat = cat;
    btn.addEventListener('click', onCategoryClick);
    elements.categoriesContainer.appendChild(btn);
  });
}
buildCategories();

function setStatus(text,showLoader=false){
  if(!text){ 
    elements.status.classList.add('hidden'); 
    return; 
  }
  elements.status.classList.remove('hidden');
  elements.statusText.textContent = text;
  if(showLoader){ 
    elements.loader.classList.remove('hidden'); 
  } else { 
    elements.loader.classList.add('hidden'); 
  }
}

function clearNews(){ 
  elements.newsGrid.innerHTML = ''; 
}

function placeholderImage(){
  return (
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="450">
        <rect width="100%" height="100%" fill="#0b1220"/>
        <text x="50%" y="50%" fill="#7c8ea3" font-size="24" text-anchor="middle" alignment-baseline="middle">
          No image
        </text>
      </svg>
    `)
  );
}

async function fetchNews({category=null, query=null}){
  try{
    setStatus('Loading news...', true);
    clearNews();

    let url;
    if(query && query.trim().length>0){
      url = `${API_BASE}/everything?q=${encodeURIComponent(query)}&pageSize=${PAGE_SIZE}&language=en&apiKey=${API_KEY}`;
    } else {
      const cat = category || activeCategory || 'general';
      url = `${API_BASE}/top-headlines?country=${DEFAULT_COUNTRY}&category=${encodeURIComponent(cat)}&pageSize=${PAGE_SIZE}&apiKey=${API_KEY}`;
    }

    const resp = await fetch(url);
    if(!resp.ok){
      const text = await resp.text();
      throw new Error(`Network error: ${resp.status} ${resp.statusText} - ${text}`);
    }
    const data = await resp.json();
    if(data.status !== 'ok'){
      throw new Error(data.message || 'API returned an error');
    }

    const articles = data.articles || [];
    if(articles.length === 0){
      setStatus('No news found. Try another keyword or category.', false);
      return;
    }

    renderArticles(articles);
    setStatus(null);
  } catch(err){
    console.error(err);
    setStatus('Failed to load news. ' + (err.message || ''), false);
  }
}

function renderArticles(articles){
  clearNews();
  const frag = document.createDocumentFragment();
  articles.forEach(a=>{
    const card = document.createElement('article');
    card.className = 'card';
      
    const img = document.createElement('img');
    img.src = a.urlToImage || placeholderImage();
    img.alt = a.title || 'News image';

    const content = document.createElement('div');
    content.className = 'content';

    const h3 = document.createElement('h3');
    h3.textContent = a.title || 'Untitled';

    const p = document.createElement('p');
    p.textContent = a.description || (a.content ? a.content.slice(0,160)+'...' : 'No description available.');

    const meta = document.createElement('div');
    meta.className = 'meta';

    const source = document.createElement('small');
    source.textContent = a.source && a.source.name ? a.source.name : '';

    const readBtn = document.createElement('button');
    readBtn.className = 'btn-read';
    readBtn.textContent = 'Read More';
    readBtn.addEventListener('click', ()=> window.open(a.url,'_blank'));

    meta.appendChild(source);
    meta.appendChild(readBtn);

    content.appendChild(h3);
    content.appendChild(p);
    content.appendChild(meta);

    card.appendChild(img);
    card.appendChild(content);

    frag.appendChild(card);
  });
  elements.newsGrid.appendChild(frag);
}

function onCategoryClick(e){
  const btn = e.currentTarget;
  const cat = btn.dataset.cat;
  if(!cat) return;
  activeCategory = cat;
  document.querySelectorAll('.cat-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  elements.searchInput.value = '';
  fetchNews({category:cat});
}

elements.searchInput.addEventListener('keydown',(e)=>{
  if(e.key === 'Enter'){
    const q = elements.searchInput.value.trim();
    if(q.length === 0) return;
    document.querySelectorAll('.cat-btn').forEach(b=>b.classList.remove('active'));
    setStatus(`Searching for “${q}”...`, true);
    fetchNews({query:q});
  }
});

// Initial dark mode only — no toggles, no storage
document.documentElement.classList.remove('light');

// initial load
fetchNews({category: activeCategory});
