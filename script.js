document.addEventListener('DOMContentLoaded', () => {
    // ------------------ ANIMACIÓN FLOTANTE ------------------
    const container = document.getElementById('container');
    const pngFiles = Array.from({ length: 13 }, (_, i) => `imgs/${i + 1}.png`);
    let isTabActive = true, activeElements = 0;
    const maxElements = 15, initialElements = 10;
    let creationInterval = null;
    const floatingElements = new Set();

    function preloadImages(urls, callback) {
        let loaded = 0;
        urls.forEach(url => {
            const img = new Image();
            img.onload = () => (++loaded === urls.length && callback());
            img.src = url;
        });
    }

    function startElementCreation() {
        clearInterval(creationInterval);
        creationInterval = setInterval(() => {
            if (isTabActive && activeElements < maxElements) createFloatingElement();
        }, 500);
    }

    function isElementOutOfViewport(element) {
        const rect = element.getBoundingClientRect(), buffer = 50;
        return (
            rect.right < -buffer || rect.left > window.innerWidth + buffer ||
            rect.bottom < -buffer || rect.top > window.innerHeight + buffer
        );
    }

    function createFloatingElement() {
        const element = document.createElement('div');
        element.className = 'floating-element';
        const img = document.createElement('img');
        img.src = pngFiles[Math.floor(Math.random() * pngFiles.length)];
        img.alt = "Elemento flotante";
        element.appendChild(img);

        // Tamaño inicial
        const initialSize = Math.random() * 10 + 5;
        element.style.width = `${initialSize}px`;

        container.appendChild(element);
        activeElements++;
        floatingElements.add(element);

        animateElement(element, () => {
            element.remove();
            activeElements--;
            floatingElements.delete(element);
        });
    }

    function animateElement(element, onRemove) {
        const speed = Math.random() * 4 + 3;
        const rotationSpeed = (Math.random() - 0.5) * 4;
        const growthRate = Math.random() * 0.03 + 0.02;
        const angle = Math.random() * 2 * Math.PI;

        let currentSize = parseFloat(element.style.width), currentRotation = 0, posX = 0, posY = 0, running = true;

        function animate() {
            if (!isTabActive) return requestAnimationFrame(animate);
            posX += Math.cos(angle) * speed;
            posY += Math.sin(angle) * speed;
            currentRotation += rotationSpeed;
            currentSize = Math.min(currentSize + currentSize * growthRate, 200);

            element.style.transform = `translate(calc(-50% + ${posX}px), calc(-50% + ${posY}px)) rotate(${currentRotation}deg)`;
            element.style.width = `${currentSize}px`;

            if (isElementOutOfViewport(element)) {
                running = false;
                onRemove();
            } else if (running) {
                requestAnimationFrame(animate);
            }
        }
        animate();
    }

    document.addEventListener('visibilitychange', () => {
        isTabActive = !document.hidden;
        if (isTabActive) startElementCreation(); else clearInterval(creationInterval);
    });

    preloadImages(pngFiles, () => {
        startElementCreation();
        for (let i = 0; i < initialElements; i++) setTimeout(() => {
            if (activeElements < maxElements) createFloatingElement();
        }, i * 500);
    });

    // ------------------ CALCULADORA DE COSTOS ------------------
    const Calculator = {
        PRECIOS: {
            'casete-60min': 1500, 'casete-90min': 1800, 'vinilo-single': 2000, 'vinilo-ep': 2500, 'vinilo-lp': 3000, 'cd-audio': 1000,
            'vhs': 2500, 'vhs-c': 2800, 'dvd': 1500,
            'diskette': 800, 'disco-rigido': 3000, 'memoria-sd': 1000, 'cd-dvd': 1200,
            'restauracion-audio': 500, 'mejora-video': 800, 'separar-pistas': 700, 'entrega-ambas': 500
        },
        optionsTree: {
            "root": [
                { id: "audio", text: "Audio", next: "audio-type" },
                { id: "video", text: "Video", next: "video-type" },
                { id: "information", text: "Información", next: "information-type" }
            ],
            "audio-type": [
                { id: "casete", text: "Casete", next: "casete-length" },
                { id: "vinilo", text: "Vinilo", next: "vinilo-type" },
                { id: "cd", text: "CD", final: true }
            ],
            "video-type": [
                { id: "vhs", text: "VHS", final: true },
                { id: "vhs-c", text: "VHS-C (Videocam)", final: true },
                { id: "dvd", text: "DVD", final: true }
            ],
            "information-type": [
                { id: "diskette", text: "Diskette", final: true },
                { id: "disco-rigido", text: "Disco Rígido", final: true },
                { id: "memoria-sd", text: "Memoria SD", final: true },
                { id: "cd-dvd", text: "CD / DVD", final: true }
            ],
            "casete-length": [
                { id: "60min", text: "60 min.", final: true },
                { id: "90min", text: "90 min.", final: true }
            ],
            "vinilo-type": [
                { id: "single", text: "Single", final: true },
                { id: "ep", text: "EP", final: true },
                { id: "lp", text: "LP", final: true }
            ]
        },
        state: {
            currentStep: "root",
            selectedOptions: {},
            selectionHistory: [],
            quantity: 1,
            deliveryOption: "pendrive",
            audioRestoration: false,
            videoEnhancement: false,
            separateTracks: false,
            isFinalSelection: false
        },
        // DOM references (set at init)
        refs: {},
        // Inicializa referencias y listeners
        init() {
            this.refs = {
                selectionPath: document.getElementById('selectionPath'),
                optionsContainer: document.getElementById('optionsContainer'),
                detailsContainer: document.getElementById('detailsContainer'),
                selectionSummary: document.getElementById('selectionSummary'),
                quantityValue: document.getElementById('quantityValue'),
                decreaseQuantity: document.getElementById('decreaseQuantity'),
                increaseQuantity: document.getElementById('increaseQuantity'),
                audioRestorationCheckbox: document.getElementById('audioRestoration'),
                videoEnhancementCheckbox: document.getElementById('videoEnhancement'),
                separateTracksCheckbox: document.getElementById('separateTracks'),
                calculateBtn: document.getElementById('calculateBtn'),
                resultContainer: document.getElementById('resultContainer'),
                priceResult: document.getElementById('priceResult'),
                requestBtn: document.getElementById('requestBtn'),
                thankYouMessage: document.getElementById('thankYouMessage'),
                deliveryOptions: document.querySelectorAll('.delivery-option'),
                globalBackBtn: document.getElementById('globalBackBtn'),
                videoWarning: document.getElementById('videoWarning'),
                informationWarning: document.getElementById('informationWarning')
            };
            this.showOptions(this.state.currentStep);
            this.setupListeners();
            this.updateBackButton();
        },
        showOptions(step) {
            const { optionsContainer } = this.refs;
            optionsContainer.innerHTML = '';
            const options = this.optionsTree[step];
            if (!options || this.state.isFinalSelection) return;
            options.forEach(option => {
                const optionRow = document.createElement('div');
                optionRow.className = 'option-row';
                optionRow.innerHTML = `
                    <span class="option-text">${option.text}</span>
                    <span class="option-arrow">→</span>`;
                optionRow.addEventListener('click', () => this.selectOption(option));
                optionsContainer.appendChild(optionRow);
            });
        },
        selectOption(option) {
            this.resetCalculationState();
            const pathStep = document.createElement('div');
            pathStep.className = 'path-step';
            pathStep.textContent = option.text;
            pathStep.style.animation = 'slideIn 0.5s ease forwards';
            this.refs.selectionPath.appendChild(pathStep);

            this.state.selectionHistory.push({ step: this.state.currentStep, option });
            this.state.selectedOptions[this.state.currentStep] = { text: option.text, id: option.id };

            if (option.final) {
                this.state.isFinalSelection = true;
                this.refs.optionsContainer.style.display = 'none';
                this.showDetails();
                this.refs.calculateBtn.style.display = 'block';
            } else if (option.next) {
                this.state.currentStep = option.next;
                this.showOptions(this.state.currentStep);
                this.refs.calculateBtn.style.display = 'none';
            }
            this.updateBackButton();
        },
        showDetails() {
            let summaryHTML = `<h3>Resumen de selección:</h3><ul>`;
            for (const step in this.state.selectedOptions) {
                summaryHTML += `<li>${this.state.selectedOptions[step].text}</li>`;
            }
            summaryHTML += '</ul>';
            this.refs.selectionSummary.innerHTML = summaryHTML;

            const audioRestorationContainer = document.getElementById('audioRestorationContainer');
            const videoEnhancementContainer = document.getElementById('videoEnhancementContainer');
            const separateTracksContainer = document.getElementById('separateTracksContainer');

            if (this.state.selectedOptions['root'].text === 'Audio') {
                
                videoEnhancementContainer.style.display = 'none';
                if (this.state.selectedOptions['audio-type'] &&
                    (this.state.selectedOptions['audio-type'].id === 'casete' ||
                     this.state.selectedOptions['audio-type'].id === 'vinilo')) {
                    separateTracksContainer.style.display = 'flex';
                    audioRestorationContainer.style.display = 'flex';
                } else {
                    separateTracksContainer.style.display = 'none';
                    audioRestorationContainer.style.display = 'none';
                }
                this.refs.videoWarning.style.display = 'none';
                this.refs.informationWarning.style.display = 'none';

            } else if (this.state.selectedOptions['root'].text === 'Video') {
                audioRestorationContainer.style.display = 'none';
                videoEnhancementContainer.style.display = 'flex';
                separateTracksContainer.style.display = 'none';
                this.refs.videoWarning.style.display = 'flex';

                if (this.state.selectedOptions['video-type'] &&
                    (this.state.selectedOptions['video-type'].id === 'dvd')){
                        this.refs.videoWarning.style.display = 'none';
                        videoEnhancementContainer.style.display = 'none';
                }
                
                this.refs.informationWarning.style.display = 'none';


            } else {
                audioRestorationContainer.style.display = 'none';
                videoEnhancementContainer.style.display = 'none';
                separateTracksContainer.style.display = 'none';
                

                if (this.state.selectedOptions['information-type'] &&
                    (this.state.selectedOptions['information-type'].id === 'diskette')){
                        this.refs.informationWarning.style.display = 'none';
                }else{
                    this.refs.informationWarning.style.display = 'flex';
                }
                this.refs.videoWarning.style.display = 'none';
                
            }
            this.refs.detailsContainer.style.display = 'block';
        },
        goBack() {
            if (this.state.selectionHistory.length === 0) return;
            this.resetCalculationState();
            const lastSelection = this.state.selectionHistory.pop();
            const pathSteps = this.refs.selectionPath.querySelectorAll('.path-step');
            if (pathSteps.length > 0) pathSteps[pathSteps.length - 1].remove();
            delete this.state.selectedOptions[lastSelection.step];

            if (this.state.selectionHistory.length === 0) {
                this.state.currentStep = "root";
                this.state.isFinalSelection = false;
                this.refs.optionsContainer.style.display = 'block';
                this.showOptions(this.state.currentStep);
            } else {
                const prev = this.state.selectionHistory[this.state.selectionHistory.length - 1];
                if (prev.option.final) {
                    this.state.isFinalSelection = true;
                    this.refs.optionsContainer.style.display = 'none';
                    this.showDetails();
                    this.refs.calculateBtn.style.display = 'block';
                    this.state.currentStep = prev.step;
                } else {
                    this.state.isFinalSelection = false;
                    this.state.currentStep = prev.option.next;
                    this.refs.optionsContainer.style.display = 'block';
                    this.showOptions(this.state.currentStep);
                    this.refs.calculateBtn.style.display = 'none';
                }
            }
            if (!this.state.isFinalSelection) this.refs.detailsContainer.style.display = 'none';
            this.updateBackButton();
        },
        resetCalculationState() {
            this.refs.resultContainer.style.display = 'none';
            this.refs.calculateBtn.classList.remove('calculating');
            this.refs.calculateBtn.textContent = 'Calcular...';
            this.refs.requestBtn.style.display = 'none';
        },
        updateBackButton() {
            this.refs.globalBackBtn.style.display = this.state.selectionHistory.length > 0 ? 'block' : 'none';
        },
        setupListeners() {
            this.refs.decreaseQuantity.addEventListener('click', () => {
                if (this.state.quantity > 1) {
                    this.state.quantity--;
                    this.refs.quantityValue.textContent = this.state.quantity;
                }
            });
            this.refs.increaseQuantity.addEventListener('click', () => {
                this.state.quantity++;
                this.refs.quantityValue.textContent = this.state.quantity;
            });
            this.refs.deliveryOptions.forEach(option => {
                option.addEventListener('click', () => {
                    this.refs.deliveryOptions.forEach(opt => opt.classList.remove('selected'));
                    option.classList.add('selected');
                    this.state.deliveryOption = option.getAttribute('data-value');
                });
            });
            this.refs.audioRestorationCheckbox.addEventListener('change', (e) => {
                this.state.audioRestoration = e.target.checked;
            });
            this.refs.videoEnhancementCheckbox.addEventListener('change', (e) => {
                this.state.videoEnhancement = e.target.checked;
            });
            this.refs.separateTracksCheckbox.addEventListener('change', (e) => {
                this.state.separateTracks = e.target.checked;
            });
            this.refs.calculateBtn.addEventListener('click', () => this.calculatePrice());
            this.refs.requestBtn.addEventListener('click', () => this.requestService());
            this.refs.globalBackBtn.addEventListener('click', () => this.goBack());
            this.refs.deliveryOptions[0].classList.add('selected');
        },
        calculatePrice() {
            this.refs.calculateBtn.classList.add('calculating');
            this.refs.calculateBtn.textContent = 'Calculando...';
            setTimeout(() => {
                let basePrice = 0, finalSelectionId = '';
                for (const step in this.state.selectedOptions) {
                    const option = this.state.selectedOptions[step];
                    if (option.id === 'cd') finalSelectionId = 'cd-audio';
                    else if (option.id === '60min') finalSelectionId = 'casete-60min';
                    else if (option.id === '90min') finalSelectionId = 'casete-90min';
                    else if (option.id === 'single') finalSelectionId = 'vinilo-single';
                    else if (option.id === 'ep') finalSelectionId = 'vinilo-ep';
                    else if (option.id === 'lp') finalSelectionId = 'vinilo-lp';
                    else if (option.id === 'vhs') finalSelectionId = 'vhs';
                    else if (option.id === 'vhs-c') finalSelectionId = 'vhs-c';
                    else if (option.id === 'dvd') finalSelectionId = 'dvd';
                    else if (option.id === 'diskette') finalSelectionId = 'diskette';
                    else if (option.id === 'disco-rigido') finalSelectionId = 'disco-rigido';
                    else if (option.id === 'memoria-sd') finalSelectionId = 'memoria-sd';
                    else if (option.id === 'cd-dvd') finalSelectionId = 'cd-dvd';
                }
                basePrice = this.PRECIOS[finalSelectionId] || 1500;
                if (this.state.audioRestoration) basePrice += this.PRECIOS['restauracion-audio'];
                if (this.state.videoEnhancement) basePrice += this.PRECIOS['mejora-video'];
                if (this.state.separateTracks) basePrice += this.PRECIOS['separar-pistas'];
                let totalPrice = basePrice * this.state.quantity;
                if (this.state.deliveryOption === 'both') totalPrice += this.PRECIOS['entrega-ambas'];

                this.refs.priceResult.textContent = `$${totalPrice}`;
                this.refs.resultContainer.style.display = 'block';
                setTimeout(() => {
                    this.refs.resultContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
                this.refs.calculateBtn.style.display = 'none';
                setTimeout(() => {
                    this.refs.requestBtn.style.display = 'block';
                }, 600);
            }, 2000); // Más rápido
        },
        requestService() {
            document.querySelector('.calculator-container').style.opacity = '0';
            document.querySelector('.calculator-container').style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                this.refs.thankYouMessage.style.opacity = '1';
                setTimeout(() => {
                    this.refs.thankYouMessage.style.transform = 'translate(-50%, -50%) scale(0.5)';
                    this.refs.thankYouMessage.style.opacity = '0';
                    setTimeout(() => {
                        this.sendWhatsAppMessage();
                    }, 700);
                }, 400);
            }, 1500);
        },
        sendWhatsAppMessage() {
            let msg = "Hola, me interesa solicitar el servicio de conversión con los siguientes detalles:%0A";
            for (const step in this.state.selectedOptions) {
                msg += `${step}: ${this.state.selectedOptions[step].text}%0A`;
            }
            msg += `%0ACantidad: ${this.state.quantity}%0A`;
            msg += `Entrega: ${this.state.deliveryOption === 'pendrive' ? 'Pen Drive' :
                this.state.deliveryOption === 'cloud' ? 'Link en la Nube' : 'Ambas'}%0A`;
            if (this.state.audioRestoration) msg += "Restaurar Sonido: Sí%0A";
            if (this.state.videoEnhancement) msg += "Mejorar Imagen de Video: Sí%0A";
            if (this.state.separateTracks) msg += "Separar pistas: Sí%0A";
            msg += `Precio calculado: ${this.refs.priceResult.textContent}%0A%0A`;
            msg += "Por favor, contactarme para coordinar el servicio.";
            window.open(`https://wa.me/5491153374470?text=${msg}`, '_blank');
            setTimeout(() => {
                this.reset();
                document.getElementById('calculatorContainer').classList.remove('active');
                document.getElementById('infoContent').classList.remove('active');
                document.querySelector('.content').classList.remove('hidden');
            }, 1100);
        },
        reset() {
            this.state = {
                currentStep: "root",
                selectedOptions: {},
                selectionHistory: [],
                quantity: 1,
                deliveryOption: "pendrive",
                audioRestoration: false,
                videoEnhancement: false,
                separateTracks: false,
                isFinalSelection: false
            };
            this.refs.selectionPath.innerHTML = '';
            this.refs.optionsContainer.innerHTML = '';
            this.refs.optionsContainer.style.display = 'block';
            this.refs.detailsContainer.style.display = 'none';
            this.refs.resultContainer.style.display = 'none';
            this.refs.calculateBtn.style.display = 'none';
            this.refs.calculateBtn.classList.remove('calculating');
            this.refs.calculateBtn.textContent = 'Calcular...';
            this.refs.requestBtn.style.display = 'none';
            this.refs.quantityValue.textContent = '1';
            this.refs.audioRestorationCheckbox.checked = false;
            this.refs.videoEnhancementCheckbox.checked = false;
            this.refs.separateTracksCheckbox.checked = false;
            this.refs.videoWarning.style.display = 'none';
            this.refs.informationWarning.style.display = 'none';
            document.querySelector('.calculator-container').style.opacity = '1';
            this.showOptions(this.state.currentStep);
            this.refs.deliveryOptions.forEach(opt => opt.classList.remove('selected'));
            this.refs.deliveryOptions[0].classList.add('selected');
            this.updateBackButton();
        }
    };

    Calculator.init();

    // ------------------ TRANSICIONES DE PANTALLAS ------------------
    const learnMoreBtn = document.querySelector('.btn');
    const backBtn = document.getElementById('backBtn');
    const calculateCostBtn = document.getElementById('calculateCostBtn');
    const calculatorBackBtn = document.getElementById('calculatorBackBtn');
    const mainContent = document.querySelector('.content');
    const infoContent = document.getElementById('infoContent');
    const calculatorContainer = document.getElementById('calculatorContainer');

    learnMoreBtn.addEventListener('click', function (e) {
        e.preventDefault();
        mainContent.classList.add('hidden');
        setTimeout(() => infoContent.classList.add('active'), 300);
    });
    backBtn.addEventListener('click', function (e) {
        e.preventDefault();
        infoContent.classList.remove('active');
        setTimeout(() => mainContent.classList.remove('hidden'), 300);
    });
    calculateCostBtn.addEventListener('click', function (e) {
        e.preventDefault();
        infoContent.classList.remove('active');
        setTimeout(() => calculatorContainer.classList.add('active'), 300);
    });
    calculatorBackBtn.addEventListener('click', function (e) {
        e.preventDefault();
        calculatorContainer.classList.remove('active');
        setTimeout(() => infoContent.classList.add('active'), 300);
    });

});

