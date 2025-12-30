// --- Data & State ---
const initialState = [
    { id: 1, name: "ChatGPT", url: "https://chatgpt.com", status: "used" },
    { id: 2, name: "GitHub Copilot", url: "https://github.com/copilot", status: "expert" },
    { id: 3, name: "Midjourney", url: "https://midjourney.com", status: "heard" },
    { id: 4, name: "VS Code", url: "https://vscode.dev", status: "expert" },
    { id: 5, name: "Claude", url: "https://claude.ai", status: "used" },
    { id: 17, name: "Google Colab", url: "https://colab.google", status: "used" },
    { id: 24, name: "Hugging Face", url: "https://huggingface.co", status: "heard" },
    { id: 32, name: "Google Antigravity", url: "https://developers.google.com", status: "heard" }
];

// --- Persistence ---
const STORAGE_KEY = 'ai_tools_tracker_data';

function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tools));
        updateStats(); // Update stats on save
    } catch (e) {
        console.error("Failed to save state", e);
        showToast("Failed to save data locally", "error");
    }
}

function loadState() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.error("Failed to load state", e);
    }
    return [...initialState];
}

let state = {
    tools: loadState(),
    filter: 'all', // all, heard, used, expert
    search: '',
    editingId: null
};

// --- Render Logic ---
const tableBody = document.getElementById('tableBody');
const searchInput = document.getElementById('searchInput');
const filterBtns = document.querySelectorAll('.filter-btn');
const btnAdd = document.getElementById('btnAdd');
const emptyState = document.getElementById('emptyState');
const toastContainer = document.getElementById('toast-container');

function render() {
    tableBody.innerHTML = '';

    // Filter Data
    const filteredTools = state.tools.filter(tool => {
        const matchesSearch = tool.name.toLowerCase().includes(state.search.toLowerCase());
        const matchesFilter = state.filter === 'all' || tool.status === state.filter;
        return matchesSearch && matchesFilter;
    });

    if (filteredTools.length === 0) {
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
    }

    // Update Stats
    updateStats();

    // Build Rows
    filteredTools.forEach(tool => {
        const row = document.createElement('tr');

        // --- Edit Mode ---
        if (state.editingId === tool.id) {
            row.className = 'editing-row';
            row.innerHTML = `
                <td>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                        <input type="text" class="tool-input" id="editName-${tool.id}" value="${escapeHtml(tool.name)}" placeholder="Tool Name">
                        <!-- URL is Auto-Generated -->
                    </div>
                </td>
                <td colspan="2">
                    <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                        <button class="save-btn" onclick="saveEdit(${tool.id})" title="Save">
                            ✅ Save
                        </button>
                         <button class="cancel-btn" onclick="cancelEdit()" title="Cancel">
                            ❌ Cancel
                        </button>
                    </div>
                </td>
            `;
        }
        // --- View Mode ---
        else {
            const isHeard = tool.status === 'heard';
            const isUsed = tool.status === 'used';
            const isExpert = tool.status === 'expert';

            row.innerHTML = `
                <td>
                    <div class="tool-name-container">
                        <a href="${tool.url || '#'}" target="_blank" class="tool-link">
                            ${escapeHtml(tool.name)}
                            <span class="external-icon">↗</span>
                        </a>
                    </div>
                </td>
                <td>
                    <div class="status-cell-container" style="margin: 0 auto;">
                        <div class="status-option ${isHeard ? 'active' : ''}" onclick="toggleStatus(${tool.id}, 'heard')" title="Heard of it">
                             <span class="check-icon">✓</span>
                        </div>
                        <div class="status-option ${isUsed ? 'active' : ''}" onclick="toggleStatus(${tool.id}, 'used')" title="Used it">
                             <span class="check-icon">✓</span>
                        </div>
                        <div class="status-option ${isExpert ? 'active' : ''}" onclick="toggleStatus(${tool.id}, 'expert')" title="Expert">
                             <span class="check-icon">✓</span>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="actions-cell">
                        <button class="edit-btn" onclick="startEdit(${tool.id})" title="Edit Tool" aria-label="Edit ${escapeHtml(tool.name)}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                        </button>
                        <button class="delete-btn" onclick="deleteTool(${tool.id})" title="Delete Tool" aria-label="Delete ${escapeHtml(tool.name)}">
                            🗑️
                        </button>
                    </div>
                </td>
            `;
        } // end if/else

        tableBody.appendChild(row);

        // Focus logic for edit mode
        if (state.editingId === tool.id) {
            setTimeout(() => {
                const input = document.getElementById(`editName-${tool.id}`);
                if (input) input.focus();
            }, 50);
        }
    });
}

