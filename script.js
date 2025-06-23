// Authentication check
const isAuthenticated = localStorage.getItem('isAuthenticated');
const loggedInUser = localStorage.getItem('loggedInUser');

if (!isAuthenticated || !loggedInUser) {
  // User is NOT logged in - redirect to login page
  window.location.href = 'index.html';
  // Stop further execution (optional)
  throw new Error('User not authenticated');
}



  function logout() {
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('loggedInUser');
  window.location.href = 'index.html';
}
(() => {
  'use strict';

  // Constants
  const statusToListTitle = {
    todo: 'To Do',
    inprogress: 'In Progress',
    done: 'Done'
  };
  // Elements
  const storageKey = `taskManagerData_${loggedInUser}`;
  const currentUser = { id: 'user-123', name: 'You' };
  const projectListEl = document.getElementById('project-list');
  const mainContentEl = document.getElementById('main-content');
  const detailPanelEl = document.getElementById('detail-panel');
  const detailCloseBtn = document.getElementById('detail-close-btn');
  const deleteBtn = document.getElementById("delete-project-btn");
  const addProjectBtn = document.getElementById('add-project-btn');
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  const darkModeIcon = document.getElementById('dark-mode-icon');
  const filterButtons = document.querySelectorAll('#header-nav button[data-filter]');
 
  const detailTitleEl = document.getElementById('detail-title');
  const descTextarea = document.getElementById('task-desc-textarea');
  const prioritySelect = document.getElementById('task-priority-select');
  const dueDateInput = document.getElementById('task-due-input');
  const statusSelect = document.getElementById('task-status-select');
  const tagsInput = document.getElementById('task-tags-input');
  const assigneeInput = document.getElementById('task-assignee-input');
  const taskSaveBtn = document.getElementById('task-save-btn');

  let data = {
    projects: [],
    lists: [],
    tasks: []
  };
  let activeProjectId = null;
  let activeTaskId = null;
  let draggingTaskId = null;
  let activeFilter = 'all';

  function initDefaultData() {
    const defaultProjectId = crypto.randomUUID();
    const defaultListIds = [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()];
    data.projects = [{
      id: defaultProjectId,
      name: 'Default Task',
      description: 'Demo Task',
      color: '#f59e0b',
    }];
    data.lists = [
      { id: defaultListIds[0], projectId: defaultProjectId, title: 'To Do', taskIds: [] },
      { id: defaultListIds[1], projectId: defaultProjectId, title: 'In Progress', taskIds: [] },
      { id: defaultListIds[2], projectId: defaultProjectId, title: 'Done', taskIds: [] },
    ];
    data.tasks = [
      {
        id: crypto.randomUUID(),
        title: 'Welcome to Task Manager',
        description: 'This is your first task. Click to view details.',
        projectId: defaultProjectId,
        listId: defaultListIds[0],
        priority: 'medium',
        dueDate: null,
        tags: ['welcome'],
        assignedTo: 'You',
        createdBy: currentUser.id,
        createdAt: new Date().toISOString(),
        completedAt: null,
        status: 'todo',
      }
    ];
    data.lists[0].taskIds.push(data.tasks[0].id);
    activeProjectId = defaultProjectId;
  }

  function loadData() {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        data = JSON.parse(stored);
        if (!data.projects.length) initDefaultData();
        if (!activeProjectId && data.projects.length > 0) activeProjectId = data.projects[0].id;
      } catch {
        initDefaultData();
      }
    } else {
      initDefaultData();
    }
  }

  function saveData() {
    localStorage.setItem(storageKey, JSON.stringify(data));
  }

  

 function renderProjects() {
    projectListEl.innerHTML = '';
    data.projects.forEach(proj => {
    const div = document.createElement('div');
    div.classList.add('project-item');
    if (proj.id === activeProjectId) div.classList.add('active');
    div.setAttribute('role', 'listitem');
    div.setAttribute('tabindex', '0');
    div.title = proj.description || '';

    const colorEl = document.createElement('span');
    colorEl.className = 'project-color';
    colorEl.style.backgroundColor = proj.color;

    const nameEl = document.createElement('span');
    nameEl.className = 'project-name';
    nameEl.textContent = proj.name;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'project-delete-btn';
    deleteBtn.innerHTML = '<span class="material-icons">delete</span>';
    deleteBtn.title = 'Delete project';
    deleteBtn.onclick = (e) => {
      e.stopPropagation(); // prevent triggering project switch
      if (confirm(`Delete project "${proj.name}"? This will delete all tasks inside it.`)) {
        deleteProject(proj.id);
      }
    };

    div.appendChild(colorEl);
    div.appendChild(nameEl);
    div.appendChild(deleteBtn);

    div.onclick = () => {
      activeProjectId = proj.id;
      activeTaskId = null;
      renderProjects();
      renderLists();
      closeDetailPanel();
    };

    div.onkeydown = e => {
      if (e.key === 'Enter' || e.key === ' ') {
        activeProjectId = proj.id;
        activeTaskId = null;
        renderProjects();
        renderLists();
        closeDetailPanel();
        e.preventDefault();
      }
    };

    projectListEl.appendChild(div);
  });
}

