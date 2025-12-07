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