function updateStats() {
    const statsBar = document.getElementById('statsBar');
    if (!statsBar) return;

    const counts = {
        total: state.tools.length,
        heard: state.tools.filter(t => t.status === 'heard').length,
        used: state.tools.filter(t => t.status === 'used').length,
        expert: state.tools.filter(t => t.status === 'expert').length
    };

    statsBar.innerHTML = `
            <div class="stat-item">
                <span class="stat-value" style="color: var(--text-primary)">${counts.total}</span>
                <span class="stat-label">Total Tools</span>
            </div>
            <div class="stat-item">
                <span class="stat-value" style="color: var(--primary-color)">${counts.heard}</span>
                <span class="stat-label">Heard</span>
            </div>
            <div class="stat-item">
                 <span class="stat-value" style="color: #a855f7">${counts.used}</span>
                 <span class="stat-label">Used</span>
            </div>
            <div class="stat-item">
                 <span class="stat-value" style="color: var(--success-color)">${counts.expert}</span>
                 <span class="stat-label">Expert</span>
            </div>
        `;
}

// --- Actions ---

window.toggleStatus = (id, newStatus) => {
    const toolIndex = state.tools.findIndex(t => t.id === id);
    if (toolIndex === -1) return;

    if (state.tools[toolIndex].status !== newStatus) {
        state.tools[toolIndex].status = newStatus;
        saveState();
        render();
    }
};

window.startEdit = (id) => {
    state.editingId = id;
    render();
    // Listen for Enter key in the inputs
    setTimeout(() => {
        const nameInput = document.getElementById(`editName-${id}`);

        const handleEnter = (e) => {
            if (e.key === 'Enter') saveEdit(id);
            if (e.key === 'Escape') cancelEdit();
        };

        if (nameInput) {
            nameInput.addEventListener('keydown', handleEnter);
            nameInput.focus();
        }
    }, 100);
};

window.cancelEdit = () => {
    // Remove any newly added empty tool if cancelling edit
    const tool = state.tools.find(t => t.id === state.editingId);
    if (tool && tool.name === "") {
        state.tools = state.tools.filter(t => t.id !== state.editingId);
    }
    state.editingId = null;
    render();
};

window.saveEdit = (id) => {
    const nameInput = document.getElementById(`editName-${id}`);

    if (!nameInput) return;

    const newName = nameInput.value.trim();

    // Auto-generate URL from the name
    let newUrl = generateUrl(newName);

    if (!newName) {
        showToast("Tool name cannot be empty", "error");
        nameInput.focus();
        return;
    }

    // Duplicate Check
    const isDuplicate = state.tools.some(t => t.id !== id && t.name.toLowerCase() === newName.toLowerCase());
    if (isDuplicate) {
        showToast(`"${newName}" already exists`, "warning");
        nameInput.focus();
        return;
    }

    // URL Formatting
    if (newUrl && !/^https?:\/\//i.test(newUrl)) {
        newUrl = 'https://' + newUrl;
    }

    // Update State
    const toolIndex = state.tools.findIndex(t => t.id === id);
    state.tools[toolIndex].name = newName;
    state.tools[toolIndex].url = newUrl;
    state.editingId = null;

    saveState();
    render();
    showToast("Tool saved successfully", "success");
};

window.deleteTool = (id) => {
    const tool = state.tools.find(t => t.id === id);
    if (confirm(`Are you sure you want to delete ${tool ? tool.name : 'this tool'}?`)) {
        state.tools = state.tools.filter(t => t.id !== id);
        saveState();
        render();
        showToast("Tool deleted successfully", "success");
    }
};

// --- Event Listeners ---

searchInput.addEventListener('input', (e) => {
    state.search = e.target.value;
    render();
});

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.filter = btn.dataset.filter;
        render();
    });
});

