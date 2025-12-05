// Admin Panel Pagination for API Usage

// Pagination state
let currentAPIUsagePage = 1;
const apiUsagePageSize = 20;

// Enhanced loadAPIUsage with pagination
async function loadAPIUsageWithPagination(page = 1) {
    if (typeof showAPIUsageLoading !== 'undefined') {
        showAPIUsageLoading();
    }
    
    try {
        const apiType = document.getElementById('apiTypeFilter').value;
        const days = document.getElementById('daysFilter').value;
        
        let url = `${API_URL}/admin/api-usage?days=${days}&page=${page}&page_size=${apiUsagePageSize}`;
        if (apiType) {
            url += `&api_type=${apiType}`;
        }
        
        const response = await authenticatedFetch(url);
        if (response.ok) {
            const data = await response.json();
            currentAPIUsagePage = page;
            
            // Small delay for smooth transition
            setTimeout(() => {
                displayAPIUsageWithPagination(data);
                
                // Add fade-in animation
                const container = document.getElementById('apiUsageTable');
                container.classList.add('fade-in');
            }, 300);
        }
    } catch (error) {
        console.error('Error loading API usage:', error);
        document.getElementById('apiUsageTable').innerHTML = '<p class="text-red-500">Error loading API usage</p>';
    }
}

// Display API usage with pagination controls
function displayAPIUsageWithPagination(data) {
    const container = document.getElementById('apiUsageTable');
    
    if (data.records.length === 0) {
        container.innerHTML = '<p class="text-gray-500">No API usage records found</p>';
        return;
    }
    
    const pagination = data.pagination;
    
    container.innerHTML = `
        <div class="mb-4 p-4 bg-gray-50 rounded-lg">
            <div class="grid grid-cols-4 gap-4 text-center">
                <div>
                    <p class="text-sm text-gray-600">Total Requests</p>
                    <p class="text-2xl font-bold">${data.stats.total_requests}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-600">Successful</p>
                    <p class="text-2xl font-bold text-green-600">${data.stats.successful}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-600">Total Tokens</p>
                    <p class="text-2xl font-bold text-blue-600">${data.stats.total_tokens.toLocaleString()}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-600">Total Cost</p>
                    <p class="text-2xl font-bold text-orange-600">$${data.stats.total_cost.toFixed(4)}</p>
                </div>
            </div>
        </div>
        
        <div class="overflow-x-auto bg-white rounded-lg shadow">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">API</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Endpoint</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tokens</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${data.records.map(record => `
                        <tr class="hover:bg-gray-50 transition-colors duration-150">
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${record.username}</td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span class="px-2 py-1 text-xs font-semibold rounded-full ${record.api_type === 'groq' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}">
                                    ${record.api_type.toUpperCase()}
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${record.endpoint}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${record.tokens_used.toLocaleString()}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">$${record.estimated_cost.toFixed(4)}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(record.timestamp).toLocaleString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <!-- Pagination Controls -->
        <div class="mt-6 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg shadow">
            <!-- Mobile Pagination -->
            <div class="flex flex-1 justify-between sm:hidden">
                <button 
                    onclick="changeAPIUsagePage(${pagination.page - 1})"
                    ${!pagination.has_prev ? 'disabled' : ''}
                    class="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition">
                    <i class="fas fa-chevron-left mr-2"></i>
                    Previous
                </button>
                <span class="text-sm text-gray-700 flex items-center">
                    Page ${pagination.page} of ${pagination.total_pages}
                </span>
                <button 
                    onclick="changeAPIUsagePage(${pagination.page + 1})"
                    ${!pagination.has_next ? 'disabled' : ''}
                    class="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition">
                    Next
                    <i class="fas fa-chevron-right ml-2"></i>
                </button>
            </div>
            
            <!-- Desktop Pagination -->
            <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                    <p class="text-sm text-gray-700">
                        Showing
                        <span class="font-medium">${((pagination.page - 1) * pagination.page_size) + 1}</span>
                        to
                        <span class="font-medium">${Math.min(pagination.page * pagination.page_size, pagination.total_records)}</span>
                        of
                        <span class="font-medium">${pagination.total_records}</span>
                        results
                    </p>
                </div>
                <div>
                    <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <!-- Previous Button -->
                        <button 
                            onclick="changeAPIUsagePage(${pagination.page - 1})"
                            ${!pagination.has_prev ? 'disabled' : ''}
                            class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed transition">
                            <span class="sr-only">Previous</span>
                            <i class="fas fa-chevron-left h-5 w-5"></i>
                        </button>
                        
                        ${generatePaginationButtons(pagination.page, pagination.total_pages)}
                        
                        <!-- Next Button -->
                        <button 
                            onclick="changeAPIUsagePage(${pagination.page + 1})"
                            ${!pagination.has_next ? 'disabled' : ''}
                            class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed transition">
                            <span class="sr-only">Next</span>
                            <i class="fas fa-chevron-right h-5 w-5"></i>
                        </button>
                    </nav>
                </div>
            </div>
        </div>
    `;
}

// Generate pagination buttons with ellipsis
function generatePaginationButtons(currentPage, totalPages) {
    let buttons = '';
    const maxButtons = 7;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    
    // Adjust start if we're near the end
    if (endPage - startPage < maxButtons - 1) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }
    
    // First page
    if (startPage > 1) {
        buttons += `
            <button 
                onclick="changeAPIUsagePage(1)"
                class="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 transition">
                1
            </button>
        `;
        if (startPage > 2) {
            buttons += `
                <span class="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300">
                    ...
                </span>
            `;
        }
    }
    
    // Page buttons
    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === currentPage;
        buttons += `
            <button 
                onclick="changeAPIUsagePage(${i})"
                aria-current="${isActive ? 'page' : 'false'}"
                class="relative inline-flex items-center px-4 py-2 text-sm font-semibold transition ${
                    isActive 
                        ? 'z-10 bg-primary text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary' 
                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                }">
                ${i}
            </button>
        `;
    }
    
    // Last page
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            buttons += `
                <span class="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300">
                    ...
                </span>
            `;
        }
        buttons += `
            <button 
                onclick="changeAPIUsagePage(${totalPages})"
                class="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 transition">
                ${totalPages}
            </button>
        `;
    }
    
    return buttons;
}

// Change page handler
function changeAPIUsagePage(page) {
    loadAPIUsageWithPagination(page);
    // Smooth scroll to top of table
    const element = document.getElementById('apiUsageTable');
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Override the original loadAPIUsage function
if (typeof loadAPIUsage !== 'undefined') {
    const originalLoadAPIUsage = loadAPIUsage;
    loadAPIUsage = function(page) {
        if (page) {
            loadAPIUsageWithPagination(page);
        } else {
            loadAPIUsageWithPagination(1);
        }
    };
}
