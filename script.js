import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.1/firebase-app.js";
import {
  getDatabase, ref, push, onValue, remove, update
} from "https://www.gstatic.com/firebasejs/10.12.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBrOLGVfadcM0a-uRNiRwjuH1l6ekAXnUg",
  authDomain: "dict-49fa4.firebaseapp.com",
  databaseURL: "https://dict-49fa4-default-rtdb.firebaseio.com",
  projectId: "dict-49fa4",
  storageBucket: "dict-49fa4.appspot.com",
  messagingSenderId: "151088930905",
  appId: "1:151088930905:web:59548718202126b07ad148"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const form = document.getElementById('entryForm');
const toggleFormBtn = document.getElementById('toggleFormBtn');
const addMeaningBtn = document.getElementById('addMeaningBtn');
const meaningsContainer = document.getElementById('meaningsContainer');
const entriesList = document.getElementById('entriesList');

let editingKey = null;

toggleFormBtn.addEventListener('click', () => {
  const isFormVisible = !form.classList.contains('hidden');
  toggleForm(!isFormVisible);
  toggleFormBtn.textContent = isFormVisible ? 'Од сёрмадовкс' : 'Мекев';
});

addMeaningBtn.addEventListener('click', () => addMeaningField());

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const word = document.getElementById('word').value;
  const pronunciation = document.getElementById('pronunciation').value.trim();
  const partOfSpeech = document.getElementById('partOfSpeech').value;
  const etymology = document.getElementById('etymology').value;
  const sources = document.getElementById('source').value
    .split('\n')
    .map(s => s.trim())
    .filter(s => s);

  const definitions = {};
document.querySelectorAll('.meaning-group').forEach((group, index) => {
  const def = group.querySelector('.definition').value.trim();
  if (!def) return;

  const examples = group.querySelector('.examples').value
    .split('\n')
    .map(e => e.trim())
    .filter(e => e);
  const synonyms = group.querySelector('.synonyms').value
    .split(',')
    .map(s => s.trim())
    .filter(s => s);
  const antonyms = group.querySelector('.antonyms').value
    .split(',')
    .map(a => a.trim())
    .filter(a => a);

  definitions[`def_${index + 1}`] = {
    definition: def,
    examples: examples.length > 0 ? examples : ['?'],
    synonyms: synonyms.length > 0 ? synonyms : ['?'],
    antonyms: antonyms.length > 0 ? antonyms : ['?'],
  };
});

  const entryData = {
    word,
    partOfSpeech,
    pronunciation,
    etymology,
    definitions,
    sources,
  };

  console.log('Saving entry:', entryData);

  try {
    if (editingKey) {
      await update(ref(db, `dictionary/${editingKey}`), entryData);
      renderEntries();
    } else {
      await push(ref(db, 'dictionary'), entryData);
      renderEntries();
    }

    form.reset();
    meaningsContainer.innerHTML = '';
    addMeaningField();
    toggleForm(false);
    toggleFormBtn.textContent = 'Од сёрмадовкс';
  } catch (err) {
    alert('Error saving entry: ' + err.message);
  }
});

function addMeaningField(def = '', ex = [], syn = '', ant = '') {
  const div = document.createElement('div');
  div.className = 'meaning-group';

  const defInput = document.createElement('textarea');
  defInput.className = 'definition';
  defInput.placeholder = 'Валонь смусть';
  defInput.required = true;
  defInput.value = def;

  const exInput = document.createElement('textarea');
  exInput.className = 'examples';
  exInput.placeholder = 'Невтевкст';
  exInput.value = ex.join(', ');

  const synInput = document.createElement('textarea');
  synInput.className = 'synonyms';
  synInput.placeholder = 'Синонимт';
  synInput.value = syn || '';

  const antInput = document.createElement('textarea');
  antInput.className = 'antonyms';
  antInput.placeholder = 'Антонимт';
  antInput.value = ant || '';

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.textContent = 'Смустень нардамо';
  deleteBtn.className = 'delete-meaning-btn';
  deleteBtn.addEventListener('click', () => deleteMeaningField(div));

  div.appendChild(defInput);
  div.appendChild(exInput);
  div.appendChild(synInput);
  div.appendChild(antInput);
  div.appendChild(deleteBtn);
  meaningsContainer.appendChild(div);
}

function deleteMeaningField(meaningGroup) {
  if (meaningsContainer.children.length > 1) {
    meaningGroup.remove();
  } else {
    alert('Ялатеке вейке смустентень лиядома сёрмадовксос.');
  }
}

function renderEntries() {
  const dictionaryRef = ref(db, 'dictionary');

  document.getElementById('loadingMessage').classList.remove('hidden');
  document.getElementById('emptyMessage').classList.add('hidden');
  entriesList.innerHTML = '';

  onValue(dictionaryRef, (snapshot) => {
    const entries = [];
    snapshot.forEach((child) => {
      const entry = child.val();
      entries.push({ key: child.key, ...entry });
    });

    entries.sort((a, b) => a.word.localeCompare(b.word));

    // Piilota latausviesti
    document.getElementById('loadingMessage').classList.add('hidden');

    if (entries.length === 0) {
      document.getElementById('emptyMessage').classList.remove('hidden');
    } else {
      document.getElementById('emptyMessage').classList.add('hidden');
    }

    displayEntries(entries);

    document.getElementById('searchInput').addEventListener('input', (e) => {
      const searchValue = e.target.value.toLowerCase();
      const filtered = entries
        .filter(ent => ent.word.toLowerCase().includes(searchValue))
        .sort((a, b) => a.word.localeCompare(b.word));

      entriesList.innerHTML = '';

      if (filtered.length === 0) {
        document.getElementById('emptyMessage').classList.remove('hidden');
      } else {
        document.getElementById('emptyMessage').classList.add('hidden');
        displayEntries(filtered);
      }
    });
  });
}

