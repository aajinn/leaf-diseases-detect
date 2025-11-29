/**
 * Plant Diseases Database
 * Comprehensive list of common plant diseases
 */

// Comprehensive disease database
const diseasesDatabase = [
    // Tomato Diseases
    {
        name: "Tomato Late Blight",
        plant: "Tomato",
        type: "Fungal",
        severity: "High",
        description: "A devastating fungal disease that can destroy entire tomato crops within days. Caused by Phytophthora infestans.",
        symptoms: ["Dark brown spots on leaves", "White mold on undersides", "Fruit rot", "Rapid plant death"],
        causes: ["High humidity", "Cool temperatures", "Wet conditions", "Poor air circulation"],
        treatment: ["Remove infected plants", "Apply copper fungicide", "Improve air circulation", "Avoid overhead watering"],
        prevention: ["Use resistant varieties", "Proper spacing", "Crop rotation", "Mulching"]
    },
    {
        name: "Tomato Early Blight",
        plant: "Tomato",
        type: "Fungal",
        severity: "Medium",
        description: "Common fungal disease affecting tomatoes, characterized by concentric ring patterns on leaves.",
        symptoms: ["Brown spots with concentric rings", "Yellow halos around spots", "Lower leaf drop", "Stem lesions"],
        causes: ["Warm humid weather", "Overhead watering", "Poor nutrition", "Stressed plants"],
        treatment: ["Remove affected leaves", "Apply fungicide", "Improve plant nutrition", "Mulch around plants"],
        prevention: ["Crop rotation", "Proper spacing", "Drip irrigation", "Resistant varieties"]
    },
    {
        name: "Tomato Leaf Mold",
        plant: "Tomato",
        type: "Fungal",
        severity: "Medium",
        description: "Fungal disease common in greenhouse tomatoes, causing yellow spots and mold growth.",
        symptoms: ["Yellow spots on upper leaves", "Olive-green mold underneath", "Leaf curling", "Reduced yield"],
        causes: ["High humidity", "Poor ventilation", "Dense foliage", "Warm temperatures"],
        treatment: ["Improve ventilation", "Reduce humidity", "Remove infected leaves", "Apply fungicide"],
        prevention: ["Proper spacing", "Good air flow", "Avoid overhead watering", "Resistant varieties"]
    },
    {
        name: "Tomato Mosaic Virus",
        plant: "Tomato",
        type: "Viral",
        severity: "High",
        description: "Viral disease causing mottled patterns on leaves and reduced fruit quality.",
        symptoms: ["Mottled light and dark green leaves", "Distorted leaves", "Stunted growth", "Poor fruit quality"],
        causes: ["Infected seeds", "Contaminated tools", "Handling infected plants", "Aphid transmission"],
        treatment: ["No cure - remove infected plants", "Disinfect tools", "Control aphids", "Plant resistant varieties"],
        prevention: ["Use certified seeds", "Sanitize tools", "Control insects", "Avoid tobacco products"]
    },
    {
        name: "Tomato Septoria Leaf Spot",
        plant: "Tomato",
        type: "Fungal",
        severity: "Medium",
        description: "Fungal disease causing numerous small spots with dark borders on tomato leaves.",
        symptoms: ["Small circular spots", "Gray centers with dark borders", "Lower leaf yellowing", "Defoliation"],
        causes: ["Wet weather", "Splash from rain", "Infected debris", "High humidity"],
        treatment: ["Remove infected leaves", "Apply fungicide", "Mulch soil", "Improve air circulation"],
        prevention: ["Crop rotation", "Clean up debris", "Stake plants", "Avoid overhead watering"]
    },

    // Potato Diseases
    {
        name: "Potato Late Blight",
        plant: "Potato",
        type: "Fungal",
        severity: "High",
        description: "The same pathogen that causes tomato late blight, devastating to potato crops.",
        symptoms: ["Dark lesions on leaves", "White fungal growth", "Tuber rot", "Rapid plant collapse"],
        causes: ["Cool wet weather", "High humidity", "Infected seed potatoes", "Poor drainage"],
        treatment: ["Remove infected plants", "Apply fungicide", "Harvest early if needed", "Destroy infected tubers"],
        prevention: ["Certified seed potatoes", "Good drainage", "Proper spacing", "Resistant varieties"]
    },
    {
        name: "Potato Early Blight",
        plant: "Potato",
        type: "Fungal",
        severity: "Medium",
        description: "Common fungal disease affecting potato foliage and reducing yields.",
        symptoms: ["Brown spots with concentric rings", "Yellowing leaves", "Premature defoliation", "Reduced tuber size"],
        causes: ["Warm weather", "Plant stress", "Poor nutrition", "Overhead irrigation"],
        treatment: ["Apply fungicide", "Improve nutrition", "Remove infected leaves", "Proper watering"],
        prevention: ["Crop rotation", "Balanced fertilization", "Resistant varieties", "Proper spacing"]
    },

    // Corn Diseases
    {
        name: "Corn Northern Leaf Blight",
        plant: "Corn",
        type: "Fungal",
        severity: "Medium",
        description: "Fungal disease causing long gray-green lesions on corn leaves.",
        symptoms: ["Long elliptical lesions", "Gray-green color", "Leaf death", "Reduced yield"],
        causes: ["Humid weather", "Infected crop residue", "Susceptible hybrids", "Dense planting"],
        treatment: ["Apply fungicide", "Remove infected debris", "Improve air flow", "Timely harvest"],
        prevention: ["Resistant hybrids", "Crop rotation", "Tillage", "Proper spacing"]
    },
    {
        name: "Corn Common Rust",
        plant: "Corn",
        type: "Fungal",
        severity: "Low",
        description: "Fungal disease producing rust-colored pustules on corn leaves.",
        symptoms: ["Reddish-brown pustules", "Scattered on leaves", "Leaf yellowing", "Premature death"],
        causes: ["Cool humid weather", "Wind-borne spores", "Susceptible varieties", "Dense canopy"],
        treatment: ["Usually not needed", "Fungicide if severe", "Monitor weather", "Maintain plant health"],
        prevention: ["Resistant hybrids", "Proper nutrition", "Good air circulation", "Timely planting"]
    },

    // Wheat Diseases
    {
        name: "Wheat Rust",
        plant: "Wheat",
        type: "Fungal",
        severity: "High",
        description: "Serious fungal disease causing orange-red pustules on wheat plants.",
        symptoms: ["Orange-red pustules", "Leaf yellowing", "Stem weakness", "Reduced grain quality"],
        causes: ["Humid conditions", "Moderate temperatures", "Wind dispersal", "Susceptible varieties"],
        treatment: ["Apply fungicide", "Early detection crucial", "Remove infected plants", "Harvest promptly"],
        prevention: ["Resistant varieties", "Crop rotation", "Early planting", "Monitor regularly"]
    },
    {
        name: "Wheat Powdery Mildew",
        plant: "Wheat",
        type: "Fungal",
        severity: "Medium",
        description: "Fungal disease causing white powdery growth on wheat leaves.",
        symptoms: ["White powdery patches", "Leaf yellowing", "Stunted growth", "Reduced tillering"],
        causes: ["Cool humid weather", "Dense planting", "Excessive nitrogen", "Poor air flow"],
        treatment: ["Apply fungicide", "Improve ventilation", "Reduce nitrogen", "Remove infected tissue"],
        prevention: ["Resistant varieties", "Proper spacing", "Balanced fertilization", "Good air circulation"]
    },

    // Rice Diseases
    {
        name: "Rice Blast",
        plant: "Rice",
        type: "Fungal",
        severity: "High",
        description: "Most destructive rice disease worldwide, affecting all plant parts.",
        symptoms: ["Diamond-shaped lesions", "Gray centers", "Brown borders", "Neck rot"],
        causes: ["High humidity", "Excessive nitrogen", "Dense planting", "Susceptible varieties"],
        treatment: ["Apply fungicide", "Drain fields", "Reduce nitrogen", "Remove infected plants"],
        prevention: ["Resistant varieties", "Proper spacing", "Balanced fertilization", "Water management"]
    },
    {
        name: "Rice Bacterial Blight",
        plant: "Rice",
        type: "Bacterial",
        severity: "High",
        description: "Serious bacterial disease causing leaf blight and yield loss in rice.",
        symptoms: ["Water-soaked lesions", "Yellow to white leaves", "Wilting", "Seedling death"],
        causes: ["Flooding", "Wounds", "Contaminated water", "Infected seeds"],
        treatment: ["No cure", "Remove infected plants", "Drain fields", "Apply copper compounds"],
        prevention: ["Resistant varieties", "Clean seeds", "Proper water management", "Avoid injuries"]
    },

    // Apple Diseases
    {
        name: "Apple Scab",
        plant: "Apple",
        type: "Fungal",
        severity: "High",
        description: "Most serious disease of apples, causing leaf spots and fruit lesions.",
        symptoms: ["Olive-green spots on leaves", "Velvety appearance", "Fruit scabs", "Premature leaf drop"],
        causes: ["Wet spring weather", "Infected leaves", "Poor air circulation", "Susceptible varieties"],
        treatment: ["Apply fungicide", "Remove infected leaves", "Prune for air flow", "Rake fallen leaves"],
        prevention: ["Resistant varieties", "Proper pruning", "Sanitation", "Fungicide program"]
    },
    {
        name: "Apple Fire Blight",
        plant: "Apple",
        type: "Bacterial",
        severity: "High",
        description: "Devastating bacterial disease that can kill entire apple trees.",
        symptoms: ["Blackened shoots", "Shepherd's crook appearance", "Oozing cankers", "Fruit mummification"],
        causes: ["Warm wet weather", "Insect transmission", "Pruning wounds", "Susceptible varieties"],
        treatment: ["Prune infected branches", "Disinfect tools", "Apply antibiotics", "Remove severely infected trees"],
        prevention: ["Resistant varieties", "Avoid excess nitrogen", "Prune in dry weather", "Control insects"]
    },

    // Grape Diseases
    {
        name: "Grape Powdery Mildew",
        plant: "Grape",
        type: "Fungal",
        severity: "High",
        description: "Common fungal disease affecting grape vines and fruit quality.",
        symptoms: ["White powdery growth", "Distorted leaves", "Fruit cracking", "Reduced sugar content"],
        causes: ["Warm dry weather", "Poor air circulation", "Dense canopy", "Susceptible varieties"],
        treatment: ["Apply fungicide", "Improve air flow", "Remove infected parts", "Sulfur dusting"],
        prevention: ["Resistant varieties", "Proper pruning", "Good air circulation", "Regular monitoring"]
    },
    {
        name: "Grape Downy Mildew",
        plant: "Grape",
        type: "Fungal",
        severity: "High",
        description: "Serious fungal disease causing significant yield losses in grapes.",
        symptoms: ["Yellow oil spots", "White downy growth underneath", "Leaf drop", "Fruit rot"],
        causes: ["Wet humid weather", "Poor drainage", "Dense foliage", "Infected debris"],
        treatment: ["Apply fungicide", "Improve drainage", "Remove infected leaves", "Increase air flow"],
        prevention: ["Resistant varieties", "Proper spacing", "Good drainage", "Canopy management"]
    },

    // Citrus Diseases
    {
        name: "Citrus Canker",
        plant: "Citrus",
        type: "Bacterial",
        severity: "High",
        description: "Highly contagious bacterial disease affecting all citrus species.",
        symptoms: ["Raised brown lesions", "Yellow halos", "Leaf drop", "Fruit blemishes"],
        causes: ["Wind-driven rain", "Contaminated equipment", "Infected plants", "Wounds"],
        treatment: ["Remove infected trees", "Apply copper sprays", "Quarantine area", "Disinfect tools"],
        prevention: ["Disease-free nursery stock", "Windbreaks", "Copper sprays", "Sanitation"]
    },
    {
        name: "Citrus Greening",
        plant: "Citrus",
        type: "Bacterial",
        severity: "High",
        description: "Devastating bacterial disease transmitted by psyllids, fatal to citrus trees.",
        symptoms: ["Yellow shoots", "Blotchy mottling", "Lopsided fruit", "Bitter taste"],
        causes: ["Asian citrus psyllid", "Infected budwood", "No cure available", "Systemic infection"],
        treatment: ["No cure", "Remove infected trees", "Control psyllids", "Nutritional support"],
        prevention: ["Psyllid control", "Certified nursery stock", "Regular monitoring", "Area-wide management"]
    },

    // Cucumber Diseases
    {
        name: "Cucumber Mosaic Virus",
        plant: "Cucumber",
        type: "Viral",
        severity: "Medium",
        description: "Common viral disease affecting cucumbers and related crops.",
        symptoms: ["Mottled leaves", "Stunted growth", "Distorted fruit", "Reduced yield"],
        causes: ["Aphid transmission", "Infected plants", "Contaminated tools", "Weed hosts"],
        treatment: ["No cure", "Remove infected plants", "Control aphids", "Eliminate weeds"],
        prevention: ["Reflective mulches", "Insect control", "Resistant varieties", "Weed management"]
    },
    {
        name: "Cucumber Downy Mildew",
        plant: "Cucumber",
        type: "Fungal",
        severity: "High",
        description: "Serious fungal disease that can rapidly destroy cucumber crops.",
        symptoms: ["Yellow angular spots", "Purple-gray growth underneath", "Leaf death", "Rapid spread"],
        causes: ["Cool wet weather", "High humidity", "Poor air circulation", "Infected debris"],
        treatment: ["Apply fungicide", "Improve ventilation", "Remove infected leaves", "Reduce humidity"],
        prevention: ["Resistant varieties", "Proper spacing", "Good air flow", "Avoid overhead watering"]
    },

    // Pepper Diseases
    {
        name: "Pepper Bacterial Spot",
        plant: "Pepper",
        type: "Bacterial",
        severity: "High",
        description: "Common bacterial disease causing leaf spots and fruit lesions on peppers.",
        symptoms: ["Small dark spots", "Yellow halos", "Leaf drop", "Fruit scabs"],
        causes: ["Warm wet weather", "Contaminated seeds", "Splash dispersal", "Wounds"],
        treatment: ["Apply copper sprays", "Remove infected plants", "Improve air flow", "Avoid overhead watering"],
        prevention: ["Certified seeds", "Crop rotation", "Proper spacing", "Drip irrigation"]
    },

    // Bean Diseases
    {
        name: "Bean Rust",
        plant: "Bean",
        type: "Fungal",
        severity: "Medium",
        description: "Fungal disease producing rust-colored pustules on bean leaves.",
        symptoms: ["Reddish-brown pustules", "Yellow halos", "Leaf drop", "Reduced pod set"],
        causes: ["Humid weather", "Dense planting", "Poor air circulation", "Infected debris"],
        treatment: ["Apply fungicide", "Remove infected leaves", "Improve air flow", "Avoid overhead watering"],
        prevention: ["Resistant varieties", "Proper spacing", "Crop rotation", "Good air circulation"]
    },

    // Lettuce Diseases
    {
        name: "Lettuce Downy Mildew",
        plant: "Lettuce",
        type: "Fungal",
        severity: "High",
        description: "Major fungal disease of lettuce causing significant crop losses.",
        symptoms: ["Yellow angular spots", "White downy growth", "Leaf distortion", "Head rot"],
        causes: ["Cool wet weather", "High humidity", "Poor air flow", "Infected seeds"],
        treatment: ["Apply fungicide", "Improve ventilation", "Remove infected plants", "Reduce humidity"],
        prevention: ["Resistant varieties", "Proper spacing", "Good drainage", "Certified seeds"]
    },

    // Strawberry Diseases
    {
        name: "Strawberry Gray Mold",
        plant: "Strawberry",
        type: "Fungal",
        severity: "High",
        description: "Common fungal disease causing fruit rot in strawberries.",
        symptoms: ["Gray fuzzy mold", "Fruit rot", "Flower blight", "Rapid spread"],
        causes: ["Cool wet weather", "Dense planting", "Poor air flow", "Overripe fruit"],
        treatment: ["Remove infected fruit", "Apply fungicide", "Improve air circulation", "Reduce humidity"],
        prevention: ["Proper spacing", "Good air flow", "Timely harvest", "Mulching"]
    },

    // Rose Diseases
    {
        name: "Rose Black Spot",
        plant: "Rose",
        type: "Fungal",
        severity: "Medium",
        description: "Common fungal disease causing black spots on rose leaves.",
        symptoms: ["Black circular spots", "Yellow halos", "Premature leaf drop", "Weakened plants"],
        causes: ["Wet weather", "Splash dispersal", "Poor air circulation", "Infected debris"],
        treatment: ["Remove infected leaves", "Apply fungicide", "Improve air flow", "Rake fallen leaves"],
        prevention: ["Resistant varieties", "Proper spacing", "Avoid overhead watering", "Sanitation"]
    },

    // Nutrient Deficiencies
    {
        name: "Nitrogen Deficiency",
        plant: "All Plants",
        type: "Nutrient",
        severity: "Medium",
        description: "Common nutrient deficiency causing yellowing of older leaves.",
        symptoms: ["Yellowing older leaves", "Stunted growth", "Pale green color", "Reduced vigor"],
        causes: ["Poor soil", "Leaching", "High rainfall", "Sandy soils"],
        treatment: ["Apply nitrogen fertilizer", "Use compost", "Add organic matter", "Foliar feeding"],
        prevention: ["Regular fertilization", "Soil testing", "Organic amendments", "Proper pH"]
    },
    {
        name: "Iron Deficiency",
        plant: "All Plants",
        type: "Nutrient",
        severity: "Medium",
        description: "Nutrient deficiency causing yellowing between leaf veins.",
        symptoms: ["Interveinal chlorosis", "Yellow leaves with green veins", "Stunted growth", "Leaf drop"],
        causes: ["High pH soil", "Poor drainage", "Excess phosphorus", "Cold soil"],
        treatment: ["Apply iron chelate", "Lower soil pH", "Improve drainage", "Foliar spray"],
        prevention: ["Maintain proper pH", "Good drainage", "Balanced fertilization", "Organic matter"]
    }
];

