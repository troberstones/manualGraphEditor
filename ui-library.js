//function to populate the left hand column with a list of the objects from the rdl2Objects.json file
function populateLeftRDLObjectList() {
    if (!rdl2Objects || !rdl2Objects.scene_classes) {
        console.warn("No RDL objects found to populate list.");
        return;
    }

    const objectListSidebar = document.getElementById('objectList');
    const contentArea = objectListSidebar.querySelector('.sidebar-content');

    // Clear existing content
    contentArea.innerHTML = '';

    // Create Search Bar
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'search-input';
    searchInput.placeholder = 'Search objects...';

    searchContainer.appendChild(searchInput);

    // Remove existing search container if any (to prevent duplicates)
    const existingSearch = objectListSidebar.querySelector('.search-container');
    if (existingSearch) {
        existingSearch.remove();
    }

    // Insert after header
    const header = objectListSidebar.querySelector('.sidebar-header');
    header.after(searchContainer);

    // Get list of objects and sort them
    const objectNames = Object.keys(rdl2Objects.scene_classes).sort((a, b) => a.localeCompare(b));

    // Create list container
    const listContainer = document.createElement('div');
    listContainer.className = 'object-list';
    contentArea.appendChild(listContainer);

    // Function to render list items
    function renderItems(filter = '') {
        listContainer.innerHTML = '';
        const lowerFilter = filter.toLowerCase();

        objectNames.forEach(name => {
            if (name.toLowerCase().includes(lowerFilter)) {
                const item = document.createElement('div');
                item.className = 'object-list-item';
                item.textContent = name;

                item.addEventListener('click', (e) => {
                    // Deselect others
                    const selected = listContainer.querySelectorAll('.selected');
                    selected.forEach(el => el.classList.remove('selected'));
                    item.classList.add('selected');

                    // when double clicked, create a new object of this type.
                    if (e.detail === 2) {
                        console.log('Double clicked object type:', name);
                        createRdlObject(rdl2Objects.scene_classes[name], name);
                        refreshTheCanvas();
                    } else {
                        console.log('Single clicked object type:', name);
                    }
                });

                listContainer.appendChild(item);
            }
        });

        if (listContainer.children.length === 0) {
            const emptyMsg = document.createElement('p');
            emptyMsg.style.padding = '1rem';
            emptyMsg.style.color = 'var(--text-secondary)';
            emptyMsg.style.fontStyle = 'italic';
            emptyMsg.textContent = 'No matching objects found';
            listContainer.appendChild(emptyMsg);
        }
    }

    // Initial render
    renderItems();

    // Search event listener
    searchInput.addEventListener('input', (e) => {
        renderItems(e.target.value);
    });
}

function showNodeCreationMenu() {
    // don't create multiple
    if (document.getElementById('nodeCreationMenu')) return;

    if (!rdl2Objects || !rdl2Objects.scene_classes) return;

    const menu = document.createElement('div');
    menu.id = 'nodeCreationMenu';
    menu.className = 'floating-menu';

    // Center it on screen
    menu.style.left = '50%';
    menu.style.top = '50%';
    menu.style.transform = 'translate(-50%, -50%)';

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'search-input menu-search';
    searchInput.placeholder = 'Search node...';
    menu.appendChild(searchInput);

    const listContainer = document.createElement('div');
    listContainer.className = 'object-list menu-list';
    menu.appendChild(listContainer);

    document.body.appendChild(menu);

    const objectNames = Object.keys(rdl2Objects.scene_classes).sort((a, b) => a.localeCompare(b));
    let selectedIndex = 0;
    let filteredNames = [...objectNames];

    function closeMenu() {
        if (document.body.contains(menu)) {
            document.body.removeChild(menu);
        }
    }

    function renderItems() {
        listContainer.innerHTML = '';
        if (filteredNames.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'empty-msg';
            emptyMsg.textContent = 'No matching objects found';
            listContainer.appendChild(emptyMsg);
            return;
        }

        filteredNames.forEach((name, idx) => {
            const item = document.createElement('div');
            item.className = 'object-list-item';
            if (idx === selectedIndex) {
                item.classList.add('selected');
            }
            item.textContent = name;

            item.addEventListener('click', () => {
                createRdlObject(rdl2Objects.scene_classes[name], name);
                refreshTheCanvas();
                closeMenu();
            });

            listContainer.appendChild(item);
        });

        // Ensure selected item is visible
        const selectedEl = listContainer.children[selectedIndex];
        if (selectedEl && selectedEl.scrollIntoView) {
            selectedEl.scrollIntoView({ block: 'nearest' });
        }
    }

    renderItems();
    searchInput.focus();

    searchInput.addEventListener('input', (e) => {
        const filter = e.target.value.toLowerCase();
        filteredNames = objectNames.filter(name => name.toLowerCase().includes(filter));
        selectedIndex = 0; // reset selected index
        renderItems();
    });

    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (selectedIndex < filteredNames.length - 1) {
                selectedIndex++;
                renderItems();
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (selectedIndex > 0) {
                selectedIndex--;
                renderItems();
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredNames.length > 0) {
                createRdlObject(rdl2Objects.scene_classes[filteredNames[selectedIndex]], filteredNames[selectedIndex]);
                refreshTheCanvas();
                closeMenu();
            }
        } else if (e.key === 'Escape') {
            e.preventDefault();
            closeMenu();
        }
    });

    // click outside to close
    setTimeout(() => {
        const closeOnOutside = (e) => {
            if (!menu.contains(e.target)) {
                closeMenu();
                window.removeEventListener('click', closeOnOutside);
            }
        };
        window.addEventListener('click', closeOnOutside);
    }, 0);
}
