// /public/js/dashboard-loaders.js

import { apiFetch } from './supabase-client.js';
import { formatDate, formatTime } from './shared-utils.js';

/**
 * Loads and renders dashboard stats (resources, workshops, projects).
 * @param {object} dom Cached DOM references
 */
export async function loadDashboardData(dom) {
  try {
    const stats = await apiFetch('dashboard/stats');
    dom.stats.resources.textContent = stats.resourceCount ?? '—';
    dom.stats.workshops.textContent = stats.upcomingWorkshops ?? '—';
    dom.stats.projects.textContent = stats.implementedProjects ?? '—';
  } catch (e) {
    console.error('Dashboard data error', e);
  }
}

/**
 * Loads and renders timeline events in the dashboard.
 * @param {HTMLElement} container The timeline container element
 */
export async function loadTimeline(container) {
  container.innerHTML = '<p class="loading">Loading activity...</p>';
  try {
    const events = await apiFetch('user/timeline');
    container.innerHTML = '';
    events.slice(0, 5).forEach(ev => {
      const div = document.createElement('div');
      div.className = 'timeline-item';
      div.innerHTML = `
        <div class="timeline-date">${formatDate(ev.timestamp)} ${formatTime(ev.timestamp)}</div>
        <div class="timeline-content">
          <strong>${ev.title}</strong>
          <p>${ev.description}</p>
        </div>
      `;
      container.appendChild(div);
    });
  } catch (e) {
    console.error('Timeline load error', e);
    container.innerHTML = '<p class="error-message">Failed to load timeline.</p>';
  }
}

/**
 * Loads and renders featured content cards.
 * @param {HTMLElement} container The featured content container
 */
export async function loadFeaturedContent(container) {
  container.innerHTML = '<p class="loading">Loading featured...</p>';
  try {
    const items = await apiFetch('content/featured?limit=3');
    container.innerHTML = '';
    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'featured-card';
      card.innerHTML = `
        <h4>${item.title}</h4>
        <p>${item.excerpt}</p>
        <a href="/content/${item.id}">View</a>
      `;
      container.appendChild(card);
    });
  } catch (e) {
    console.error('Featured content error', e);
    container.innerHTML = '<p class="error-message">Failed to load featured.</p>';
  }
}

/**
 * Loads and renders learning resources with pagination support.
 * @param {HTMLElement} container The container element
 * @param {number} page Current page number
 * @param {function} updatePagination Callback to update pagination UI
 */
export async function loadLearningResources(container, page = 1, updatePagination) {
  container.innerHTML = '<p class="loading">Loading learning resources...</p>';
  try {
    const data = await apiFetch(`content?page=${page}&limit=${ITEMS_PER_PAGE}`);
    container.innerHTML = '';
    if (data.items.length) {
      data.items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'resource-card';
        card.innerHTML = `
          <h4>${item.title}</h4>
          <p>${item.excerpt || item.description || ''}</p>
          <a href="/content/${item.id}">View Resource</a>
        `;
        container.appendChild(card);
      });
    } else {
      container.innerHTML = '<p>No learning resources found.</p>';
    }
    const totalPages = Math.ceil(data.totalItems / ITEMS_PER_PAGE);
    updatePagination && updatePagination('resources', page, totalPages);
  } catch (e) {
    console.error('Learning resources error', e);
    container.innerHTML = '<p class="error-message">Failed to load learning resources.</p>';
  }
}

/**
 * Loads and renders workshops with pagination support.
 * @param {HTMLElement} container The container element
 * @param {number} page Current page number
 * @param {function} updatePagination Callback to update pagination UI
 */
export async function loadWorkshops(container, page = 1, updatePagination) {
  container.innerHTML = '<p class="loading">Loading workshops...</p>';
  try {
    const data = await apiFetch(`workshops?page=${page}&limit=${ITEMS_PER_PAGE}`);
    container.innerHTML = '';
    if (data.items.length) {
      data.items.forEach(ws => {
        const card = document.createElement('div');
        card.className = 'workshop-card';
        card.innerHTML = `
          <h4>${ws.title}</h4>
          <p>${formatDate(ws.start_time)} at ${formatTime(ws.start_time)}</p>
          <a href="/workshop/${ws.id}">Details</a>
        `;
        container.appendChild(card);
      });
    } else {
      container.innerHTML = '<p>No workshops available.</p>';
    }
    const totalPages = Math.ceil(data.totalItems / ITEMS_PER_PAGE);
    updatePagination && updatePagination('workshops', page, totalPages);
  } catch (e) {
    console.error('Workshops error', e);
    container.innerHTML = '<p class="error-message">Failed to load workshops.</p>';
  }
}

/**
 * Loads and renders project listings with pagination support.
 * @param {HTMLElement} container The container element
 * @param {number} page Current page number
 * @param {function} updatePagination Callback to update pagination UI
 */
export async function loadProjects(container, page = 1, updatePagination) {
  container.innerHTML = '<p class="loading">Loading projects...</p>';
  try {
    const data = await apiFetch(`projects?page=${page}&limit=${ITEMS_PER_PAGE}`);
    container.innerHTML = '';
    if (data.items.length) {
      data.items.forEach(pr => {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.innerHTML = `
          <h4>${pr.title}</h4>
          <p>Status: ${pr.status}</p>
          <a href="/project/${pr.id}">View Project</a>
        `;
        container.appendChild(card);
      });
    } else {
      container.innerHTML = '<p>No projects found.</p>';
    }
    const totalPages = Math.ceil(data.totalItems / ITEMS_PER_PAGE);
    updatePagination && updatePagination('projects', page, totalPages);
  } catch (e) {
    console.error('Projects error', e);
    container.innerHTML = '<p class="error-message">Failed to load projects.</p>';
  }
}
