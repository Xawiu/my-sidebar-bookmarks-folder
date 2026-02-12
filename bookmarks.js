function localizeHtmlPage() {
    const objects = document.querySelectorAll('[data-i18n]');
    for (const obj of objects) {
        const key = obj.getAttribute('data-i18n');
        const translation = browser.i18n.getMessage(key);
        if (translation) {
            obj.textContent = translation;
        }
    }
}

let currentFolderId = null;
const defaultIcon = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><g stroke='%23888' stroke-width='1' fill='none'><circle cx='8' cy='8' r='7'/><ellipse cx='8' cy='8' rx='3' ry='7'/><path d='M1 8h14'/></g></svg>";

const urlParams = new URLSearchParams(window.location.search);
const viewType = urlParams.get('type');

let storageKey; 

if (viewType === 'sidebar') {
    document.body.style.width = "100%";
    storageKey = 'sideId';
} else {
    document.body.style.width = "450px";
    storageKey = 'popupId';
}

async function loadBookmarks(folderId = null) {
  const container = document.getElementById('bookmark-list');
  if (!container) return;

  try {
    const data = await browser.storage.local.get('setting');
    const settings = data.setting || {};

    if (settings.isPadded) {
        document.body.classList.add('comfort');
    } else {
        document.body.classList.remove('comfort');
    }

    const rootFolderId = settings[storageKey] || 'toolbar_____';

    if (!folderId) folderId = rootFolderId;
    currentFolderId = folderId;

    const bookmarks = await browser.bookmarks.getChildren(folderId);
    container.innerHTML = '';

    if (folderId !== rootFolderId) {
      const parentInfo = await browser.bookmarks.get(folderId);
      const parentId = parentInfo[0].parentId;

      const backBtn = document.createElement('div');
      backBtn.className = 'bookmark back-button';
      
      const img = document.createElement('img');
      img.className = 'favicon';
      img.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><path fill='none' stroke='%23888' stroke-width='1' d='M11 2L5 8l6 6'/></svg>";
      
      const span = document.createElement('span');
      span.className = 'bookmark-text';
      span.textContent = browser.i18n.getMessage("backButton");
      
      backBtn.appendChild(img);
      backBtn.appendChild(span);
      backBtn.onclick = () => loadBookmarks(parentId);
      container.appendChild(backBtn);
    }

    bookmarks.forEach(bm => {
      // Ignore system bookmarks like 'place:' (Smart Bookmarks)
      if (bm.url && bm.url.startsWith('place:')) {
        return;
      }
      if (bm.type === 'separator') {
        const separatorContainer = document.createElement('div');
        separatorContainer.className = 'separator-container';
        
        const separatorLine = document.createElement('div');
        separatorLine.className = 'separator-line';
        
        separatorContainer.appendChild(separatorLine);
        container.appendChild(separatorContainer);
        return;
      }

      const isFolder = !bm.url;
      const el = document.createElement(isFolder ? 'div' : 'a');
      el.className = 'bookmark' + (isFolder ? '' : ' is-link');
      el.title = isFolder ? (bm.title || browser.i18n.getMessage("folderText")) : bm.url;
      
      const img = document.createElement('img');
      img.className = 'favicon';
      
      if (isFolder) {
        img.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><path fill='none' stroke='%23888' stroke-width='1.2' d='M1.5 3.5a1 1 0 0 1 1-1h3.5l2 2h6.5a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-12a1 1 0 0 1-1-1z'/></svg>";

        el.onclick = () => loadBookmarks(bm.id);
      } else {
        // Block "Illegal URL"
        el.href = bm.url.startsWith('javascript:') ? "#" : bm.url;

        try {
          const urlObj = new URL(bm.url);
          img.src = urlObj.protocol.startsWith('http') ? `https://icons.duckduckgo.com/ip3/${urlObj.hostname}.ico` : defaultIcon;
        } catch (e) {
          img.src = defaultIcon;
        }
        img.onerror = () => { img.src = defaultIcon; };

        el.addEventListener('click', async (e) => {
          e.preventDefault();
          e.stopPropagation();

          if (bm.url.startsWith('javascript:')) {
            const rawCode = bm.url.replace(/^javascript:/, '');
            const codeToRun = decodeURIComponent(rawCode);
            
            const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
            if (tab?.id) {
              browser.scripting.executeScript({
                target: { tabId: tab.id },
                world: "MAIN",
                injectImmediately: true,
                func: (code) => {
                  const s = document.createElement('script');
                  s.textContent = code;
                  document.documentElement.appendChild(s);
                  s.remove();
                },
                args: [codeToRun]
              }).catch(err => console.error("Scripting error:", err));
            }
            return;
          }

          // NORMAL URL's
          if (e.shiftKey) {
            browser.windows.create({ url: bm.url });
          } else if (e.button === 1 || e.ctrlKey || e.metaKey) {
            browser.tabs.create({ url: bm.url });
          } else {
            const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
            if (tab) browser.tabs.update(tab.id, { url: bm.url });
          }
        });
      }

      const span = document.createElement('span');
      span.className = 'bookmark-text';
      span.textContent = bm.title || (isFolder ? browser.i18n.getMessage("folderText") : browser.i18n.getMessage("untitled"));

      el.appendChild(img);
      el.appendChild(span);
      container.appendChild(el);
    });

  } catch (error) {
    container.textContent = ''; 
    const errorDiv = document.createElement('div');
    errorDiv.style.padding = "1rem";
    errorDiv.style.color = "red";
    errorDiv.textContent = browser.i18n.getMessage("noFolderError");
    container.appendChild(errorDiv);
    console.error(error);
  }
}

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    localizeHtmlPage(); // i18n
    
    const settingsBtn = document.getElementById('open-settings');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            browser.runtime.openOptionsPage();
        });
    }
    loadBookmarks();
});

browser.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.setting) loadBookmarks();
});
