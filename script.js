// Indian House Price Prediction Platform JavaScript

class HousePricePredictionApp {
    constructor() {
        this.map = null;
        this.markers = [];
        this.properties = [];
        this.currentLocation = null;
        this.formData = null;
        this.currentMode = 'buyer';
        this.minPredictedPrice = 0;
        this.maxPredictedPrice = 0;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupLocationAutocomplete();
        
        // Debug: Check if seller form exists
        setTimeout(() => {
            const sellerForm = document.getElementById('sellerForm');
            const sellerSubmitBtn = document.getElementById('sellerSubmitBtn');
            console.log('Seller form elements check:', { 
                sellerForm: !!sellerForm, 
                sellerSubmitBtn: !!sellerSubmitBtn 
            });
            
            if (!sellerForm || !sellerSubmitBtn) {
                console.error('Seller form elements not found!');
            }
        }, 1000);
    }

    setupEventListeners() {
        // Phase toggle
        document.getElementById('buyerModeTab').addEventListener('click', () => {
            this.switchMode('buyer');
        });

        document.getElementById('sellerModeTab').addEventListener('click', () => {
            this.switchMode('seller');
        });

        // Form submission (buyer mode)
        document.getElementById('predictionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmission();
        });

        // Form submission (seller mode) - Add better error handling
        const sellerForm = document.getElementById('sellerForm');
        if (sellerForm) {
            sellerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('SELLER FORM SUBMIT EVENT FIRED!'); // Debug log
                this.handleSellerFormSubmission();
            });
            
            // Also add click test
            const submitBtn = document.getElementById('sellerSubmitBtn');
            if (submitBtn) {
                submitBtn.addEventListener('click', (e) => {
                    console.log('SELLER SUBMIT BUTTON CLICKED!'); // Debug log
                    e.preventDefault(); // Prevent double submission
                });
            }
        } else {
            console.error('Seller form not found!');
        }

        // Back button
        document.getElementById('backBtn').addEventListener('click', () => {
            this.showBuyerMode();
        });

        // Location button
        document.getElementById('locationBtn').addEventListener('click', () => {
            this.getCurrentLocation();
        });

        // Zone tabs
        document.querySelectorAll('.zone-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.filterProperties(e.target.dataset.zone);
                this.updateActiveTab(e.target);
            });
        });

        // Price slider
        document.getElementById('priceSlider').addEventListener('input', (e) => {
            this.updatePriceSlider(e.target.value);
        });

        // Form validation on input
        document.getElementById('houseSize').addEventListener('input', (e) => {
            this.validateHouseSize(e.target);
        });

        document.getElementById('bhk').addEventListener('change', (e) => {
            this.validateBHK(e.target);
        });

        document.getElementById('location').addEventListener('input', (e) => {
            this.validateLocation(e.target);
            this.handleLocationInput(e.target.value);
        });

        // Seller form validation
        document.getElementById('sellerHouseSize').addEventListener('input', (e) => {
            this.validateSellerHouseSize(e.target);
        });

        document.getElementById('sellerBhk').addEventListener('change', (e) => {
            this.validateSellerBHK(e.target);
        });

        document.getElementById('sellerLocation').addEventListener('input', (e) => {
            this.validateSellerLocation(e.target);
        });
    }

    switchMode(mode) {
        if (this.currentMode === mode) return;
        
        const buyerMode = document.getElementById('buyerMode');
        const sellerMode = document.getElementById('sellerMode');
        const buyerTab = document.getElementById('buyerModeTab');
        const sellerTab = document.getElementById('sellerModeTab');
        
        // Add fade out animation
        const currentMain = mode === 'buyer' ? sellerMode : buyerMode;
        currentMain.classList.add('fade-out');
        
        setTimeout(() => {
            if (mode === 'buyer') {
                buyerMode.style.display = 'block';
                sellerMode.style.display = 'none';
                buyerTab.classList.add('active');
                sellerTab.classList.remove('active');
            } else {
                sellerMode.style.display = 'block';
                buyerMode.style.display = 'none';
                sellerTab.classList.add('active');
                buyerTab.classList.remove('active');
            }
            
            // Add fade in animation
            const newMain = mode === 'buyer' ? buyerMode : sellerMode;
            newMain.classList.remove('fade-out');
            newMain.classList.add('fade-in');
            
            setTimeout(() => {
                newMain.classList.remove('fade-in');
            }, 300);
            
            this.currentMode = mode;
        }, 300);
    }

    showBuyerMode() {
        document.getElementById('resultsPage').style.display = 'none';
        document.getElementById('buyerMode').style.display = 'block';
        
        // Reset form
        document.getElementById('predictionForm').reset();
        this.clearValidationErrors();
        
        // Destroy map
        if (this.map) {
            this.map.remove();
            this.map = null;
            this.markers = [];
        }
    }

    setupLocationAutocomplete() {
        // Indian cities and areas for autocomplete
        this.indianLocations = [
            'Mumbai, Maharashtra', 'Delhi, NCR', 'Bangalore, Karnataka', 'Hyderabad, Telangana',
            'Chennai, Tamil Nadu', 'Kolkata, West Bengal', 'Pune, Maharashtra', 'Ahmedabad, Gujarat',
            'Jaipur, Rajasthan', 'Surat, Gujarat', 'Lucknow, Uttar Pradesh', 'Kanpur, Uttar Pradesh',
            'Nagpur, Maharashtra', 'Indore, Madhya Pradesh', 'Thane, Maharashtra', 'Bhopal, Madhya Pradesh',
            'Visakhapatnam, Andhra Pradesh', 'Pimpri-Chinchwad, Maharashtra', 'Patna, Bihar',
            'Vadodara, Gujarat', 'Ghaziabad, Uttar Pradesh', 'Ludhiana, Punjab', 'Agra, Uttar Pradesh',
            'Nashik, Maharashtra', 'Faridabad, Haryana', 'Meerut, Uttar Pradesh', 'Rajkot, Gujarat',
            'Kalyan-Dombivali, Maharashtra', 'Vasai-Virar, Maharashtra', 'Varanasi, Uttar Pradesh',
            'Srinagar, Jammu & Kashmir', 'Dhanbad, Jharkhand', 'Jodhpur, Rajasthan', 'Amritsar, Punjab',
            'Raipur, Chhattisgarh', 'Allahabad, Uttar Pradesh', 'Ranchi, Jharkhand', 'Gwalior, Madhya Pradesh',
            'Vijayawada, Andhra Pradesh', 'Madurai, Tamil Nadu', 'Jabalpur, Madhya Pradesh',
            'Coimbatore, Tamil Nadu', 'Aurangabad, Maharashtra', 'Solapur, Maharashtra', 'Hubli-Dharwad, Karnataka',
            'Tiruchirappalli, Tamil Nadu', 'Bareilly, Uttar Pradesh', 'Gurgaon, Haryana',
            'Aligarh, Uttar Pradesh', 'Jalandhar, Punjab', 'Tirupur, Tamil Nadu', 'Bhubaneswar, Odisha',
            'Salem, Tamil Nadu', 'Mira-Bhayandar, Maharashtra', 'Thiruvananthapuram, Kerala',
            'Bhiwandi, Maharashtra', 'Saharanpur, Uttar Pradesh', 'Guntur, Andhra Pradesh',
            'Amravati, Maharashtra', 'Bikaner, Rajasthan', 'Noida, Uttar Pradesh', 'Warangal, Telangana',
            'Cuttack, Odisha', 'Firozabad, Uttar Pradesh', 'Kochi, Kerala', 'Bhilai, Chhattisgarh',
            'Kochi, Kerala', 'Navi Mumbai, Maharashtra', 'Kota, Rajasthan', 'Pondicherry, Puducherry'
        ];
    }

    handleLocationInput(value) {
        const suggestionsContainer = document.getElementById('locationSuggestions');
        
        if (value.length < 2) {
            suggestionsContainer.style.display = 'none';
            return;
        }

        const filteredLocations = this.indianLocations.filter(location =>
            location.toLowerCase().includes(value.toLowerCase())
        );

        if (filteredLocations.length > 0) {
            suggestionsContainer.innerHTML = filteredLocations
                .slice(0, 5)
                .map(location => `
                    <div class="suggestion-item" onclick="app.selectLocation('${location}')">
                        <i class="fas fa-map-marker-alt"></i> ${location}
                    </div>
                `).join('');
            suggestionsContainer.style.display = 'block';
        } else {
            suggestionsContainer.style.display = 'none';
        }
    }

    selectLocation(location) {
        document.getElementById('location').value = location;
        document.getElementById('locationSuggestions').style.display = 'none';
        this.validateLocation(document.getElementById('location'));
    }

    validateHouseSize(input) {
        const value = parseInt(input.value);
        const errorElement = document.getElementById('houseSizeError');
        
        if (!value || value < 200) {
            errorElement.textContent = 'House size must be at least 200 sq. ft.';
            errorElement.style.display = 'block';
            input.style.borderColor = '#ef4444';
            return false;
        }
        
        if (value > 10000) {
            errorElement.textContent = 'House size must be less than 10,000 sq. ft.';
            errorElement.style.display = 'block';
            input.style.borderColor = '#ef4444';
            return false;
        }
        
        errorElement.style.display = 'none';
        input.style.borderColor = '#10b981';
        return true;
    }

    validateBHK(input) {
        const value = input.value;
        const errorElement = document.getElementById('bhkError');
        
        if (!value) {
            errorElement.textContent = 'Please select number of rooms';
            errorElement.style.display = 'block';
            input.style.borderColor = '#ef4444';
            return false;
        }
        
        errorElement.style.display = 'none';
        input.style.borderColor = '#10b981';
        return true;
    }

    validateLocation(input) {
        const value = input.value.trim();
        const errorElement = document.getElementById('locationError');
        
        if (!value || value.length < 3) {
            errorElement.textContent = 'Please enter a valid location';
            errorElement.style.display = 'block';
            input.style.borderColor = '#ef4444';
            return false;
        }
        
        errorElement.style.display = 'none';
        input.style.borderColor = '#10b981';
        return true;
    }

    getCurrentLocation() {
        if (navigator.geolocation) {
            const btn = document.getElementById('locationBtn');
            btn.innerHTML = '<div class="loading"></div>';
            btn.disabled = true;

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    // Simulate getting location name from coordinates
                    const locations = ['Mumbai, Maharashtra', 'Bangalore, Karnataka', 'Delhi, NCR'];
                    const randomLocation = locations[Math.floor(Math.random() * locations.length)];
                    document.getElementById('location').value = randomLocation;
                    btn.innerHTML = '<i class="fas fa-crosshairs"></i>';
                    btn.disabled = false;
                    this.validateLocation(document.getElementById('location'));
                },
                (error) => {
                    btn.innerHTML = '<i class="fas fa-crosshairs"></i>';
                    btn.disabled = false;
                    alert('Unable to get your location. Please enter manually.');
                }
            );
        } else {
            alert('Geolocation is not supported by your browser.');
        }
    }

    handleFormSubmission() {
        const houseSizeInput = document.getElementById('houseSize');
        const bhkInput = document.getElementById('bhk');
        const locationInput = document.getElementById('location');

        // Validate all fields
        const isHouseSizeValid = this.validateHouseSize(houseSizeInput);
        const isBHKValid = this.validateBHK(bhkInput);
        const isLocationValid = this.validateLocation(locationInput);

        if (!isHouseSizeValid || !isBHKValid || !isLocationValid) {
            return;
        }

        // Store form data
        this.formData = {
            houseSize: parseInt(houseSizeInput.value),
            bhk: parseInt(bhkInput.value),
            location: locationInput.value.trim()
        };

        // Show loading state
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.innerHTML = '<div class="loading"></div> Predicting...';
        submitBtn.disabled = true;

        // Simulate API call
        setTimeout(() => {
            this.generatePredictions();
            this.showResultsPage();
            submitBtn.innerHTML = '<i class="fas fa-chart-line"></i> Predict House Prices';
            submitBtn.disabled = false;
        }, 2000);
    }

    handleSellerFormSubmission() {
        console.log('=== SELLER FORM SUBMISSION START ==='); // Debug log
        
        try {
            // Check if we're in seller mode
            if (this.currentMode !== 'seller') {
                console.error('Not in seller mode! Current mode:', this.currentMode);
                alert('Please switch to Seller Mode first.');
                return;
            }
            
            const houseSizeInput = document.getElementById('sellerHouseSize');
            const bhkInput = document.getElementById('sellerBhk');
            const locationInput = document.getElementById('sellerLocation');

            console.log('Inputs found:', { 
                houseSizeInput: !!houseSizeInput, 
                bhkInput: !!bhkInput, 
                locationInput: !!locationInput 
            }); // Debug log

            if (!houseSizeInput || !bhkInput || !locationInput) {
                console.error('Required inputs not found!');
                alert('Form inputs not found. Please refresh the page and try again.');
                return;
            }

            console.log('Input values:', {
                houseSize: houseSizeInput.value,
                bhk: bhkInput.value,
                location: locationInput.value
            });

            // Validate all fields
            const isHouseSizeValid = this.validateSellerHouseSize(houseSizeInput);
            const isBHKValid = this.validateSellerBHK(bhkInput);
            const isLocationValid = this.validateSellerLocation(locationInput);

            console.log('Validation results:', { isHouseSizeValid, isBHKValid, isLocationValid }); // Debug log

            if (!isHouseSizeValid || !isBHKValid || !isLocationValid) {
                console.log('Validation failed - stopping submission'); // Debug log
                alert('Please fill in all required fields correctly.');
                return;
            }

            // Show loading state
            const submitBtn = document.getElementById('sellerSubmitBtn');
            if (!submitBtn) {
                console.error('Submit button not found!');
                return;
            }
            
            submitBtn.innerHTML = '<div class="loading"></div> Submitting...';
            submitBtn.disabled = true;

            console.log('Loading state set'); // Debug log

            // Collect form data
            const formData = {
                id: Date.now(),
                houseSize: parseInt(houseSizeInput.value),
                bhk: parseInt(bhkInput.value),
                location: locationInput.value.trim(),
                nearbySchools: document.getElementById('nearbySchools')?.value || '',
                nearbyHospitals: document.getElementById('nearbyHospitals')?.value || '',
                transportAccess: document.getElementById('transportAccess')?.value || '',
                crimeRate: document.getElementById('crimeRate')?.value || '',
                shoppingMalls: document.getElementById('shoppingMalls')?.value || '',
                waterSupply: document.getElementById('waterSupply')?.value || '',
                propertyDescription: document.getElementById('propertyDescription')?.value || '',
                propertyImages: document.getElementById('propertyImages')?.files || null,
                submittedAt: new Date().toISOString(),
                status: 'pending'
            };

            console.log('Form data collected:', formData); // Debug log

            // Save to localStorage
            this.saveSellerListing(formData);

            console.log('Listing saved to localStorage'); // Debug log

            // Simulate API call
            setTimeout(() => {
                console.log('Showing success message'); // Debug log
                alert('Property listed successfully! Our team will review and publish your listing within 24 hours.');
                
                // Reset form
                document.getElementById('sellerForm').reset();
                this.clearSellerValidationErrors();
                
                submitBtn.innerHTML = '<i class="fas fa-upload"></i> List Property for Sale';
                submitBtn.disabled = false;

                console.log('Form reset and button restored'); // Debug log

                // Show My Listings button
                this.showMyListingsButton();
                
                console.log('My Listings button shown'); // Debug log
                console.log('=== SELLER FORM SUBMISSION SUCCESS ==='); // Debug log
            }, 2000);

        } catch (error) {
            console.error('=== SELLER FORM SUBMISSION ERROR ==='); // Debug log
            console.error('Error details:', error);
            console.error('Error stack:', error.stack);
            
            alert('An error occurred while submitting your listing. Please try again.\n\nError: ' + error.message);
            
            // Reset button state
            const submitBtn = document.getElementById('sellerSubmitBtn');
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-upload"></i> List Property for Sale';
                submitBtn.disabled = false;
            }
        }
    }

    saveSellerListing(listingData) {
        // Get existing listings from localStorage
        let listings = JSON.parse(localStorage.getItem('sellerListings') || '[]');
        listings.push(listingData);
        localStorage.setItem('sellerListings', JSON.stringify(listings));
    }

    showMyListingsButton() {
        // Check if button already exists
        if (!document.getElementById('myListingsBtn')) {
            const button = document.createElement('button');
            button.id = 'myListingsBtn';
            button.className = 'my-listings-btn';
            button.innerHTML = '<i class="fas fa-list"></i> View My Listings';
            button.onclick = () => this.showMyListings();
            
            // Insert after the form
            const formContainer = document.querySelector('.form-container');
            formContainer.appendChild(button);
        }
    }

    showMyListings() {
        const listings = JSON.parse(localStorage.getItem('sellerListings') || '[]');
        
        if (listings.length === 0) {
            alert('You have no listings yet. List your first property to see it here!');
            return;
        }

        // Create listings modal/page
        this.createMyListingsPage(listings);
    }

    createMyListingsPage(listings) {
        // Hide seller form
        document.getElementById('sellerForm').parentElement.style.display = 'none';
        
        // Create listings container
        const listingsContainer = document.createElement('div');
        listingsContainer.className = 'my-listings-container';
        listingsContainer.innerHTML = `
            <div class="listings-header">
                <h2><i class="fas fa-list"></i> My Property Listings</h2>
                <button class="back-to-form-btn" onclick="app.backToSellerForm()">
                    <i class="fas fa-arrow-left"></i> Back to Form
                </button>
            </div>
            <div class="listings-grid">
                ${listings.map(listing => this.createListingCard(listing)).join('')}
            </div>
        `;
        
        // Insert after the form container
        const formContainer = document.querySelector('.form-container');
        formContainer.appendChild(listingsContainer);
    }

    createListingCard(listing) {
        const statusColors = {
            'pending': '#f59e0b',
            'approved': '#10b981',
            'rejected': '#ef4444'
        };

        const statusText = {
            'pending': 'Under Review',
            'approved': 'Published',
            'rejected': 'Rejected'
        };

        return `
            <div class="listing-card">
                <div class="listing-header">
                    <div class="listing-title">
                        <h3>${listing.bhk} BHK Property</h3>
                        <span class="listing-status" style="color: ${statusColors[listing.status]}">
                            <i class="fas fa-circle"></i> ${statusText[listing.status]}
                        </span>
                    </div>
                    <div class="listing-date">
                        Submitted: ${new Date(listing.submittedAt).toLocaleDateString()}
                    </div>
                </div>
                
                <div class="listing-details">
                    <div class="detail-row">
                        <span class="detail-label">Size:</span>
                        <span class="detail-value">${listing.houseSize.toLocaleString()} sq. ft.</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Location:</span>
                        <span class="detail-value">${listing.location}</span>
                    </div>
                    ${listing.nearbySchools ? `
                        <div class="detail-row">
                            <span class="detail-label">Schools:</span>
                            <span class="detail-value">${listing.nearbySchools}</span>
                        </div>
                    ` : ''}
                    ${listing.nearbyHospitals ? `
                        <div class="detail-row">
                            <span class="detail-label">Hospitals:</span>
                            <span class="detail-value">${listing.nearbyHospitals}</span>
                        </div>
                    ` : ''}
                    ${listing.propertyDescription ? `
                        <div class="detail-row">
                            <span class="detail-label">Description:</span>
                            <span class="detail-value">${listing.propertyDescription.substring(0, 100)}${listing.propertyDescription.length > 100 ? '...' : ''}</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="listing-actions">
                    <button class="edit-btn" onclick="app.editListing(${listing.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="delete-btn" onclick="app.deleteListing(${listing.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }

    backToSellerForm() {
        // Remove listings container
        const listingsContainer = document.querySelector('.my-listings-container');
        if (listingsContainer) {
            listingsContainer.remove();
        }
        
        // Show seller form
        document.getElementById('sellerForm').parentElement.style.display = 'block';
    }

    editListing(listingId) {
        alert('Edit functionality would be implemented here. Listing ID: ' + listingId);
    }

    deleteListing(listingId) {
        if (confirm('Are you sure you want to delete this listing?')) {
            let listings = JSON.parse(localStorage.getItem('sellerListings') || '[]');
            listings = listings.filter(listing => listing.id !== listingId);
            localStorage.setItem('sellerListings', JSON.stringify(listings));
            
            // Refresh the listings page
            this.backToSellerForm();
            this.showMyListings();
        }
    }

    // Seller form validation methods
    validateSellerHouseSize(input) {
        const value = parseInt(input.value);
        const errorElement = document.getElementById('sellerHouseSizeError');
        
        if (!value || value < 200) {
            errorElement.textContent = 'Property size must be at least 200 sq. ft.';
            errorElement.style.display = 'block';
            input.style.borderColor = '#ef4444';
            return false;
        }
        
        if (value > 10000) {
            errorElement.textContent = 'Property size must be less than 10,000 sq. ft.';
            errorElement.style.display = 'block';
            input.style.borderColor = '#ef4444';
            return false;
        }
        
        errorElement.style.display = 'none';
        input.style.borderColor = '#10b981';
        return true;
    }

    validateSellerBHK(input) {
        const value = input.value;
        const errorElement = document.getElementById('sellerBhkError');
        
        if (!value) {
            errorElement.textContent = 'Please select number of rooms';
            errorElement.style.display = 'block';
            input.style.borderColor = '#ef4444';
            return false;
        }
        
        errorElement.style.display = 'none';
        input.style.borderColor = '#10b981';
        return true;
    }

    validateSellerLocation(input) {
        const value = input.value.trim();
        const errorElement = document.getElementById('sellerLocationError');
        
        if (!value || value.length < 10) {
            errorElement.textContent = 'Please enter complete address details (minimum 10 characters)';
            errorElement.style.display = 'block';
            input.style.borderColor = '#ef4444';
            return false;
        }
        
        errorElement.style.display = 'none';
        input.style.borderColor = '#10b981';
        return true;
    }

    clearSellerValidationErrors() {
        document.querySelectorAll('[id$="Error"]').forEach(error => {
            error.style.display = 'none';
        });
        
        document.querySelectorAll('.seller-form input, .seller-form select, .seller-form textarea').forEach(input => {
            input.style.borderColor = '#e2e8f0';
        });
    }

    generatePredictions() {
        // Generate mock properties based on form data
        const basePrice = this.calculateBasePrice();
        const propertyCount = 12;
        
        this.properties = [];
        
        for (let i = 0; i < propertyCount; i++) {
            const property = this.generateProperty(basePrice, i);
            this.properties.push(property);
        }

        // Enhanced sorting: First by zone, then by match percentage within each zone
        this.properties.sort((a, b) => {
            // Zone priority: Affordable -> Mid-Range -> Luxury
            const zoneOrder = { 'affordable': 0, 'mid-range': 1, 'luxury': 2 };
            const zoneDiff = zoneOrder[a.zone] - zoneOrder[b.zone];
            
            if (zoneDiff !== 0) {
                return zoneDiff; // Sort by zone first
            }
            
            // Then by match percentage (descending)
            return b.matchPercentage - a.matchPercentage;
        });

        // Update prediction insights
        this.updatePredictionInsights(basePrice);
    }

    calculateBasePrice() {
        const { houseSize, bhk, location } = this.formData;
        
        // Base price calculation (simplified for demo)
        let basePrice = houseSize * 8000; // Base rate per sq ft
        
        // BHK multiplier
        const bhkMultiplier = { 1: 0.8, 2: 1.0, 3: 1.2, 4: 1.4, 5: 1.6, 6: 1.8 };
        basePrice *= bhkMultiplier[bhk] || 1.0;
        
        // Location multiplier (simplified)
        const locationMultiplier = this.getLocationMultiplier(location);
        basePrice *= locationMultiplier;
        
        return Math.round(basePrice);
    }

    getLocationMultiplier(location) {
        const multipliers = {
            'mumbai': 2.5, 'delhi': 2.2, 'bangalore': 2.0, 'hyderabad': 1.8,
            'chennai': 1.7, 'kolkata': 1.5, 'pune': 1.6, 'ahmedabad': 1.3,
            'jaipur': 1.2, 'surat': 1.4, 'lucknow': 1.1, 'kanpur': 1.0
        };
        
        const lowerLocation = location.toLowerCase();
        for (const [city, multiplier] of Object.entries(multipliers)) {
            if (lowerLocation.includes(city)) {
                return multiplier;
            }
        }
        
        return 1.0; // Default multiplier
    }

    generateProperty(basePrice, index) {
        const zones = ['affordable', 'mid-range', 'luxury'];
        const zone = zones[Math.floor(Math.random() * zones.length)];
        
        const zoneMultipliers = {
            'affordable': { min: 0.7, max: 0.9 },
            'mid-range': { min: 0.9, max: 1.1 },
            'luxury': { min: 1.1, max: 1.5 }
        };
        
        const multiplier = zoneMultipliers[zone];
        const variance = multiplier.min + Math.random() * (multiplier.max - multiplier.min);
        const price = Math.round(basePrice * variance);
        
        const property = {
            id: index + 1,
            title: `${this.getRandomBHK()} BHK ${this.getRandomPropertyType()}`,
            location: this.getRandomLocation(),
            size: this.formData.houseSize + Math.round((Math.random() - 0.5) * 500),
            bhk: this.getRandomBHK(),
            zone: zone,
            matchPercentage: Math.round(85 + Math.random() * 14),
            minPrice: Math.round(price * 0.9),
            maxPrice: Math.round(price * 1.1),
            intelligence: this.generateLocationIntelligence(),
            coordinates: this.generateCoordinates()
        };
        
        return property;
    }

    getRandomBHK() {
        const bhks = [1, 2, 3, 4, 5];
        return bhks[Math.floor(Math.random() * bhks.length)];
    }

    getRandomPropertyType() {
        const types = ['Apartment', 'Flat', 'Villa', 'Independent House', 'Builder Floor'];
        return types[Math.floor(Math.random() * types.length)];
    }

    getRandomLocation() {
        const areas = {
            'Mumbai': ['Andheri', 'Bandra', 'Juhu', 'Worli', 'Marine Lines', 'Powai'],
            'Bangalore': ['Indiranagar', 'Koramangala', 'Whitefield', 'HSR Layout', 'Jayanagar'],
            'Delhi': ['Connaught Place', 'Karol Bagh', 'Rohini', 'Dwarka', 'Lajpat Nagar'],
            'Hyderabad': ['Banjara Hills', 'Jubilee Hills', 'Gachibowli', 'Madhapur', 'Kukatpally']
        };
        
        const cities = Object.keys(areas);
        const city = cities[Math.floor(Math.random() * cities.length)];
        const areaList = areas[city];
        const area = areaList[Math.floor(Math.random() * areaList.length)];
        
        return `${area}, ${city}`;
    }

    generateLocationIntelligence() {
        return {
            school: this.getRandomIntelligenceLevel(),
            hospital: this.getRandomIntelligenceLevel(),
            metro: this.getRandomIntelligenceLevel(),
            crime: this.getRandomIntelligenceLevel(),
            mall: this.getRandomIntelligenceLevel(),
            water: this.getRandomIntelligenceLevel()
        };
    }

    getRandomIntelligenceLevel() {
        const levels = ['excellent', 'good', 'moderate', 'poor'];
        const weights = [0.3, 0.4, 0.2, 0.1]; // Weighted probabilities
        
        const random = Math.random();
        let cumulative = 0;
        
        for (let i = 0; i < levels.length; i++) {
            cumulative += weights[i];
            if (random < cumulative) {
                return levels[i];
            }
        }
        
        return 'moderate';
    }

    generateCoordinates() {
        // Comprehensive Indian city coordinates for accurate mapping
        const cityCoordinates = {
            'Mumbai': [19.0760, 72.8777],
            'Delhi': [28.7041, 77.1025],
            'Bangalore': [12.9716, 77.5946],
            'Hyderabad': [17.3850, 78.4867],
            'Chennai': [13.0827, 80.2707],
            'Kolkata': [22.5726, 88.3639],
            'Pune': [18.5204, 73.8567],
            'Ahmedabad': [23.0225, 72.5714],
            'Jaipur': [26.9124, 75.7873],
            'Surat': [21.1702, 72.8311],
            'Lucknow': [26.8467, 80.9462],
            'Kanpur': [26.4499, 80.3319],
            'Nagpur': [21.1458, 79.0882],
            'Indore': [22.7196, 75.8577],
            'Thane': [19.2183, 72.9781],
            'Bhopal': [23.2599, 77.4126],
            'Visakhapatnam': [17.6868, 83.2185],
            'Pimpri-Chinchwad': [18.6298, 73.7997],
            'Patna': [25.5941, 85.1376],
            'Vadodara': [22.3072, 73.1812],
            'Ghaziabad': [28.6692, 77.4538],
            'Ludhiana': [30.9010, 75.8573],
            'Agra': [27.1767, 78.0081],
            'Nashik': [19.9975, 73.7898],
            'Faridabad': [28.4089, 77.3178],
            'Meerut': [28.9845, 77.7064],
            'Rajkot': [22.3039, 70.8022],
            'Kalyan-Dombivali': [19.2403, 73.1305],
            'Vasai-Virar': [19.4912, 72.8395],
            'Varanasi': [25.3176, 82.9739],
            'Srinagar': [34.0837, 74.7973],
            'Dhanbad': [23.7957, 86.4304],
            'Jodhpur': [26.2389, 73.0243],
            'Amritsar': [31.6340, 74.8723],
            'Raipur': [21.2514, 81.6296],
            'Allahabad': [25.4358, 81.8463],
            'Ranchi': [23.3441, 85.3096],
            'Gwalior': [26.2124, 78.1772],
            'Vijayawada': [16.5062, 80.6480],
            'Madurai': [9.9252, 78.1198],
            'Jabalpur': [23.1815, 79.9864],
            'Coimbatore': [11.0168, 76.9558],
            'Aurangabad': [19.8762, 75.3433],
            'Solapur': [17.6599, 75.9064],
            'Hubli-Dharwad': [15.3647, 75.1240],
            'Tiruchirappalli': [10.7905, 78.7047],
            'Bareilly': [28.3666, 79.4302],
            'Gurgaon': [28.4595, 77.0266],
            'Aligarh': [27.8974, 78.0884],
            'Jalandhar': [31.3260, 75.5762],
            'Tirupur': [11.1085, 77.3411],
            'Bhubaneswar': [20.2961, 85.8245],
            'Salem': [11.6643, 78.1460],
            'Mira-Bhayandar': [19.2940, 72.8555],
            'Thiruvananthapuram': [8.5241, 76.9366],
            'Bhiwandi': [19.3028, 73.0420],
            'Kochi': [9.9312, 76.2673],
            'Bhilai': [21.1951, 81.3770],
            'Cuttack': [20.4625, 85.8830],
            'Firozabad': [27.1491, 78.4021],
            'Noida': [28.5355, 77.3910],
            'Warangal': [17.9784, 79.5941]
        };
        
        // Try to match user's location input with our database
        const userLocation = this.formData.location.toLowerCase();
        let matchedCity = null;
        
        // First try exact match
        for (const [city, coords] of Object.entries(cityCoordinates)) {
            if (userLocation.includes(city.toLowerCase())) {
                matchedCity = city;
                break;
            }
        }
        
        // If no match, use a random major city
        if (!matchedCity) {
            const majorCities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune'];
            matchedCity = majorCities[Math.floor(Math.random() * majorCities.length)];
        }
        
        const [lat, lng] = cityCoordinates[matchedCity];
        
        // Add small variance for different properties (within city bounds)
        const newLat = lat + (Math.random() - 0.5) * 0.05; // Smaller variance for accuracy
        const newLng = lng + (Math.random() - 0.5) * 0.05;
        
        return [newLat, newLng];
    }

    updatePredictionInsights(basePrice) {
        this.minPredictedPrice = Math.round(basePrice * 0.8);
        this.maxPredictedPrice = Math.round(basePrice * 1.2);
        
        document.getElementById('minPrice').textContent = `₹${this.minPredictedPrice.toLocaleString('en-IN')}`;
        document.getElementById('maxPrice').textContent = `₹${this.maxPredictedPrice.toLocaleString('en-IN')}`;
        document.getElementById('resultsLocation').textContent = `Properties near ${this.formData.location}`;
        
        // Initialize price slider
        this.initializePriceSlider();
    }

    initializePriceSlider() {
        const slider = document.getElementById('priceSlider');
        const sliderValue = document.getElementById('sliderValue');
        
        slider.min = 0;
        slider.max = 100;
        slider.value = 50;
        
        this.updatePriceSlider(50);
    }

    updatePriceSlider(value) {
        const sliderValue = document.getElementById('sliderValue');
        const percentage = parseInt(value);
        
        const priceRange = this.maxPredictedPrice - this.minPredictedPrice;
        const currentPrice = Math.round(this.minPredictedPrice + (priceRange * percentage / 100));
        
        sliderValue.textContent = `₹${currentPrice.toLocaleString('en-IN')}`;
        
        // Update slider background
        const slider = document.getElementById('priceSlider');
        const percentageStr = `${percentage}%`;
        slider.style.background = `linear-gradient(to right, #4f46e5 0%, #4f46e5 ${percentageStr}, #e2e8f0 ${percentageStr}, #e2e8f0 100%)`;
    }

    showResultsPage() {
        document.getElementById('buyerMode').style.display = 'none';
        document.getElementById('resultsPage').style.display = 'block';
        
        // Initialize map
        setTimeout(() => {
            this.initializeMap();
            this.displayProperties('all');
        }, 100);
    }

    showLandingPage() {
        this.showBuyerMode();
    }

    clearValidationErrors() {
        document.querySelectorAll('.error-message').forEach(error => {
            error.style.display = 'none';
        });
        
        document.querySelectorAll('input, select').forEach(input => {
            input.style.borderColor = '#e2e8f0';
        });
    }

    initializeMap() {
        // Initialize map centered on user's selected location
        const userLocation = this.formData.location.toLowerCase();
        let centerCoords = [20.5937, 78.9629]; // Default: India center
        let zoomLevel = 5;
        
        // Try to match user's location with our coordinates database
        const cityCoordinates = {
            'Mumbai': [19.0760, 72.8777],
            'Delhi': [28.7041, 77.1025],
            'Bangalore': [12.9716, 77.5946],
            'Hyderabad': [17.3850, 78.4867],
            'Chennai': [13.0827, 80.2707],
            'Kolkata': [22.5726, 88.3639],
            'Pune': [18.5204, 73.8567],
            'Ahmedabad': [23.0225, 72.5714],
            'Jaipur': [26.9124, 75.7873],
            'Surat': [21.1702, 72.8311],
            'Lucknow': [26.8467, 80.9462],
            'Kanpur': [26.4499, 80.3319],
            'Nagpur': [21.1458, 79.0882],
            'Indore': [22.7196, 75.8577],
            'Thane': [19.2183, 72.9781],
            'Bhopal': [23.2599, 77.4126],
            'Visakhapatnam': [17.6868, 83.2185],
            'Pimpri-Chinchwad': [18.6298, 73.7997],
            'Patna': [25.5941, 85.1376],
            'Vadodara': [22.3072, 73.1812],
            'Ghaziabad': [28.6692, 77.4538],
            'Ludhiana': [30.9010, 75.8573],
            'Agra': [27.1767, 78.0081],
            'Nashik': [19.9975, 73.7898],
            'Faridabad': [28.4089, 77.3178],
            'Meerut': [28.9845, 77.7064],
            'Rajkot': [22.3039, 70.8022],
            'Kalyan-Dombivali': [19.2403, 73.1305],
            'Vasai-Virar': [19.4912, 72.8395],
            'Varanasi': [25.3176, 82.9739],
            'Srinagar': [34.0837, 74.7973],
            'Dhanbad': [23.7957, 86.4304],
            'Jodhpur': [26.2389, 73.0243],
            'Amritsar': [31.6340, 74.8723],
            'Raipur': [21.2514, 81.6296],
            'Allahabad': [25.4358, 81.8463],
            'Ranchi': [23.3441, 85.3096],
            'Gwalior': [26.2124, 78.1772],
            'Vijayawada': [16.5062, 80.6480],
            'Madurai': [9.9252, 78.1198],
            'Jabalpur': [23.1815, 79.9864],
            'Coimbatore': [11.0168, 76.9558],
            'Aurangabad': [19.8762, 75.3433],
            'Solapur': [17.6599, 75.9064],
            'Hubli-Dharwad': [15.3647, 75.1240],
            'Tiruchirappalli': [10.7905, 78.7047],
            'Bareilly': [28.3666, 79.4302],
            'Gurgaon': [28.4595, 77.0266],
            'Aligarh': [27.8974, 78.0884],
            'Jalandhar': [31.3260, 75.5762],
            'Tirupur': [11.1085, 77.3411],
            'Bhubaneswar': [20.2961, 85.8245],
            'Salem': [11.6643, 78.1460],
            'Mira-Bhayandar': [19.2940, 72.8555],
            'Thiruvananthapuram': [8.5241, 76.9366],
            'Bhiwandi': [19.3028, 73.0420],
            'Kochi': [9.9312, 76.2673],
            'Bhilai': [21.1951, 81.3770],
            'Cuttack': [20.4625, 85.8830],
            'Firozabad': [27.1491, 78.4021],
            'Noida': [28.5355, 77.3910],
            'Warangal': [17.9784, 79.5941]
        };
        
        // Find matching city for better map centering
        for (const [city, coords] of Object.entries(cityCoordinates)) {
            if (userLocation.includes(city.toLowerCase())) {
                centerCoords = coords;
                zoomLevel = 11; // Closer zoom for specific city
                break;
            }
        }
        
        this.map = L.map('map').setView(centerCoords, zoomLevel);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);
    }

    displayProperties(zoneFilter) {
        const propertiesGrid = document.getElementById('propertiesGrid');
        const filteredProperties = zoneFilter === 'all' 
            ? this.properties 
            : this.properties.filter(p => p.zone === zoneFilter);
        
        propertiesGrid.innerHTML = '';
        
        if (filteredProperties.length === 0) {
            propertiesGrid.innerHTML = '<div class="no-properties">No properties found in this zone.</div>';
            return;
        }
        
        // Group properties by zone for better organization
        const groupedProperties = this.groupPropertiesByZone(filteredProperties);
        
        // Display properties with zone headers
        Object.entries(groupedProperties).forEach(([zone, properties]) => {
            if (properties.length > 0) {
                // Add zone header
                const zoneHeader = this.createZoneHeader(zone);
                propertiesGrid.appendChild(zoneHeader);
                
                // Add properties in this zone
                properties.forEach(property => {
                    const propertyCard = this.createPropertyCard(property);
                    propertiesGrid.appendChild(propertyCard);
                });
            }
        });
        
        // Update map markers
        this.updateMapMarkers(filteredProperties);
    }

    groupPropertiesByZone(properties) {
        const grouped = {
            'affordable': [],
            'mid-range': [],
            'luxury': []
        };
        
        properties.forEach(property => {
            if (grouped[property.zone]) {
                grouped[property.zone].push(property);
            }
        });
        
        return grouped;
    }

    createZoneHeader(zone) {
        const header = document.createElement('div');
        header.className = 'zone-header';
        
        const zoneInfo = {
            'affordable': {
                title: 'Affordable Zone',
                icon: 'fa-rupee-sign',
                color: '#10b981',
                description: 'Budget-friendly properties'
            },
            'mid-range': {
                title: 'Mid-Range Zone', 
                icon: 'fa-coins',
                color: '#3b82f6',
                description: 'Balanced price and features'
            },
            'luxury': {
                title: 'Luxury Zone',
                icon: 'fa-gem',
                color: '#f59e0b',
                description: 'Premium properties and amenities'
            }
        };
        
        const info = zoneInfo[zone];
        
        header.innerHTML = `
            <div class="zone-header-content">
                <div class="zone-title">
                    <i class="fas ${info.icon}" style="color: ${info.color}"></i>
                    <span>${info.title}</span>
                </div>
                <div class="zone-description">${info.description}</div>
                <div class="zone-count">${this.getZonePropertyCount(zone)} properties</div>
            </div>
        `;
        
        return header;
    }

    getZonePropertyCount(zone) {
        return this.properties.filter(p => p.zone === zone).length;
    }

    createPropertyCard(property) {
        const card = document.createElement('div');
        card.className = `property-card ${property.zone}`;
        
        // Generate random names for location intelligence
        const randomNames = this.getRandomLocationNames();
        
        const intelligenceIcons = {
            school: 'fa-graduation-cap',
            hospital: 'fa-hospital',
            metro: 'fa-subway',
            crime: 'fa-shield-alt',
            mall: 'fa-shopping-bag',
            water: 'fa-tint'
        };
        
        const intelligenceLabels = {
            school: randomNames.school,
            hospital: randomNames.hospital,
            metro: randomNames.metro,
            crime: randomNames.crime,
            mall: randomNames.mall,
            water: randomNames.water
        };
        
        card.innerHTML = `
            <div class="property-header">
                <div>
                    <div class="property-title">${property.title}</div>
                    <div class="property-location">
                        <i class="fas fa-map-marker-alt"></i>
                        ${property.location}
                    </div>
                </div>
                <div class="match-percentage">${property.matchPercentage}% Match</div>
            </div>
            
            <div class="property-details">
                <div class="detail-item">
                    <i class="fas fa-ruler-combined"></i>
                    ${property.size.toLocaleString()} sq. ft.
                </div>
                <div class="detail-item">
                    <i class="fas fa-bed"></i>
                    ${property.bhk} BHK
                </div>
            </div>
            
            <div class="price-range-card">
                <div class="price-range-label">Predicted Price Range</div>
                <div class="price-range-value">
                    ₹${property.minPrice.toLocaleString('en-IN')} - ₹${property.maxPrice.toLocaleString('en-IN')}
                </div>
            </div>
            
            <div class="location-intelligence">
                ${Object.entries(property.intelligence).map(([key, level]) => `
                    <div class="intelligence-item ${level}">
                        <i class="fas ${intelligenceIcons[key]}"></i>
                        <span>${intelligenceLabels[key]}</span>
                    </div>
                `).join('')}
            </div>
        `;
        
        card.addEventListener('click', () => {
            this.focusPropertyOnMap(property);
        });
        
        return card;
    }

    getRandomLocationNames() {
        const schools = ['DPS School', 'KV School', 'St. Mary\'s', 'Delhi Public', 'National Public'];
        const hospitals = ['Apollo Hospital', 'Fortis Hospital', 'Max Healthcare', 'City Medical', 'AIIMS Hospital'];
        const metros = ['Metro Station', 'Central Metro', 'Blue Line Metro', 'Red Line Metro', 'Green Line Metro'];
        const crimes = ['Low Crime', 'Safe Area', 'Secure Zone', 'Peaceful Area', 'Protected Area'];
        const malls = ['Phoenix Mall', 'Central Mall', 'Inorbit Mall', 'DLF Mall', 'Select Mall'];
        const waters = ['24x7 Water', 'Daily Supply', 'Good Supply', 'Regular Water', 'Municipal Water'];
        
        return {
            school: schools[Math.floor(Math.random() * schools.length)],
            hospital: hospitals[Math.floor(Math.random() * hospitals.length)],
            metro: metros[Math.floor(Math.random() * metros.length)],
            crime: crimes[Math.floor(Math.random() * crimes.length)],
            mall: malls[Math.floor(Math.random() * malls.length)],
            water: waters[Math.floor(Math.random() * waters.length)]
        };
    }

    focusPropertyOnMap(property) {
        const marker = this.markers.find(m => 
            m.getLatLng().lat === property.coordinates[0] && 
            m.getLatLng().lng === property.coordinates[1]
        );
        
        if (marker) {
            this.map.setView(property.coordinates, 15);
            marker.openPopup();
        }
    }

    updateMapMarkers(properties) {
        // Clear existing markers
        this.markers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.markers = [];
        
        // Add new markers
        properties.forEach(property => {
            const marker = L.marker(property.coordinates)
                .addTo(this.map)
                .bindPopup(`
                    <div style="padding: 10px;">
                        <h4 style="margin: 0 0 5px 0;">${property.title}</h4>
                        <p style="margin: 0 0 5px 0; color: #666;">${property.location}</p>
                        <p style="margin: 0 0 5px 0;"><strong>Price:</strong> ₹${property.minPrice.toLocaleString('en-IN')} - ₹${property.maxPrice.toLocaleString('en-IN')}</p>
                        <p style="margin: 0;"><strong>Match:</strong> ${property.matchPercentage}%</p>
                    </div>
                `);
            
            this.markers.push(marker);
        });
        
        // Fit map to show all markers
        if (this.markers.length > 0) {
            const group = new L.featureGroup(this.markers);
            this.map.fitBounds(group.getBounds().pad(0.1));
        }
    }

    filterProperties(zone) {
        this.displayProperties(zone);
    }

    updateActiveTab(activeTab) {
        document.querySelectorAll('.zone-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        activeTab.classList.add('active');
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new HousePricePredictionApp();
});

// Close location suggestions when clicking outside
document.addEventListener('click', (e) => {
    const locationInput = document.getElementById('location');
    const suggestionsContainer = document.getElementById('locationSuggestions');
    
    if (!locationInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
        suggestionsContainer.style.display = 'none';
    }
});