function deleteProject(projectId) {
  // Remove project
  data.projects = data.projects.filter(p => p.id !== projectId);

  // Remove related lists and collect their IDs
  const removedListIds = data.lists.filter(l => l.projectId === projectId).map(l => l.id);
  data.lists = data.lists.filter(l => l.projectId !== projectId);

  // Remove related tasks
  data.tasks = data.tasks.filter(t => !removedListIds.includes(t.listId));

  // Reset activeProjectId if it was the one deleted
  if (activeProjectId === projectId) {
    activeProjectId = data.projects.length > 0 ? data.projects[0].id : null;
  }

  saveData();
  renderProjects();
  renderLists();
  closeDetailPanel();
}


  function renderLists() {
    mainContentEl.innerHTML = '';
    if (!activeProjectId) {
      mainContentEl.textContent = 'No project selected.';
      return;
    }
    const listsForProject = data.lists.filter(l => l.projectId === activeProjectId);
    listsForProject.forEach(list => {
      const col = document.createElement('section');
      col.className = 'list-column';
      col.setAttribute('data-list-id', list.id);
      col.setAttribute('aria-label', `Task list ${list.title}`);

      const header = document.createElement('header');
      header.className = 'list-column-header';
      header.textContent = list.title;
      col.appendChild(header);

      const cardsContainer = document.createElement('div');
      cardsContainer.className = 'list-cards';
      cardsContainer.setAttribute('role', 'list');
      cardsContainer.setAttribute('aria-label', `Cards in ${list.title}`);

      list.taskIds.forEach(taskId => {
        const task = data.tasks.find(t => t.id === taskId);
        if (!task) return;
        if (!filterTaskByActiveFilter(task)) return;

        const card = document.createElement('article');
        card.className = 'card';
        card.setAttribute('draggable', 'true');
        card.setAttribute('role', 'listitem');
        card.tabIndex = 0;
        card.dataset.taskId = task.id;

        const titleEl = document.createElement('div');
        titleEl.className = 'card-title';
        titleEl.textContent = task.title.length > 35 ? task.title.slice(0, 32) + '...' : task.title;

        const priorityEl = document.createElement('div');
        priorityEl.className = `card-priority priority-${task.priority}`;
        priorityEl.textContent = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);

        card.appendChild(titleEl);
        card.appendChild(priorityEl);

        if (task.dueDate) {
          const dueDate = new Date(task.dueDate);
          const now = new Date();
          const dueEl = document.createElement('div');
          dueEl.className = 'card-due';
          dueEl.textContent = 'Due: ' + dueDate.toLocaleDateString();
          if (dueDate < now && task.status !== 'done') dueEl.classList.add('card-overdue');
          card.appendChild(dueEl);
        }

        // Add delete task button
        const deleteTaskBtn = document.createElement('button');
        deleteTaskBtn.className = 'card-delete-btn';
        deleteTaskBtn.title = 'Delete task';
        deleteTaskBtn.setAttribute('aria-label', 'Delete task');
        deleteTaskBtn.innerHTML = '<span class="material-icons">delete</span>';
        deleteTaskBtn.onclick = e => {
          e.stopPropagation();
          if (confirm('Are you sure you want to delete this task?')) {
            deleteTask(task.id);
          }
        };
        card.appendChild(deleteTaskBtn);

        card.onclick = () => openDetailPanel(task.id);
        card.onkeydown = e => {
          if (e.key === 'Enter' || e.key === ' ') {
            openDetailPanel(task.id);
            e.preventDefault();
          }
        };

        card.addEventListener('dragstart', dragStart);
        card.addEventListener('dragend', dragEnd);

        cardsContainer.appendChild(card);
      });

      const footer = document.createElement('footer');
      footer.className = 'list-column-footer';
      footer.innerHTML = `
        <textarea class="new-card-input" placeholder="+ Add new task" rows="2" aria-label="Add new task to the list ${list.title}"></textarea>
        <button class="btn-add-card">Add</button>
      `;
      const addCardBtn = footer.querySelector('.btn-add-card');
      const newCardInput = footer.querySelector('.new-card-input');

      addCardBtn.addEventListener('click', () => {
        const val = newCardInput.value.trim();
        if (val.length === 0) return;
        createNewTask(val, list.id);
        newCardInput.value = '';
      });
      newCardInput.addEventListener('keydown', e => {
        if (e.key === 'Enter' && (e.shiftKey || e.ctrlKey)) {
          addCardBtn.click();
          e.preventDefault();
        }
      });

      col.appendChild(cardsContainer);
      col.appendChild(footer);
      cardsContainer.addEventListener('dragover', dragOver);
      cardsContainer.addEventListener('drop', drop);
      mainContentEl.appendChild(col);
    });
  }

  function filterTaskByActiveFilter(task) {
    switch(activeFilter) {
      case 'all': return true;
      case 'pending': return task.status !== 'done';
      case 'done': return task.status === 'done';
      default: return true;
    }
  }

  function createNewTask(title, listId) {
    if (!activeProjectId) return;
    const list = data.lists.find(l => l.id === listId);
    let status = 'todo';
    if (list) {
      if (list.title === 'In Progress') status = 'inprogress';
      else if (list.title === 'Done') status = 'done';
    }
    const newTask = {
      id: crypto.randomUUID(),
      title,
      description: '',
      projectId: activeProjectId,
      listId,
      priority: 'medium',
      dueDate: null,
      tags: [],
      assignedTo: '',
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
      completedAt: null,
      status,
    };
    data.tasks.push(newTask);
    if (list) list.taskIds.push(newTask.id);
    saveData();
    renderLists();
  }

  function deleteTask(taskId) {
    const task = data.tasks.find(t => t.id === taskId);
    if (!task) return;
    data.tasks = data.tasks.filter(t => t.id !== taskId);
    const list = data.lists.find(l => l.id === task.listId);
    if (list) list.taskIds = list.taskIds.filter(id => id !== taskId);
    saveData();
    renderLists();
    closeDetailPanel();
  }

   addProjectBtn.addEventListener('click', () => {
   const projectName = prompt('Enter project name:');
   if (!projectName || !projectName.trim()) return;
   const newProjectId = crypto.randomUUID();
   const newProjectColor = ["#3b82f6", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#e11d48", "#0ea5e9", "#22c55e", "#a855f7"][Math.floor(Math.random()*7)];
   data.projects.push({ id: newProjectId, name: projectName.trim(), description: '', color: newProjectColor });
   const newListIds = [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()];
   data.lists.push(
    { id: newListIds[0], projectId: newProjectId, title: 'To Do', taskIds: [] },
    { id: newListIds[1], projectId: newProjectId, title: 'In Progress', taskIds: [] },
    { id: newListIds[2], projectId: newProjectId, title: 'Done', taskIds: [] }
  );
  activeProjectId = newProjectId;
  saveData();
  renderProjects();
  renderLists();
  closeDetailPanel();
});
 
// Dark Mode Toggle
 darkModeToggle.onclick = () => {
  document.body.classList.toggle('dark');
  updateDarkModeIcon();
  localStorage.setItem('darkModeEnabled', document.body.classList.contains('dark') ? '1' : '0');
  
};

function updateDarkModeIcon() {
  darkModeIcon.textContent = document.body.classList.contains('dark') ? 'light_mode' : 'dark_mode';
}
// Load dark mode preference from localStorage or system preference
function loadDarkModePref() {
  const stored = localStorage.getItem('darkModeEnabled');
  if (stored === '1') document.body.classList.add('dark');
  else if (stored === '0') document.body.classList.remove('dark');
  else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.body.classList.add('dark');
  updateDarkModeIcon();
}
// Open Task Detail Panel
function openDetailPanel(taskId) {
    const task = data.tasks.find(t => t.id === taskId);
    if (!task) return;
    activeTaskId = taskId;
    detailTitleEl.textContent = task.title.length > 40 ? task.title.slice(0,40) + '...' : task.title;
    descTextarea.value = task.description || '';
    prioritySelect.value = task.priority || 'medium';
    dueDateInput.value = task.dueDate || '';
    statusSelect.value = task.status || 'todo';
    tagsInput.value = task.tags.join(', ');
    assigneeInput.value = task.assignedTo || '';
    detailPanelEl.classList.remove('hidden');
    detailPanelEl.focus();
  }
// Close Task Detail Panel
  function closeDetailPanel() {
    activeTaskId = null;
    detailPanelEl.classList.add('hidden');
  }

  detailCloseBtn.addEventListener('click', closeDetailPanel);

  // Save Task Details
  taskSaveBtn.addEventListener('click', () => {
    if (!activeTaskId) return;
    const task = data.tasks.find(t => t.id === activeTaskId);
    if (!task) return;

    task.description = descTextarea.value.trim();
    task.priority = prioritySelect.value;
    task.dueDate = dueDateInput.value || null;
    task.status = statusSelect.value;
    task.tags = tagsInput.value.split(',').map(t => t.trim()).filter(Boolean);
    task.assignedTo = assigneeInput.value.trim();

    const targetListTitle = statusToListTitle[task.status] || 'To Do';
    const targetList = data.lists.find(l => l.projectId === task.projectId && l.title === targetListTitle);
    if (targetList && task.listId !== targetList.id) {
      const oldList = data.lists.find(l => l.id === task.listId);
      if (oldList) {
        const idx = oldList.taskIds.indexOf(task.id);
        if (idx > -1) oldList.taskIds.splice(idx, 1);
      }
      targetList.taskIds.push(task.id);
      task.listId = targetList.id;
    }
    if (task.status === 'done') {
      task.completedAt = task.completedAt || new Date().toISOString();
    } else {
      task.completedAt = null;
    }
    saveData();
    renderLists();
    closeDetailPanel();
    deleteBtn.disabled = true; // Disable delete button when panel is closed

  });

  // Drag and Drop Handlers
  function dragStart(e) {
    draggingTaskId = e.target.dataset.taskId;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggingTaskId);
    e.target.classList.add('dragging');
  }
  function dragEnd(e) {
    e.target.classList.remove('dragging');
    draggingTaskId = null;
  }
  function dragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }
  function drop(e) {
    e.preventDefault();
    const listId = e.currentTarget.parentElement.dataset.listId;
    const taskId = e.dataTransfer.getData('text/plain');
    if (!listId || !taskId) return;
    if (!data.lists.find(l => l.id === listId)) return;
    if (!data.tasks.find(t => t.id === taskId)) return;
    data.lists.forEach(l => {
      const idx = l.taskIds.indexOf(taskId);
      if (idx > -1) l.taskIds.splice(idx, 1);
    });
    const targetList = data.lists.find(l => l.id === listId);
    if (!targetList.taskIds.includes(taskId)) targetList.taskIds.push(taskId);
    const task = data.tasks.find(t => t.id === taskId);
    if (task) {
      task.listId = listId;
      const listTitle = targetList.title.toLowerCase();
      if (listTitle === 'done') {
        task.status = 'done';
        task.completedAt = task.completedAt || new Date().toISOString();
      } else if (listTitle === 'in progress') {
        task.status = 'inprogress';
        task.completedAt = null;
      } else {
        task.status = 'todo';
        task.completedAt = null;
      }
    }
    saveData();
    renderLists();
  }
// Filter Buttons
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      activeFilter = btn.dataset.filter;
      closeDetailPanel();
      renderLists();
    });
  });

  // Initialize the app
  function init() {
    loadData();
    loadDarkModePref();
    renderProjects();
    renderLists();
    closeDetailPanel();
    deleteBtn.disabled = true;

  }
  init();

  // Keyboard navigation for detail panel
  detailPanelEl.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      const focusable = detailPanelEl.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          last.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === last) {
          first.focus();
          e.preventDefault();
        }
      }
    }
  });

  
})();
