// Pagination UI for API Usage Table
// Overrides the displayAPIUsage function to add pagination controls

window.displayAPIUsage = function(data) {
    const container = document.getElementById('apiUsageTable');
    
    console.log('📊 API Usage Data:', data);
    console.log('📄 Pagination:', data.pagination);
    console.log('📝 Records count:', data.records.length);
    
    if (!data || data.records.length === 0) {
        container.innerHTML = '<p class="text-gray-500">No API usage records found</p>';
        return;
    }
    
    const p = data.pagination || {
        page: 1,
        total_pages: 1,
        total_records: data.records.length,
        has_next: false,
        has_prev: false,
        page_size: 20
    };
    
    console.log('✅ Using pagination:', p);
    console.log('🔢 Total pages:', p.total_pages);
    console.log('❓ Will show pagination?', p.total_pages > 1);
    
    // Add debug banner
    if (!data.pagination) {
        console.warn('⚠️ No pagination data from API! Using defaults.');
    }
    
    // Generate pagination buttons
    function generatePageButtons(current, total) {
        if (total <= 1) return '';
        
        let buttons = '';
        const maxButtons = 7;
        let start = Math.max(1, current - 3);
        let end = Math.min(total, start + maxButtons - 1);
        
        if (end - start < maxButtons - 1) {
            start = Math.max(1, end - maxButtons + 1);
        }
        
        // First page
        if (start > 1) {
            buttons += `<button onclick="changeAPIUsagePage(1)" class="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50">1</button>`;
            if (start > 2) {
                buttons += `<span class="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300">...</span>`;
            }
        }
        
        // Page numbers
        for (let i = start; i <= end; i++) {
            const isActive = i === current;
            buttons += `<button onclick="changeAPIUsagePage(${i})" class="relative inline-flex items-center px-4 py-2 text-sm font-semibold ${isActive ? 'z-10 bg-primary text-white' : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'}">${i}</button>`;
        }
        
        // Last page
        if (end < total) {
            if (end < total - 1) {
                buttons += `<span class="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300">...</span>`;
            }
            buttons += `<button onclick="changeAPIUsagePage(${total})" class="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50">${total}</button>`;
        }
        
        return buttons;
    }
    
    container.innerHTML = `
        ${!data.pagination ? '<div class="mb-4 p-3 bg-yellow-100 border border-yellow-400 rounded text-sm"><strong>⚠️ Debug:</strong> No pagination data from API</div>' : ''}
        ${data.pagination && p.total_pages <= 1 ? `<div class="mb-4 p-3 bg-blue-100 border border-blue-400 rounded text-sm"><strong>ℹ️ Info:</strong> Only ${p.total_records} records found (${p.total_pages} page)</div>` : ''}
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
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">API</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Endpoint</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tokens</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${data.records.map(record => `
                        <tr class="hover:bg-gray-50">
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${record.username}</td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span class="px-2 py-1 text-xs font-semibold rounded-full ${record.api_type === 'groq' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}">
                                    ${record.api_type.toUpperCase()}
                                </span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${record.endpoint}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${record.tokens_used.toLocaleString()}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$${record.estimated_cost.toFixed(4)}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(record.timestamp).toLocaleString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        ${p.total_pages > 1 ? `
        <div class="mt-6 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg shadow">
            <!-- Mobile pagination -->
            <div class="flex flex-1 justify-between sm:hidden">
                <button onclick="changeAPIUsagePage(${p.page - 1})" ${!p.has_prev ? 'disabled' : ''} 
                    class="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    <i class="fas fa-chevron-left mr-2"></i>Previous
                </button>
                <span class="text-sm text-gray-700 flex items-center">
                    Page ${p.page} of ${p.total_pages}
                </span>
                <button onclick="changeAPIUsagePage(${p.page + 1})" ${!p.has_next ? 'disabled' : ''}
                    class="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    Next<i class="fas fa-chevron-right ml-2"></i>
                </button>
            </div>
            
            <!-- Desktop pagination -->
            <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                    <p class="text-sm text-gray-700">
                        Showing <span class="font-medium">${(p.page - 1) * p.page_size + 1}</span> to 
                        <span class="font-medium">${Math.min(p.page * p.page_size, p.total_records)}</span> of 
                        <span class="font-medium">${p.total_records}</span> results
                    </p>
                </div>
                <div>
                    <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm">
                        <button onclick="changeAPIUsagePage(${p.page - 1})" ${!p.has_prev ? 'disabled' : ''}
                            class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                            <i class="fas fa-chevron-left h-5 w-5"></i>
                        </button>
                        ${generatePageButtons(p.page, p.total_pages)}
                        <button onclick="changeAPIUsagePage(${p.page + 1})" ${!p.has_next ? 'disabled' : ''}
                            class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                            <i class="fas fa-chevron-right h-5 w-5"></i>
                        </button>
                    </nav>
                </div>
            </div>
        </div>
        ` : ''}
    `;
};

console.log('✅ Pagination UI loaded');