btnAdd.addEventListener('click', () => {
    // Create new ID
    const newId = Math.max(...state.tools.map(t => t.id), 0) + 1;

    const newTool = {
        id: newId,
        name: "",
        url: "",
        status: "heard" // Default status
    };

    state.tools.unshift(newTool); // Add to top
    state.editingId = newId; // Immediately edit

    // Clear search/filter so user can see what they're adding
    state.search = '';
    state.filter = 'all';
    searchInput.value = '';
    filterBtns.forEach(b => b.classList.remove('active'));
    document.querySelector('[data-filter="all"]').classList.add('active');

    saveState();
    render();
});

// --- Utilities ---

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `<span class="toast-icon">${icon}</span> <span>${message}</span>`;

    toastContainer.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Remove after 3s
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 400); // Wait for transition
    }, 3000);
}

function escapeHtml(text) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function generateUrl(name) {
    if (!name) return "";
    const lower = name.toLowerCase().trim();

    // Dictionary of known mappings
    const mappings = {
        'chatgpt': 'https://chatgpt.com',
        'openai': 'https://openai.com',
        'claude': 'https://claude.ai',
        'bard': 'https://bard.google.com',
        'gemini': 'https://gemini.google.com',
        'midjourney': 'https://midjourney.com',
        'react': 'https://react.dev',
        'vue': 'https://vuejs.org',
        'angular': 'https://angular.io',
        'svelte': 'https://svelte.dev',
        'node': 'https://nodejs.org',
        'python': 'https://python.org',
        'rust': 'https://rust-lang.org',
        'go': 'https://go.dev',
        'figma': 'https://figma.com',
        'notion': 'https://notion.so'
    };

    if (mappings[lower]) return mappings[lower];

    // Smart Pattern Matching

    // VS Code
    if (lower.includes('vs code') || lower === 'vscode') return "https://vscode.dev";

    // GitHub
    if (lower.startsWith('github')) {
        if (lower.includes('copilot')) return "https://github.com/features/copilot";
        const parts = lower.split(/\s+/);
        if (parts.length > 1) return `https://github.com/${parts.slice(1).join('')}`;
        return "https://github.com";
    }

    // Google
    if (lower.startsWith('google')) {
        const remainder = lower.replace('google', '').trim();
        if (!remainder) return "https://www.google.com";

        // Common cloud services often go to cloud.google.com
        if (['cloud', 'vertex', 'maps', 'drive', 'docs', 'sheets', 'slides'].some(k => remainder.includes(k))) {
            if (remainder.includes('vertex')) return "https://cloud.google.com/vertex-ai";
            if (remainder === 'cloud') return "https://cloud.google.com";
            return `https://${remainder.replace(/\s+/g, '')}.google.com`;
        }

        // Default Google sub-property heuristic: google maps -> maps.google.com
        return `https://${remainder.replace(/\s+/g, '')}.google.com`;
    }

    // Generic cleanup: "My Tool" -> "mytool.com"
    // Remove all non-alphanumeric chars
    const clean = lower.replace(/[^a-z0-9]/g, '');

    if (lower.includes('.')) {
        // User typed something like "figma.com"
        return `https://${lower.replace(/\s+/g, '')}`;
    }

    // Check for explicit extension suffixes in the user input
    // e.g. "Supabase IO" -> supabase.io
    const suffixes = {
        ' ai': '.ai',
        ' io': '.io',
        ' dev': '.dev',
        ' org': '.org',
        ' net': '.net',
        ' app': '.app',
        ' com': '.com'
    };

    for (const [suffix, ext] of Object.entries(suffixes)) {
        if (lower.endsWith(suffix)) {
            // Remove suffix from clean string part using substring
            const nameWithoutSuffix = lower.substring(0, lower.length - suffix.length);
            const cleanName = nameWithoutSuffix.replace(/[^a-z0-9]/g, '');
            return `https://${cleanName}${ext}`;
        }
    }

    // Fallback check for clean string endings (e.g. "jasperai")
    // "jasperai" -> jasper.ai
    if (clean.length > 2 && clean.endsWith('ai')) {
        return `https://${clean.substring(0, clean.length - 2)}.ai`;
    }

    return `https://${clean}.com`;
}

// --- Init ---
render();