let filteredDiseases = [...diseasesDatabase];

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    setupAuthLinks();
    displayDiseases();
    updateResultCount();
});

// Setup authentication links
function setupAuthLinks() {
    const authLinks = document.getElementById('authLinks');
    const token = localStorage.getItem('token');
    
    if (token) {
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        authLinks.innerHTML = `
            <a href="/dashboard" class="text-gray-600 hover:text-primary">Dashboard</a>
            ${isAdmin ? '<a href="/admin" class="text-gray-600 hover:text-primary">Admin</a>' : ''}
            <button onclick="logout()" class="text-red-600 hover:text-red-800">Logout</button>
        `;
    } else {
        authLinks.innerHTML = `
            <a href="/login" class="text-gray-600 hover:text-primary">Login</a>
            <a href="/register" class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary transition">Register</a>
        `;
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
    window.location.href = '/';
}

// Display diseases in grid
function displayDiseases() {
    const grid = document.getElementById('diseasesGrid');
    const loading = document.getElementById('loading');
    const noResults = document.getElementById('noResults');
    
    loading.classList.add('hidden');
    
    if (filteredDiseases.length === 0) {
        grid.classList.add('hidden');
        noResults.classList.remove('hidden');
        return;
    }
    
    grid.classList.remove('hidden');
    noResults.classList.add('hidden');
    
    grid.innerHTML = filteredDiseases.map(disease => createDiseaseCard(disease)).join('');
}

// Create disease card HTML
function createDiseaseCard(disease) {
    const severityColors = {
        'High': 'bg-red-100 text-red-800 border-red-500',
        'Medium': 'bg-yellow-100 text-yellow-800 border-yellow-500',
        'Low': 'bg-green-100 text-green-800 border-green-500'
    };
    
    const typeIcons = {
        'Fungal': 'fa-bacteria',
        'Bacterial': 'fa-virus',
        'Viral': 'fa-dna',
        'Pest': 'fa-bug',
        'Nutrient': 'fa-flask'
    };
    
    return `
        <div class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer overflow-hidden"
             onclick='showDiseaseDetail(${JSON.stringify(disease).replace(/'/g, "&#39;")})'>
            <div class="p-6">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex-1">
                        <h3 class="text-xl font-bold text-gray-800 mb-2">${disease.name}</h3>
                        <p class="text-sm text-gray-600 flex items-center">
                            <i class="fas fa-seedling text-primary mr-2"></i>
                            ${disease.plant}
                        </p>
                    </div>
                    <div class="flex flex-col items-end space-y-2">
                        <span class="px-3 py-1 rounded-full text-xs font-semibold ${severityColors[disease.severity]} border-2">
                            ${disease.severity}
                        </span>
                        <i class="fas ${typeIcons[disease.type]} text-2xl text-gray-400"></i>
                    </div>
                </div>
                
                <p class="text-gray-700 text-sm mb-4 line-clamp-3">${disease.description}</p>
                
                <div class="border-t border-gray-200 pt-4">
                    <div class="flex items-center justify-between text-sm">
                        <span class="text-gray-600">
                            <i class="fas fa-tag mr-2 text-primary"></i>
                            ${disease.type}
                        </span>
                        <span class="text-primary font-semibold hover:text-secondary">
                            Learn More <i class="fas fa-arrow-right ml-1"></i>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Filter diseases
function filterDiseases() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const typeFilter = document.getElementById('typeFilter').value;
    
    filteredDiseases = diseasesDatabase.filter(disease => {
        const matchesSearch = 
            disease.name.toLowerCase().includes(searchTerm) ||
            disease.plant.toLowerCase().includes(searchTerm) ||
            disease.description.toLowerCase().includes(searchTerm) ||
            disease.symptoms.some(s => s.toLowerCase().includes(searchTerm));
        
        const matchesType = !typeFilter || disease.type === typeFilter;
        
        return matchesSearch && matchesType;
    });
    
    displayDiseases();
    updateResultCount();
}

// Reset filters
function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('typeFilter').value = '';
    filteredDiseases = [...diseasesDatabase];
    displayDiseases();
    updateResultCount();
}

// Update result count
function updateResultCount() {
    document.getElementById('resultCount').textContent = filteredDiseases.length;
}

// Show disease detail modal
function showDiseaseDetail(disease) {
    const modal = document.getElementById('diseaseModal');
    const title = document.getElementById('modalTitle');
    const meta = document.getElementById('modalMeta');
    const content = document.getElementById('modalContent');
    
    const severityColors = {
        'High': 'bg-red-100 text-red-800',
        'Medium': 'bg-yellow-100 text-yellow-800',
        'Low': 'bg-green-100 text-green-800'
    };
    
    title.textContent = disease.name;
    
    meta.innerHTML = `
        <span class="px-3 py-1 rounded-full text-xs font-semibold ${severityColors[disease.severity]}">
            ${disease.severity} Severity
        </span>
        <span class="text-gray-600">
            <i class="fas fa-seedling text-primary mr-1"></i>${disease.plant}
        </span>
        <span class="text-gray-600">
            <i class="fas fa-tag text-primary mr-1"></i>${disease.type}
        </span>
    `;
    
    content.innerHTML = `
        <div class="space-y-6">
            <div>
                <h3 class="text-lg font-bold text-gray-800 mb-2">Description</h3>
                <p class="text-gray-700">${disease.description}</p>
            </div>
            
            <div>
                <h3 class="text-lg font-bold text-gray-800 mb-3 flex items-center">
                    <i class="fas fa-stethoscope text-red-500 mr-2"></i>
                    Symptoms
                </h3>
                <ul class="space-y-2">
                    ${disease.symptoms.map(s => `
                        <li class="flex items-start">
                            <i class="fas fa-circle text-xs text-red-500 mr-3 mt-1"></i>
                            <span class="text-gray-700">${s}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
            
            <div>
                <h3 class="text-lg font-bold text-gray-800 mb-3 flex items-center">
                    <i class="fas fa-search text-yellow-500 mr-2"></i>
                    Causes
                </h3>
                <ul class="space-y-2">
                    ${disease.causes.map(c => `
                        <li class="flex items-start">
                            <i class="fas fa-circle text-xs text-yellow-500 mr-3 mt-1"></i>
                            <span class="text-gray-700">${c}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
            
            <div>
                <h3 class="text-lg font-bold text-gray-800 mb-3 flex items-center">
                    <i class="fas fa-prescription-bottle text-blue-500 mr-2"></i>
                    Treatment
                </h3>
                <ul class="space-y-2">
                    ${disease.treatment.map(t => `
                        <li class="flex items-start">
                            <i class="fas fa-circle text-xs text-blue-500 mr-3 mt-1"></i>
                            <span class="text-gray-700">${t}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
            
            <div>
                <h3 class="text-lg font-bold text-gray-800 mb-3 flex items-center">
                    <i class="fas fa-shield-alt text-green-500 mr-2"></i>
                    Prevention
                </h3>
                <ul class="space-y-2">
                    ${disease.prevention.map(p => `
                        <li class="flex items-start">
                            <i class="fas fa-circle text-xs text-green-500 mr-3 mt-1"></i>
                            <span class="text-gray-700">${p}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
}

// Close modal
function closeModal() {
    document.getElementById('diseaseModal').classList.add('hidden');
}

// Close modal on outside click
document.getElementById('diseaseModal').addEventListener('click', (e) => {
    if (e.target.id === 'diseaseModal') {
        closeModal();
    }
});
