let _bookmarkFolders = [];

async function restore() {
    try {
        const d = await browser.storage.local.get('setting');
        const selectId = d.setting ? d.setting.topId : 'toolbar_____';
        await setFolderList(selectId);
    } catch (e) {
        console.error("Error during restore:", e);
    }
}

async function save() {
    const val = document.getElementById('topId').value;
    const setting = { topId: val };
    await browser.storage.local.set({ setting });
    console.log("Folder saved:", val);
}

async function setFolderList(currentId) {
    const root = await browser.bookmarks.getTree();
    const select = document.getElementById('topId');
    const loading = document.getElementById('folder_loading');
    
    _bookmarkFolders = [];
    addBookmarkItem(root[0].children, 0);
    
    select.innerHTML = ''; // wyczyść
    _bookmarkFolders.forEach(bmf => {
        const opt = document.createElement('option');
        opt.value = bmf.id;
        opt.textContent = bmf.title;
        if (bmf.id === currentId) opt.selected = true;
        select.appendChild(opt);
    });

    loading.style.display = 'none';
    select.style.display = 'block';
}

function addBookmarkItem(bookmarks, index) {
    for (const bm of bookmarks) {
        if (!bm.url) { // if it's a folder
            _bookmarkFolders.push({
                id: bm.id, 
                title: "  ".repeat(index) + (bm.title || "Untitled")
            });
            if (bm.children) addBookmarkItem(bm.children, index + 1);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    restore();
    document.getElementById('topId').addEventListener('change', save);
});