function displayEntries(entries) {
  console.log('Displaying entries:', entries);

  entriesList.innerHTML = '';

  entries.forEach(entry => {
    const li = document.createElement('li');
    const articleId = `article-${entry.key}`;
    li.innerHTML = `
      <div class="entry-header" onclick="toggleArticle('${articleId}')">
        <span>${entry.word}</span>

        <span class="part-of-speech">${entry.partOfSpeech}</span>
      </div>
      <div id="${articleId}" class="hidden entry-article">

      ${entry.pronunciation
  ? `<span class="pronunciation">${entry.pronunciation
      .split(',')
      .map(p => `/${p.trim()}/`)
      .join(', ')}</span>`
  : ''}
      
        ${Object.values(entry.definitions).map((d, index, arr) => {
  const hasExamples = d.examples && d.examples[0] !== '?';
  const definitionClass = hasExamples ? 'entry-definition' : 'entry-definition compact';
  return `
  
    <div class="${definitionClass}">
      ${arr.length > 1 ? `<strong>${index + 1}.</strong> ` : ''}${d.definition}
      <div class="entry-examples">
        ${hasExamples 
          ? d.examples.map(ex => `<em>${ex}</em>`).join('<br>') 
          : ''}
      </div>
      ${d.synonyms[0] === '?' 
        ? '' 
        : `<div class="entry-margin-top"><strong>= </strong> ${d.synonyms.join(', ')}</div>`}
      ${d.antonyms[0] === '?' 
        ? '' 
        : `<div><strong>≠ </strong> ${d.antonyms.join(', ')}</div>`}
    </div>
  `;
}).join('')}
        
        <hr>
    ${entry.etymology && entry.etymology.trim() !== '' ? `
      <div class="entry-etymology">
        Валонть этимологиязо:
        <span class="etymology-text">${entry.etymology}</span>
      </div>
    ` : `
      <div class="entry-etymology">
        Валонть этимологиязо: <span class="etymology-text">?</span>
      </div>
    `}

        <hr>
        <div class="entry-margin-top">
          Лисьмапрят:
          <ul class="entry-sources">
            ${(Array.isArray(entry.sources) ? entry.sources : [entry.source || '']).map(src => `<li>${src}</li>`).join('')}
          </ul>
        </div>

        <div class="entry-margin-top">
          <button onclick="editEntry('${entry.key}')">Витема</button>
          <!-- <button onclick="deleteEntry('${entry.key}')">Нардамо</button> -->
          <button onclick="alert('Функциясь таго-зярс лоткавтозь.')" style="cursor: pointer;">Нардамо</button>
        </div>
      </div>
    `;
    
    entriesList.appendChild(li);
  });
}

window.toggleArticle = function (id) {
  const el = document.getElementById(id);
  el.classList.toggle('hidden');
};

function toggleForm(show) {
  form.classList.toggle('hidden', !show);
  document.getElementById('entriesSection').classList.toggle('hidden', show);

  if (!show) {
    form.reset();
    meaningsContainer.innerHTML = '';
    addMeaningField();
    editingKey = null;
  } else if (meaningsContainer.children.length === 0) {
    addMeaningField();
  }
}

window.deleteEntry = function (key) {
  const confirmDelete = confirm('Кеместэ ули мелеть нардамс те сёрмадовксонть?');
  if (confirmDelete) {
    remove(ref(db, `dictionary/${key}`));
  }
};

window.editEntry = function (key) {
  const entryRef = ref(db, `dictionary/${key}`);
  onValue(entryRef, (snapshot) => {
    const entry = snapshot.val();
    document.getElementById('word').value = entry.word;
    document.getElementById('pronunciation').value = entry.pronunciation || '';
    document.getElementById('partOfSpeech').value = entry.partOfSpeech;
    document.getElementById('etymology').value = entry.etymology.trim() !== '?' ? entry.etymology : '';
    document.getElementById('source').value = (entry.sources || []).join('\n');
    meaningsContainer.innerHTML = '';

    Object.entries(entry.definitions).forEach(([key, def]) => {
  addMeaningField(
    def.definition || '',
    def.examples && def.examples[0] !== '?' ? def.examples : [],
    def.synonyms && def.synonyms[0] !== '?' ? def.synonyms.join(', ') : '',
    def.antonyms && def.antonyms[0] !== '?' ? def.antonyms.join(', ') : ''
  );
});

    toggleForm(true);
    editingKey = key;

  toggleFormBtn.textContent = 'Мекев';
  }, {
    onlyOnce: true
  });
};

renderEntries();
addMeaningField();
